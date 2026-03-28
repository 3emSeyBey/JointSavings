# JointSavings Implementation Master Tracker

Master progress tracker for all backlog tickets in `BACKLOG_TICKETS.md`.

## Status Legend

- `Not Started`
- `In Progress`
- `Blocked`
- `In Review`
- `Done`

## Documentation Map

- [Epic A - Security, Auth, and Multi-Household](implementation-tickets/EPIC_A_SECURITY_AUTH.md)
- [Epic B - Data Integrity and Reliability](implementation-tickets/EPIC_B_DATA_INTEGRITY.md)
- [Epic C - Analytics and Planning Intelligence](implementation-tickets/EPIC_C_ANALYTICS_INTELLIGENCE.md)
- [Epic D - AI Copilot 2.0](implementation-tickets/EPIC_D_AI_COPILOT.md)
- [Epic E - Gamification and Engagement](implementation-tickets/EPIC_E_GAMIFICATION.md)
- [Epic F - UX, Accessibility, Performance](implementation-tickets/EPIC_F_UX_ACCESSIBILITY_PERF.md)
- [Epic G - Integrations and Open Finance](implementation-tickets/EPIC_G_OPEN_FINANCE.md)
- [Epic H - Quality, Testing, Delivery](implementation-tickets/EPIC_H_QUALITY_DELIVERY.md)

## Wave Tracking

### Wave 1 (Stabilize Core)

- Scope: `A-001..A-008`, `B-001..B-004`, `H-001..H-004`
- Progress: `0 / 16` complete
- Target window: _TBD_

### Wave 2 (Trust + Intelligence)

- Scope: `A-009..A-012`, `B-005..B-010`, `C-001..C-004`, `D-001..D-004`, `F-001..F-004`
- Progress: `0 / 22` complete
- Target window: _TBD_

### Wave 3 (Differentiation)

- Scope: `C-005..C-008`, `D-005..D-008`, `E-001..E-007`, `F-005..F-007`, `G-001..G-005`, `H-005..H-006`
- Progress: `0 / 25` complete
- Target window: _TBD_

## Ticket Register

