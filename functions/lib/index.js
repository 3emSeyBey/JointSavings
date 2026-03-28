"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProfilePin = exports.clearProfilePin = exports.setProfilePin = exports.generateAI = void 0;
const crypto = __importStar(require("crypto"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const genai_1 = require("@google/genai");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
/** Must match `HOUSEHOLD_DATA_ROOT_DOC` in `src/lib/firestorePaths.ts`. */
const HOUSEHOLD_DATA_ROOT = 'v1';
const WINDOW_MS = 60000;
const MAX_CALLS_PER_WINDOW = 30;
async function enforceRateLimit(uid) {
    const ref = db.doc(`aiRate/${uid}`);
    const now = Date.now();
    await db.runTransaction(async (t) => {
        const snap = await t.get(ref);
        const data = snap.data();
        const windowStart = data?.windowStart ?? now;
        let count = data?.count ?? 0;
        if (now - windowStart > WINDOW_MS) {
            t.set(ref, { count: 1, windowStart: now });
            return;
        }
        if (count >= MAX_CALLS_PER_WINDOW) {
            throw new https_1.HttpsError('resource-exhausted', 'Too many AI requests. Try again in a minute.');
        }
        t.set(ref, { count: count + 1, windowStart });
    });
}
async function householdIdForUser(uid) {
    const u = await db.doc(`users/${uid}`).get();
    const hid = u.get('householdId');
    if (!hid)
        throw new https_1.HttpsError('failed-precondition', 'User household not initialized');
    return hid;
}
function hashPin(pin, salt) {
    return crypto.pbkdf2Sync(pin, salt, 120000, 32, 'sha256').toString('hex');
}
exports.generateAI = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    const { prompt, systemInstruction } = request.data;
    if (!prompt || typeof prompt !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'prompt is required');
    }
    if (prompt.length > 32000)
        throw new https_1.HttpsError('invalid-argument', 'prompt too long');
    await enforceRateLimit(request.auth.uid);
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new https_1.HttpsError('failed-precondition', 'Server GEMINI_API_KEY is not set');
    }
    const ai = new genai_1.GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction || 'You are a helpful assistant.',
        },
    });
    return { text: response.text || '' };
});
exports.setProfilePin = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    const { profileId, pin } = request.data;
    if (!profileId || typeof profileId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'profileId required');
    }
    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        throw new https_1.HttpsError('invalid-argument', 'PIN must be 4 digits');
    }
    const householdId = await householdIdForUser(request.auth.uid);
    const salt = crypto.randomBytes(16).toString('hex');
    const pinHash = hashPin(pin, salt);
    const profileRef = db.doc(`households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`);
    await profileRef.set({ pinHash, pinSalt: salt, pin: firestore_1.FieldValue.delete() }, { merge: true });
    return { ok: true };
});
exports.clearProfilePin = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    const { profileId } = request.data;
    if (!profileId)
        throw new https_1.HttpsError('invalid-argument', 'profileId required');
    const householdId = await householdIdForUser(request.auth.uid);
    const profileRef = db.doc(`households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`);
    await profileRef.set({
        pin: null,
        pinHash: firestore_1.FieldValue.delete(),
        pinSalt: firestore_1.FieldValue.delete(),
    }, { merge: true });
    return { ok: true };
});
exports.verifyProfilePin = (0, https_1.onCall)(async (request) => {
    if (!request.auth?.uid)
        throw new https_1.HttpsError('unauthenticated', 'Sign in required');
    const { profileId, pin } = request.data;
    if (!profileId || !pin)
        throw new https_1.HttpsError('invalid-argument', 'profileId and pin required');
    const householdId = await householdIdForUser(request.auth.uid);
    const profileRef = db.doc(`households/${householdId}/data/${HOUSEHOLD_DATA_ROOT}/profiles/${profileId}`);
    const snap = await profileRef.get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', 'Profile not found');
    const data = snap.data();
    const pinHash = data.pinHash;
    const pinSalt = data.pinSalt;
    const legacyPin = data.pin;
    if (pinHash && pinSalt) {
        try {
            const computed = hashPin(pin, pinSalt);
            const a = Buffer.from(pinHash, 'hex');
            const b = Buffer.from(computed, 'hex');
            if (a.length !== b.length)
                return { ok: false };
            const ok = crypto.timingSafeEqual(a, b);
            return { ok };
        }
        catch {
            return { ok: false };
        }
    }
    if (legacyPin != null && legacyPin === pin) {
        return { ok: true };
    }
    return { ok: false };
});
//# sourceMappingURL=index.js.map