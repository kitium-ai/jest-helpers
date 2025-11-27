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

import { registerAutoSetup } from './auto-setup.base';

registerAutoSetup('unit');

export default {};
