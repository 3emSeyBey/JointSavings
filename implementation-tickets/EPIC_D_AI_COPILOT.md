# Epic D - AI Copilot 2.0

---

## D-001 - Persist AI chat threads per household

### Objective
Provide continuity and context across sessions/devices.

### Implementation Plan
- Add conversation storage model by household + thread ID.
- Add loading/pagination and retention policy.

### Tasks
- [ ] Persist user and assistant messages with metadata.
- [ ] Add thread list/reopen support.
- [ ] Add clear thread and retention settings.

### Test Plan
- Verify chat survives reload and cross-device sign in.
- Verify household isolation between chats.

---

## D-002 - Add AI memory controls and data transparency

### Objective
Increase trust and user control over AI context.

### Implementation Plan
- Show what data is used to answer prompts.
- Allow users to opt out of memory or clear memory scope.

### Tasks
- [ ] Add "memory panel" in AI UI.
- [ ] Implement memory on/off at household/user level.
- [ ] Add granular clear actions (last msg/thread/all).

### Test Plan
- Verify disabled memory prevents historical context reuse.

---

## D-003 - Introduce structured AI tools (balances/goals/cutoffs)

### Objective
Reduce hallucinations in data-driven responses.

### Implementation Plan
- Implement tool-call layer for bounded queries (totals, owed, target progress).
- Force model responses to reference tool outputs for numeric answers.

### Tasks
- [ ] Define tool contracts and schemas.
- [ ] Build server resolver for each tool.
- [ ] Add response guardrails and fallback messaging.

### Test Plan
- Verify numeric answers match source data across edge cases.
- Verify missing data produces safe response.

---

## D-004 - Build proactive AI nudges engine

### Objective
Shift coach from reactive chat to proactive guidance.

### Implementation Plan
- Run periodic rule checks (missed target risk, overdue balances, streak breaks).
- Generate nudge cards and optional notifications.

### Tasks
- [ ] Define trigger conditions and cadence.
- [ ] Build nudge generation pipeline.
- [ ] Add dismiss/snooze and relevance feedback.

### Test Plan
- Verify nudges trigger only when conditions are met.
- Verify snoozed nudges respect suppression period.

---

## D-005 - Add multilingual coaching with locale-aware tone

### Objective
Improve accessibility and user affinity across languages.

### Implementation Plan
- Add language preference settings and localized prompt templates.
- Localize key financial terms and tone guidelines by locale.

### Tasks
- [ ] Add locale settings for coach.
- [ ] Build localized prompt packs and UI strings.
- [ ] Add fallback language strategy.

### Test Plan
- Verify message output respects selected locale.
- Verify mixed-language household behavior is stable.

---

## D-006 - Add AI explainability cards for recommendations

### Objective
Make recommendations auditable and credible.

### Implementation Plan
- Attach "why this recommendation" panel with source metrics and confidence.
- Display data timestamp and assumption references.

### Tasks
- [ ] Add explainability schema to AI responses.
- [ ] Render evidence cards in chat.
- [ ] Add "report incorrect advice" feedback action.

### Test Plan
- Verify every recommendation includes evidence fields.

---

## D-007 - Add Coach Playbooks

### Objective
Offer guided strategy presets for different goals.

### Implementation Plan
- Define playbook templates (Debt-first, Vacation sprint, Emergency fund).
- Translate selected playbook into target/goal/routine configuration suggestions.

### Tasks
- [ ] Add playbook catalog + detail UI.
- [ ] Add apply-preview-confirm flow.
- [ ] Add rollback/revert to prior config.

### Test Plan
- Verify applied playbook updates expected settings only.

---

## D-008 - Build voice companion mode (speech in/out)

### Objective
Enable hands-free financial check-ins and quick actions.

### Implementation Plan
- Add speech-to-text input and text-to-speech responses.
- Require confirmation step for any write action by voice.

### Tasks
- [ ] Add voice capture controls and permissions UX.
- [ ] Integrate STT/TTS provider abstraction.
- [ ] Add command parser + confirmation dialog.

### Test Plan
- Verify voice queries are accurate in noisy conditions baseline.
- Verify writes are impossible without explicit confirmation.

