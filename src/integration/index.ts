/**
 * Integration testing helpers and utilities
 * Provides utilities for setup, teardown, and testing integrated components
 */

import { retry, waitFor } from '@kitiumai/test-core';

/**
 * Integration test context - manages test state and resources
 */
export type IntegrationTestContext = {
  [key: string]: unknown;
};

/**
 * Test resource - lifecycle management for test dependencies
 */
export type TestResource<T> = {
  name: string;
  setup(): Promise<T> | T;
  teardown(resource: T): Promise<void> | void;
};

/**
 * Integration test environment manager
 */
export class IntegrationTestEnvironment {
  private readonly resources: Map<string, unknown> = new Map();
  private readonly resourceDefs: Map<string, TestResource<unknown>> = new Map();
  private setupHooks: Array<() => Promise<void>> = [];
  private teardownHooks: Array<() => Promise<void>> = [];

  /**
   * Register a test resource
   */
  registerResource<T>(resource: TestResource<T>): void {
    this.resourceDefs.set(resource.name, resource);
  }

  /**
   * Setup a specific resource
   */
  async setupResource<T>(name: string): Promise<T> {
    const resource = this.resourceDefs.get(name);
    if (!resource) {
      throw new Error(`Resource '${name}' not registered`);
    }

    const instance = await resource.setup();
    this.resources.set(name, instance);
    return instance as T;
  }

  /**
   * Get a resource instance
   */
  getResource<T>(name: string): T {
    const instance = this.resources.get(name);
    if (!instance) {
      throw new Error(`Resource '${name}' not setup`);
    }
    return instance as T;
  }

  /**
   * Setup all registered resources
   */
  async setupAll(): Promise<void> {
    for (const name of this.resourceDefs.keys()) {
      await this.setupResource(name);
    }
  }

  /**
   * Teardown a specific resource
   */
  async teardownResource(name: string): Promise<void> {
    const resource = this.resourceDefs.get(name);
    const instance = this.resources.get(name);

    if (resource && instance) {
      await resource.teardown(instance);
      this.resources.delete(name);
    }
  }

  /**
   * Teardown all resources
   */
  async teardownAll(): Promise<void> {
    const names = Array.from(this.resources.keys()).reverse();
    for (const name of names) {
      await this.teardownResource(name);
    }
  }

  /**
   * Add setup hook
   */
  onSetup(hook: () => Promise<void>): void {
    this.setupHooks.push(hook);
  }

  /**
   * Add teardown hook
   */
  onTeardown(hook: () => Promise<void>): void {
    this.teardownHooks.push(hook);
  }

  /**
   * Execute setup process
   */
  async setup(): Promise<void> {
    for (const hook of this.setupHooks) {
      await hook();
    }
  }

  /**
   * Execute teardown process
   */
  async teardown(): Promise<void> {
    for (const hook of this.teardownHooks) {
      await hook();
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.resources.clear();
    this.resourceDefs.clear();
    this.setupHooks = [];
    this.teardownHooks = [];
  }
}

/**
 * Test scenario builder - defines a sequence of test operations
 */
export class TestScenario {
  private readonly steps: Array<() => Promise<void>> = [];
  private beforeEachFn?: () => Promise<void>;
  private afterEachFn?: () => Promise<void>;

  /**
   * Add setup step
   */
  beforeEach(function_: () => Promise<void>): this {
    this.beforeEachFn = function_;
    return this;
  }

  /**
   * Add teardown step
   */
  afterEach(function_: () => Promise<void>): this {
    this.afterEachFn = function_;
    return this;
  }

  /**
   * Add a test step
   */
  step(name: string, function_: () => Promise<void>): this {
    this.steps.push(async () => {
      console.log(`  → ${name}`);
      await function_();
    });
    return this;
  }

  /**
   * Execute scenario
   */
  async execute(): Promise<void> {
    if (this.beforeEachFn) {
      await this.beforeEachFn();
    }

    for (const step of this.steps) {
      await step();
    }

    if (this.afterEachFn) {
      await this.afterEachFn();
    }
  }
}

/**
 * Test data builder for complex scenarios
 */
export class TestDataBuilder {
  private data: Record<string, unknown> = {};
  private readonly relationships: Map<string, unknown[]> = new Map();

  /**
   * Set a value
   */
  set(key: string, value: unknown): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Add related entity
   */
  addRelated(key: string, entity: unknown): this {
    if (!this.relationships.has(key)) {
      this.relationships.set(key, []);
    }
    const rels = this.relationships.get(key);
    if (rels) {
      rels.push(entity);
    }
    return this;
  }

  /**
   * Get value
   */
  get(key: string): unknown {
    return this.data[key];
  }

  /**
   * Get related entities
   */
  getRelated(key: string): unknown[] {
    return this.relationships.get(key) ?? [];
  }

