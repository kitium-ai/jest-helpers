/**
 * Strict mode presets for enterprise testing
 * Enforces best practices and prevents common mistakes
 */

import { contextManager, type ILogger, LogLevel } from '@kitiumai/logger';

import { setupContextAwareConsole } from '../console/context-aware';
import { createAutomaticFixtureHooks, type Fixture } from '../fixtures';
import { getRequestRecorder } from '../http/contract-testing';
import { setupCustomMatchers } from '../matchers';
import { setupObservabilityMatchers } from '../matchers/observability';
import { extractConsoleEntries } from './internal/console-entries.js';
import { createDevelopmentTestLogger } from './internal/development-logger.js';
import { setupErrorHandlers } from './internal/error-handlers.js';

export type StrictModeOptions = {
  /**
   * Enable context propagation for all tests
   */
  shouldEnableContextPropagation?: boolean;
  /**
   * Enable automatic fixture cleanup
   */
  shouldEnableAutomaticCleanup?: boolean;
  /**
   * Enable request recording for contract testing
   */
  shouldEnableRequestRecording?: boolean;
  /**
   * Enable observability matchers
   */
  shouldEnableObservabilityMatchers?: boolean;
  /**
   * Enable context-aware console capture
   */
  shouldEnableContextAwareConsole?: boolean;
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
  shouldFailOnUnhandledRejection?: boolean;
  /**
   * Fail tests on console errors
   */
  shouldFailOnConsoleError?: boolean;
  /**
   * Fail tests when console output is produced
   */
  shouldFailOnConsoleNoise?: boolean;
  /**
   * Timeout for tests (ms)
   */
  timeout?: number;
  /**
   * Enforce fake timers or real timers for a preset
   */
  timerPolicy?: 'fake' | 'real';
  /**
   * Fail tests when timers leak between steps
   */
  shouldFailOnTimerLeaks?: boolean;
};

/**
 * Strict mode preset with all best practices enabled
 */
function createTestLogger(logLevel: LogLevel): ILogger {
  return createDevelopmentTestLogger(logLevel);
}

function setupMatchersIfEnabled(shouldEnableObservabilityMatchers: boolean): void {
  if (shouldEnableObservabilityMatchers) {
    setupMatchers(true);
  }
}

function setupConsoleIfEnabled(
  shouldEnableContextAwareConsole: boolean
): ReturnType<typeof setupContextAwareConsole> | null {
  return setupConsole(shouldEnableContextAwareConsole);
}

function setupFixturesIfEnabled(
  shouldEnableAutomaticCleanup: boolean,
  fixtures: Record<string, Fixture<unknown>>
): ReturnType<typeof createAutomaticFixtureHooks> | null {
  return setupFixtures(shouldEnableAutomaticCleanup, fixtures);
}

function setupRequestRecorderIfEnabled(
  shouldEnableRequestRecording: boolean
): ReturnType<typeof getRequestRecorder> | null {
  return shouldEnableRequestRecording ? getRequestRecorder() : null;
}

function setupErrorHandlersWithOptions(
  logger: ILogger,
  shouldFailOnUnhandledRejection: boolean,
  shouldFailOnConsoleError: boolean
): void {
  setupErrorHandlers({
    logger,
    shouldFailOnUnhandledRejection,
    shouldFailOnConsoleError,
  });
}

function createLifecycleInstance(
  logger: ILogger,
  fixtureHooks: ReturnType<typeof createAutomaticFixtureHooks> | null,
  consoleHooks: ReturnType<typeof setupContextAwareConsole> | null,
  requestRecorder: ReturnType<typeof getRequestRecorder> | null,
  shouldEnableContextPropagation: boolean,
  timerOptions: LifecycleGuards
): StrictModeLifecycle {
  return new StrictModeLifecycle(
    logger,
    fixtureHooks,
    consoleHooks,
    requestRecorder,
    shouldEnableContextPropagation,
    timerOptions
  );
}

