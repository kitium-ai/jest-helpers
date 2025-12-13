/**
 * Multi-framework testing utilities
 * Shared utilities that work across Jest and Vitest
 */

export type TestFramework = 'jest' | 'vitest' | 'unknown';

export type TestContext = {
  framework: TestFramework;
  version: string;
  environment: 'node' | 'browser' | 'unknown';
  isCI: boolean;
};

export type TestRunner = {
  describe: (name: string, function_: () => void) => void;
  it: (name: string, function_: () => void | Promise<void>) => void;
  beforeEach: (function_: () => void | Promise<void>) => void;
  afterEach: (function_: () => void | Promise<void>) => void;
  beforeAll: (function_: () => void | Promise<void>) => void;
  afterAll: (function_: () => void | Promise<void>) => void;
  expect: (value: unknown) => ReturnType<typeof expect>;
};

/**
 * Framework detector
 */
export class FrameworkDetector {
  static detect(): TestFramework {
    // Check for Jest
    if (typeof jest !== 'undefined' && 'mock' in jest) {
      return 'jest';
    }

    // Check for Vitest
    if (
      typeof globalThis !== 'undefined' &&
      (globalThis as unknown as { vitest?: unknown }).vitest
    ) {
      return 'vitest';
    }

    // Check for global test functions
    if (typeof describe === 'function' && typeof it === 'function') {
      // Try to detect based on global properties
      if (typeof expect !== 'undefined' && (expect as unknown as { getState?: unknown }).getState) {
        return 'jest';
      }
      if (
        typeof globalThis !== 'undefined' &&
        (globalThis as unknown as { __vitest__?: unknown }).__vitest__
      ) {
        return 'vitest';
      }
    }

    return 'unknown';
  }

  private static detectFrameworkVersion(framework: TestFramework): string {
    try {
      switch (framework) {
        case 'jest':
          return (jest as unknown as { getVersion?: () => string }).getVersion?.() ?? 'unknown';
        case 'vitest':
          return (
            (globalThis as unknown as { vitest?: { version?: string } }).vitest?.version ??
            'unknown'
          );
        case 'unknown':
          return 'unknown';
        default:
          return 'unknown';
      }
    } catch {
      // Ignore version detection errors
      return 'unknown';
    }
  }

  private static detectEnvironment(): 'node' | 'browser' | 'unknown' {
    if (typeof globalThis !== 'undefined') {
      const g = globalThis as unknown as { window?: unknown; document?: unknown };
      if (typeof g.window !== 'undefined' && typeof g.document !== 'undefined') {
        return 'browser';
      }
    }

    if (
      typeof process !== 'undefined' &&
      (process as unknown as { versions?: { node?: string } }).versions?.node
    ) {
      return 'node';
    }

    return 'unknown';
  }

  static getContext(): TestContext {
    const framework = this.detect();
    const version = this.detectFrameworkVersion(framework);
    const environment = this.detectEnvironment();

    return {
      framework,
      version,
      environment,
      isCI: this.isCI(),
    };
  }

  private static isCI(): boolean {
    if (typeof process === 'undefined') {
      return false;
    }

    const environment = process.env;
    const marker =
      environment['CI'] ??
      environment['CONTINUOUS_INTEGRATION'] ??
      environment['BUILD_NUMBER'] ??
      environment['CIRCLECI'] ??
      environment['TRAVIS'] ??
      environment['GITHUB_ACTIONS'] ??
      environment['JENKINS_URL'] ??
      environment['BUILDKITE'];
    return !!marker;
  }
}

/**
 * Universal test runner adapter
 */
export class UniversalTestRunner implements TestRunner {
  private readonly framework: TestFramework;

  constructor() {
    this.framework = FrameworkDetector.detect();
  }

