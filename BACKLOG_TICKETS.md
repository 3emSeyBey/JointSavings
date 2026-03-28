# JointSavings Product Backlog (Ambitious)

This backlog is organized to de-risk the app first, then scale toward a world-class couples financial copilot.

Priority scale:
- `P0` critical correctness/security
- `P1` high impact
- `P2` medium impact
- `P3` exploratory/longer-horizon

Effort scale:
- `S` <= 1 day
- `M` 2-4 days
- `L` 1-2 weeks
- `XL` multi-week

## Epic A - Security, Auth, and Multi-Household Architecture

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| A-001 | P0 | L | Introduce `householdId` and migrate all Firestore paths | All reads/writes are scoped by `householdId`; no global shared docs remain; existing sample data migrates cleanly. |
| A-002 | P0 | L | Replace hardcoded profile IDs with dynamic member model | App supports >2 members in schema; no `pea/cam` assumptions in hooks/components. |
| A-003 | P0 | XL | Implement real authentication (email/OAuth) | Anonymous-only auth removed or optional; users can sign in/out reliably across sessions. |
| A-004 | P0 | L | Add role-based household membership (owner/member/viewer) | Permissions enforced in UI and Firestore rules; unauthorized writes are blocked. |
| A-005 | P0 | M | Move Gemini calls to server-side function/proxy | API key no longer shipped to client; AI requests succeed through secure backend endpoint. |
| A-006 | P0 | M | Add request auth + rate limiting for AI endpoints | Per-user quotas enforced; abuse attempts return handled errors; costs become predictable. |
| A-007 | P0 | M | Hash/encrypt profile unlock PIN and add retry lockout | PIN never stored in plaintext; failed attempts trigger cooldown/lockout policy. |
| A-008 | P0 | M | Create production Firestore security rules | Rules enforce `householdId` ownership, role checks, and write constraints. |
| A-009 | P1 | M | Add audit log collection for sensitive actions | Profile edits, goal deletes, period closes, and member changes are recorded with actor/timestamp. |
| A-010 | P1 | M | Build invite flow for partner onboarding | Owner can create invite links/codes; invitee can join household with validation. |
| A-011 | P1 | S | Add environment validation at app startup | Missing Firebase/API config produces clear setup screen instead of runtime failures. |
| A-012 | P1 | M | Add secrets hygiene docs and preflight checks | `.env.example` added; startup/docs explain required keys; accidental key exposure checks included. |

## Epic B - Money Data Integrity and Core Reliability

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| B-001 | P0 | M | Make transaction + goal contribution atomic | One user action cannot partially apply; rollback/transaction guarantees consistency. |
| B-002 | P0 | M | Validate amount/date/note inputs centrally | Negative, NaN, malformed dates rejected in UI and backend rules. |
| B-003 | P0 | M | Fix timezone-safe date handling utilities | `today` and cutoff logic are consistent across timezones and around midnight. |
| B-004 | P1 | M | Normalize money storage to integer cents | No floating precision drift; all calculations use integer minor units. |
| B-005 | P1 | M | Add optimistic updates + resilient rollback | UI feels immediate; failures revert state and show actionable errors. |
| B-006 | P1 | M | Add idempotency keys for create operations | Retry/double-submit cannot create duplicate transactions/goals. |
| B-007 | P1 | S | Replace `alert/confirm` flows with app toasts/dialogs | Error/success messages are non-blocking and consistent across app. |
| B-008 | P1 | S | Standardize async error boundaries per tab | Crashes in one module do not white-screen app; fallback UI displayed. |
| B-009 | P1 | M | Implement history-safe delete/undo for transactions | Deleted items can be restored within grace period; activity is tracked. |
| B-010 | P1 | M | Complete cutoff period lifecycle actions | Close/reopen/pay-owed actions are wired and reflected in history accurately. |

## Epic C - Analytics, Planning, and Financial Intelligence

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| C-001 | P1 | L | Add category model + categorized spending insights | Every transaction can be categorized; analytics show category trends and outliers. |
| C-002 | P1 | L | Build "forecast timeline" (6/12/24 months) | Users can project savings based on current behavior and adjustable assumptions. |
| C-003 | P1 | M | Add "what-if simulator" for goals/targets | Users can tweak monthly contribution and see ETA impact instantly. |
| C-004 | P1 | M | Add fairness/effort metric (not just amount split) | Dashboard shows contribution fairness based on chosen model (equal %, fixed share, income-adjusted). |
| C-005 | P2 | M | Add recurring contribution templates | Users can create recurring entries; reminders and expected-vs-actual tracking visible. |
| C-006 | P2 | M | Build anomaly detection for unusual spending/saving | App flags unusual patterns with explainable insight cards. |
| C-007 | P2 | M | Add weekly financial recap digest | In-app recap summarizes wins, risks, and next best actions. |
| C-008 | P2 | M | Export analytics/report pack (PDF/CSV) | Users can download goal progress, contribution split, and period history reports. |

