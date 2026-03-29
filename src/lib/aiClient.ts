import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { functions, GEMINI_API_KEY } from '@/config/firebase';
import { callGemini } from '@/lib/utils';

type GenerateAIPayload = { prompt: string; systemInstruction?: string };

function explainCallableError(e: unknown): string {
  if (e instanceof FirebaseError) {
    if (e.code === 'functions/not-found') {
      return 'The AI Cloud Function is not deployed. From the project root run: firebase deploy --only functions — then set the Gemini secret (see README).';
    }
    if (e.code === 'functions/failed-precondition') {
      return e.message.includes('Gemini') || e.message.includes('GEMINI')
        ? e.message
        : `Server setup incomplete: ${e.message}`;
    }
    if (e.code === 'functions/unauthenticated') {
      return 'Sign in again, then retry the coach.';
    }
    if (e.code === 'functions/resource-exhausted') {
      return 'Too many AI requests in a short window. Wait a minute and try again.';
    }
    return e.message || 'AI request failed.';
  }
  if (e instanceof Error) return e.message;
  return 'AI request failed.';
}

/**
 * Uses the Gemini API key from the Vite env (browser) by default — no Cloud Functions bill.
 * If `VITE_GEMINI_API_KEY` is unset, falls back to the `generateAI` callable when configured.
 */
export async function generateAIText(
  prompt: string,
  systemInstruction = 'You are a helpful financial assistant.'
): Promise<string | undefined> {
  if (GEMINI_API_KEY.trim()) {
    try {
      return await callGemini(prompt, GEMINI_API_KEY.trim(), systemInstruction);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gemini request failed';
      throw new Error(msg);
    }
  }
  if (functions) {
    try {
      const fn = httpsCallable<GenerateAIPayload, { text?: string }>(functions, 'generateAI');
      const res = await fn({ prompt, systemInstruction });
      return res.data?.text;
    } catch (e) {
      throw new Error(explainCallableError(e));
    }
  }
  throw new Error(
    'Add VITE_GEMINI_API_KEY to your .env for the AI coach (direct Gemini from the browser). See README.'
  );
}
