/**
 * Jest mock utilities and factories
 */

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

/**
 * Create a simple mock function
 */

export function createMock<T extends (...args: unknown[]) => unknown>(
  options?: MockSetupOptions
): MockFunction<T> {
  const mock = jest.fn<ReturnType<T>, Parameters<T>>();

  if (options?.returnValue !== undefined) {
    mock.mockReturnValue(options.returnValue as ReturnType<T>);
  }

  if (options?.returnValues) {
    mock.mockReturnValueOnce = jest.fn();
    options.returnValues.forEach((value) => {
      mock.mockReturnValueOnce(value as ReturnType<T>);
    });
  }

  if (options?.implementation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mock.mockImplementation(options.implementation as any);
  }

  if (options?.resolveWith !== undefined && options.resolveWith !== null) {
    // Type assertion needed for jest's mockResolvedValue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mock as any).mockResolvedValue(options.resolveWith);
  }

  if (options?.rejectWith) {
    // Type assertion needed for jest's mockRejectedValue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mock as any).mockRejectedValue(options.rejectWith);
  }

  return mock;
}

/**
 * Create a mock object with specified methods
 */
export function createMockObject<T extends Record<string, unknown>>(
  template: T,
  mockOverrides?: Partial<Record<keyof T, MockSetupOptions>>
): T {
  const result: Partial<T> = {};

  for (const key in template) {
    if (Object.prototype.hasOwnProperty.call(template, key)) {
      const value = template[key];
      const override = mockOverrides?.[key];

      if (typeof value === 'function') {
        const mockFunction = createMock(override);
        (result as Record<string, unknown>)[key as string] = mockFunction;
        const mockFunction = createMock(override);
        (result as Record<string, unknown>)[key as string] = mockFunction;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const mockObject = createMockObject(
        const mockObject = createMockObject(
          value as Record<string, unknown>,
          override as Partial<Record<string, MockSetupOptions>>
        );
        (result as Record<string, unknown>)[key as string] = mockObject;
        (result as Record<string, unknown>)[key as string] = mockObject;
      } else {
        (result as Record<string, unknown>)[key as string] = value;
      }
    }
  }

  return result as T;
}

/**
 * Create a mock module
 */
export function createMockModule<T extends Record<string, unknown>>(
  moduleName: string,
  mockImplementation: T
): T {
  jest.mock(moduleName, () => mockImplementation);
  return mockImplementation;
}

/**
 * Spy on a function and track calls
 */

export function spyOnFunction<T extends (...args: unknown[]) => unknown>(
  function_: T,
  function_: T,
  options?: MockSetupOptions
): MockFunction<T> {
  // Create a wrapper object to spy on
  const wrapper = { fn: function_ };
  const wrapper = { fn: function_ };
  // Use type assertion to work around jest.spyOn type limitations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spy = jest.spyOn(wrapper as any, 'fn') as unknown as jest.Mock<
    ReturnType<T>,
    Parameters<T>
  >;

  if (options?.returnValue !== undefined) {
    spy.mockReturnValue(options.returnValue as ReturnType<T>);
  }

  if (options?.implementation) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spy.mockImplementation(options.implementation as any);
  }

  return spy;
}

/**
 * Mock timers with convenience methods
 */
export const mockTimers = {
  enable(): void {
    jest.useFakeTimers();
  },

  disable(): void {
    jest.useRealTimers();
  },

  advanceByTime(ms: number): void {
    jest.advanceTimersByTime(ms);
  },

  advanceToNextTimer(): void {
    jest.runOnlyPendingTimers();
  },

  advanceAllTimers(): void {
    jest.runAllTimers();
  },

  clear(): void {
    jest.clearAllTimers();
  },

  reset(): void {
    jest.resetModules();
  },
};

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  jest.clearAllMocks();
}

/**
 * Restore all mocks
 */
export function restoreAllMocks(): void {
  jest.restoreAllMocks();
}

/**
 * Create a mock with lifecycle management
 */
export class ManagedMock<T extends (...args: unknown[]) => unknown> {
  private readonly mock: MockFunction<T>;

  constructor(options?: MockSetupOptions) {
    this.mock = createMock<T>(options);
  }

  get fn(): MockFunction<T> {
    return this.mock;
  }

  getCalls(): Array<{ args: Parameters<T>; result?: ReturnType<T>; error?: Error }> {
    return this.mock.mock.calls.map((args, index) => ({
      args: args as Parameters<T>,
      result: this.mock.mock.results[index]?.value as ReturnType<T>,
      error: this.mock.mock.results[index]?.value as Error,
    }));
  }

  getLastCall(): { args: Parameters<T>; result?: ReturnType<T> } | null {
    const calls = this.getCalls();
    if (calls.length === 0) {
      return null;
    }
    const lastCall = calls[calls.length - 1];
    if (!lastCall) {
      return null;
    }
    // Remove error property if present
    const { error: _error, ...callWithoutError } = lastCall;
    return callWithoutError;
  }

  getCallCount(): number {
    return this.mock.mock.calls.length;
  }

  wasCalledWith(...args: Parameters<T>): boolean {
    return this.mock.mock.calls.some(
      (callArguments) => JSON.stringify(callArguments) === JSON.stringify(args)
      (callArguments) => JSON.stringify(callArguments) === JSON.stringify(args)
    );
  }

  clear(): void {
    this.mock.mockClear();
  }

  reset(): void {
    this.mock.mockReset();
  }

  restore(): void {
    this.mock.mockRestore();
  }
}

type MockShape = Record<string, (...args: unknown[]) => unknown>;

type MockDefinition<T extends MockShape> = {
  [K in keyof T]: T[K] | MockSetupOptions;
};

/**
 * Typed helper to declare a map of mocks without repeating string keys.
 * Each entry can be a concrete implementation (wrapped with jest.fn) or a MockSetupOptions object.
 */
export function defineMocks<T extends MockShape>(
  definitions: MockDefinition<T>
): { [K in keyof T]: MockFunction<T[K]> } {
  const mocks = {} as { [K in keyof T]: MockFunction<T[K]> };

  for (const key in definitions) {
    if (!Object.prototype.hasOwnProperty.call(definitions, key)) {
      continue;
    }

    const definition = definitions[key];
    const mockOptions: MockSetupOptions | undefined =
      typeof definition === 'function'
        ? { implementation: definition as (...args: unknown[]) => unknown }
        ? { implementation: definition as (...args: unknown[]) => unknown }
        : (definition as MockSetupOptions);

    mocks[key] = createMock(mockOptions) as MockFunction<T[typeof key]>;
  }

  return mocks;
}
