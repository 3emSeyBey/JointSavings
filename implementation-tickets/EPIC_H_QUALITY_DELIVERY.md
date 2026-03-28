# Epic H - Quality, Testing, and Delivery

---

## H-001 - Add unit tests for money/date utility functions

### Objective
Prevent regressions in foundational computations.

### Implementation Plan
- Add deterministic tests for currency conversion/formatting and period/date utilities.
- Cover boundary and locale/timezone edge cases.

### Tasks
- [ ] Add test runner setup for unit tests.
- [ ] Create fixture matrix for money/date cases.
- [ ] Enforce coverage threshold for utility modules.

### Test Plan
- Verify passing tests for all known edge conditions.

---

## H-002 - Add integration tests for hooks (`useFirestore`, targets, sessions)

### Objective
Validate real data flow behavior across hooks and Firestore interactions.

### Implementation Plan
- Use Firebase emulator/mocks for isolated integration tests.
- Cover CRUD flows, cutoff lifecycle, and session restore behavior.

### Tasks
- [ ] Configure emulator test environment.
- [ ] Write hook integration tests for create/read/update/delete.
- [ ] Add failure-path tests (timeouts, permission denied).

### Test Plan
- Verify each hook passes happy and failure paths.

---

## H-003 - Add E2E happy path

### Objective
Guarantee baseline user journey on every release.

### Implementation Plan
- Build E2E flow: auth/login -> add tx -> goal update -> target view -> AI open.
- Run headless in CI.

### Tasks
- [ ] Select and configure E2E framework.
- [ ] Add stable test data and deterministic selectors.
- [ ] Add CI execution artifact capture (screenshots/video on fail).

### Test Plan
- Verify E2E passes on PR and main branches.

---

## H-004 - Add lint/format/typecheck CI workflow

### Objective
Catch quality regressions before merge.

### Implementation Plan
- Add CI pipeline for lint, typecheck, and tests.
- Block merge on failing checks.

### Tasks
- [ ] Add workflow config with caching.
- [ ] Add scripts for lint/type/test consistency.
- [ ] Enforce required checks in repository settings.

### Test Plan
- Verify failing lint/type/test blocks PR merge.

---

## H-005 - Add monitoring + alerting (errors, API latency, AI cost)

### Objective
Improve production reliability and cost control.

### Implementation Plan
- Add runtime error monitoring and API latency dashboards.
- Add AI usage/cost metrics per user/household.

### Tasks
- [ ] Integrate client/server error logging.
- [ ] Define core SLOs and alert thresholds.
- [ ] Add cost anomaly alerts for AI usage spikes.

### Test Plan
- Verify synthetic error/latency incidents trigger alerts.

---

## H-006 - Add feature flags + staged rollout support

### Objective
Reduce launch risk for large features.

### Implementation Plan
- Add runtime flag framework with environment and cohort targeting.
- Gate major features behind reversible toggles.

### Tasks
- [ ] Add flag provider and typed flag registry.
- [ ] Add admin/config workflow for rollout percentages.
- [ ] Add audit logging for flag changes.

### Test Plan
- Verify disabled flags fully hide feature code paths.
- Verify gradual rollout can be increased/decreased safely.

