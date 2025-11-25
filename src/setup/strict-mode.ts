/**
 * Strict mode presets for enterprise testing
 * Enforces best practices and prevents common mistakes
 */

import { contextManager, LoggerBuilder, LogLevel } from '@kitiumai/logger';
import { setupCustomMatchers } from '../matchers';
import { setupObservabilityMatchers } from '../matchers/observability';
import { setupContextAwareConsole } from '../console/context-aware';
import { createAutomaticFixtureHooks } from '../fixtures/registry';
import { getRequestRecorder } from '../http/contract-testing';
import type { Fixture } from '../fixtures';

export type StrictModeOptions = {
  /**
   * Enable context propagation for all tests
   */
  enableContextPropagation?: boolean;
  /**
   * Enable automatic fixture cleanup
   */
  enableAutomaticCleanup?: boolean;
  /**
   * Enable request recording for contract testing
   */
  enableRequestRecording?: boolean;
  /**
   * Enable observability matchers
   */
  enableObservabilityMatchers?: boolean;
  /**
   * Enable context-aware console capture
   */
  enableContextAwareConsole?: boolean;
  /**
   * Log level for test execution
   */
  logLevel?: LogLevel;
  /**
   * Fixtures to register
   */
  fixtures?: Record<string, Fixture<unknown>>;
  /**
   * Fail tests on unhandled promise rejections
   */
  failOnUnhandledRejection?: boolean;
  /**
   * Fail tests on console errors
   */
  failOnConsoleError?: boolean;
  /**
   * Timeout for tests (ms)
   */
  timeout?: number;
};

/**
 * Strict mode preset with all best practices enabled
 */
export function createStrictModePreset(options: StrictModeOptions = {}): {
  beforeAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  afterAll: () => Promise<void>;
  getFixture: <T>(name: string) => T;
  getConsoleCapture: () => ReturnType<typeof setupContextAwareConsole>['getCapture'];
  getRequestRecorder: () => ReturnType<typeof getRequestRecorder>;
} {
  const {
    enableContextPropagation = true,
    enableAutomaticCleanup = true,
    enableRequestRecording = true,
    enableObservabilityMatchers = true,
    enableContextAwareConsole = true,
    logLevel = LogLevel.INFO,
    fixtures = {},
    failOnUnhandledRejection = true,
    failOnConsoleError = false,
    timeout = 30000,
  } = options;

  // Initialize logger
  const logger = setupLogger(logLevel);

  // Setup custom matchers
  setupMatchers(enableObservabilityMatchers);

  // Setup context-aware console
  const consoleHooks = setupConsole(enableContextAwareConsole);

  // Setup automatic fixtures
  const fixtureHooks = setupFixtures(enableAutomaticCleanup, fixtures);

  // Setup request recorder
  const requestRecorder = enableRequestRecording ? getRequestRecorder() : null;

  // Setup error handlers
  setupErrorHandlers(failOnUnhandledRejection, failOnConsoleError, logger);

  // Set test timeout
  jest.setTimeout(timeout);

  const lifecycle = new StrictModeLifecycle(
    logger,
    fixtureHooks,
    consoleHooks,
    requestRecorder,
    enableContextPropagation
  );

  return {
    beforeAll: lifecycle.beforeAll.bind(lifecycle),
    beforeEach: lifecycle.beforeEach.bind(lifecycle),
    afterEach: lifecycle.afterEach.bind(lifecycle),
    afterAll: lifecycle.afterAll.bind(lifecycle),
    getFixture: lifecycle.getFixture.bind(lifecycle),
    getConsoleCapture: () => lifecycle.getConsoleCapture(),
    getRequestRecorder: () => lifecycle.getRequestRecorder(),
  };
}

/**
 * Pre-configured strict mode presets
 */
export const StrictModePresets = {
  /**
   * Unit test strict mode
   */
  unitTest(options: Partial<StrictModeOptions> = {}): ReturnType<typeof createStrictModePreset> {
    return createStrictModePreset({
      enableContextPropagation: true,
      enableAutomaticCleanup: true,
      enableRequestRecording: false,
      enableObservabilityMatchers: false,
      enableContextAwareConsole: true,
      logLevel: LogLevel.DEBUG,
      failOnUnhandledRejection: true,
      failOnConsoleError: false,
      timeout: 10000,
      ...options,
    });
  },

  /**
   * Integration test strict mode
   */
  integrationTest(
    options: Partial<StrictModeOptions> = {}
  ): ReturnType<typeof createStrictModePreset> {
    return createStrictModePreset({
      enableContextPropagation: true,
      enableAutomaticCleanup: true,
      enableRequestRecording: true,
      enableObservabilityMatchers: true,
      enableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      failOnUnhandledRejection: true,
      failOnConsoleError: false,
      timeout: 30000,
      ...options,
    });
  },

  /**
   * E2E test strict mode
   */
  e2eTest(options: Partial<StrictModeOptions> = {}): ReturnType<typeof createStrictModePreset> {
    return createStrictModePreset({
      enableContextPropagation: true,
      enableAutomaticCleanup: true,
      enableRequestRecording: true,
      enableObservabilityMatchers: true,
      enableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      failOnUnhandledRejection: true,
      failOnConsoleError: false,
      timeout: 60000,
      ...options,
    });
  },

  /**
   * Contract test strict mode
   */
  contractTest(
    options: Partial<StrictModeOptions> = {}
  ): ReturnType<typeof createStrictModePreset> {
    return createStrictModePreset({
      enableContextPropagation: true,
      enableAutomaticCleanup: true,
      enableRequestRecording: true,
      enableObservabilityMatchers: true,
      enableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      failOnUnhandledRejection: true,
      failOnConsoleError: false,
      timeout: 30000,
      ...options,
    });
  },
};

