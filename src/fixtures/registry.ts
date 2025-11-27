/**
 * Automatic fixture cleanup registry (Playwright/Nest-style)
 * Ensures fixtures are always cleaned up, even if tests fail
 */

import { contextManager, getLogger } from '@kitiumai/logger';

import type { Fixture } from './index';

type RegisteredFixture<T> = {
  fixture: Fixture<T>;
  data: T | null;
  setup: boolean;
  cleanupPromise?: Promise<void>;
};

/**
 * Automatic fixture registry with guaranteed cleanup
 * Similar to Playwright's fixture system
 */
export class AutomaticFixtureRegistry {
  private readonly fixtures: Map<string, RegisteredFixture<unknown>> = new Map();
  private cleanupOrder: string[] = [];
  private readonly logger = getLogger();

  /**
   * Register a fixture with automatic cleanup
   */
  register<T>(name: string, fixture: Fixture<T>): void {
    this.fixtures.set(name, {
      fixture: fixture as Fixture<unknown>,
      data: null,
      setup: false,
    });
  }

  /**
   * Setup a fixture (called automatically in beforeEach)
   */
  async setup<T>(name: string): Promise<T> {
    const registered = this.fixtures.get(name);
    if (!registered) {
      throw new Error(`Fixture '${name}' not registered`);
    }

    if (registered.setup) {
      return registered.data as T;
    }

    // Initialize context for fixture setup
    const context = contextManager.initContext({
      requestId: `fixture-${name}-${Date.now()}`,
      metadata: {
        fixtureName: name,
        operation: 'setup',
      },
    });

    return contextManager.run(context, async () => {
      try {
        this.logger.debug(`Setting up fixture: ${name}`, { fixtureName: name });
        const data = await registered.fixture.setup();
        registered.data = data;
        registered.setup = true;

        // Add to cleanup order (LIFO - last in, first out)
        this.cleanupOrder.push(name);

        return data as T;
      } catch (error) {
        this.logger.error(
          `Failed to setup fixture: ${name}`,
          { fixtureName: name },
          error instanceof Error ? error : new Error(String(error))
        );
        throw error;
      }
    });
  }

  /**
   * Get a fixture value
   */
  get<T>(name: string): T {
    const registered = this.fixtures.get(name);
    if (!registered || !registered.setup || registered.data === null) {
      throw new Error(`Fixture '${name}' not setup`);
    }
    return registered.data as T;
  }

  /**
   * Cleanup all fixtures in reverse order (LIFO)
   */
  async cleanupAll(): Promise<void> {
    const errors: Error[] = [];

    // Cleanup in reverse order
    for (let index = this.cleanupOrder.length - 1; index >= 0; index--) {
      const name = this.cleanupOrder[index];
      if (!name) {
        continue;
      }

      const registered = this.fixtures.get(name);
      if (!registered || !registered.setup || registered.data === null) {
        continue;
      }

      try {
        const context = contextManager.initContext({
          requestId: `fixture-cleanup-${name}-${Date.now()}`,
          metadata: {
            fixtureName: name,
            operation: 'teardown',
          },
        });

        await contextManager.run(context, async () => {
          this.logger.debug(`Cleaning up fixture: ${name}`, { fixtureName: name });
          await registered.fixture.teardown(registered.data);
        });

        registered.setup = false;
        registered.data = null;
      } catch (error) {
        const errorObject = error instanceof Error ? error : new Error(String(error));
        errors.push(errorObject);
        this.logger.error(`Failed to cleanup fixture: ${name}`, { fixtureName: name }, errorObject);
      }
    }

    this.cleanupOrder = [];

    if (errors.length > 0) {
      throw new Error(
        `Failed to cleanup ${errors.length} fixture(s): ${errors.map((e) => e.message).join(', ')}`
      );
    }
  }

  /**
   * Clear all registered fixtures
   */
  clear(): void {
    this.fixtures.clear();
    this.cleanupOrder = [];
  }

  /**
   * Check if a fixture is setup
   */
  isSetup(name: string): boolean {
    const registered = this.fixtures.get(name);
    return registered?.setup ?? false;
  }

  /**
   * Get all setup fixture names
   */
  getSetupFixtures(): string[] {
    return Array.from(this.fixtures.entries())
      .filter(([, registered]) => registered.setup)
      .map(([name]) => name);
  }
}

/**
 * Global automatic fixture registry
 */
let globalRegistry: AutomaticFixtureRegistry | null = null;

export function getAutomaticFixtureRegistry(): AutomaticFixtureRegistry {
  globalRegistry ??= new AutomaticFixtureRegistry();
  return globalRegistry;
}

/**
 * Create Jest hooks for automatic fixture management
 */
export function createAutomaticFixtureHooks(fixtures: Record<string, Fixture<unknown>>): {
  beforeAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
  afterAll: () => Promise<void>;
  getFixture: <T>(name: string) => T;
} {
  const registry = getAutomaticFixtureRegistry();

  // Register all fixtures
  for (const [name, fixture] of Object.entries(fixtures)) {
    registry.register(name, fixture);
  }

  return {
    async beforeAll() {
      // Setup fixtures that should be shared across all tests
      // (can be extended to support shared fixtures)
    },
    async beforeEach() {
      // Setup fixtures for each test
      const setupPromises = Object.keys(fixtures).map((name) => registry.setup(name));
      await Promise.all(setupPromises);
    },
    async afterEach() {
      // Cleanup after each test
      await registry.cleanupAll();
    },
    async afterAll() {
      // Final cleanup
      registry.clear();
      await Promise.resolve();
    },
    getFixture<T>(name: string): T {
      return registry.get<T>(name);
    },
  };
}
