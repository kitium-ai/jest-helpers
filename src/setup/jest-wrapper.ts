/**
 * Jest Wrapper - Simple API that handles all complexity internally
 * This is the recommended way to use @kitiumai/jest-helpers
 *
 * Usage:
 * ```typescript
 * import { setupJest } from '@kitiumai/jest-helpers';
 *
 * const test = setupJest('unit'); // or 'integration', 'e2e'
 *
 * // That's it! Everything is set up automatically
 * // Use test utilities in your tests
 * ```
 */

import { StrictModePresets, type StrictModeOptions } from './strict-mode';
import type { setupContextAwareConsole } from '../console/context-aware';
import { getRequestRecorder, type ContractSpec } from '../http/contract-testing';
import type { HttpRequest, HttpResponse, MockHttpHandler } from '../http';
import { HttpMockRegistry } from '../http';
import type * as MocksModule from '../mocks';
import type * as FixturesModule from '../fixtures';
import type * as MatchersModule from '../matchers';
import type * as HttpModule from '../http';
import type * as AsyncModule from '../async';
import type * as TimersModule from '../timers';
import { delay, getTimerManager, runWithFakeTimers } from '../timers';
import type * as DatabaseModule from '../database';

export type JestPreset = 'unit' | 'integration' | 'e2e' | 'contract';

export type HttpClientFacade = ReturnType<typeof createHttpClientFacade>;

export type JestWrapper = {
  /**
   * Setup functions - call these in your test file
   * This is the only setup you need to do
   */
  setup: {
    beforeAll: () => Promise<void>;
    beforeEach: () => Promise<void>;
    afterEach: () => Promise<void>;
    afterAll: () => Promise<void>;
  };

  /**
   * Get a fixture by name (if fixtures were provided)
   */
  fixture: <T>(name: string) => T;

  /**
   * Get console capture (if enabled)
   */
  console: () => ReturnType<typeof setupContextAwareConsole>['getCapture'];

  /**
   * Get request recorder (if enabled)
   */
  requests: () => ReturnType<typeof getRequestRecorder>;

  /**
   * Convenience wrapper around timer policies per test
   */
  withTimers: <T>(
    testFn: (timers: TimersModule.TimerManager) => Promise<T> | T,
    mode?: 'fake' | 'real'
  ) => Promise<T>;

  /**
   * Golden-path HTTP mocking + recording facade
   */
  httpClient: () => HttpClientFacade;

  /**
   * Access to underlying utilities (for advanced use cases)
   */
  utils: {
    mock: typeof MocksModule;
    fixture: typeof FixturesModule;
    matcher: typeof MatchersModule;
    http: typeof HttpModule;
    async: typeof AsyncModule;
    timer: typeof TimersModule;
    database: typeof DatabaseModule;
  };
};

/**
 * Get hooks for a preset
 */
function getPresetHooks(
  preset: JestPreset,
  options?: Partial<StrictModeOptions>
): ReturnType<typeof StrictModePresets.unitTest> {
  switch (preset) {
    case 'unit':
      return StrictModePresets.unitTest(options);
    case 'integration':
      return StrictModePresets.integrationTest(options);
    case 'e2e':
      return StrictModePresets.e2eTest(options);
    case 'contract':
      return StrictModePresets.contractTest(options);
    default:
      return StrictModePresets.unitTest(options);
  }
}

/**
 * Setup Jest with intelligent defaults - handles all complexity internally
 * This is the main entry point for @kitiumai/jest-helpers
 *
 * @param preset - Test type preset ('unit', 'integration', 'e2e', 'contract')
 * @param options - Optional overrides for strict mode options
 * @returns JestWrapper with simple API
 *
 * @example
 * ```typescript
 * // Simple usage - minimal setup
 * const test = setupJest('unit');
 *
 * // One-time setup in your test file
 * beforeAll(test.setup.beforeAll);
 * beforeEach(test.setup.beforeEach);
 * afterEach(test.setup.afterEach);
 * afterAll(test.setup.afterAll);
 *
 * // In your tests, just use the utilities
 * const mockFn = test.utils.mock.createMock({ returnValue: 'test' });
 *
 * // With fixtures
 * const test = setupJest('integration', {
 *   fixtures: {
 *     db: createFixture(() => setupDb(), (db) => db.close())
 *   }
 * });
 *
 * // Access fixtures easily
 * const db = test.fixture('db');
 * ```
 */
