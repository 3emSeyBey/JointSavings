# Epic F - UX, Accessibility, and App Performance

---

## F-001 - Implement keyboard/focus accessibility for all modals

### Objective
Ensure modal flows are accessible and standards-compliant.

### Implementation Plan
- Add focus trap, ESC close, initial focus, and return focus behavior.
- Add aria labels/roles and screen reader announcements.

### Tasks
- [ ] Build reusable accessible modal wrapper.
- [ ] Refactor all existing modal components to wrapper.
- [ ] Add accessibility smoke checks.

### Test Plan
- Verify keyboard-only navigation end-to-end.
- Verify screen reader announces modal context correctly.

---

## F-002 - Improve responsive layout for small devices

### Objective
Fix layout friction on narrow mobile screens.

### Implementation Plan
- Audit breakpoints for overflow, clipped controls, and tap targets.
- Refactor key screens with mobile-first constraints.

### Tasks
- [ ] Run visual QA matrix for common mobile widths.
- [ ] Fix tab nav, modal sizing, chart responsiveness, floating action conflicts.
- [ ] Add responsive regression checklist.

### Test Plan
- Verify all primary actions reachable at 320-390px widths.

---

## F-003 - Add transaction list pagination/virtualization

### Objective
Keep app smooth for large histories.

### Implementation Plan
- Add server query paging and client virtualized rendering.
- Preserve sort/filter behavior under pagination.

### Tasks
- [ ] Add paged transaction query with cursor state.
- [ ] Integrate list virtualization library or custom windowing.
- [ ] Add loading placeholders and fetch-next UX.

### Test Plan
- Verify smooth scroll and low memory at 5k+ rows.

---

## F-004 - Add empty/loading/error states consistency kit

### Objective
Standardize user feedback and reduce state ambiguity.

### Implementation Plan
- Create shared components for empty/loading/error states.
- Apply across all tabs and key async blocks.

### Tasks
- [ ] Build state components with theme variants.
- [ ] Replace ad hoc messages.
- [ ] Add retry hooks where applicable.

### Test Plan
- Verify every tab has clear state for empty, loading, and error.

---

## F-005 - Add customizable dashboard cards

### Objective
Let households tailor what matters most.

### Implementation Plan
- Add drag/reorder/hide controls for dashboard widgets.
- Persist layout preferences per user or household.

### Tasks
- [ ] Define widget registry and preference schema.
- [ ] Add edit mode and reorder interactions.
- [ ] Add reset-to-default action.

### Test Plan
- Verify layout persists after refresh/sign-in.

---

## F-006 - Add theme engine v2 (light/dark + custom palettes)

### Objective
Improve personalization and visual accessibility.

### Implementation Plan
- Expand theme system to include dark mode and palette overrides.
- Enforce contrast checks for accessible combinations.

### Tasks
- [ ] Refactor theme tokens to semantic design tokens.
- [ ] Add mode switch and preference persistence.
- [ ] Add contrast validation guard for custom colors.

### Test Plan
- Verify dark mode coverage across all tabs/modals.

---

## F-007 - Add offline banner + reconnect behavior

### Objective
Make connectivity state explicit and resilient.

### Implementation Plan
- Detect offline/online transitions and queued mutations.
- Show pending sync state with reconnect reconciliation.

### Tasks
- [ ] Add network status hook.
- [ ] Add offline banner and queued action indicator.
- [ ] Add replay/retry flow after reconnect.

### Test Plan
- Verify offline write intent is preserved and replayed safely.

