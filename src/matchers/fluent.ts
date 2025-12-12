/**
 * Fluent assertions API inspired by Google's Truth library
 * Provides chainable, readable assertions for enterprise testing
 */

export type AssertionResult = {
  pass: boolean;
  message: string;
  actual?: unknown;
  expected?: unknown;
};

export type AssertionChain<T> = {
  and: AssertionChain<T>;
  or: AssertionChain<T>;
  not: AssertionChain<T>;
  value: T;
  result: AssertionResult;
};

export type FluentMatcher<T> = {
  (actual: T): AssertionChain<T>;
  not: FluentMatcher<T>;
};

export type ChainableMatcher<T, R extends AssertionChain<T>> = {
  (actual: T): R;
  not: ChainableMatcher<T, R>;
};

/**
 * Base assertion chain class
 */
export class AssertionChainImpl<T> implements AssertionChain<T> {
  private _negated = false;
  private _results: AssertionResult[] = [];
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  get and(): this {
    return this;
  }

  get or(): this {
    // For now, 'or' behaves like 'and' - could be extended for complex logic
    return this;
  }

  get not(): this {
    this._negated = !this._negated;
    return this;
  }

  get result(): AssertionResult {
    const lastResult = this._results[this._results.length - 1];
    if (!lastResult) {
      return { pass: true, message: 'No assertions performed' };
    }

    return {
      ...lastResult,
      pass: this._negated ? !lastResult.pass : lastResult.pass,
      message: this._negated ? lastResult.message.replace('expected', 'expected not') : lastResult.message,
    };
  }

  protected addResult(result: AssertionResult): void {
    this._results.push(result);
  }

  protected assert(condition: boolean, message: string, actual?: unknown, expected?: unknown): this {
    this.addResult({
      pass: condition,
      message,
      actual,
      expected,
    });
    return this;
  }
}

/**
 * String assertion chain
 */
export class StringAssertionChain extends AssertionChainImpl<string> {
  toBeValidEmail(): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(this.value);
    return this.assert(
      isValid,
      `expected "${this.value}" to be a valid email address`,
      this.value,
      'valid email format'
    );
  }

  toBeValidUrl(): this {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    const isValid = urlRegex.test(this.value);
    return this.assert(
      isValid,
      `expected "${this.value}" to be a valid URL`,
      this.value,
      'valid URL format'
    );
  }

  toContain(substring: string): this {
    const contains = this.value.includes(substring);
    return this.assert(
      contains,
      `expected "${this.value}" to contain "${substring}"`,
      this.value,
      substring
    );
  }

  toStartWith(prefix: string): this {
    const startsWith = this.value.startsWith(prefix);
    return this.assert(
      startsWith,
      `expected "${this.value}" to start with "${prefix}"`,
      this.value,
      prefix
    );
  }

  toEndWith(suffix: string): this {
    const endsWith = this.value.endsWith(suffix);
    return this.assert(
      endsWith,
      `expected "${this.value}" to end with "${suffix}"`,
      this.value,
      suffix
    );
  }

  toHaveLength(length: number): this {
    const hasLength = this.value.length === length;
    return this.assert(
      hasLength,
      `expected "${this.value}" to have length ${length}, but got ${this.value.length}`,
      this.value.length,
      length
    );
  }

  toMatch(regex: RegExp): this {
    const matches = regex.test(this.value);
    return this.assert(
      matches,
      `expected "${this.value}" to match ${regex}`,
      this.value,
      regex
    );
  }
}

/**
 * Number assertion chain
 */
export class NumberAssertionChain extends AssertionChainImpl<number> {
  toBeGreaterThan(value: number): this {
    const isGreater = this.value > value;
    return this.assert(
      isGreater,
      `expected ${this.value} to be greater than ${value}`,
      this.value,
      value
    );
  }

  toBeGreaterThanOrEqual(value: number): this {
    const isGreaterOrEqual = this.value >= value;
    return this.assert(
      isGreaterOrEqual,
      `expected ${this.value} to be greater than or equal to ${value}`,
      this.value,
      value
    );
  }

  toBeLessThan(value: number): this {
    const isLess = this.value < value;
    return this.assert(
      isLess,
      `expected ${this.value} to be less than ${value}`,
      this.value,
      value
    );
  }

  toBeLessThanOrEqual(value: number): this {
    const isLessOrEqual = this.value <= value;
    return this.assert(
      isLessOrEqual,
      `expected ${this.value} to be less than or equal to ${value}`,
      this.value,
      value
    );
  }

  toBeWithinRange(min: number, max: number): this {
    const isWithinRange = this.value >= min && this.value <= max;
    return this.assert(
      isWithinRange,
      `expected ${this.value} to be within range [${min}, ${max}]`,
      this.value,
      [min, max]
    );
  }

  toBeCloseTo(value: number, precision = 2): this {
    const diff = Math.abs(this.value - value);
    const isClose = diff < Math.pow(10, -precision);
    return this.assert(
      isClose,
      `expected ${this.value} to be close to ${value} (within ${precision} decimal places)`,
      this.value,
      value
    );
  }
}

/**
 * Array assertion chain
 */
export class ArrayAssertionChain<T> extends AssertionChainImpl<T[]> {
  toHaveLength(length: number): this {
    const hasLength = this.value.length === length;
    return this.assert(
      hasLength,
      `expected array to have length ${length}, but got ${this.value.length}`,
      this.value.length,
      length
    );
  }

  toContain(item: T): this {
    const contains = this.value.includes(item);
    return this.assert(
      contains,
      `expected array to contain ${JSON.stringify(item)}`,
      this.value,
      item
    );
  }