export function setupJest(
  preset: JestPreset = 'unit',
  options?: Partial<StrictModeOptions>
): JestWrapper {
  const hooks = getPresetHooks(preset, options);
  let httpClientFacade: HttpClientFacade | null = null;

  // Return wrapper with simple API
  // Note: Jest hooks are set up by the user calling the returned functions
  // This keeps it compatible with Jest's test file structure
  return {
    /**
     * Setup function - call this in your test file's beforeAll/beforeEach
     * This is the only setup you need to do
     */
    setup: {
      beforeAll: hooks.beforeAll,
      beforeEach: hooks.beforeEach,
      afterEach: hooks.afterEach,
      afterAll: hooks.afterAll,
    },

    /**
     * Get a fixture by name (if fixtures were provided)
     */
    fixture: <T>(name: string): T => hooks.getFixture<T>(name),

    /**
     * Get console capture (if enabled)
     */
    console: hooks.getConsoleCapture.bind(hooks),

    /**
     * Get request recorder (if enabled)
     */
    requests: () => hooks.getRequestRecorder(),

    /**
     * Convenience wrapper around timer policies per test
     */
    withTimers: async <T>(
      testFn: (timers: TimersModule.TimerManager) => Promise<T> | T,
      mode: 'fake' | 'real' = 'fake'
    ): Promise<T> => {
      if (mode === 'real') {
        const timers = getTimerManager();
        jest.useRealTimers();
        return Promise.resolve(testFn(timers));
      }

      return runWithFakeTimers(testFn);
    },

    /**
     * Golden-path HTTP mocking + recording facade
     */
    httpClient: () => {
      if (httpClientFacade) {
        return httpClientFacade;
      }

      const recorder = safeGetRequestRecorder(hooks);
      httpClientFacade = createHttpClientFacade(recorder);
      return httpClientFacade;
    },

    /**
     * Access to underlying utilities (for advanced use cases)
     */
    utils: {
      // Lazy import to avoid circular dependencies
      get mock() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../mocks');
      },
      get fixture() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../fixtures');
      },
      get matcher() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../matchers');
      },
      get http() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../http');
      },
      get async() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../async');
      },
      get timer() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../timers');
      },
      get database() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('../database');
      },
    },
  };
}

/**
 * Quick setup for common test scenarios
 * Even simpler than setupJest - zero configuration
 */
export const jestHelpers = {
  /**
   * Unit tests - fast, isolated
   */
  unit: () => setupJest('unit'),

  /**
   * Integration tests - with HTTP mocking
   */
  integration: () => setupJest('integration'),

  /**
   * E2E tests - full stack
   */
  e2e: () => setupJest('e2e'),

  /**
   * Contract tests - API contract validation
   */
  contract: () => setupJest('contract'),
};

function safeGetRequestRecorder(
  hooks: ReturnType<typeof StrictModePresets.unitTest>
): ReturnType<typeof getRequestRecorder> | null {
  try {
    return hooks.getRequestRecorder();
  } catch {
    return null;
  }
}

function createHttpClientFacade(
  recorder: ReturnType<typeof getRequestRecorder> | null
): {
  registry: HttpMockRegistry;
  mock: HttpMockRegistry;
  request: (request: HttpRequest) => Promise<HttpResponse>;
  record: (request: HttpRequest) => void;
  requests: () => HttpRequest[];
  assertContract: (spec: ContractSpec) => { passed: boolean; failures: string[] };
  reset: () => void;
} {
  const registry = new HttpMockRegistry();

  return {
    registry,
    mock: registry,
    async request(request: HttpRequest): Promise<HttpResponse> {
      const handler = registry.getHandler(request as HttpRequest & { handler?: MockHttpHandler });
      if (!handler) {
        throw new Error(`No HTTP mock registered for ${request.method} ${request.url}`);
      }

      const response =
        typeof handler.response === 'function'
          ? (handler.response as () => HttpResponse)()
          : handler.response;

      registry.recordRequest(request);
      recorder?.record(request, response, handler.delay);

      if (handler.delay) {
        await delay(handler.delay);
      }

      return response;
    },
    record(request: HttpRequest) {
      registry.recordRequest(request);
    },
    requests() {
      return registry.getRequests();
    },
    assertContract(spec: ContractSpec) {
      if (!recorder) {
        throw new Error('Request recording not enabled for this preset. Use the integration/contract presets.');
      }
      return recorder.assertContract(spec);
    },
    reset() {
      registry.clear();
      recorder?.clear();
    },
  };
}
