import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

/** Set with: `firebase functions:secrets:set GEMINI_API_KEY` then deploy. */
const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = admin.firestore();

/** Must match `HOUSEHOLD_DATA_ROOT_DOC` in `src/lib/firestorePaths.ts`. */
const HOUSEHOLD_DATA_ROOT = 'v1';

const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 30;

async function enforceRateLimit(uid: string): Promise<void> {
  const ref = db.doc(`aiRate/${uid}`);
  const now = Date.now();
  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const data = snap.data() as { count?: number; windowStart?: number } | undefined;
    const windowStart = data?.windowStart ?? now;
    let count = data?.count ?? 0;
    if (now - windowStart > WINDOW_MS) {
      t.set(ref, { count: 1, windowStart: now });
      return;
    }
    if (count >= MAX_CALLS_PER_WINDOW) {
      throw new HttpsError('resource-exhausted', 'Too many AI requests. Try again in a minute.');
    }
    t.set(ref, { count: count + 1, windowStart });
  });
}

async function householdIdForUser(uid: string): Promise<string> {
  const u = await db.doc(`users/${uid}`).get();
  const hid = u.get('householdId') as string | undefined;
  if (!hid) throw new HttpsError('failed-precondition', 'User household not initialized');
  return hid;
}

function hashPin(pin: string, salt: string): string {
  return crypto.pbkdf2Sync(pin, salt, 120000, 32, 'sha256').toString('hex');
}

export const generateAI = onCall(
  {
    secrets: [geminiApiKey],
    region: 'us-central1',
  },
  async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const { prompt, systemInstruction } = request.data as {
    prompt?: string;
    systemInstruction?: string;
  };
  if (!prompt || typeof prompt !== 'string') {
    throw new HttpsError('invalid-argument', 'prompt is required');
  }
  if (prompt.length > 32000) throw new HttpsError('invalid-argument', 'prompt too long');

  await enforceRateLimit(request.auth.uid);

  const key =
    geminiApiKey.value().trim() ||
    (process.env.GEMINI_API_KEY && String(process.env.GEMINI_API_KEY).trim());
  if (!key) {
    throw new HttpsError(
      'failed-precondition',
      'Gemini API key missing. Run: firebase functions:secrets:set GEMINI_API_KEY — see README.'
    );
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction || 'You are a helpful assistant.',
    },
  });

  return { text: response.text || '' };
  }
);

export const setProfilePin = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const { profileId, pin } = request.data as { profileId?: string; pin?: string };
  if (!profileId || typeof profileId !== 'string') {
    throw new HttpsError('invalid-argument', 'profileId required');
  }
  if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    throw new HttpsError('invalid-argument', 'PIN must be 4 digits');
  }

  const householdId = await householdIdForUser(request.auth.uid);
  const salt = crypto.randomBytes(16).toString('hex');
  const pinHash = hashPin(pin, salt);
  const profileRef = db.doc(
    `households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`
  );
  await profileRef.set(
    { pinHash, pinSalt: salt, pin: FieldValue.delete() },
    { merge: true }
  );
  return { ok: true };
});

export const clearProfilePin = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const { profileId } = request.data as { profileId?: string };
  if (!profileId) throw new HttpsError('invalid-argument', 'profileId required');
  const householdId = await householdIdForUser(request.auth.uid);
  const profileRef = db.doc(
    `households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`
  );
  await profileRef.set(
    {
      pin: null,
      pinHash: FieldValue.delete(),
      pinSalt: FieldValue.delete(),
    },
    { merge: true }
  );
  return { ok: true };
});

export const verifyProfilePin = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in required');
  const { profileId, pin } = request.data as { profileId?: string; pin?: string };
  if (!profileId || !pin) throw new HttpsError('invalid-argument', 'profileId and pin required');

  const householdId = await householdIdForUser(request.auth.uid);
  const profileRef = db.doc(
    `households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`
  );
  const snap = await profileRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Profile not found');

  const data = snap.data()!;
  const pinHash = data.pinHash as string | undefined;
  const pinSalt = data.pinSalt as string | undefined;
  const legacyPin = data.pin as string | null | undefined;

  if (pinHash && pinSalt) {
    try {
      const computed = hashPin(pin, pinSalt);
      const a = Buffer.from(pinHash, 'hex');
      const b = Buffer.from(computed, 'hex');
      if (a.length !== b.length) return { ok: false };
      const ok = crypto.timingSafeEqual(a, b);
      return { ok };
    } catch {
      return { ok: false };
    }
  }

  if (legacyPin != null && legacyPin === pin) {
    return { ok: true };
  }

  return { ok: false };
});
