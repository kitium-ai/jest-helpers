/**
 * Fixture management for tests
 */

export type Fixture<T> = {
  setup(): Promise<T> | T;
  teardown(data: T): Promise<void> | void;
};

export type FixtureContext = {
  [key: string]: unknown;
};

/**
 * Fixture manager for setup and teardown
 */
export class FixtureManager {
  private readonly fixtures: Map<string, unknown> = new Map();
  private readonly fixtureDefinitions: Map<string, Fixture<unknown>> = new Map();

  /**
   * Register a fixture
   */
  register<T>(name: string, fixture: Fixture<T>): void {
    this.fixtureDefinitions.set(name, fixture);
  }

  /**
   * Setup a fixture by name
   */
  async setup<T>(name: string): Promise<T> {
    const fixture = this.fixtureDefinitions.get(name);
    if (!fixture) {
      throw new Error(`Fixture '${name}' not found`);
    }

    const data = await fixture.setup();
    this.fixtures.set(name, data);
    return data as T;
  }

  /**
   * Get a fixture by name
   */
  get<T>(name: string): T {
    const data = this.fixtures.get(name);
    if (data === undefined) {
      throw new Error(`Fixture '${name}' not setup yet`);
    }
    return data as T;
  }

  /**
   * Teardown a specific fixture
   */
  async teardown(name: string): Promise<void> {
    const fixture = this.fixtureDefinitions.get(name);
    const data = this.fixtures.get(name);

    if (fixture && data !== undefined) {
      await fixture.teardown(data);
      this.fixtures.delete(name);
    }
  }

  /**
   * Teardown all fixtures
   */
  async teardownAll(): Promise<void> {
    const names = Array.from(this.fixtures.keys());
    for (const name of names) {
      await this.teardown(name);
    }
  }

  /**
   * Clear all fixtures
   */
  clear(): void {
    this.fixtures.clear();
    this.fixtureDefinitions.clear();
  }
}

/**
 * Create a simple fixture
 */
export function createFixture<T>(
  setup: () => T | Promise<T>,
  teardown?: (data: T) => void | Promise<void>
): Fixture<T> {
  return {
    async setup() {
      return await setup();
    },
    async teardown(data: T) {
      if (teardown) {
        await teardown(data);
      }
    },
  };
}

/**
 * Fixture context helper - manages setup/teardown in tests
 */
export async function withFixture<T>(
  fixture: Fixture<T>,
  testFunction: (data: T) => Promise<void> | void
): Promise<void> {
  const data = await fixture.setup();

  try {
    await testFunction(data);
  } finally {
    await fixture.teardown(data);
  }
}

/**
 * Setup multiple fixtures
 */
export async function withFixtures<T extends Record<string, unknown>>(
  fixtures: Record<keyof T, Fixture<T[keyof T]>>,
  testFunction: (context: T) => Promise<void> | void
): Promise<void> {
  const context = {} as T;

  try {
    for (const key in fixtures) {
      if (Object.prototype.hasOwnProperty.call(fixtures, key)) {
        const fixture = fixtures[key];
        const setupResult = await fixture.setup();
        // Type assertion needed due to TypeScript's strict type checking
        (context as Record<string, unknown>)[key as string] = setupResult as T[Extract<
          keyof T,
          string
        >];
      }
    }

    await testFunction(context);
  } finally {
    for (const key in fixtures) {
      if (!Object.prototype.hasOwnProperty.call(fixtures, key)) {
        continue;
      }
      const fixture = fixtures[key];
      const data = context[key];
      if (data !== undefined) {
        await fixture.teardown(data);
      }
    }
  }
}

/**
 * Global fixture registry
 */
const globalRegistry = new FixtureManager();

export function getGlobalFixtureManager(): FixtureManager {
  return globalRegistry;
}

/**
 * Create a fixture hook for beforeEach/afterEach
 */
export function createFixtureHook<T>(
  fixture: Fixture<T>,
  onSetup?: (data: T) => void
): {
  beforeEach(): Promise<void>;
  afterEach(): Promise<void>;
  getData(): T;
} {
  let data: T;

  return {
    async beforeEach() {
      data = await fixture.setup();
      onSetup?.(data);
    },
    async afterEach() {
      await fixture.teardown(data);
    },
    getData() {
      return data;
    },
  };
}

/**
 * Strongly-typed fixture registry helper.
 * Allows declaring fixtures with inferred keys and values without string literals.
 */
export function defineFixtures<TFixtures extends Record<string, Fixture<unknown>>>(
  fixtures: TFixtures
): TFixtures {
  return fixtures;
}