  describe(name: string, function_: () => void): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as { describe: (name: string, function__: () => void) => void }
      ).describe(name, function_);
    } else {
      describe(name, function_);
    }
  }

  it(name: string, function_: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as {
          it: (name: string, function__: () => void | Promise<void>) => void;
        }
      ).it(name, function_);
    } else {
      // Cast to jest.ProvidesCallback to handle both sync and async functions
      it(name, function_ as jest.ProvidesCallback);
    }
  }

  beforeEach(function_: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as { beforeEach: (function__: () => void | Promise<void>) => void }
      ).beforeEach(function_);
    } else {
      beforeEach(function_);
    }
  }

  afterEach(function_: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as { afterEach: (function__: () => void | Promise<void>) => void }
      ).afterEach(function_);
    } else {
      afterEach(function_);
    }
  }

  beforeAll(function_: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as { beforeAll: (function__: () => void | Promise<void>) => void }
      ).beforeAll(function_);
    } else {
      beforeAll(function_);
    }
  }

  afterAll(function_: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (
        globalThis as unknown as { afterAll: (function__: () => void | Promise<void>) => void }
      ).afterAll(function_);
    } else {
      afterAll(function_);
    }
  }

  expect(value: unknown): ReturnType<typeof expect> {
    if (this.framework === 'vitest') {
      return (
        globalThis as unknown as { expect: (value: unknown) => ReturnType<typeof expect> }
      ).expect(value);
    } else {
      return expect(value);
    }
  }
}

/**
 * Shared matcher utilities that work across frameworks
 */
export class UniversalMatchers {
  static toEqual(received: unknown, expected: unknown): { pass: boolean; message: string } {
    try {
      const runner = new UniversalTestRunner();
      runner.expect(received).toEqual(expected);
      return { pass: true, message: 'Values are equal' };
    } catch (error) {
      return {
        pass: false,
        message: error instanceof Error ? error.message : 'Values are not equal',
      };
    }
  }

  static toBe(received: unknown, expected: unknown): { pass: boolean; message: string } {
    try {
      const runner = new UniversalTestRunner();
      runner.expect(received).toBe(expected);
      return { pass: true, message: 'Values are strictly equal' };
    } catch (error) {
      return {
        pass: false,
        message: error instanceof Error ? error.message : 'Values are not strictly equal',
      };
    }
  }

  static toContain(array: unknown[], item: unknown): { pass: boolean; message: string } {
    try {
      const runner = new UniversalTestRunner();
      runner.expect(array).toContain(item);
      return { pass: true, message: 'Array contains item' };
    } catch (error) {
      return {
        pass: false,
        message: error instanceof Error ? error.message : 'Array does not contain item',
      };
    }
  }

  static toMatch(string: string, pattern: RegExp): { pass: boolean; message: string } {
    try {
      const runner = new UniversalTestRunner();
      runner.expect(string).toMatch(pattern);
      return { pass: true, message: 'String matches pattern' };
    } catch (error) {
      return {
        pass: false,
        message: error instanceof Error ? error.message : 'String does not match pattern',
      };
    }
  }
}

/**
 * Shared mock utilities
 */
export class UniversalMocks {
  static createMock<T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>
  ): T {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      return (
        globalThis as unknown as {
          vi: { fn: <F extends (...args: unknown[]) => unknown>(impl?: F) => F };
        }
      ).vi.fn(implementation as (...args: unknown[]) => unknown) as T;
    } else {
      const mock = jest.fn(implementation);
      return mock as unknown as T;
    }
  }

  static createMockObject<T extends Record<string, unknown>>(template: T): T {
    const result = {} as T;

    for (const key in template) {
      if (typeof template[key] === 'function') {
        (result as Record<string, unknown>)[key] = this.createMock(
          template[key] as (...args: unknown[]) => unknown
        );
      } else {
        (result as Record<string, unknown>)[key] = template[key];
      }
    }

    return result;
  }

  static spyOn<T extends Record<string, unknown>, K extends keyof T>(
    object: T,
    method: K
  ): unknown {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      return (
        globalThis as unknown as {
          vi: {
            spyOn: <O extends Record<string, unknown>, M extends keyof O>(
              object_: O,
              method: M
            ) => unknown;
          };
        }
      ).vi.spyOn(object, method);
    } else {
      // Use type assertion to bypass strict type checking for dynamic method names
      return jest.spyOn(object as Record<string, unknown>, method as never);
    }
  }

  static clearAllMocks(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as unknown as { vi: { clearAllMocks: () => void } }).vi.clearAllMocks();
    } else {
      jest.clearAllMocks();
    }
  }

  static resetAllMocks(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as unknown as { vi: { resetAllMocks: () => void } }).vi.resetAllMocks();
    } else {
      jest.resetAllMocks();
    }
  }
}

