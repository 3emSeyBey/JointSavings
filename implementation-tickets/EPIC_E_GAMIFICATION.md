# Epic E - Gamification and Engagement Engine

---

## E-001 - Add streaks for target adherence

### Objective
Increase consistency through habit reinforcement.

### Implementation Plan
- Define streak events (daily save, cutoff completion, weekly target hit).
- Track current, best, and recovery states.

### Tasks
- [ ] Add streak state model.
- [ ] Compute streak updates from transaction/cutoff events.
- [ ] Show streak cards and progress nudges.

### Test Plan
- Verify streak increments/breaks/recovery logic.

---

## E-002 - Add quests/challenges system

### Objective
Convert financial goals into structured weekly missions.

### Implementation Plan
- Add quest templates and assignment engine.
- Track completion and reward claims.

### Tasks
- [ ] Define quest schema and lifecycle.
- [ ] Build challenge board UI.
- [ ] Add reward ledger and claim history.

### Test Plan
- Verify quests complete from qualifying events only.

---

## E-003 - Add milestone badges and celebration timelines

### Objective
Celebrate progress and reinforce momentum.

### Implementation Plan
- Award badges at pre-defined goal/target milestones.
- Add timeline feed for achievements.

### Tasks
- [ ] Define badge catalog and trigger rules.
- [ ] Build achievement timeline view.
- [ ] Add share-card generation option.

### Test Plan
- Verify no duplicate badge grants for same milestone.

---

## E-004 - Tie mini-games to real financial actions

### Objective
Bridge entertainment and financial behavior.

### Implementation Plan
- Add optional post-game actions (micro-quests, no-spend challenges, bonus save).
- Persist game outcome to challenge context.

### Tasks
- [ ] Add game outcome event model.
- [ ] Build "apply outcome to challenge" workflow.
- [ ] Add opt-in safeguards to avoid coercive UX.

### Test Plan
- Verify financial actions are always explicit opt-in.

---

## E-005 - Add partner accountability prompts

### Objective
Encourage supportive follow-through when one member falls behind.

### Implementation Plan
- Trigger empathetic prompts based on target gap and due date.
- Support tone customization and snooze behavior.

### Tasks
- [ ] Add accountability trigger logic.
- [ ] Create message templates with neutral/supportive tone.
- [ ] Add mute/snooze preferences.

### Test Plan
- Verify prompts stop when user catches up or snoozes.

---

## E-006 - Add seasonal events (30-day savings sprint)

### Objective
Drive periodic re-engagement with time-boxed campaigns.

### Implementation Plan
- Build event engine with start/end windows and dynamic rules.
- Allow admin/user activation without code changes.

### Tasks
- [ ] Define event config schema.
- [ ] Add event dashboard and progress visuals.
- [ ] Add event-specific rewards and recap.

### Test Plan
- Verify events auto-start/auto-end by schedule.

---

## E-007 - Add social circles and friend leaderboard (opt-in)

### Objective
Introduce optional social accountability with privacy controls.

### Implementation Plan
- Add private circles with invite-based membership.
- Publish aggregated, privacy-safe leaderboard metrics.

### Tasks
- [ ] Add circle model and membership flow.
- [ ] Build leaderboard with anonymization controls.
- [ ] Add strict opt-in/opt-out UX.

### Test Plan
- Verify non-opt-in households never appear in leaderboards.

