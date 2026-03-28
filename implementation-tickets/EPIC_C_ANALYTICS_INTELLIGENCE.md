# Epic C - Analytics, Planning, and Financial Intelligence

---

## C-001 - Add category model + categorized spending insights

### Objective
Make analytics actionable by category, not just totals.

### Implementation Plan
- Add transaction category taxonomy with defaults + custom categories.
- Support manual and assisted categorization.
- Add category trend/outlier visualizations.

### Tasks
- [ ] Define category schema and defaults.
- [ ] Add category selector in transaction flow.
- [ ] Build analytics cards/charts for category spend/savings.

### Test Plan
- Verify uncategorized fallback behavior.
- Verify category totals reconcile with overall totals.

---

## C-002 - Build forecast timeline (6/12/24 months)

### Objective
Enable forward-looking planning from current financial behavior.

### Implementation Plan
- Create projection engine based on contribution patterns and targets.
- Show timeline chart with confidence bands/assumptions.

### Tasks
- [ ] Build forecast computation service.
- [ ] Add assumptions panel (growth, recurring saves, one-time events).
- [ ] Render projections in analytics tab.

### Test Plan
- Verify deterministic outputs for fixed input fixtures.
- Verify assumption changes update projections instantly.

---

## C-003 - Add what-if simulator for goals/targets

### Objective
Give users instant impact analysis for contribution changes.

### Implementation Plan
- Add scenario sandbox inputs (monthly amount, frequency, start date).
- Compute ETA and completion probability by goal/target.

### Tasks
- [ ] Build simulator model and UI controls.
- [ ] Add side-by-side current vs simulated comparison.
- [ ] Persist favorite scenarios per household.

### Test Plan
- Verify simulator never mutates real data.
- Verify ETA updates as inputs change.

---

## C-004 - Add fairness/effort metric (beyond amount split)

### Objective
Measure fairness with configurable contribution logic.

### Implementation Plan
- Support fairness modes: equal amount, fixed split, income-adjusted.
- Visualize fairness trend over time.

### Tasks
- [ ] Add fairness policy settings.
- [ ] Implement metric calculations with explainers.
- [ ] Add dashboard panel with historical trend.

### Test Plan
- Verify calculations across all fairness modes.
- Verify mode switch updates all dependent UI.

---

## C-005 - Add recurring contribution templates

### Objective
Automate habitual savings contributions.

### Implementation Plan
- Add recurring rule model (amount, cadence, owner, goal link).
- Generate expected entries and reminders.

### Tasks
- [ ] Build recurring rule CRUD UI.
- [ ] Add scheduler/trigger logic.
- [ ] Add expected-vs-actual tracking widget.

### Test Plan
- Verify missed and completed recurring items are tracked correctly.

---

## C-006 - Build anomaly detection for unusual spending/saving

### Objective
Detect behavior spikes and regressions early.

### Implementation Plan
- Implement baseline + deviation detection per member/category.
- Surface anomaly cards with short explanations and actions.

### Tasks
- [ ] Define anomaly thresholds and scoring.
- [ ] Build anomaly computation job/hook.
- [ ] Add dismiss/snooze interaction.

### Test Plan
- Verify known synthetic anomalies are detected.
- Verify low-noise behavior does not over-trigger.

---

## C-007 - Add weekly financial recap digest

### Objective
Create a regular review cadence for better habits.

### Implementation Plan
- Generate weekly summary from transactions, goals, targets, owed amounts.
- Show in-app recap and optional notification/email channel.

### Tasks
- [ ] Build recap generator and template.
- [ ] Add recap timeline/history view.
- [ ] Add per-household recap schedule settings.

### Test Plan
- Verify recap uses correct date range and metrics.

---

## C-008 - Export analytics/report pack (PDF/CSV)

### Objective
Make data portable for review and planning.

### Implementation Plan
- Provide CSV exports for raw data and PDF summary for dashboards.
- Include goal progress, period history, member split, forecast snapshots.

### Tasks
- [ ] Add export menu in analytics.
- [ ] Implement CSV serializers and PDF renderer.
- [ ] Add file naming/versioning conventions.

### Test Plan
- Verify exported totals match in-app values exactly.
- Verify export works on mobile and desktop.

