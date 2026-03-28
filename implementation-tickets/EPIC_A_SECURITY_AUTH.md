# Epic A - Security, Auth, and Multi-Household

Use this format for execution updates inside each ticket:
- Status:
- Owner:
- Start Date:
- Target Date:
- Dependency Notes:

---

## A-001 - Introduce `householdId` and migrate all Firestore paths

### Objective
Scope all persisted data to a household boundary and eliminate global shared datasets.

### Implementation Plan
- Define new Firestore hierarchy: `households/{householdId}/...` for profiles, transactions, goals, targets, sessions.
- Add `householdId` resolution in app bootstrap/session state.
- Update all hooks (`useFirestore`, `useSavingsTarget`, `useGameSession`) to require household context.
- Build migration path for legacy docs under `artifacts/{APP_ID}/public/data`.

### Tasks
- [ ] Define canonical schema in docs.
- [ ] Add read/write helper for household-scoped references.
- [ ] Backfill/migrate existing docs to first household.
- [ ] Add migration completion marker to prevent re-runs.
- [ ] Validate no global paths remain in source.

### Test Plan
- Verify two households cannot read each other's data.
- Verify legacy dataset is preserved after migration.
- Verify app boot works for new and existing users.

---

## A-002 - Replace hardcoded profile IDs with dynamic member model

### Objective
Remove `pea/cam` assumptions and support variable member lists.

### Implementation Plan
- Introduce `Member` type with `id`, role, profile metadata.
- Refactor totals/progress calculations to iterate members, not fixed keys.
- Update UI labels and analytics legends to dynamic rendering.

### Tasks
- [ ] Add member-aware types and utility selectors.
- [ ] Refactor `App`, `Overview`, `Analytics`, `SavingsTargets`, `MiniGames`.
- [ ] Migrate existing profiles to member collection format.
- [ ] Add fallback behavior for exactly two-member households.

### Test Plan
- Validate app works with 1, 2, and 3 members.
- Validate no runtime access to `profiles.pea/cam`.

---

## A-003 - Implement real authentication (email/OAuth)

### Objective
Upgrade auth from anonymous-only to durable account identity.

### Implementation Plan
- Add Firebase auth providers (email/password + Google OAuth).
- Build onboarding/sign-in views and account linking strategy from anonymous user.
- Attach household membership to authenticated user IDs.

### Tasks
- [ ] Design auth flow states (new user, returning, invited).
- [ ] Implement sign in/up/reset/logout screens.
- [ ] Implement anonymous-to-account upgrade migration.
- [ ] Add protected route/app gate logic.

### Test Plan
- Verify sign in/out across refresh and device.
- Verify anonymous data survives account upgrade.
- Verify auth errors are surfaced cleanly.

---

## A-004 - Add role-based household membership (owner/member/viewer)

### Objective
Control access for sensitive actions by role.

### Implementation Plan
- Add membership collection with role enum.
- Enforce role checks in UI and server/firestore rules.
- Restrict destructive or config operations to allowed roles.

### Tasks
- [ ] Add role model and role resolver hook.
- [ ] Guard settings/admin actions in UI.
- [ ] Add Firestore rule conditions per role.
- [ ] Add role change action logging (with A-009).

### Test Plan
- Verify viewer cannot write protected docs.
- Verify owner can manage members and settings.

---

## A-005 - Move Gemini calls to server-side function/proxy

### Objective
Prevent client-side API key exposure.

### Implementation Plan
- Build server endpoint/cloud function for AI requests.
- Move prompt building and model invocation server-side.
- Sign requests with authenticated user token.

### Tasks
- [ ] Create backend endpoint contract.
- [ ] Refactor `AIChat` and `DecideForMe` to call backend.
- [ ] Remove direct client use of `VITE_GEMINI_API_KEY`.
- [ ] Add backend timeout/retry/error shape.

### Test Plan
- Verify no Gemini key appears in frontend bundle.
- Verify AI chat and mini-game AI remain functional.

---

