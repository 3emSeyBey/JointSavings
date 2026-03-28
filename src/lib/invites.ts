/**
 * Household invite tokens (A-010). Validate and redeem in Cloud Functions + UI accept flow.
 */
export function buildInviteLink(baseUrl: string, token: string): string {
  const u = new URL(baseUrl);
  u.searchParams.set('invite', token);
  return u.toString();
}

export function parseInviteFromLocation(search: string): string | null {
  const params = new URLSearchParams(search);
  const t = params.get('invite');
  return t && t.length > 8 ? t : null;
}