| ID | Title | Priority | Effort | Epic | Status | Owner | Start | ETA | Notes |
|---|---|---|---|---|---|---|---|---|---|
| A-001 | Introduce householdId + data migration | P0 | L | A | Not Started |  |  |  |  |
| A-002 | Dynamic member model | P0 | L | A | Not Started |  |  |  |  |
| A-003 | Real auth (email/OAuth) | P0 | XL | A | Not Started |  |  |  |  |
| A-004 | Role-based household membership | P0 | L | A | Not Started |  |  |  |  |
| A-005 | Server-side Gemini proxy | P0 | M | A | Not Started |  |  |  |  |
| A-006 | AI endpoint auth + rate limiting | P0 | M | A | Not Started |  |  |  |  |
| A-007 | Secure PIN + lockout | P0 | M | A | Not Started |  |  |  |  |
| A-008 | Production Firestore rules | P0 | M | A | Not Started |  |  |  |  |
| A-009 | Audit logging for sensitive actions | P1 | M | A | Not Started |  |  |  |  |
| A-010 | Partner invite flow | P1 | M | A | Not Started |  |  |  |  |
| A-011 | Startup environment validation | P1 | S | A | Not Started |  |  |  |  |
| A-012 | Secrets hygiene + preflight checks | P1 | M | A | Not Started |  |  |  |  |
| B-001 | Atomic tx + goal contribution | P0 | M | B | Not Started |  |  |  |  |
| B-002 | Central money/date input validation | P0 | M | B | Not Started |  |  |  |  |
| B-003 | Timezone-safe date utilities | P0 | M | B | Not Started |  |  |  |  |
| B-004 | Store money as integer cents | P1 | M | B | Not Started |  |  |  |  |
| B-005 | Optimistic update + rollback | P1 | M | B | Not Started |  |  |  |  |
| B-006 | Idempotency for creates | P1 | M | B | Not Started |  |  |  |  |
| B-007 | Replace alert/confirm UI | P1 | S | B | Not Started |  |  |  |  |
| B-008 | Async error boundaries | P1 | S | B | Not Started |  |  |  |  |
| B-009 | Soft delete + undo tx | P1 | M | B | Not Started |  |  |  |  |
| B-010 | Complete cutoff lifecycle actions | P1 | M | B | Not Started |  |  |  |  |
| C-001 | Category model + insights | P1 | L | C | Not Started |  |  |  |  |
| C-002 | Forecast timeline | P1 | L | C | Not Started |  |  |  |  |
| C-003 | What-if simulator | P1 | M | C | Not Started |  |  |  |  |
| C-004 | Fairness/effort metric | P1 | M | C | Not Started |  |  |  |  |
| C-005 | Recurring contribution templates | P2 | M | C | Not Started |  |  |  |  |
| C-006 | Anomaly detection cards | P2 | M | C | Not Started |  |  |  |  |
| C-007 | Weekly financial recap | P2 | M | C | Not Started |  |  |  |  |
| C-008 | Export report pack PDF/CSV | P2 | M | C | Not Started |  |  |  |  |
| D-001 | Persist AI chat by household | P1 | M | D | Not Started |  |  |  |  |
| D-002 | AI memory controls | P1 | M | D | Not Started |  |  |  |  |
| D-003 | Structured AI tools | P1 | L | D | Not Started |  |  |  |  |
| D-004 | Proactive AI nudges | P1 | M | D | Not Started |  |  |  |  |
| D-005 | Multilingual AI coaching | P2 | L | D | Not Started |  |  |  |  |
| D-006 | AI explainability cards | P2 | M | D | Not Started |  |  |  |  |
| D-007 | Coach playbooks | P2 | M | D | Not Started |  |  |  |  |
| D-008 | Voice companion mode | P3 | XL | D | Not Started |  |  |  |  |
| E-001 | Target adherence streaks | P1 | M | E | Not Started |  |  |  |  |
| E-002 | Quests/challenges engine | P1 | M | E | Not Started |  |  |  |  |
| E-003 | Milestone badges/timeline | P2 | M | E | Not Started |  |  |  |  |
| E-004 | Financially-linked mini-games | P2 | M | E | Not Started |  |  |  |  |
| E-005 | Partner accountability prompts | P2 | M | E | Not Started |  |  |  |  |
| E-006 | Seasonal savings events | P2 | L | E | Not Started |  |  |  |  |
| E-007 | Social circles leaderboard | P3 | L | E | Not Started |  |  |  |  |
| F-001 | Modal accessibility hardening | P1 | M | F | Not Started |  |  |  |  |
| F-002 | Small-screen responsive pass | P1 | M | F | Not Started |  |  |  |  |
| F-003 | Tx list virtualization | P1 | M | F | Not Started |  |  |  |  |
| F-004 | Loading/error/empty consistency kit | P1 | S | F | Not Started |  |  |  |  |
| F-005 | Custom dashboard layout | P2 | M | F | Not Started |  |  |  |  |
| F-006 | Theme engine v2 | P2 | M | F | Not Started |  |  |  |  |
| F-007 | Offline + reconnect UX | P2 | S | F | Not Started |  |  |  |  |
| G-001 | Bank account linking | P2 | XL | G | Not Started |  |  |  |  |
| G-002 | Ingestion + dedupe pipeline | P2 | L | G | Not Started |  |  |  |  |
| G-003 | Recurring bills/subscriptions | P2 | L | G | Not Started |  |  |  |  |
| G-004 | Pay-by-bank transfer flow | P2 | L | G | Not Started |  |  |  |  |
| G-005 | Shared envelope wallet model | P3 | XL | G | Not Started |  |  |  |  |
| H-001 | Unit tests for money/date utils | P0 | M | H | Not Started |  |  |  |  |
| H-002 | Hook integration tests | P0 | M | H | Not Started |  |  |  |  |
| H-003 | E2E happy path | P1 | M | H | Not Started |  |  |  |  |
| H-004 | CI lint/type/test workflow | P1 | S | H | Not Started |  |  |  |  |
| H-005 | Monitoring + alerting | P1 | M | H | Not Started |  |  |  |  |
| H-006 | Feature flags + staged rollout | P2 | M | H | Not Started |  |  |  |  |

## Weekly Progress Log

| Date | Completed | In Progress | Blocked | Notes |
|---|---:|---:|---:|---|
| YYYY-MM-DD | 0 | 0 | 0 | Kickoff |

