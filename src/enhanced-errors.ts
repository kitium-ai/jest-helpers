/**
 * Enhanced error messages and debugging utilities
 * Provides detailed diffs, context, and better error reporting
 */

import { diff as jestDiff } from 'jest-diff';

export type ErrorContext = {
  testName?: string;
  testFile?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
};

export type DiffOptions = {
  contextLines?: number;
  expand?: boolean;
  includeChangeCounts?: boolean;
};

export type AssertionErrorDetails = {
  actual: unknown;
  expected: unknown;
  message: string;
  diff?: string;
  context?: ErrorContext;
  suggestions?: string[];
};

/**
 * Enhanced assertion error class
 */
export class EnhancedAssertionError extends Error {
  public readonly details: AssertionErrorDetails;

  constructor(details: AssertionErrorDetails) {
    super(details.message);
    this.name = 'EnhancedAssertionError';
    this.details = details;
  }

  /**
   * Get formatted error message with diff
   */
  getFormattedMessage(): string {
    let message = this.details.message;

    if (this.details.diff) {
      message += '\n\n' + this.details.diff;
    }

    if (this.details.suggestions && this.details.suggestions.length > 0) {
      message += '\n\nSuggestions:';
      this.details.suggestions.forEach(suggestion => {
        message += `\n  • ${suggestion}`;
      });
    }

    if (this.details.context) {
      message += '\n\nContext:';
      if (this.details.context.testName) {
        message += `\n  Test: ${this.details.context.testName}`;
      }
      if (this.details.context.testFile) {
        message += `\n  File: ${this.details.context.testFile}`;
      }
      if (this.details.context.timestamp) {
        message += `\n  Time: ${this.details.context.timestamp.toISOString()}`;
      }
    }

    return message;
  }
}

/**
 * Diff utilities
 */
export class DiffUtils {
  /**
   * Create a diff between two values
   */
  static createDiff(actual: unknown, expected: unknown, options: DiffOptions = {}): string | null {
    const {
      contextLines = 3,
      expand = false,
      includeChangeCounts = true,
    } = options;

    return jestDiff(expected, actual, {
      contextLines,
      expand,
      includeChangeCounts,
      aAnnotation: 'Expected',
      bAnnotation: 'Actual',
    });
  }

  /**
   * Create a diff for objects with better formatting
   */
  static createObjectDiff(actual: unknown, expected: unknown, options: DiffOptions = {}): string | null {
    if (typeof actual === 'object' && typeof expected === 'object') {
      return this.createDiff(actual, expected, options);
    }
    return null;
  }

  /**
   * Create a diff for arrays
   */
  static createArrayDiff(actual: unknown[], expected: unknown[], options: DiffOptions = {}): string | null {
    if (Array.isArray(actual) && Array.isArray(expected)) {
      return this.createDiff(actual, expected, options);
    }
    return null;
  }

  /**
   * Create a diff for strings with character-level highlighting
   */
  static createStringDiff(actual: string, expected: string): string | null {
    if (typeof actual === 'string' && typeof expected === 'string') {
      return this.createDiff(actual, expected);
    }
    return null;
  }
}

/**
 * Context-aware error builder
 */
export class ErrorBuilder {
  private details: Partial<AssertionErrorDetails> = {};
  private context: ErrorContext = {};

  /**
   * Set the actual value
   */
  actual(value: unknown): this {
    this.details.actual = value;
    return this;
  }

  /**
   * Set the expected value
   */
  expected(value: unknown): this {
    this.details.expected = value;
    return this;
  }

  /**
   * Set the error message
   */
  message(message: string): this {
    this.details.message = message;
    return this;
  }