  toContainObject(object: Partial<T>): this {
    const contains = this.value.some(item => {
      if (typeof item === 'object' && item !== null && typeof object === 'object') {
        return Object.keys(object).every(key =>
          (item as any)[key] === (object as any)[key]
        );
      }
      return false;
    });
    return this.assert(
      contains,
      `expected array to contain object matching ${JSON.stringify(object)}`,
      this.value,
      object
    );
  }

  each(predicate: (item: T) => boolean): this {
    const allMatch = this.value.every(predicate);
    return this.assert(
      allMatch,
      `expected all items in array to match predicate`,
      this.value,
      predicate
    );
  }

  some(predicate: (item: T) => boolean): this {
    const someMatch = this.value.some(predicate);
    return this.assert(
      someMatch,
      `expected at least one item in array to match predicate`,
      this.value,
      predicate
    );
  }
}

/**
 * Object assertion chain
 */
export class ObjectAssertionChain<T extends Record<string, unknown>> extends AssertionChainImpl<T> {
  toHaveProperty(property: keyof T): this {
    const hasProperty = property in this.value;
    return this.assert(
      hasProperty,
      `expected object to have property "${String(property)}"`,
      Object.keys(this.value),
      property
    );
  }

  toHavePropertyWithValue(property: keyof T, value: unknown): this {
    const hasProperty = property in this.value;
    const propertyValue = this.value[property];
    const matchesValue = hasProperty && propertyValue === value;
    return this.assert(
      matchesValue,
      `expected object.${String(property)} to be ${JSON.stringify(value)}, but got ${JSON.stringify(propertyValue)}`,
      propertyValue,
      value
    );
  }

  toMatchShape(shape: Partial<T>): this {
    const matches = Object.keys(shape).every(key => {
      const expectedValue = (shape as any)[key];
      const actualValue = (this.value as any)[key];

      if (typeof expectedValue === 'object' && expectedValue !== null) {
        return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      }
      return actualValue === expectedValue;
    });

    return this.assert(
      matches,
      `expected object to match shape ${JSON.stringify(shape)}`,
      this.value,
      shape
    );
  }
}

/**
 * Function assertion chain (for mocks)
 */
export class FunctionAssertionChain extends AssertionChainImpl<jest.Mock> {
  toHaveBeenCalled(): this {
    const called = this.value.mock.calls.length > 0;
    return this.assert(
      called,
      `expected mock function to have been called`,
      this.value.mock.calls.length,
      '> 0'
    );
  }

  toHaveBeenCalledTimes(times: number): this {
    const callCount = this.value.mock.calls.length;
    const calledTimes = callCount === times;
    return this.assert(
      calledTimes,
      `expected mock function to have been called ${times} times, but was called ${callCount} times`,
      callCount,
      times
    );
  }

  toHaveBeenCalledWith(...args: unknown[]): this {
    const calledWithArgs = this.value.mock.calls.some(call =>
      JSON.stringify(call) === JSON.stringify(args)
    );
    return this.assert(
      calledWithArgs,
      `expected mock function to have been called with ${JSON.stringify(args)}`,
      this.value.mock.calls,
      args
    );
  }

  toHaveBeenLastCalledWith(...args: unknown[]): this {
    const lastCall = this.value.mock.calls[this.value.mock.calls.length - 1];
    const calledWithArgs = lastCall && JSON.stringify(lastCall) === JSON.stringify(args);
    return this.assert(
      calledWithArgs,
      `expected mock function to have been last called with ${JSON.stringify(args)}`,
      lastCall,
      args
    );
  }
}

/**
 * Create fluent assertion functions
 */
/**
 * Fluent assertion API
 */
export const assertThat = {
  string: (actual: string): StringAssertionChain => new StringAssertionChain(actual),
  number: (actual: number): NumberAssertionChain => new NumberAssertionChain(actual),
  array: <T>(actual: T[]): ArrayAssertionChain<T> => new ArrayAssertionChain(actual),
  object: <T extends Record<string, unknown>>(actual: T): ObjectAssertionChain<T> => new ObjectAssertionChain(actual),
  mock: (actual: jest.Mock): FunctionAssertionChain => new FunctionAssertionChain(actual),
};

/**
 * Generic assertThat function with type inference
 */
export function assertThatValue<T>(actual: T): AssertionChain<T> {
  if (typeof actual === 'string') {
    return new StringAssertionChain(actual) as unknown as AssertionChain<T>;
  }
  if (typeof actual === 'number') {
    return new NumberAssertionChain(actual) as unknown as AssertionChain<T>;
  }
  if (Array.isArray(actual)) {
    return new ArrayAssertionChain(actual) as unknown as AssertionChain<T>;
  }
  if (typeof actual === 'object' && actual !== null) {
    return new ObjectAssertionChain(actual as Record<string, unknown>) as unknown as AssertionChain<T>;
  }
  if (typeof actual === 'function' && 'mock' in actual) {
    const mockInstance = actual as unknown as jest.Mock;
    return new FunctionAssertionChain(mockInstance) as unknown as AssertionChain<T>;
  }

  // Fallback to base assertion chain
  return new AssertionChainImpl(actual);
}

/**
 * Jest integration for fluent assertions
 */
export function setupFluentAssertions(): void {
  // Extend Jest expect with fluent assertions
  const originalExpect = (globalThis as any).expect;

  if (originalExpect) {
    (originalExpect as any).fluent = assertThat;
    (originalExpect as any).assertThat = assertThatValue;
  }
}