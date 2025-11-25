/**
 * Auto-setup for Jest - Import this file once and everything is configured
 *
 * Usage in jest.config.js:
 * ```javascript
 * module.exports = {
 *   setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup'],
 * };
 * ```
 *
 * Or in a setup file:
 * ```typescript
 * import '@kitiumai/jest-helpers/auto-setup';
 * ```
 *
 * That's it! All Jest complexity is handled automatically.
 *
 * Note: For custom configuration, use setupJest() directly instead.
 */

import { setupJest } from './jest-wrapper';

// Only auto-setup if we're in a Jest environment
// This prevents errors in non-test contexts
const isJestEnvironment =
  typeof jest !== 'undefined' &&
  typeof beforeAll !== 'undefined' &&
  typeof beforeEach !== 'undefined';

if (isJestEnvironment) {
  // Auto-setup with unit test defaults
  // Users can override by calling setupJest themselves in their test files
  const test = setupJest('unit');

  // Set up Jest lifecycle hooks automatically
  beforeAll(test.setup.beforeAll);
  beforeEach(test.setup.beforeEach);
  afterEach(test.setup.afterEach);
  afterAll(test.setup.afterAll);

  // Make test utilities globally available for convenience
  // Users can also import setupJest() for type-safe access
  if (typeof global !== 'undefined') {
    (global as typeof globalThis & { jestHelpers: typeof test }).jestHelpers = test;
  }
}

export default {};