## A-006 - Add request auth + rate limiting for AI endpoints

### Objective
Protect AI endpoints from abuse and cost spikes.

### Implementation Plan
- Require valid user auth token + household membership.
- Apply per-user and per-household rate limits.
- Return friendly 429 responses with retry metadata.

### Tasks
- [ ] Add middleware for auth verification.
- [ ] Add request budget counters (minute/day).
- [ ] Add rate-limit telemetry and alerting hook.
- [ ] Document quota settings in config.

### Test Plan
- Verify unauthorized calls are rejected.
- Verify quota enforcement under burst traffic.

---

## A-007 - Hash/encrypt profile unlock PIN and add retry lockout

### Objective
Eliminate plaintext PIN storage and brute-force risk.

### Implementation Plan
- Store hashed PIN (or encrypted verifier) server-side.
- Add failed-attempt counter and cooldown lockouts.
- Update PIN create/update/remove flows in settings/login.

### Tasks
- [ ] Replace direct PIN compare in client.
- [ ] Add lockout metadata per profile/device session.
- [ ] Add clear user feedback for lockout state.
- [ ] Migrate existing plaintext PIN records safely.

### Test Plan
- Verify PIN is never readable plaintext in DB.
- Verify lockout triggers and resets correctly.

---

## A-008 - Create production Firestore security rules

### Objective
Establish least-privilege datastore policy.

### Implementation Plan
- Define rules per collection and role.
- Enforce schema-level validation for critical fields.
- Add local emulator tests for rule coverage.

### Tasks
- [ ] Draft rules for households, members, transactions, goals, targets, sessions.
- [ ] Add create/update field guards.
- [ ] Add rules tests for allow/deny cases.
- [ ] Document deployment checklist.

### Test Plan
- Verify cross-household access is denied.
- Verify malformed writes are denied.

---

## A-009 - Add audit log collection for sensitive actions

### Objective
Enable traceability for high-risk changes.

### Implementation Plan
- Create append-only `auditLogs` structure.
- Log actor, action, target entity, before/after summary, timestamp.
- Emit logs on profile, membership, target, goal deletion, period close actions.

### Tasks
- [ ] Create log schema and helper.
- [ ] Wire sensitive mutation points.
- [ ] Build simple admin log viewer.

### Test Plan
- Verify all targeted actions create log entries.
- Verify non-sensitive actions do not pollute logs.

---

## A-010 - Build invite flow for partner onboarding

### Objective
Allow secure invitation to join household.

### Implementation Plan
- Generate one-time invite tokens with expiry.
- Build accept-invite flow and membership creation.
- Handle invalid/expired/reused invites.

### Tasks
- [ ] Add invite token model and endpoint.
- [ ] Build invite UI in settings.
- [ ] Build invite acceptance screen.
- [ ] Add revocation support for pending invites.

### Test Plan
- Verify successful join creates membership.
- Verify expired/reused token is blocked.

---

## A-011 - Add environment validation at app startup

### Objective
Fail fast on missing critical environment config.

### Implementation Plan
- Add startup validator for required runtime keys.
- Render setup help UI when invalid.
- Prevent partial initialization when config is broken.

### Tasks
- [ ] Build `validateEnv()` helper.
- [ ] Add startup guard in app bootstrap.
- [ ] Add user-facing remediation instructions.

### Test Plan
- Verify missing Firebase key shows setup state.
- Verify valid config proceeds normally.

---

## A-012 - Add secrets hygiene docs and preflight checks

### Objective
Reduce accidental secret leakage and onboarding mistakes.

### Implementation Plan
- Add `.env.example` and env documentation.
- Add pre-commit/pre-build check for accidental secret files.
- Add docs for rotating compromised credentials.

### Tasks
- [ ] Create `.env.example` from required keys.
- [ ] Add README "security and secrets" section.
- [ ] Add CI or local preflight scan for disallowed files.

### Test Plan
- Verify clean install works from docs alone.
- Verify preflight catches bad secret patterns.