  /**
   * Build complete data object
   */
  build(): Record<string, unknown> {
    const result = { ...this.data };
    for (const [key, entities] of this.relationships) {
      result[key] = entities;
    }
    return result;
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.data = {};
    this.relationships.clear();
    return this;
  }
}

/**
 * Integration test assertions
 */
export const IntegrationAssertions = {
  /**
   * Assert resource exists and is accessible
   */
  assertResourceAccessible<T>(value: T, message?: string): T {
    if (value === null || value === undefined) {
      throw new Error(message ?? 'Resource is not accessible');
    }
    return value;
  },

  /**
   * Assert value changed
   */
  assertChanged<T>(before: T, after: T, message?: string): void {
    if (JSON.stringify(before) === JSON.stringify(after)) {
      throw new Error(message ?? 'Value did not change');
    }
  },

  /**
   * Assert value did not change
   */
  assertUnchanged<T>(before: T, after: T, message?: string): void {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(message ?? 'Value should not have changed');
    }
  },

  /**
   * Assert state consistency
   */
  async assertEventuallyConsistent<T>(
    function_: () => Promise<T>,
    expectedValue: T,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> {
    const { timeout = 5000, interval = 100 } = options;

    await waitFor(
      async () => {
        const value = await function_();
        return JSON.stringify(value) === JSON.stringify(expectedValue);
      },
      { timeout, interval }
    );
  },

  /**
   * Assert no side effects
   */
  assertNoSideEffects<T>(
    before: T,
    _operation: () => Promise<void>,
    after: T,
    message?: string
  ): void {
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error(message ?? 'Operation caused unexpected side effects');
    }
  },
};

/**
 * Create integration test environment
 */
export function createIntegrationTestEnvironment(): IntegrationTestEnvironment {
  return new IntegrationTestEnvironment();
}

/**
 * Create test scenario
 */
export function createTestScenario(): TestScenario {
  return new TestScenario();
}

/**
 * Create test data builder
 */
export function createTestDataBuilder(): TestDataBuilder {
  return new TestDataBuilder();
}

/**
 * Parallel test execution helper
 */
export async function runTestsInParallel<T>(
  tests: Array<() => Promise<T>>,
  options: { concurrency?: number } = {}
): Promise<T[]> {
  const { concurrency = 5 } = options;
  const results: T[] = [];
  const executing: Array<Promise<T>> = [];

  for (let index = 0; index < tests.length; index++) {
    const test = tests[index];
    const promise = Promise.resolve().then(test);

    results[index] = await promise;

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      void executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }

    executing.push(promise);
  }

  await Promise.all(executing);
  return results;
}

/**
 * Sequential test execution helper
 */
export async function runTestsSequentially<T>(tests: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];

  for (const test of tests) {
    results.push(await test());
  }

  return results;
}

/**
 * Test retry helper with reporting
 */
export async function retryTestWithReport<T>(
  testFunction: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 100, onRetry } = options;

  let attempt = 0;
  return retry(
    async () => {
      attempt++;
      try {
        return await testFunction();
      } catch (error) {
        if (attempt < maxAttempts) {
          const errorObject = error instanceof Error ? error : new Error(String(error));
          console.log(`Retry attempt ${attempt}/${maxAttempts}: ${errorObject.message}`);
          onRetry?.(attempt, errorObject);
        }
        throw error;
      }
    },
    {
      maxAttempts,
      delay: delayMs,
    }
  );
}

/**
 * Timeout helper for test execution
 */
export async function withTimeout<T>(function_: () => Promise<T>, timeoutMs: number): Promise<T> {
  let completed = false;
  let result: T;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      if (!completed) {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  try {
    result = await Promise.race([function_(), timeoutPromise]);
    completed = true;
    return result;
  } catch (e) {
    completed = true;
    throw e;
  }
}

/**
 * Test cleanup manager
 */
export class TestCleanupManager {
  private cleanupFns: Array<() => Promise<void>> = [];

  /**
   * Register cleanup function
   */
  onCleanup(function_: () => Promise<void>): void {
    this.cleanupFns.push(function_);
  }

  /**
   * Execute all cleanup functions in reverse order
   */
  async cleanup(): Promise<void> {
    for (let index = this.cleanupFns.length - 1; index >= 0; index--) {
      const cleanupFunction = this.cleanupFns[index];
      if (!cleanupFunction) {
        continue;
      }
      try {
        await cleanupFunction();
      } catch (_error) {
        // Cleanup errors are logged but don't fail the test
        if (process.env['DEBUG']) {
          console.error(`Cleanup function failed: ${_error}`);
        }
      }
    }
  }

  /**
   * Clear cleanup functions
   */
  clear(): void {
    this.cleanupFns = [];
  }
}

/**
 * Create cleanup manager
 */
export function createTestCleanupManager(): TestCleanupManager {
  return new TestCleanupManager();
}
