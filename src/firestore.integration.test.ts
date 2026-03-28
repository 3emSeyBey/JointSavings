import { describe, it } from 'vitest';

/**
 * H-002: Run against the Firestore emulator (firebase emulators:exec …).
 * Skipped in default `npm test` until emulator wiring is added to CI.
 */
describe.skip('Firestore emulator (household isolation)', () => {
  it('placeholder — add rules + emulator harness', () => {
    // e.g. @firebase/rules-unit-testing with households/{hid}/data paths
  });
});