function parseOptions(options: StrictModeOptions = {}): Required<StrictModeOptions> {
  return {
    shouldEnableContextPropagation: true,
    shouldEnableAutomaticCleanup: true,
    shouldEnableRequestRecording: true,
    shouldEnableObservabilityMatchers: true,
    shouldEnableContextAwareConsole: true,
    logLevel: LogLevel.INFO,
    fixtures: {},
    shouldFailOnUnhandledRejection: true,
    shouldFailOnConsoleError: false,
    shouldFailOnConsoleNoise: false,
    timeout: 30000,
    timerPolicy: 'real',
    shouldFailOnTimerLeaks: true,
    ...options,
  };
}

function initializeComponents(parsedOptions: Required<StrictModeOptions>): {
  logger: ILogger;
  consoleHooks: ReturnType<typeof setupContextAwareConsole> | null;
  fixtureHooks: ReturnType<typeof createAutomaticFixtureHooks> | null;
  requestRecorder: ReturnType<typeof getRequestRecorder> | null;
} {
  const logger = createTestLogger(parsedOptions.logLevel);
  setupMatchersIfEnabled(parsedOptions.shouldEnableObservabilityMatchers);
  const consoleHooks = setupConsoleIfEnabled(parsedOptions.shouldEnableContextAwareConsole);
  const fixtureHooks = setupFixturesIfEnabled(
    parsedOptions.shouldEnableAutomaticCleanup,
    parsedOptions.fixtures
  );
  const requestRecorder = setupRequestRecorderIfEnabled(parsedOptions.shouldEnableRequestRecording);

  return { logger, consoleHooks, fixtureHooks, requestRecorder };
}

function setupGlobalConfiguration(
  logger: ILogger,
  parsedOptions: Required<StrictModeOptions>
): void {
  setupErrorHandlersWithOptions(
    logger,
    parsedOptions.shouldFailOnUnhandledRejection,
    parsedOptions.shouldFailOnConsoleError
  );
  jest.setTimeout(parsedOptions.timeout);
}