  /**
   * Add context information
   */
  withContext(context: Partial<ErrorContext>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  /**
   * Add suggestions for fixing the error
   */
  withSuggestions(suggestions: string[]): this {
    this.details.suggestions = suggestions;
    return this;
  }

  /**
   * Generate diff automatically
   */
  withDiff(options: DiffOptions = {}): this {
    if (this.details.actual !== undefined && this.details.expected !== undefined) {
      const diff = DiffUtils.createDiff(this.details.actual, this.details.expected, options);
      if (diff !== null) {
        this.details.diff = diff;
      }
    }
    return this;
  }

  /**
   * Build the error
   */
  build(): EnhancedAssertionError {
    const details: AssertionErrorDetails = {
      actual: this.details.actual,
      expected: this.details.expected,
      message: this.details.message || 'Assertion failed',
      ...(this.details.diff !== undefined && { diff: this.details.diff }),
      ...(Object.keys(this.context).length > 0 && { context: this.context }),
      ...(this.details.suggestions && { suggestions: this.details.suggestions }),
    };

    return new EnhancedAssertionError(details);
  }

  /**
   * Throw the error
   */
  throw(): never {
    throw this.build();
  }
}

/**
 * Assertion helpers with enhanced error messages
 */
export class AssertionHelpers {
  private context: ErrorContext;

  constructor(context: ErrorContext = {}) {
    this.context = context;
  }

  /**
   * Assert equality with enhanced diff
   */
  equal<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      new ErrorBuilder()
        .actual(actual)
        .expected(expected)
        .message(message || `Expected ${expected} but got ${actual}`)
        .withContext(this.context)
        .withDiff()
        .withSuggestions([
          'Check if the values are of the same type',
          'Verify the comparison logic',
          'Consider using deep equality for objects',
        ])
        .throw();
    }
  }

  /**
   * Assert deep equality for objects and arrays
   */
  deepEqual<T>(actual: T, expected: T, message?: string): void {
    const actualStr = JSON.stringify(actual, null, 2);
    const expectedStr = JSON.stringify(expected, null, 2);

    if (actualStr !== expectedStr) {
      new ErrorBuilder()
        .actual(actual)
        .expected(expected)
        .message(message || 'Objects are not deeply equal')
        .withContext(this.context)
        .withDiff()
        .withSuggestions([
          'Check nested object properties',
          'Verify array lengths and contents',
          'Consider using partial matching for complex objects',
        ])
        .throw();
    }
  }

  /**
   * Assert truthiness
   */
  truthy(value: unknown, message?: string): void {
    if (!value) {
      new ErrorBuilder()
        .actual(value)
        .expected('truthy value')
        .message(message || `Expected truthy value but got ${value}`)
        .withContext(this.context)
        .withSuggestions([
          'Check if the value is null or undefined',
          'Verify boolean conversion',
          'Consider using specific type checks',
        ])
        .throw();
    }
  }

  /**
   * Assert array contains item
   */
  contains<T>(array: T[], item: T, message?: string): void {
    if (!Array.isArray(array)) {
      new ErrorBuilder()
        .actual(array)
        .expected('array')
        .message(message || 'Expected an array')
        .withContext(this.context)
        .throw();
    }

    if (!array.includes(item)) {
      new ErrorBuilder()
        .actual(array)
        .expected(item)
        .message(message || `Array does not contain ${item}`)
        .withContext(this.context)
        .withDiff()
        .withSuggestions([
          'Check array contents',
          'Verify the item type matches array elements',
          'Consider using find() for complex objects',
        ])
        .throw();
    }
  }

  /**
   * Assert string matches pattern
   */
  matches(string: string, pattern: RegExp, message?: string): void {
    if (typeof string !== 'string') {
      new ErrorBuilder()
        .actual(typeof string)
        .expected('string')
        .message(message || 'Expected a string')
        .withContext(this.context)
        .throw();
    }

    if (!pattern.test(string)) {
      new ErrorBuilder()
        .actual(string)
        .expected(pattern)
        .message(message || `String does not match pattern ${pattern}`)
        .withContext(this.context)
        .withSuggestions([
          'Check the regular expression pattern',
          'Verify string formatting',
          'Consider case sensitivity',
        ])
        .throw();
    }
  }

  /**
   * Assert object has property
   */
  hasProperty(object: Record<string, unknown>, property: string, message?: string): void {
    if (typeof object !== 'object' || object === null) {
      new ErrorBuilder()
        .actual(object)
        .expected('object')
        .message(message || 'Expected an object')
        .withContext(this.context)
        .throw();
    }

    if (!(property in object)) {
      new ErrorBuilder()
        .actual(Object.keys(object))
        .expected(property)
        .message(message || `Object does not have property "${property}"`)
        .withContext(this.context)
        .withSuggestions([
          'Check property name spelling',
          'Verify object structure',
          'Consider using optional chaining',
        ])
        .throw();
    }
  }

  /**
   * Assert number is within range
   */
  inRange(value: number, min: number, max: number, message?: string): void {
    if (typeof value !== 'number') {
      new ErrorBuilder()
        .actual(typeof value)
        .expected('number')
        .message(message || 'Expected a number')
        .withContext(this.context)
        .throw();
    }

    if (value < min || value > max) {
      new ErrorBuilder()
        .actual(value)
        .expected(`[${min}, ${max}]`)
        .message(message || `Value ${value} is not in range [${min}, ${max}]`)
        .withContext(this.context)
        .withSuggestions([
          'Check boundary conditions',
          'Verify calculation logic',
          'Consider inclusive vs exclusive ranges',
        ])
        .throw();
    }
  }
}

