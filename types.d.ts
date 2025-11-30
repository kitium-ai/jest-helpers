/**
 * TypeScript module declarations for @kitiumai/jest-helpers
 * Provides type support for all subpath exports
 */

declare module '@kitiumai/jest-helpers' {
  export * from '@kitiumai/jest-helpers/index';
}

declare module '@kitiumai/jest-helpers/mocks' {
  export type MockFunction<T extends (...args: unknown[]) => unknown> = jest.Mock<
    ReturnType<T>,
    Parameters<T>
  >;

  export type MockSetupOptions = {
    returnValue?: unknown;
    returnValues?: unknown[];
    implementation?: (...args: unknown[]) => unknown;
    rejectWith?: Error;
    resolveWith?: unknown;
  };

  export function createMock<T extends (...args: unknown[]) => unknown>(
    options?: MockSetupOptions
  ): MockFunction<T>;

  export function createMockWithCleanup<T extends (...args: unknown[]) => unknown>(
    options?: MockSetupOptions
  ): MockFunction<T>;

  export * from '@kitiumai/jest-helpers/mocks/index';
}

declare module '@kitiumai/jest-helpers/fixtures' {
  export type Fixture<T> = {
    setup(): Promise<T> | T;
    teardown(data: T): Promise<void> | void;
  };

  export type FixtureContext = {
    [key: string]: unknown;
  };

  export class FixtureManager {
    register<T>(name: string, fixture: Fixture<T>): void;
    setup<T>(name: string): Promise<T>;
    get<T>(name: string): T;
    teardown(name: string): Promise<void>;
    teardownAll(): Promise<void>;
  }

  export * from '@kitiumai/jest-helpers/fixtures/index';
}

declare module '@kitiumai/jest-helpers/matchers' {
  export * from '@kitiumai/jest-helpers/matchers/index';
}

declare module '@kitiumai/jest-helpers/database' {
  export * from '@kitiumai/jest-helpers/database/index';
}

declare module '@kitiumai/jest-helpers/http' {
  export type HttpRequest = {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
  };

  export type HttpResponse = {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
  };

  export type MockHttpHandler = (request: HttpRequest) => HttpResponse | Promise<HttpResponse>;

  export class HttpMockRegistry {
    register(handler: MockHttpHandler): void;
    reset(): void;
  }

  export * from '@kitiumai/jest-helpers/http/index';
}

declare module '@kitiumai/jest-helpers/timers' {
  export class TimerManager {
    advanceTimersByTime(ms: number): void;
    runAllTimers(): void;
    clearAllTimers(): void;
  }

  export function getTimerManager(): TimerManager;
  export function createTimerManager(): TimerManager;
  export function runWithFakeTimers<T>(fn: () => T | Promise<T>): Promise<T>;
  export function delay(ms: number): Promise<void>;
  export function waitFor<T>(
    fn: () => T,
    options?: { timeout?: number; interval?: number }
  ): Promise<T>;
  export function timeout<T>(promise: Promise<T>, ms: number): Promise<T>;
  export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T;
  export function throttle<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T;
  export function measureTime<T>(
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }>;
  export function assertExecutionTime<T>(fn: () => T | Promise<T>, maxMs: number): Promise<T>;

  export * from '@kitiumai/jest-helpers/timers/index';
}

declare module '@kitiumai/jest-helpers/setup' {
  export type JestPreset = 'unit' | 'integration' | 'e2e' | 'contract';

  export type JestWrapper = {
    setup: {
      beforeAll: () => Promise<void>;
      beforeEach: () => Promise<void>;
      afterEach: () => Promise<void>;
      afterAll: () => Promise<void>;
    };
    utils: {
      mock: typeof import('@kitiumai/jest-helpers/mocks');
      fixtures: typeof import('@kitiumai/jest-helpers/fixtures');
      http: typeof import('@kitiumai/jest-helpers/http');
      timers: typeof import('@kitiumai/jest-helpers/timers');
      matchers: typeof import('@kitiumai/jest-helpers/matchers');
      database: typeof import('@kitiumai/jest-helpers/database');
    };
  };

  export function setupJest(preset: JestPreset): JestWrapper;
  export const jestHelpers: JestWrapper;

  export * from '@kitiumai/jest-helpers/setup/index';
}

