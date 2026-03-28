import { httpsCallable } from 'firebase/functions';
import { functions, GEMINI_API_KEY } from '@/config/firebase';
import { callGemini } from '@/lib/utils';

type GenerateAIPayload = { prompt: string; systemInstruction?: string };

/**
 * Prefer Cloud Function proxy (A-005); fall back to client key only when set (dev).
 */
export async function generateAIText(
  prompt: string,
  systemInstruction = 'You are a helpful financial assistant.'
): Promise<string | undefined> {
  if (functions) {
    const fn = httpsCallable<GenerateAIPayload, { text?: string }>(functions, 'generateAI');
    const res = await fn({ prompt, systemInstruction });
    return res.data?.text;
  }
  if (GEMINI_API_KEY) {
    return callGemini(prompt, GEMINI_API_KEY, systemInstruction);
  }
  throw new Error('AI not configured (deploy generateAI function or set VITE_GEMINI_API_KEY for local dev only)');
}