/**
 * Test context manager for automatic error context
 */
export class TestContextManager {
  private static currentContext: ErrorContext = {};

  /**
   * Set current test context
   */
  static setContext(context: ErrorContext): void {
    this.currentContext = context;
  }

  /**
   * Get current test context
   */
  static getContext(): ErrorContext {
    return this.currentContext;
  }

  /**
   * Create assertion helpers with current context
   */
  static createAssertions(): AssertionHelpers {
    return new AssertionHelpers(this.currentContext);
  }

  /**
   * Clear context
   */
  static clearContext(): void {
    this.currentContext = {};
  }
}

/**
 * Jest integration for enhanced assertions
 */
export function setupEnhancedAssertions(): void {
  // Override Jest's expect to use enhanced error messages
  const originalExpect = (globalThis as any).expect;

  if (originalExpect) {
    const enhancedExpect = (actual: unknown) => {
      const assertions = TestContextManager.createAssertions();

      return {
        ...originalExpect(actual),
        toEqual: (expected: unknown) => {
          try {
            assertions.equal(actual, expected);
          } catch (error) {
            if (error instanceof EnhancedAssertionError) {
              throw new Error(error.getFormattedMessage());
            }
            throw error;
          }
        },
        toBe: (expected: unknown) => {
          try {
            assertions.equal(actual, expected);
          } catch (error) {
            if (error instanceof EnhancedAssertionError) {
              throw new Error(error.getFormattedMessage());
            }
            throw error;
          }
        },
        toContain: (item: unknown) => {
          try {
            assertions.contains(actual as unknown[], item);
          } catch (error) {
            if (error instanceof EnhancedAssertionError) {
              throw new Error(error.getFormattedMessage());
            }
            throw error;
          }
        },
        toMatch: (pattern: RegExp) => {
          try {
            assertions.matches(actual as string, pattern);
          } catch (error) {
            if (error instanceof EnhancedAssertionError) {
              throw new Error(error.getFormattedMessage());
            }
            throw error;
          }
        },
      };
    };

    // Copy properties from original expect
    Object.setPrototypeOf(enhancedExpect, originalExpect);

    (globalThis as any).expect = enhancedExpect;
  }
}

/**
 * Setup test hooks for automatic context management
 */
export function setupTestContextHooks(): void {
  beforeEach(() => {
    const testState = (globalThis as any).expect?.getState?.();
    TestContextManager.setContext({
      testName: testState?.currentTestName,
      testFile: testState?.testPath,
      timestamp: new Date(),
    });
  });

  afterEach(() => {
    TestContextManager.clearContext();
  });
}