declare module '@kitiumai/jest-helpers/integration' {
  export type TestResource = {
    start(): Promise<void>;
    stop(): Promise<void>;
  };

  export type IntegrationTestContext = {
    [key: string]: unknown;
  };

  export class IntegrationTestEnvironment {
    addResource(name: string, resource: TestResource): void;
    start(): Promise<void>;
    stop(): Promise<void>;
  }

  export function createIntegrationTestEnvironment(): IntegrationTestEnvironment;

  export * from '@kitiumai/jest-helpers/integration/index';
}

declare module '@kitiumai/jest-helpers/console' {
  export type ConsoleCaptureEntry = {
    type: 'log' | 'warn' | 'error' | 'info' | 'debug';
    message: string;
    args: unknown[];
  };

  export type ConsoleCaptureOptions = {
    silent?: boolean;
  };

  export type ConsoleCapture = {
    entries: ConsoleCaptureEntry[];
    restore(): void;
  };

  export type ContextAwareConsoleOutput = {
    testName: string;
    entries: ConsoleCaptureEntry[];
  };

  export type ContextAwareConsoleCapture = {
    outputs: ContextAwareConsoleOutput[];
    restore(): void;
  };

  export function captureConsoleWithContext(): ContextAwareConsoleCapture;
  export function setupContextAwareConsole(): void;

  export * from '@kitiumai/jest-helpers/console/index';
}

declare module '@kitiumai/jest-helpers/async' {
  export function delay(ms: number): Promise<void>;
  export function waitFor<T>(
    fn: () => T,
    options?: { timeout?: number; interval?: number }
  ): Promise<T>;
  export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>;

  export * from '@kitiumai/jest-helpers/async/index';
}

declare module '@kitiumai/jest-helpers/builders' {
  export class TestDataBuilder<T> {
    with<K extends keyof T>(key: K, value: T[K]): this;
    build(): T;
  }

  export function createTestDataBuilder<T>(defaults: T): TestDataBuilder<T>;
  export function createMockProvider<T>(factory: () => T): { get(): T };
  export function createMockRegistry<T>(): Map<string, T>;
  export function createTestConfig<T>(overrides?: Partial<T>): T;

  export * from '@kitiumai/jest-helpers/builders/index';
}

declare module '@kitiumai/jest-helpers/namespaced' {
  export const namespaced: {
    mocks: typeof import('@kitiumai/jest-helpers/mocks');
    fixtures: typeof import('@kitiumai/jest-helpers/fixtures');
    matchers: typeof import('@kitiumai/jest-helpers/matchers');
    database: typeof import('@kitiumai/jest-helpers/database');
    http: typeof import('@kitiumai/jest-helpers/http');
    timers: typeof import('@kitiumai/jest-helpers/timers');
    setup: typeof import('@kitiumai/jest-helpers/setup');
    integration: typeof import('@kitiumai/jest-helpers/integration');
    console: typeof import('@kitiumai/jest-helpers/console');
    async: typeof import('@kitiumai/jest-helpers/async');
    builders: typeof import('@kitiumai/jest-helpers/builders');
  };

  export default namespaced;
}

declare module '@kitiumai/jest-helpers/strict-mode' {
  export type StrictModeOptions = {
    enforceCleanup?: boolean;
    enforceIsolation?: boolean;
    enforceTimers?: boolean;
  };

  export const StrictModePresets: {
    unit: StrictModeOptions;
    integration: StrictModeOptions;
    e2e: StrictModeOptions;
  };

  export * from '@kitiumai/jest-helpers/setup/strict-mode';
}

declare module '@kitiumai/jest-helpers/auto-setup' {
  // Auto-setup module has side effects and sets up Jest globals
  export {};
}

declare module '@kitiumai/jest-helpers/auto-setup/unit' {
  // Auto-setup for unit tests
  export {};
}

declare module '@kitiumai/jest-helpers/auto-setup/integration' {
  // Auto-setup for integration tests
  export {};
}

declare module '@kitiumai/jest-helpers/auto-setup/e2e' {
  // Auto-setup for e2e tests
  export {};
}

declare module '@kitiumai/jest-helpers/auto-setup/contract' {
  // Auto-setup for contract tests
  export {};
}
