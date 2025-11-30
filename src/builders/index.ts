/**
 * Test data builders and factory utilities
 * Re-exports factory utilities from @kitiumai/test-core and adds Jest-specific mock builders
 */

// Re-export from test-core for convenience
export {
  Builder,
  createBuilder,
  createFactory,
  createFactoryWithBuilder,
  DataGenerators,
  Factories,
  Factory,
  Sequence,
} from '@kitiumai/test-core';

/**
 * Create a mock provider with common methods
 */
export function createMockProvider<T extends Record<string, unknown>>(methods: {
  [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
    ? jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
    : T[K];
}): jest.Mocked<T> {
  return methods as jest.Mocked<T>;
}

/**
 * Create a mock provider with default implementations
 */
export function createMockProviderWithDefaults<T extends Record<string, unknown>>(
  defaults: Partial<T>,
  overrides?: Partial<T>
): jest.Mocked<T> {
  const mock = {} as jest.Mocked<T>;

  for (const key in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      const value = defaults[key];
      if (typeof value === 'function') {
        (mock as unknown as Record<string, unknown>)[key] = jest
          .fn()
          .mockImplementation(value as (...args: unknown[]) => unknown);
      } else {
        (mock as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }

  if (overrides) {
    Object.assign(mock, overrides);
  }

  return mock;
}

/**
 * Create a test configuration object with defaults
 */
export function createTestConfig<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Partial<T>
): T {
  return { ...defaults, ...overrides } as T;
}

/**
 * Create a mock registry/manager
 */
export function createMockRegistry<T>(items: Record<string, T> = {}): {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  has: (key: string) => boolean;
  list: () => string[];
  clear: () => void;
} {
  const registry = new Map<string, T>(Object.entries(items));

  return {
    get(key: string): T | null {
      return registry.get(key) ?? null;
    },
    set(key: string, value: T): void {
      registry.set(key, value);
    },
    has(key: string): boolean {
      return registry.has(key);
    },
    list(): string[] {
      return Array.from(registry.keys());
    },
    clear(): void {
      registry.clear();
    },
  };
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(
  data: unknown,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    ok?: boolean;
  } = {}
): Response {
  const {
    status = 200,
    statusText = 'OK',
    headers = { 'Content-Type': 'application/json' },
    ok = status >= 200 && status < 300,
  } = options;

  return {
    ok,
    status,
    statusText,
    headers: new Headers(headers),
    json: async () => Promise.resolve(data),
    text: async () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    blob: async () => Promise.resolve(new Blob([JSON.stringify(data)])),
    arrayBuffer: async () => Promise.resolve(new ArrayBuffer(0)),
    clone: function () {
      return createMockFetchResponse(data, options);
    },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'default',
    url: '',
  } as Response;
}

/**
 * Create a mock fetch error response
 */
export function createMockFetchError(message: string, status = 500): Response {
  return createMockFetchResponse(
    { error: message },
    {
      status,
      statusText: 'Error',
      ok: false,
    }
  );
}

/**
 * Create a mock fetch that returns different responses
 */
export function createMockFetch(responses: Array<Response | (() => Response)> = []): jest.Mock {
  let callIndex = 0;

  return jest.fn((_url: string, _options?: RequestInit) => {
    if (callIndex >= responses.length) {
      return Promise.resolve(
        createMockFetchResponse({ message: 'No more mock responses' }, { status: 404 })
      );
    }

    const response = responses[callIndex++];
    const resolvedResponse = typeof response === 'function' ? response() : response;

    return Promise.resolve(resolvedResponse);
  });
}

/**
 * Create a mock fetch with rate limiting simulation
 */
export function createMockFetchWithRetries(
  responses: Array<Response | (() => Response)>,
  retryAfter = 1
): jest.Mock {
  let callIndex = 0;
  let retryCount = 0;

  return jest.fn((_url: string, _options?: RequestInit) => {
    // Simulate rate limiting
    if (retryCount < responses.length && callIndex > 0 && callIndex % 2 === 0) {
      retryCount++;
      return Promise.resolve(
        createMockFetchResponse(
          { error: 'Rate limited' },
          {
            status: 429,
            statusText: 'Too Many Requests',
            ok: false,
            headers: { 'retry-after': String(retryAfter) },
          }
        )
      );
    }

    if (callIndex >= responses.length) {
      return Promise.resolve(
        createMockFetchResponse({ message: 'No more mock responses' }, { status: 404 })
      );
    }

    const response = responses[callIndex++];
    const resolvedResponse = typeof response === 'function' ? response() : response;

    return Promise.resolve(resolvedResponse);
  });
}

/**
 * Builder for test data objects
 */
export class TestDataBuilder<T extends Record<string, unknown>> {
  private data: Partial<T> = {};

  constructor(defaults?: Partial<T>) {
    if (defaults) {
      this.data = { ...defaults };
    }
  }

  with<K extends keyof T>(key: K, value: T[K]): this {
    this.data[key] = value;
    return this;
  }

  withMany(overrides: Partial<T>): this {
    Object.assign(this.data, overrides);
    return this;
  }

  build(): T {
    return this.data as T;
  }

  buildPartial(): Partial<T> {
    return { ...this.data };
  }
}

/**
 * Create a test data builder
 */
export function createTestDataBuilder<T extends Record<string, unknown>>(
  defaults?: Partial<T>
): TestDataBuilder<T> {
  return new TestDataBuilder<T>(defaults);
}
