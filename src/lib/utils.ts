export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getAutoPeriod(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return day <= 15 ? `${month} 1-15, ${year}` : `${month} 16-End, ${year}`;
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export async function callGemini(
  prompt: string,
  apiKey: string,
  systemPrompt = "You are a helpful financial assistant."
): Promise<string | undefined> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
    },
  });

  return response.text;
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

