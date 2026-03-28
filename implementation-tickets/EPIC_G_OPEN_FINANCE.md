# Epic G - Integrations and Open Finance

---

## G-001 - Integrate bank account linking provider (region-gated)

### Objective
Enable secure linked-account data ingestion.

### Implementation Plan
- Abstract provider integration by region.
- Add account connection, reconnection, and disconnect flows.

### Tasks
- [ ] Select provider strategy (region matrix + fallback).
- [ ] Implement token exchange and secure credential lifecycle.
- [ ] Add linked account management UI.

### Test Plan
- Verify connect/reconnect/disconnect works and is auditable.
- Verify unsupported regions fail gracefully.

---

## G-002 - Build transaction ingestion pipeline + dedupe

### Objective
Convert raw bank transactions into clean internal records.

### Implementation Plan
- Normalize provider payloads to app schema.
- Deduplicate based on provider transaction IDs + fuzzy fallback.

### Tasks
- [ ] Build ingestion service with normalization mapping.
- [ ] Add dedupe strategy and reconciliation logs.
- [ ] Add import status dashboard.

### Test Plan
- Verify repeated sync cycles do not duplicate transactions.

---

## G-003 - Add recurring bill/subscription detection

### Objective
Improve planning via known upcoming obligations.

### Implementation Plan
- Detect periodic transactions and classify subscription candidates.
- Display due-date reminders and impact on savings target.

### Tasks
- [ ] Add recurrence detection heuristics.
- [ ] Add confirmation/edit UI for detected subscriptions.
- [ ] Add due soon reminders and summary card.

### Test Plan
- Verify false positive/negative rates in fixture data baseline.

---

## G-004 - Add pay-by-bank transfer-to-savings flow

### Objective
Allow direct transfer actions where supported.

### Implementation Plan
- Implement payment initiation flow with user consent and status tracking.
- Support pending/success/failure reconciliation.

### Tasks
- [ ] Build transfer initiation API flow.
- [ ] Add transfer UI with confirmation and limits.
- [ ] Add transfer history and failure recovery.

### Test Plan
- Verify transfer status transitions and retries are accurate.

---

## G-005 - Add card wallet + shared spending envelope model

### Objective
Provide proactive spend control before money is spent.

### Implementation Plan
- Create envelope budgets tied to card/spending channels.
- Track spend against envelope caps and trigger warnings.

### Tasks
- [ ] Define envelope schema and allocation rules.
- [ ] Add envelope setup and adjustment UI.
- [ ] Add spend-to-envelope matching and alerts.

### Test Plan
- Verify envelope balances and over-limit alerts are accurate.

