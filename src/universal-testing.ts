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
  describe: (name: string, fn: () => void) => void;
  it: (name: string, fn: () => void | Promise<void>) => void;
  beforeEach: (fn: () => void | Promise<void>) => void;
  afterEach: (fn: () => void | Promise<void>) => void;
  beforeAll: (fn: () => void | Promise<void>) => void;
  afterAll: (fn: () => void | Promise<void>) => void;
  expect: (value: unknown) => any;
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
    if (typeof globalThis !== 'undefined' && (globalThis as any).vitest) {
      return 'vitest';
    }

    // Check for global test functions
    if (typeof describe === 'function' && typeof it === 'function') {
      // Try to detect based on global properties
      if (typeof expect !== 'undefined' && (expect as any).getState) {
        return 'jest';
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any).__vitest__) {
        return 'vitest';
      }
    }

    return 'unknown';
  }

  static getContext(): TestContext {
    const framework = this.detect();
    let version = 'unknown';
    let environment: 'node' | 'browser' | 'unknown' = 'unknown';

    try {
      switch (framework) {
        case 'jest':
          version = (jest as any).getVersion?.() || 'unknown';
          break;
        case 'vitest':
          version = (globalThis as any).vitest?.version || 'unknown';
          break;
      }
    } catch {
      // Ignore version detection errors
    }

    // Detect environment
    if (typeof globalThis !== 'undefined') {
      const g = globalThis as any;
      if (typeof g.window !== 'undefined' && typeof g.document !== 'undefined') {
        environment = 'browser';
      }
    }
    
    if (typeof process !== 'undefined' && (process as any).versions?.node) {
      environment = 'node';
    }

    return {
      framework,
      version,
      environment,
      isCI: this.isCI(),
    };
  }

  private static isCI(): boolean {
    if (typeof process === 'undefined') return false;
    
    const env = process.env;
    return !!(
      env['CI'] ||
      env['CONTINUOUS_INTEGRATION'] ||
      env['BUILD_NUMBER'] ||
      env['CIRCLECI'] ||
      env['TRAVIS'] ||
      env['GITHUB_ACTIONS'] ||
      env['JENKINS_URL'] ||
      env['BUILDKITE']
    );
  }
}

/**
 * Universal test runner adapter
 */
export class UniversalTestRunner implements TestRunner {
  private framework: TestFramework;

  constructor() {
    this.framework = FrameworkDetector.detect();
  }

  describe(name: string, fn: () => void): void {
    if (this.framework === 'vitest') {
      (globalThis as any).describe(name, fn);
    } else {
      describe(name, fn);
    }
  }

  it(name: string, fn: (() => void | Promise<void>)): void {
    if (this.framework === 'vitest') {
      (globalThis as any).it(name, fn as any);
    } else {
      it(name, fn as any);
    }
  }

  beforeEach(fn: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (globalThis as any).beforeEach(fn);
    } else {
      beforeEach(fn);
    }
  }

  afterEach(fn: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (globalThis as any).afterEach(fn);
    } else {
      afterEach(fn);
    }
  }

  beforeAll(fn: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (globalThis as any).beforeAll(fn);
    } else {
      beforeAll(fn);
    }
  }

  afterAll(fn: () => void | Promise<void>): void {
    if (this.framework === 'vitest') {
      (globalThis as any).afterAll(fn);
    } else {
      afterAll(fn);
    }
  }

  expect(value: unknown): any {
    if (this.framework === 'vitest') {
      return (globalThis as any).expect(value);
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
      return (globalThis as any).vi.fn(implementation);
    } else {
      const mock = jest.fn(implementation);
      return mock as unknown as T;
    }
  }

  static createMockObject<T extends Record<string, unknown>>(template: T): T {
    const result = {} as T;

    for (const key in template) {
      if (typeof template[key] === 'function') {
        (result as any)[key] = this.createMock(template[key] as any);
      } else {
        (result as any)[key] = template[key];
      }
    }

    return result;
  }

  static spyOn<T extends Record<string, unknown>, K extends keyof T>(
    object: T,
    method: K
  ): any {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      return (globalThis as any).vi.spyOn(object, method as any);
    } else {
      return jest.spyOn(object, method as any);
    }
  }

  static clearAllMocks(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as any).vi.clearAllMocks();
    } else {
      jest.clearAllMocks();
    }
  }

  static resetAllMocks(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as any).vi.resetAllMocks();
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
      (globalThis as any).vi.useFakeTimers();
    } else {
      jest.useFakeTimers();
    }
  }

  static useRealTimers(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as any).vi.useRealTimers();
    } else {
      jest.useRealTimers();
    }
  }

  static advanceTimersByTime(ms: number): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as any).vi.advanceTimersByTime(ms);
    } else {
      jest.advanceTimersByTime(ms);
    }
  }

  static runAllTimers(): void {
    const framework = FrameworkDetector.detect();

    if (framework === 'vitest') {
      (globalThis as any).vi.runAllTimers();
    } else {
      jest.runAllTimers();
    }
  }
}

/**
 * Shared fixture utilities
 */
export class UniversalFixtures {
  private static fixtures = new Map<string, { setup: () => unknown | Promise<unknown>; teardown?: (fixture: unknown) => void | Promise<void> }>();

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

    return await fixture.setup() as T;
  }

  static async cleanup(name: string, fixture: unknown): Promise<void> {
    const fixtureDef = this.fixtures.get(name);
    if (fixtureDef?.teardown) {
      await fixtureDef.teardown(fixture);
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
  static measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();

    return Promise.resolve(fn()).then(result => {
      const end = performance.now();
      return {
        result,
        duration: end - start,
      };
    });
  }

  static assertExecutionTime(
    fn: () => unknown | Promise<unknown>,
    maxDuration: number,
    description = 'operation'
  ): Promise<void> {
    return this.measureExecutionTime(fn).then(({ duration }) => {
      if (duration > maxDuration) {
        throw new Error(`${description} took ${duration.toFixed(2)}ms, exceeding limit of ${maxDuration}ms`);
      }
    });
  }
}

/**
 * Setup universal testing utilities
 */
export function setupUniversalTesting(): void {
  const context = FrameworkDetector.getContext();

  // Set global test context
  (global as any).__testContext = context;

  // Configure based on framework
  const config = UniversalConfig.getConfig();

  // Set timeouts
  if (context.framework === 'jest') {
    jest.setTimeout(config.testTimeout);
  } else if (context.framework === 'vitest') {
    // Vitest timeout configuration would go here
  }
}