class StrictModeLifecycle {
  constructor(
    private readonly logger: ReturnType<typeof LoggerBuilder.console>,
    private readonly fixtureHooks: ReturnType<typeof createAutomaticFixtureHooks> | null,
    private readonly consoleHooks: ReturnType<typeof setupContextAwareConsole> | null,
    private readonly requestRecorder: ReturnType<typeof getRequestRecorder> | null,
    private readonly enableContextPropagation: boolean
  ) {}

  async beforeAll(): Promise<void> {
    if (this.enableContextPropagation) {
      const suiteContext = contextManager.initContext({
        requestId: `test-suite-${Date.now()}`,
        metadata: {
          testSuite: expect.getState().testPath ?? 'unknown',
        },
      });
      contextManager.run(suiteContext, () => {
        this.logger.info('Test suite started', {
          testPath: expect.getState().testPath,
        });
      });
    }

    if (this.fixtureHooks) {
      await this.fixtureHooks.beforeAll();
    }
  }

  async beforeEach(): Promise<void> {
    if (this.enableContextPropagation) {
      const testContext = contextManager.initContext({
        requestId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        metadata: {
          testName: expect.getState().currentTestName ?? 'unknown',
          testPath: expect.getState().testPath ?? 'unknown',
        },
      });
      contextManager.run(testContext, () => {
        this.logger.debug('Test started', {
          testName: expect.getState().currentTestName,
        });
      });
    }

    if (this.consoleHooks) {
      this.consoleHooks.beforeEach();
    }

    if (this.fixtureHooks) {
      await this.fixtureHooks.beforeEach();
    }
  }

  async afterEach(): Promise<void> {
    if (this.consoleHooks) {
      this.consoleHooks.afterEach();
    }

    if (this.fixtureHooks) {
      await this.fixtureHooks.afterEach();
    }
  }

  async afterAll(): Promise<void> {
    if (this.fixtureHooks) {
      await this.fixtureHooks.afterAll();
    }

    if (this.enableContextPropagation) {
      this.logger.info('Test suite completed', {
        testPath: expect.getState().testPath,
      });
    }
  }

  getFixture<T>(name: string): T {
    if (!this.fixtureHooks) {
      throw new Error('Automatic fixtures not enabled');
    }
    return this.fixtureHooks.getFixture<T>(name);
  }

  getConsoleCapture(): ReturnType<typeof setupContextAwareConsole>['getCapture'] {
    if (!this.consoleHooks) {
      throw new Error('Context-aware console not enabled');
    }
    return this.consoleHooks.getCapture.bind(this.consoleHooks);
  }

  getRequestRecorder(): ReturnType<typeof getRequestRecorder> {
    if (!this.requestRecorder) {
      throw new Error('Request recording not enabled');
    }
    return this.requestRecorder;
  }
}

function setupLogger(logLevel: LogLevel): ReturnType<typeof LoggerBuilder.console> {
  return LoggerBuilder.console(logLevel);
}

function setupMatchers(enableObservabilityMatchers: boolean): void {
  setupCustomMatchers();
  if (enableObservabilityMatchers) {
    setupObservabilityMatchers();
  }
}

function setupConsole(
  enableContextAwareConsole: boolean
): ReturnType<typeof setupContextAwareConsole> | null {
  if (enableContextAwareConsole) {
    return setupContextAwareConsole({
      autoLogToLogger: true,
      redactSensitive: true,
    });
  }
  return null;
}

function setupFixtures(
  enableAutomaticCleanup: boolean,
  fixtures: Record<string, Fixture<unknown>>
): ReturnType<typeof createAutomaticFixtureHooks> | null {
  if (enableAutomaticCleanup && Object.keys(fixtures).length > 0) {
    return createAutomaticFixtureHooks(fixtures);
  }
  return null;
}

function setupErrorHandlers(
  failOnUnhandledRejection: boolean,
  failOnConsoleError: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger: any
): void {
  if (failOnUnhandledRejection) {
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection in test', { reason: String(reason) });
      throw reason;
    });
  }

  if (failOnConsoleError) {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logger.error('Console error in test', { message: args.map(String).join(' ') });
      originalError(...args);
      throw new Error('Console error detected in test');
    };
  }
}