## Epic D - AI Copilot 2.0

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| D-001 | P1 | M | Persist AI chat threads per household | Chat history survives reload/login and is separated by household. |
| D-002 | P1 | M | Add AI memory controls and data transparency | Users can view/clear AI memory context and understand what data is used. |
| D-003 | P1 | L | Introduce structured AI tools (query balances/goals/cutoffs) | AI responses grounded on explicit tool calls; hallucinations reduced for numeric queries. |
| D-004 | P1 | M | Build proactive AI nudges engine | Coach surfaces timely prompts (missed target risk, overdue owed, goal near completion). |
| D-005 | P2 | L | Add multilingual coaching with locale-aware tone | Users can pick language/voice style; key screens and AI prompts localize correctly. |
| D-006 | P2 | M | Add AI explainability cards for recommendations | Each recommendation links to data points and confidence level. |
| D-007 | P2 | M | Add "Coach Playbooks" (Debt-first, Vacation sprint, Emergency fund) | Users can apply a playbook and see concrete rule changes on targets/goals. |
| D-008 | P3 | XL | Build voice companion mode (speech in/out) | Users can ask for status and add savings by voice with confirmation flow. |

## Epic E - Gamification and Engagement Engine

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| E-001 | P1 | M | Add streaks for target adherence | Daily/period streaks update correctly and recover logic works after misses. |
| E-002 | P1 | M | Add quests/challenges system | Weekly quests can be assigned/completed; rewards are visible in profile. |
| E-003 | P2 | M | Add milestone badges and celebration timelines | Goal milestones create shareable achievement cards and timeline entries. |
| E-004 | P2 | M | Tie mini-games to real financial actions | Game outcomes can trigger optional micro-actions (e.g., "winner picks weekend no-spend challenge"). |
| E-005 | P2 | M | Add partner accountability prompts | Smart reminders trigger when one member is behind target, with empathetic language. |
| E-006 | P2 | L | Add seasonal events (30-day savings sprint) | Event templates can be enabled and tracked without custom code changes. |
| E-007 | P3 | L | Add social circles and friend leaderboard (opt-in) | Households can join private circles; leaderboard uses privacy-safe aggregated metrics. |

## Epic F - UX, Accessibility, and App Performance

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| F-001 | P1 | M | Implement keyboard/focus accessibility for all modals | Trap focus, ESC close, and screen reader labels pass accessibility checks. |
| F-002 | P1 | M | Improve responsive layout for small devices | Critical flows are fully usable on narrow mobile screens without overflow issues. |
| F-003 | P1 | M | Add transaction list pagination/virtualization | Large histories remain smooth; memory and render cost reduced measurably. |
| F-004 | P1 | S | Add empty/loading/error states consistency kit | Each tab has coherent skeleton/loading/error UX patterns. |
| F-005 | P2 | M | Add customizable dashboard cards | Users can reorder/hide widgets and persist layout preferences. |
| F-006 | P2 | M | Add theme engine v2 (light/dark + custom palettes) | Theme changes propagate consistently with contrast-safe defaults. |
| F-007 | P2 | S | Add offline banner + reconnect behavior | Users see offline state and pending sync indicator with graceful recovery. |

## Epic G - Integrations and Open Finance

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| G-001 | P2 | XL | Integrate bank account linking provider (region-gated) | Users can link accounts securely; import flow handles connect/disconnect/re-auth. |
| G-002 | P2 | L | Build transaction ingestion pipeline + dedupe | Imported transactions are normalized/categorized and duplicates are prevented. |
| G-003 | P2 | L | Add recurring bill/subscription detection | Recurring obligations identified with upcoming due alerts. |
| G-004 | P2 | L | Add pay-by-bank transfer-to-savings flow (where supported) | Users can trigger transfer actions with consent and status tracking. |
| G-005 | P3 | XL | Add card wallet + shared spending envelope model | Households can allocate envelopes and monitor spend vs envelope limits. |

## Epic H - Quality, Testing, and Delivery

| ID | Priority | Effort | Ticket | Acceptance Criteria |
|---|---|---:|---|---|
| H-001 | P0 | M | Add unit tests for money/date utility functions | Core utils (currency/date/period math) have deterministic test coverage. |
| H-002 | P0 | M | Add integration tests for hooks (`useFirestore`, targets, sessions) | CRUD and period flows are tested with Firebase emulator/local mocks. |
| H-003 | P1 | M | Add E2E happy path (login, add tx, goal, target, AI open) | Main user journey runs green in CI on every PR. |
| H-004 | P1 | S | Add lint/format/typecheck CI workflow | Pull requests fail fast on lint/type/test regressions. |
| H-005 | P1 | M | Add monitoring + alerting (errors, API latency, AI cost) | Key metrics dashboard and threshold alerts are active. |
| H-006 | P2 | M | Add feature flags + staged rollout support | Risky features can be enabled per cohort/environment with rollback switch. |

## Suggested Delivery Waves

- Wave 1 (Stabilize Core): `A-001..A-008`, `B-001..B-004`, `H-001..H-004`
- Wave 2 (Trust + Intelligence): `A-009..A-012`, `B-005..B-010`, `C-001..C-004`, `D-001..D-004`, `F-001..F-004`
- Wave 3 (Differentiation): `C-005..C-008`, `D-005..D-008`, `E-*`, `G-*`, `F-005..F-007`, `H-005..H-006`

