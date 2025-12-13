/**
 * Test data factories and builders for generating realistic test data
 * Inspired by Factory Bot and Object Mother patterns used in enterprise testing
 */

export type Factory<T> = {
  build(): T;
  buildMany(count: number): T[];
  withOverrides(overrides: Partial<T>): Factory<T>;
  create(): Promise<T>;
  createMany(count: number): Promise<T[]>;
};

export type FactoryDefinition<T> = {
  [K in keyof T]: T[K] | (() => T[K]) | FactoryGenerator<T[K]>;
};

export type FactoryGenerator<T> = () => T;

export type FactoryOptions<T = unknown> = {
  persist?: (entity: T) => Promise<T>;
  afterBuild?: (entity: T) => void | Promise<void>;
  associations?: Record<string, Factory<unknown>>;
};

/**
 * Base factory class
 */
export class BaseFactory<T extends Record<string, unknown>> implements Factory<T> {
  private readonly definition: FactoryDefinition<T>;
  private overrides: Partial<T> = {};
  private readonly options: FactoryOptions<T>;

  constructor(definition: FactoryDefinition<T>, options: FactoryOptions<T> = {}) {
    this.definition = definition;
    this.options = options;
  }

  /**
   * Build a single entity
   */
  build(): T {
    const entity = this.buildEntity();
    if (this.options.afterBuild) {
      const result = this.options.afterBuild(entity);
      if (result instanceof Promise) {
        throw new Error(
          'afterBuild should be synchronous for build(). Use create() for async operations.'
        );
      }
    }
    return entity;
  }

  /**
   * Build multiple entities
   */
  buildMany(count: number): T[] {
    return Array.from({ length: count }, () => this.build());
  }

  /**
   * Create a single entity (with persistence if configured)
   */
  async create(): Promise<T> {
    const entity = this.buildEntity();

    if (this.options.afterBuild) {
      await this.options.afterBuild(entity);
    }

    if (this.options.persist) {
      return await this.options.persist(entity);
    }

    return entity;
  }

  /**
   * Create multiple entities
   */
  async createMany(count: number): Promise<T[]> {
    const promises = Array.from({ length: count }, () => this.create());
    return await Promise.all(promises);
  }

  /**
   * Create a factory with additional overrides
   */
  withOverrides(overrides: Partial<T>): Factory<T> {
    const newFactory = new BaseFactory(this.definition, this.options);
    newFactory.overrides = { ...this.overrides, ...overrides };
    return newFactory;
  }

  /**
   * Build entity from definition
   */
  private buildEntity(): T {
    const entity = {} as T;

    for (const key in this.definition) {
      if (this.overrides[key] !== undefined) {
        entity[key] = this.overrides[key] as T[typeof key];
      } else {
        const value = this.definition[key];
        if (typeof value === 'function') {
          entity[key] = (value as () => T[typeof key])();
        } else {
          entity[key] = value as T[typeof key];
        }
      }
    }

    return entity;
  }
}

/**
 * Factory registry for managing multiple factories
 */
export class FactoryRegistry {
  private readonly factories = new Map<string, Factory<unknown>>();
  private readonly sequences = new Map<string, number>();

  /**
   * Define a factory
   */
  define<T extends Record<string, unknown>>(
    name: string,
    definition: FactoryDefinition<T>,
    options: FactoryOptions<T> = {}
  ): Factory<T> {
    const factory = new BaseFactory(definition, options);
    this.factories.set(name, factory as Factory<unknown>);
    return factory;
  }

  /**
   * Get a factory by name
   */
  get<T extends Record<string, unknown>>(name: string): Factory<T> {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Factory "${name}" not found`);
    }
    return factory as Factory<T>;
  }

  /**
   * Create a sequence generator
   */
  sequence(name: string, generator: (n: number) => unknown): () => unknown {
    return () => {
      const current = this.sequences.get(name) ?? 0;
      const next = current + 1;
      this.sequences.set(name, next);
      return generator(next);
    };
  }

  /**
   * Reset all sequences
   */
  resetSequences(): void {
    this.sequences.clear();
  }
}

/**
 * Global factory registry
 */
export const factories = new FactoryRegistry();

/**
 * Common data generators
 */
export const generators = {
  /**
   * Generate sequential IDs
   */
  id: (start = 1) => {
    let counter = start - 1;
    return () => ++counter;
  },

  /**
   * Generate sequential numbers
   */
  sequence: (prefix = '', start = 1) => {
    let counter = start - 1;
    return () => `${prefix}${++counter}`;
  },

  /**
   * Random integer
   */
  integer:
    (min = 1, max = 1000) =>
    () =>
      Math.floor(Math.random() * (max - min + 1)) + min,

  /**
   * Random string
   */
  string:
    (length = 10) =>
    () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let index = 0; index < length; index++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

  /**
   * Random email
   */
  email: () => () => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'example.com'];
    const local = generators.string(8)();
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${local}@${domain}`;
  },

