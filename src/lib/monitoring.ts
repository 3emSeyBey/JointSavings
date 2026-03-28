/**
 * Client observability hook (H-005). Wire to Sentry/LogRocket/etc. in production.
 */
export function logClientEvent(name: string, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug('[monitor]', name, data);
  }
}
