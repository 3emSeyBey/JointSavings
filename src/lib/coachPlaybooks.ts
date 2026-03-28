/** Suggested coaching flows (D-004 / explainability baseline). */
export const COACH_PLAYBOOKS = [
  { id: 'weekly-checkin', title: 'Weekly check-in', prompt: 'How did we do on savings this week?' },
  { id: 'cutoff-prep', title: 'Before cutoff', prompt: 'What should we do before the next cutoff date?' },
  { id: 'fairness', title: 'Fairness', prompt: 'Is our savings split fair given our incomes?' },
] as const;
