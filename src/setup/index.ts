/**
 * Test setup and configuration utilities
 */

import { setupCustomMatchers } from '../matchers';
import { createDevelopmentTestLogger } from './internal/development-logger.js';
import { setupErrorHandlers as setupSharedErrorHandlers } from './internal/error-handlers.js';

export type TestSetupOptions = {
  shouldEnableCustomMatchers?: boolean;
  shouldEnableFakeTimers?: boolean;
  shouldEnableMockConsole?: boolean;
  shouldEnableMockFetch?: boolean;
  mockFetchHandler?: (url: string, options?: RequestInit) => Response | Promise<Response>;
  timeout?: number;
};

/**
 * Setup test environment
 */
export class TestEnvironment {
  private originalConsole: typeof console | null = null;
  private originalFetch: typeof fetch | null = null;
  private consoleOutput: Array<{ level: string; message: string[] }> = [];

  /**
   * Setup the test environment
   */
  setup(options: TestSetupOptions = {}): void {
    const {
      shouldEnableCustomMatchers = true,
      shouldEnableFakeTimers = false,
      shouldEnableMockConsole = false,
      shouldEnableMockFetch = false,
      mockFetchHandler,
      timeout = 30000,
    } = options;

    // Set test timeout
    jest.setTimeout(timeout);

    if (shouldEnableCustomMatchers) {
      setupCustomMatchers();
    }

    if (shouldEnableFakeTimers) {
      jest.useFakeTimers();
    }

    if (shouldEnableMockConsole) {
      this.setupConsoleMock();
    }

    if (shouldEnableMockFetch) {
      this.setupFetchMock(mockFetchHandler);
    }

    // Setup error handlers
    this.setupErrorHandlers();
  }

  /**
   * Cleanup after tests
   */
  cleanup(): void {
    this.restoreConsoleMock();
    this.restoreFetchMock();
    jest.clearAllMocks();
  }

  /**
   * Setup console mock
   */
  private setupConsoleMock(): void {
    this.originalConsole = { ...console };

    const captureLog =
      (level: string) =>
      (...args: unknown[]) => {
        this.consoleOutput.push({
          level,
          message: args.map((argument) => String(argument)),
        });
      };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
    console.log = captureLog('log') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.warn = captureLog('warn') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = captureLog('error') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.info = captureLog('info') as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-console
    console.debug = captureLog('debug') as any;
  }

  /**
   * Restore console
   */
  private restoreConsoleMock(): void {
    if (this.originalConsole) {
      Object.assign(console, this.originalConsole);
    }
  }

  /**
   * Setup fetch mock
   */
  private setupFetchMock(
    handler?: (url: string, options?: RequestInit) => Response | Promise<Response>
  ): void {
    this.originalFetch = global.fetch;

    global.fetch = jest.fn((url: string, options?: RequestInit) => {
      if (handler) {
        return Promise.resolve(handler(url, options));
      }

      return Promise.resolve(
        new Response(JSON.stringify({ message: 'Mocked fetch' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  }

  /**
   * Restore fetch
   */
  private restoreFetchMock(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }

  /**
   * Setup error handlers
   * Uses @kitiumai/logger for error logging
   */
  private setupErrorHandlers(): void {
    // Use @kitiumai/logger for error logging
    void (() => {
      try {
        const logger = createDevelopmentTestLogger();
        setupSharedErrorHandlers({
          logger,
          shouldFailOnUnhandledRejection: true,
          shouldFailOnConsoleError: false,
        });

        process.on('uncaughtException', (error) => {
          logger.error(
            'Uncaught Exception',
            {},
            error instanceof Error ? error : new Error(String(error))
          );
        });
      } catch {
        // Fallback to console if logger fails to load
        process.on('unhandledRejection', (reason) => {
          console.error('Unhandled Promise Rejection:', reason);
        });

        process.on('uncaughtException', (error) => {
          console.error('Uncaught Exception:', error);
        });
      }
    })();
  }

  /**
   * Get console output
   */
  getConsoleOutput(level?: string): Array<{ level: string; message: string[] }> {
    if (!level) {
      return this.consoleOutput;
    }
    return this.consoleOutput.filter((log) => log.level === level);
  }

  /**
   * Clear console output
   */
  clearConsoleOutput(): void {
    this.consoleOutput = [];
  }
}

/**
 * Global test environment instance
 */
let globalTestEnvironment: TestEnvironment | null = null;

/**
 * Get global test environment
 */
export function getGlobalTestEnvironment(): TestEnvironment {
  globalTestEnvironment ??= new TestEnvironment();
  return globalTestEnvironment;
}

/**
 * Setup global test environment
 */
export function setupGlobalTestEnvironment(options?: TestSetupOptions): TestEnvironment {
  const environment = getGlobalTestEnvironment();
  environment.setup(options);
  return environment;
}

/**
 * Cleanup global test environment
 */
export function cleanupGlobalTestEnvironment(): void {
  const environment = getGlobalTestEnvironment();
  environment.cleanup();
}

/**
 * Test suite setup helper
 */
export function setupTestSuite(options?: TestSetupOptions): {
  beforeAll(): void;
  afterEach(): void;
  afterAll(): void;
  getEnv(): TestEnvironment;
} {
  const environment = setupGlobalTestEnvironment(options);

  return {
    beforeAll(): void {
      // Setup already done
    },
    afterEach(): void {
      environment.clearConsoleOutput();
      jest.clearAllMocks();
    },
    afterAll(): void {
      environment.cleanup();
    },
    getEnv(): TestEnvironment {
      return environment;
    },
  };
}

/**
 * Common test setup presets
 */
export const TestPresets = {
  /**
   * Unit test preset
   */
  unitTest(): TestSetupOptions {
    return {
      shouldEnableCustomMatchers: true,
      shouldEnableMockConsole: true,
      timeout: 10000,
    };
  },

  /**
   * Integration test preset
   */
  integrationTest(): TestSetupOptions {
    return {
      shouldEnableCustomMatchers: true,
      shouldEnableMockConsole: true,
      shouldEnableMockFetch: true,
      timeout: 30000,
    };
  },

  /**
   * Database test preset
   */
  databaseTest(): TestSetupOptions {
    return {
      shouldEnableCustomMatchers: true,
      shouldEnableMockConsole: false,
      timeout: 60000,
    };
  },

  /**
   * API test preset
   */
  apiTest(): TestSetupOptions {
    return {
      shouldEnableCustomMatchers: true,
      shouldEnableMockFetch: true,
      shouldEnableMockConsole: true,
      timeout: 30000,
    };
  },
};

/**
 * Jest config helper
 */
export const createJestConfig = (options: {
  rootDir?: string;
  displayName?: string;
  testEnvironment?: string;
  setupFilesAfterEnv?: string[];
  collectCoverageFrom?: string[];
  moduleNameMapper?: Record<string, string>;
  transform?: Record<string, string>;
}): Record<string, unknown> => ({
  displayName: options.displayName ?? 'tests',
  testEnvironment: options.testEnvironment ?? 'node',
  rootDir: options.rootDir ?? 'src',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  setupFilesAfterEnv: options.setupFilesAfterEnv ?? [],
  collectCoverageFrom: options.collectCoverageFrom ?? [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: options.moduleNameMapper,
  transform: options.transform ?? {
    '^.+\\.tsx?$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
});
