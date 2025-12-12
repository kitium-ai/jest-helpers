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
 * Argument captor for capturing and inspecting mock function arguments
 */
export class ArgumentCaptor<T = unknown> {
  private captured: T[] = [];

  /**
   * Capture an argument at the specified index
   */
  static forType<T>(): ArgumentCaptor<T> {
    return new ArgumentCaptor<T>();
  }

  /**
   * Get the first captured value
   */
  get first(): T | undefined {
    return this.captured[0];
  }

  /**
   * Get the last captured value
   */
  get last(): T | undefined {
    return this.captured[this.captured.length - 1];
  }

  /**
   * Get all captured values
   */
  get all(): T[] {
    return [...this.captured];
  }

  /**
   * Get captured value at index
   */
  get(index: number): T | undefined {
    return this.captured[index];
  }

  /**
   * Get the number of captured values
   */
  get size(): number {
    return this.captured.length;
  }

  /**
   * Clear captured values
   */
  clear(): void {
    this.captured = [];
  }

  /**
   * Internal method to capture a value
   */
  _capture(value: T): void {
    this.captured.push(value);
  }
}

/**
 * Verification modes for mock verification
 */
export interface VerificationMode {
  verify(actualCount: number): boolean;
  getDescription(): string;
}

export const VerificationMode = {
  times: (count: number) => new TimesVerificationMode(count),
  atLeast: (count: number) => new AtLeastVerificationMode(count),
  atMost: (count: number) => new AtMostVerificationMode(count),
  never: () => new NeverVerificationMode(),
  atLeastOnce: () => new AtLeastVerificationMode(1),
};

class TimesVerificationMode {
  constructor(private count: number) {}

  verify(actualCount: number): boolean {
    return actualCount === this.count;
  }

  getDescription(): string {
    return `exactly ${this.count} time${this.count === 1 ? '' : 's'}`;
  }
}

class AtLeastVerificationMode {
  constructor(private minCount: number) {}

  verify(actualCount: number): boolean {
    return actualCount >= this.minCount;
  }

  getDescription(): string {
    return `at least ${this.minCount} time${this.minCount === 1 ? '' : 's'}`;
  }
}

class AtMostVerificationMode {
  constructor(private maxCount: number) {}

  verify(actualCount: number): boolean {
    return actualCount <= this.maxCount;
  }

  getDescription(): string {
    return `at most ${this.maxCount} time${this.maxCount === 1 ? '' : 's'}`;
  }
}

class NeverVerificationMode {
  verify(actualCount: number): boolean {
    return actualCount === 0;
  }

  getDescription(): string {
    return 'never';
  }
}

/**
 * Enhanced mock function with advanced verification capabilities
 */
export class AdvancedMock<T extends (...args: unknown[]) => unknown> {
  private mock: MockFunction<T>;
  private argumentCaptors: ArgumentCaptor[] = [];

  constructor(options?: MockSetupOptions) {
    this.mock = createMock<T>(options);
  }

  /**
   * Get the underlying Jest mock
   */
  get fn(): MockFunction<T> {
    return this.mock;
  }

  /**
   * Verify the mock was called with specific arguments
   */
  verify(...args: Parameters<T>): this;
  verify(mode: VerificationMode, ...args: Parameters<T>): this;
  verify(modeOrArg?: VerificationMode | Parameters<T>[0], ...args: Parameters<T>): this {
    let mode: VerificationMode = VerificationMode.atLeastOnce();
    let expectedArgs: Parameters<T>;

    if (modeOrArg instanceof TimesVerificationMode ||
        modeOrArg instanceof AtLeastVerificationMode ||
        modeOrArg instanceof AtMostVerificationMode ||
        modeOrArg instanceof NeverVerificationMode) {
      mode = modeOrArg;
      expectedArgs = args as Parameters<T>;
    } else {
      expectedArgs = [modeOrArg, ...args] as Parameters<T>;
    }

    const matchingCalls = this.mock.mock.calls.filter(call =>
      this.argsMatch(call, expectedArgs)
    );

    if (!mode.verify(matchingCalls.length)) {
      throw new Error(
        `Expected mock to be called ${mode.getDescription()} with ${JSON.stringify(expectedArgs)}, ` +
        `but was called ${matchingCalls.length} time${matchingCalls.length === 1 ? '' : 's'}`
      );
    }

    return this;
  }

  /**
   * Capture arguments using argument captors
   */
  capture(captor: ArgumentCaptor, position = 0): this {
    this.argumentCaptors.push(captor);

    // Override the mock implementation to capture arguments
    const originalImplementation = this.mock.getMockImplementation();
    this.mock.mockImplementation((...args: Parameters<T>) => {
      if (args[position] !== undefined) {
        captor._capture(args[position]);
      }
      if (originalImplementation) {
        return originalImplementation(...args);
      }
      // Return undefined for async functions, or cast appropriately
      return undefined as ReturnType<T>;
    });

    return this;
  }

  /**
   * Verify no interactions occurred
   */
  verifyNoInteractions(): this {
    if (this.mock.mock.calls.length > 0) {
      throw new Error(
        `Expected no interactions with mock, but was called ${this.mock.mock.calls.length} time${this.mock.mock.calls.length === 1 ? '' : 's'}`
      );
    }
    return this;
  }