function createPresetReturnObject(lifecycle: StrictModeLifecycle): {
  beforeAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  afterAll: () => Promise<void>;
  getFixture: <T>(name: string) => T;
  getConsoleCapture: () => ReturnType<typeof setupContextAwareConsole>['getCapture'];
  getRequestRecorder: () => ReturnType<typeof getRequestRecorder>;
} {
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

export function createStrictModePreset(options: StrictModeOptions = {}): {
  beforeAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  afterAll: () => Promise<void>;
  getFixture: <T>(name: string) => T;
  getConsoleCapture: () => ReturnType<typeof setupContextAwareConsole>['getCapture'];
  getRequestRecorder: () => ReturnType<typeof getRequestRecorder>;
} {
  const parsedOptions = parseOptions(options);
  const { logger, consoleHooks, fixtureHooks, requestRecorder } =
    initializeComponents(parsedOptions);

  setupGlobalConfiguration(logger, parsedOptions);

  const lifecycle = createLifecycleInstance(
    logger,
    fixtureHooks,
    consoleHooks,
    requestRecorder,
    parsedOptions.shouldEnableContextPropagation,
    {
      timerPolicy: parsedOptions.timerPolicy,
      failOnTimerLeaks: parsedOptions.shouldFailOnTimerLeaks,
      failOnConsoleNoise: parsedOptions.shouldFailOnConsoleNoise,
    }
  );

  return createPresetReturnObject(lifecycle);
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
      shouldEnableContextPropagation: true,
      shouldEnableAutomaticCleanup: true,
      shouldEnableRequestRecording: false,
      shouldEnableObservabilityMatchers: false,
      shouldEnableContextAwareConsole: true,
      logLevel: LogLevel.DEBUG,
      shouldFailOnUnhandledRejection: true,
      shouldFailOnConsoleError: false,
      shouldFailOnConsoleNoise: true,
      timeout: 10000,
      timerPolicy: 'fake',
      shouldFailOnTimerLeaks: true,
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
      shouldEnableContextPropagation: true,
      shouldEnableAutomaticCleanup: true,
      shouldEnableRequestRecording: true,
      shouldEnableObservabilityMatchers: true,
      shouldEnableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      shouldFailOnUnhandledRejection: true,
      shouldFailOnConsoleError: false,
      shouldFailOnConsoleNoise: true,
      timeout: 30000,
      timerPolicy: 'real',
      shouldFailOnTimerLeaks: true,
      ...options,
    });
  },

  /**
   * E2E test strict mode
   */
  e2eTest(options: Partial<StrictModeOptions> = {}): ReturnType<typeof createStrictModePreset> {
    return createStrictModePreset({
      shouldEnableContextPropagation: true,
      shouldEnableAutomaticCleanup: true,
      shouldEnableRequestRecording: true,
      shouldEnableObservabilityMatchers: true,
      shouldEnableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      shouldFailOnUnhandledRejection: true,
      shouldFailOnConsoleError: false,
      shouldFailOnConsoleNoise: true,
      timeout: 60000,
      timerPolicy: 'real',
      shouldFailOnTimerLeaks: true,
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
      shouldEnableContextPropagation: true,
      shouldEnableAutomaticCleanup: true,
      shouldEnableRequestRecording: true,
      shouldEnableObservabilityMatchers: true,
      shouldEnableContextAwareConsole: true,
      logLevel: LogLevel.INFO,
      shouldFailOnUnhandledRejection: true,
      shouldFailOnConsoleError: false,
      shouldFailOnConsoleNoise: true,
      timeout: 30000,
      timerPolicy: 'real',
      shouldFailOnTimerLeaks: true,
      ...options,
    });
  },
};

type LifecycleGuards = {
  timerPolicy: 'fake' | 'real';
  failOnTimerLeaks: boolean;
  failOnConsoleNoise: boolean;
};

class StrictModeLifecycle {
  constructor(
    private readonly logger: ILogger,
    private readonly fixtureHooks: ReturnType<typeof createAutomaticFixtureHooks> | null,
    private readonly consoleHooks: ReturnType<typeof setupContextAwareConsole> | null,
    private readonly requestRecorder: ReturnType<typeof getRequestRecorder> | null,
    private readonly enableContextPropagation: boolean,
    private readonly guards: LifecycleGuards
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

    if (this.guards.timerPolicy === 'fake') {
      jest.useFakeTimers();
    } else {
      jest.useRealTimers();
    }

    if (this.fixtureHooks) {
      await this.fixtureHooks.beforeEach();
    }
  }

  async afterEach(): Promise<void> {
    if (this.consoleHooks && this.guards.failOnConsoleNoise) {
      const capture = this.consoleHooks.getCapture();
      const entries = extractConsoleEntries(capture);
      if (entries.length > 0) {
        throw new Error(
          `Console output detected in test: ${entries
            .map((entry) =>
              'level' in entry
                ? `${(entry as { level: string }).level}: ${String((entry as { message: unknown }).message ?? '')}`
                : JSON.stringify(entry)
            )
            .join('; ')}`
        );
      }
    }

    if (this.consoleHooks) {
      this.consoleHooks.afterEach();
    }

    if (this.fixtureHooks) {
      await this.fixtureHooks.afterEach();
    }

    if (this.guards.timerPolicy === 'fake' && this.guards.failOnTimerLeaks) {
      const timerCount = typeof jest.getTimerCount === 'function' ? jest.getTimerCount() : 0;
      if (timerCount > 0) {
        jest.clearAllTimers();
        throw new Error(
          `Detected ${timerCount} pending timer(s). Ensure fake timers are flushed or disabled.`
        );
      }
    }

    jest.useRealTimers();
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
