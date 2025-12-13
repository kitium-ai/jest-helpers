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
export * from './async';
export * from './database';
export * from './fixtures';
export * from './http';
export * from './matchers';
export * from './mocks';
export * from './setup';

// Console exports (context-aware console capture)
export type {
  ConsoleCapture,
  ConsoleCaptureEntry,
  ConsoleCaptureOptions,
  ContextAwareConsoleCapture,
  ContextAwareConsoleOutput,
} from './console';
export { captureConsoleWithContext, setupContextAwareConsole } from './console';

// Timers exports (with aliases to avoid conflicts)
export {
  assertExecutionTime,
  createTimerManager,
  debounce,
  getTimerManager,
  measureTime,
  runWithFakeTimers,
  throttle,
  timeout,
  TimerManager,
  waitFor,
} from './timers';
// Export timers' withTimeout as withTimeoutTimer to avoid conflict
export { delay as delayTimer, withTimeout as withTimeoutTimer } from './timers';

// Integration exports (with aliases to avoid conflicts)
export type { IntegrationTestContext, TestResource } from './integration';
export { createIntegrationTestEnvironment, IntegrationTestEnvironment } from './integration';
// Export integration's TestDataBuilder as IntegrationTestDataBuilder
export {
  createTestDataBuilder as createIntegrationTestDataBuilder,
  TestDataBuilder as IntegrationTestDataBuilder,
  withTimeout as withTimeoutIntegration,
} from './integration';

// Builders exports (with aliases)
export {
  createMockFetch,
  createMockFetchError,
  createMockFetchResponse,
  createMockFetchWithRetries,
  createMockProvider,
  createMockProviderWithDefaults,
  createMockRegistry,
  createTestConfig,
} from './builders';
// Export builders' TestDataBuilder as BuilderTestDataBuilder
export {
  TestDataBuilder as BuilderTestDataBuilder,
  createTestDataBuilder as createBuilderTestDataBuilder,
} from './builders';

// Enhanced exports (context-aware, automatic cleanup, etc.)
export * from './fixtures/registry';
export * from './http/contract-testing';
export * from './http/graphql';
export * from './matchers/observability';
export * from './setup/strict-mode';

// NEW ENTERPRISE FEATURES (Phase 1-3 Implementation)

// Fluent assertions API
export * from './matchers/fluent';

// Property-based testing
export type { Generator } from './property-testing';
export { generators as propertyGenerators, propertyTest } from './property-testing';

// Test data factories
export type { Factory, FactoryDefinition, FactoryOptions } from './factories';
export { BaseFactory, createTestDataBuilder, generators as factoryGenerators } from './factories';

// Enhanced error messages and debugging
export * from './enhanced-errors';

// Advanced mocking capabilities
export type { ArgumentCaptor } from './mocks';
export {
  createAdvancedMock,
  createSequencedMock,
  createSpy,
  MockSequencer,
  VerificationMode,
} from './mocks';

// Visual and accessibility testing
export * from './visual-accessibility';

// Parameterized testing
export * from './parameterized-testing';

// Multi-framework consistency
export * from './universal-testing';

// MAIN ENTRY POINT - Simple wrapper API (recommended)
export type { JestPreset, JestWrapper } from './setup/jest-wrapper';
export { jestHelpers, setupJest } from './setup/jest-wrapper';

// Auto-setup export (for jest.config.js setupFilesAfterEnv)
// Import '@kitiumai/jest-helpers/auto-setup' in your jest.config.js
// This is the simplest way to use the package - zero configuration!

// Namespace exports
export { namespaced } from './index.namespaced';