  /**
   * Verify order of calls (simplified version)
   */
  verifyOrder(expectedCalls: Array<{ args: Parameters<T> }>): this {
    if (this.mock.mock.calls.length !== expectedCalls.length) {
      throw new Error(
        `Expected ${expectedCalls.length} calls, but got ${this.mock.mock.calls.length}`
      );
    }

    for (let i = 0; i < expectedCalls.length; i++) {
      const actualCall = this.mock.mock.calls[i];
      const expectedCall = expectedCalls[i];
      if (!actualCall || !expectedCall) {
        throw new Error(`Call ${i} is missing`);
      }
      if (!this.argsMatch(actualCall, expectedCall.args)) {
        throw new Error(
          `Call ${i} did not match expected arguments. ` +
          `Expected: ${JSON.stringify(expectedCall.args)}, ` +
          `Actual: ${JSON.stringify(actualCall || [])}`
        );
      }
    }

    return this;
  }

  /**
   * Reset the mock
   */
  reset(): this {
    this.mock.mockReset();
    this.argumentCaptors.forEach(captor => captor.clear());
    return this;
  }

  /**
   * Clear call history
   */
  clear(): this {
    this.mock.mockClear();
    return this;
  }

  private argsMatch(actual: unknown[], expected: unknown[]): boolean {
    if (actual.length !== expected.length) {
      return false;
    }

    return actual.every((arg, index) => {
      const expectedArg = expected[index];

      // Handle argument captors
      if (expectedArg instanceof ArgumentCaptor) {
        expectedArg._capture(arg);
        return true;
      }

      // Deep equality check
      return JSON.stringify(arg) === JSON.stringify(expectedArg);
    });
  }
}

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
 * Create an advanced mock with verification capabilities
 */
export function createAdvancedMock<T extends (...args: unknown[]) => unknown>(
  options?: MockSetupOptions
): AdvancedMock<T> {
  return new AdvancedMock<T>(options);
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
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const mockObject = createMockObject(
          value as Record<string, unknown>,
          override as Partial<Record<string, MockSetupOptions>>
        );
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
  options?: MockSetupOptions
): MockFunction<T> {
  // Create a wrapper object to spy on
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
 * Create a spy with advanced verification
 */
export function createSpy<T extends (...args: unknown[]) => unknown>(
  function_: T,
  options?: MockSetupOptions
): AdvancedMock<T> {
  const spy = spyOnFunction(function_, options);
  const advancedMock = new AdvancedMock<T>();
  // Replace the mock function
  Object.setPrototypeOf(advancedMock, {
    fn: spy,
  });
  return advancedMock;
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
 * Mock behavior sequencer for defining different responses for consecutive calls
 */
export class MockSequencer<T extends (...args: unknown[]) => unknown> {
  private behaviors: Array<
    | {
        condition: (args: Parameters<T>) => boolean;
        response: ReturnType<T> | Error;
        delay?: number;
      }
    | {
        condition?: undefined;
        response: ReturnType<T> | Error;
        delay?: number;
      }
  > = [];
  private callCount = 0;

  /**
   * Add a behavior for specific call
   */
  thenReturn(value: ReturnType<T>, condition?: (args: Parameters<T>) => boolean): this {
    this.behaviors.push({ response: value, ...(condition && { condition }) });
    return this;
  }

  /**
   * Add a behavior that throws an error
   */
  thenThrow(error: Error, condition?: (args: Parameters<T>) => boolean): this {
    this.behaviors.push({ response: error, ...(condition && { condition }) });
    return this;
  }

  /**
   * Add a delayed response
   */
  thenReturnAfter(delay: number, value: ReturnType<T>): this {
    this.behaviors.push({ response: value, delay });
    return this;
  }

  /**
   * Get the next behavior
   */
  getNextBehavior(args: Parameters<T>): { response: ReturnType<T> | Error; delay?: number } {
    const behavior = this.behaviors[this.callCount % this.behaviors.length];

    if (behavior?.condition && !behavior.condition(args)) {
      // Find the first matching behavior
      const matchingBehavior = this.behaviors.find(b => !b.condition || b.condition(args));
      if (matchingBehavior) {
        return { response: matchingBehavior.response, ...(matchingBehavior.delay !== undefined && { delay: matchingBehavior.delay }) };
      }
    }

    this.callCount++;
    return behavior || { response: undefined as ReturnType<T> };
  }

  /**
   * Reset the sequencer
   */
  reset(): void {
    this.callCount = 0;
  }
}

/**
 * Create a mock with sequenced behavior
 */
export function createSequencedMock<T extends (...args: unknown[]) => unknown>(
  sequencer: MockSequencer<T>
): jest.Mock<ReturnType<T> | Promise<ReturnType<T>>, Parameters<T>> {
  return jest.fn((...args: Parameters<T>) => {
    const behavior = sequencer.getNextBehavior(args);

    if (behavior.delay) {
      return new Promise<ReturnType<T>>((resolve, reject) => {
        setTimeout(() => {
          if (behavior.response instanceof Error) {
            reject(behavior.response);
          } else {
            resolve(behavior.response as ReturnType<T>);
          }
        }, behavior.delay);
      });
    }

    if (behavior.response instanceof Error) {
      throw behavior.response;
    }

    return behavior.response as ReturnType<T>;
  });
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
        : (definition as MockSetupOptions);

    mocks[key] = createMock(mockOptions) as MockFunction<T[typeof key]>;
  }

  return mocks;
}
