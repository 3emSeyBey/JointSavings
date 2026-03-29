import DOMPurify from 'dompurify';

const SANITIZE = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'a',
    'h2',
    'h3',
    'blockquote',
    'code',
    'pre',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeChecklistHtml(html: string): string {
  return DOMPurify.sanitize(html || '', SANITIZE);
}

export function isEmptyChecklistHtml(html: string): boolean {
  const t = html.replace(/<[^>]+>/g, '').replace(/\s|&nbsp;/g, '').trim();
  return t.length === 0;
}

/** Strip HTML for AI / previews (not security-critical; sanitize first if from untrusted source). */
export function checklistPlainTextPreview(html: string, maxLen = 200): string {
  const t = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}