  /**
   * Random URL
   */
  url: () => () => {
    const protocols = ['http', 'https'];
    const domains = ['example.com', 'test.com', 'sample.org'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${protocol}://${domain}`;
  },

  /**
   * Random boolean
   */
  boolean: () => () => Math.random() > 0.5,

  /**
   * Random date
   */
  date: (start?: Date, end?: Date) => () => {
    const startDate = start ?? new Date(2000, 0, 1);
    const endDate = end ?? new Date();
    const timeDiff = endDate.getTime() - startDate.getTime();
    const randomTime = Math.random() * timeDiff;
    return new Date(startDate.getTime() + randomTime);
  },

  /**
   * Random from array
   */
  oneOf:
    <T>(options: T[]) =>
    () =>
      options[Math.floor(Math.random() * options.length)],

  /**
   * Random array
   */
  array:
    <T>(generator: () => T, min = 1, max = 5) =>
    () => {
      const length = Math.floor(Math.random() * (max - min + 1)) + min;
      return Array.from({ length }, generator);
    },

  /**
   * Random object with nested structure
   */
  object:
    <T extends Record<string, unknown>>(schema: {
      [K in keyof T]: () => T[K];
    }) =>
    () => {
      const result = {} as T;
      for (const key in schema) {
        result[key] = schema[key]();
      }
      return result;
    },
};

/**
 * Association helpers for linking factories
 */
export class Association<T extends Record<string, unknown>> {
  constructor(
    private readonly factoryName: string,
    private readonly overrides: Partial<T> = {}
  ) {}

  build(): T {
    return factories.get<T>(this.factoryName).withOverrides(this.overrides).build();
  }

  async create(): Promise<T> {
    return await factories.get<T>(this.factoryName).withOverrides(this.overrides).create();
  }
}

/**
 * Create an association
 */
export function association<T extends Record<string, unknown>>(
  factoryName: string,
  overrides: Partial<T> = {}
): Association<T> {
  return new Association(factoryName, overrides);
}

/**
 * Builder pattern for complex objects
 */
export class TestDataBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};

  /**
   * Set a property
   */
  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  /**
   * Set multiple properties
   */
  withMany(updates: Partial<T>): this {
    Object.assign(this.data, updates);
    return this;
  }

  /**
   * Generate using a factory
   */
  fromFactory(factoryName: string): T {
    const factory = factories.get<T>(factoryName);
    return factory.withOverrides(this.data).build();
  }

  /**
   * Build the object
   */
  build(defaults: T): T {
    return { ...defaults, ...this.data };
  }
}

/**
 * Create a test data builder
 */
export function createTestDataBuilder<T extends Record<string, unknown>>(): TestDataBuilder<T> {
  return new TestDataBuilder<T>();
}

/**
 * Pre-built factories for common entities
 */
export const commonFactories = {
  /**
   * User factory
   */
  user: () =>
    factories.define('user', {
      id: generators.id(),
      email: generators.email(),
      name: generators.string(20),
      age: generators.integer(18, 80),
      active: generators.boolean(),
      createdAt: generators.date(),
    }),

  /**
   * Post factory
   */
  post: () =>
    factories.define(
      'post',
      {
        id: generators.id(),
        title: generators.string(50),
        content: generators.string(200),
        authorId: generators.integer(1, 100),
        published: generators.boolean(),
        createdAt: generators.date(),
      },
      {
        associations: {
          author: factories.get('user'),
        },
      }
    ),

  /**
   * Comment factory
   */
  comment: () =>
    factories.define('comment', {
      id: generators.id(),
      content: generators.string(100),
      postId: generators.integer(1, 100),
      authorId: generators.integer(1, 100),
      createdAt: generators.date(),
    }),
};

/**
 * Setup helpers for tests
 */
export function setupFactories(): void {
  // Register common factories
  commonFactories.user();
  commonFactories.post();
  commonFactories.comment();
}

/**
 * Cleanup helpers
 */
export function resetFactories(): void {
  factories.resetSequences();
}
