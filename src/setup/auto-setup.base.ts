import type { JestPreset } from './jest-wrapper';
import { setupJest } from './jest-wrapper';

/**
 * Shared helper for auto-setup entrypoints.
 * Each preset-specific file simply calls this with the appropriate preset name.
 */
export function registerAutoSetup(preset: JestPreset): void {
  const isJestEnvironment =
    typeof jest !== 'undefined' &&
    typeof beforeAll !== 'undefined' &&
    typeof beforeEach !== 'undefined';

  if (!isJestEnvironment) {
    return;
  }

  const test = setupJest(preset);

  beforeAll(test.setup.beforeAll);
  beforeEach(test.setup.beforeEach);
  afterEach(test.setup.afterEach);
  afterAll(test.setup.afterAll);

  if (typeof global !== 'undefined') {
    (global as typeof globalThis & { jestHelpers: typeof test }).jestHelpers = test;
  }
}