/**
 * Shared timer utilities
 */
export class UniversalTimers {
  static useFakeTimers(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as unknown as { vi: { useFakeTimers: () => void } }).vi.useFakeTimers();
    } else {
      jest.useFakeTimers();
    }
  }

  static useRealTimers(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as unknown as { vi: { useRealTimers: () => void } }).vi.useRealTimers();
    } else {
      jest.useRealTimers();
    }
  }

  static advanceTimersByTime(ms: number): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (
        globalThis as unknown as { vi: { advanceTimersByTime: (ms: number) => void } }
      ).vi.advanceTimersByTime(ms);
    } else {
      jest.advanceTimersByTime(ms);
    }
  }

  static runAllTimers(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as unknown as { vi: { runAllTimers: () => void } }).vi.runAllTimers();
    } else {
      jest.runAllTimers();
    }
  }
}

/**
 * Shared fixture utilities
 */
export class UniversalFixtures {
  private static readonly fixtures = new Map<
    string,
    {
      setup: () => unknown | Promise<unknown>;
      teardown?: (fixture: unknown) => void | Promise<void>;
    }
  >();

  static define<T>(
    name: string,
    setup: () => T | Promise<T>,
    teardown?: ((fixture: unknown) => void | Promise<void>) | undefined
  ): void {
    this.fixtures.set(name, { setup, ...(teardown && { teardown }) });
  }

  static async get<T>(name: string): Promise<T> {
    const fixture = this.fixtures.get(name);
    if (!fixture) {
      throw new Error(`Fixture "${name}" not found`);
    }

    return (await fixture.setup()) as T;
  }

  static async cleanup(name: string, fixture: unknown): Promise<void> {
    const fixtureDefinition = this.fixtures.get(name);
    if (fixtureDefinition?.teardown) {
      await fixtureDefinition.teardown(fixture);
    }
  }

  static clear(): void {
    this.fixtures.clear();
  }
}

/**
 * Configuration utilities
 */
export class UniversalConfig {
  static getConfig(): {
    testTimeout: number;
    slowTestThreshold: number;
    retryTimes: number;
    bail: boolean;
  } {
    const framework = FrameworkDetector.detect();
    const context = FrameworkDetector.getContext();

    // Default configuration
    const config = {
      testTimeout: 5000,
      slowTestThreshold: 1000,
      retryTimes: context.isCI ? 2 : 0,
      bail: context.isCI,
    };

    // Framework-specific overrides
    if (framework === 'vitest') {
      // Vitest specific config
      config.testTimeout = 10000; // Vitest often needs more time
    } else if (framework === 'jest') {
      // Jest specific config
      config.testTimeout = 5000;
    }

    return config;
  }

  static setGlobalConfig(): void {
    // In a real implementation, this would merge with existing config
    // For now, it's a placeholder
  }
}

/**
 * Performance measurement utilities
 */
export class UniversalPerformance {
  static async measureExecutionTime<T>(
    function_: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await Promise.resolve(function_());
    const end = performance.now();
    return {
      result,
      duration: end - start,
    };
  }

  static async assertExecutionTime(
    function_: () => unknown | Promise<unknown>,
    maxDuration: number,
    description = 'operation'
  ): Promise<void> {
    const { duration } = await this.measureExecutionTime(function_);
    if (duration > maxDuration) {
      throw new Error(
        `${description} took ${duration.toFixed(2)}ms, exceeding limit of ${maxDuration}ms`
      );
    }
  }
}

/**
 * Setup universal testing utilities
 */
export function setupUniversalTesting(): void {
  const context = FrameworkDetector.getContext();

  // Set global test context
  (global as unknown as { __testContext?: TestContext }).__testContext = context;

  // Configure based on framework
  const config = UniversalConfig.getConfig();

  // Set timeouts
  if (context.framework === 'jest') {
    jest.setTimeout(config.testTimeout);
  } else if (context.framework === 'vitest') {
    // Vitest timeout configuration would go here
  }
}
