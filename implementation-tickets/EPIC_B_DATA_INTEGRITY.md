# Epic B - Money Data Integrity and Core Reliability

---

## B-001 - Make transaction + goal contribution atomic

### Objective
Guarantee consistency when adding savings tied to a goal.

### Implementation Plan
- Use Firestore transaction or batched write for transaction create + goal increment.
- Add failure-safe rollback semantics and deterministic error handling.

### Tasks
- [ ] Refactor current two-step write flow.
- [ ] Add transaction helper in data layer.
- [ ] Handle goal missing/deleted race condition.

### Test Plan
- Verify either both writes commit or neither commit.
- Verify duplicate submits do not double increment.

---

## B-002 - Validate amount/date/note inputs centrally

### Objective
Enforce one validation standard across UI and persistence layer.

### Implementation Plan
- Add shared validation schema for transaction/goal contribution payloads.
- Enforce in UI pre-submit and backend/rules on write.

### Tasks
- [ ] Create validators for amount/date/note.
- [ ] Integrate in `TransactionModal`, `Goals`, API writes.
- [ ] Map validation errors to user-facing field messages.

### Test Plan
- Reject negative, zero (where invalid), NaN, invalid dates.
- Verify malformed payload writes are denied.

---

## B-003 - Fix timezone-safe date handling utilities

### Objective
Prevent date drift due to UTC/local conversion issues.

### Implementation Plan
- Replace `toISOString().split('T')[0]` date assumptions with local-safe helpers.
- Normalize cutoff calculations with explicit timezone strategy.

### Tasks
- [ ] Introduce date utility module (`toLocalISODate`, period boundaries).
- [ ] Refactor all date generation and comparison points.
- [ ] Backfill tests for month-end/day-boundary edge cases.

### Test Plan
- Verify behavior around 23:00-01:00 local transitions.
- Verify consistent period assignment across timezones.

---

## B-004 - Normalize money storage to integer cents

### Objective
Remove floating-point precision errors.

### Implementation Plan
- Store all amounts as integer minor units (`amountCents`).
- Add presentation conversion for UI formatting only.

### Tasks
- [ ] Update types and Firestore schema.
- [ ] Migrate existing amount fields.
- [ ] Refactor calculations and chart transforms.

### Test Plan
- Verify arithmetic exactness for repeated operations.
- Verify migration preserves historical totals.

---

## B-005 - Add optimistic updates + resilient rollback

### Objective
Improve perceived speed without sacrificing correctness.

### Implementation Plan
- Apply optimistic local state updates for CRUD actions.
- Roll back on server failure with contextual error notice.

### Tasks
- [ ] Add optimistic write queue/store strategy.
- [ ] Tag pending entries and reconcile snapshots.
- [ ] Implement rollback and toast messaging.

### Test Plan
- Simulate network failure and verify rollback correctness.
- Verify no ghost entries remain after failed writes.

---

## B-006 - Add idempotency keys for create operations

### Objective
Prevent duplicates from retries/double clicks.

### Implementation Plan
- Generate idempotency key per create intent.
- Reject duplicate keys within validity window.

### Tasks
- [ ] Add idempotency field to create payloads.
- [ ] Persist dedupe records or deterministic document IDs.
- [ ] Add duplicate request handling response.

### Test Plan
- Trigger repeated submits and ensure single record creation.

---

## B-007 - Replace `alert/confirm` flows with app toasts/dialogs

### Objective
Provide non-blocking and accessible feedback UX.

### Implementation Plan
- Build reusable toast and confirm dialog primitives.
- Replace browser native dialogs in all components.

### Tasks
- [ ] Create `useToast` and `ConfirmDialog` components.
- [ ] Replace delete/error/success flows.
- [ ] Ensure keyboard and screen-reader compatibility.

### Test Plan
- Verify consistent visual feedback across all actions.

---

## B-008 - Standardize async error boundaries per tab

### Objective
Avoid full-app crashes from localized failures.

### Implementation Plan
- Wrap tab panes with async-safe boundaries.
- Add fallback UI with retry action.

### Tasks
- [ ] Add boundary component with logging hook.
- [ ] Apply to overview/targets/goals/analytics/games/settings.
- [ ] Add reset behavior on tab switch.

### Test Plan
- Inject failure in one tab and confirm other tabs remain usable.

---

## B-009 - Implement history-safe delete/undo for transactions

### Objective
Support reversible deletion and auditability.

### Implementation Plan
- Add soft-delete model (`deletedAt`, `deletedBy`) and undo window.
- Hide soft-deleted items from primary lists.

### Tasks
- [ ] Add soft-delete schema + query filters.
- [ ] Add undo action with expiration timer.
- [ ] Integrate with audit logging (A-009).

### Test Plan
- Verify undo restores original item and aggregates.
- Verify permanent delete occurs after grace period.

---

## B-010 - Complete cutoff period lifecycle actions

### Objective
Finish target period operations end-to-end.

### Implementation Plan
- Wire close/reopen/pay-owed actions in UI and data layer.
- Ensure period summaries and owed balances stay consistent.

### Tasks
- [ ] Expose all lifecycle handlers in `SavingsTargets`.
- [ ] Add confirmation and state transition guards.
- [ ] Recompute totals after each lifecycle action.

### Test Plan
- Verify closed period snapshots are immutable unless reopened.
- Verify owed totals update correctly after payments.

