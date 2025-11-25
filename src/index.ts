/**
 * @kitiumai/jest-helpers - Jest wrapper that handles complexity internally
 * Provides a simple API for enterprise testing
 *
 * RECOMMENDED USAGE (Simple API):
 * ```typescript
 * import { setupJest } from '@kitiumai/jest-helpers';
 *
 * const test = setupJest('unit'); // Everything set up automatically!
 * const mockFn = test.utils.mock.createMock({ returnValue: 'test' });
 * ```
 *
 * For advanced use cases or namespace exports:
 * import { namespaced } from '@kitiumai/jest-helpers/namespaced';
 */

// Core exports (avoiding duplicates)
export * from './mocks';
export * from './fixtures';
export * from './matchers';
export * from './database';
export * from './http';
export * from './setup';
export * from './async';

// Console exports (context-aware console capture)
export { captureConsoleWithContext, setupContextAwareConsole } from './console';
export type {
  ConsoleCapture,
  ConsoleCaptureEntry,
  ConsoleCaptureOptions,
  ContextAwareConsoleCapture,
  ContextAwareConsoleOutput,
} from './console';

// Timers exports (with aliases to avoid conflicts)
export {
  TimerManager,
  getTimerManager,
  createTimerManager,
  runWithFakeTimers,
  timeout,
  measureTime,
  assertExecutionTime,
  waitFor,
  debounce,
  throttle,
} from './timers';
// Export timers' withTimeout as withTimeoutTimer to avoid conflict
export { withTimeout as withTimeoutTimer, delay as delayTimer } from './timers';

// Integration exports (with aliases to avoid conflicts)
export { IntegrationTestEnvironment, createIntegrationTestEnvironment } from './integration';
export type { TestResource, IntegrationTestContext } from './integration';
// Export integration's TestDataBuilder as IntegrationTestDataBuilder
export {
  TestDataBuilder as IntegrationTestDataBuilder,
  createTestDataBuilder as createIntegrationTestDataBuilder,
  withTimeout as withTimeoutIntegration,
} from './integration';

// Builders exports (with aliases)
export {
  createMockProvider,
  createMockProviderWithDefaults,
  createTestConfig,
  createMockRegistry,
  createMockFetchResponse,
  createMockFetchError,
  createMockFetch,
  createMockFetchWithRetries,
} from './builders';
// Export builders' TestDataBuilder as BuilderTestDataBuilder
export {
  TestDataBuilder as BuilderTestDataBuilder,
  createTestDataBuilder as createBuilderTestDataBuilder,
} from './builders';

// Enhanced exports (context-aware, automatic cleanup, etc.)
export * from './fixtures/registry';
export * from './matchers/observability';
export * from './http/graphql';
export * from './http/contract-testing';
export * from './setup/strict-mode';

// MAIN ENTRY POINT - Simple wrapper API (recommended)
export { setupJest, jestHelpers } from './setup/jest-wrapper';
export type { JestWrapper, JestPreset } from './setup/jest-wrapper';

// Auto-setup export (for jest.config.js setupFilesAfterEnv)
// Import '@kitiumai/jest-helpers/auto-setup' in your jest.config.js
// This is the simplest way to use the package - zero configuration!

// Namespace exports
export { namespaced, default as namespacedDefault } from './index.namespaced';
