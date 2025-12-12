/**
 * Property-based testing utilities inspired by QuickCheck and Hypothesis
 * Generates test data automatically to find edge cases
 */

export type Generator<T> = {
  generate(): T;
  shrink(value: T): T[];
  description: string;
};

export type PropertyTestOptions = {
  iterations?: number;
  seed?: number;
  maxShrinkSteps?: number;
  onFailure?: (input: unknown, error: Error) => void;
};

export type PropertyResult = {
  passed: boolean;
  iterations: number;
  failedInputs?: Array<{ input: unknown; error: Error }>;
  shrunkInput?: unknown;
  shrunkError?: Error;
};

/**
 * Base generator class
 */
export abstract class BaseGenerator<T> implements Generator<T> {
  abstract generate(): T;
  abstract shrink(value: T): T[];
  abstract readonly description: string;

  /**
   * Map generator output
   */
  map<U>(fn: (value: T) => U): Generator<U> {
    return new MappedGenerator(this, fn);
  }

  /**
   * Filter generator output
   */
  filter(predicate: (value: T) => boolean): Generator<T> {
    return new FilteredGenerator(this, predicate);
  }

  /**
   * Chain generators
   */
  flatMap<U>(fn: (value: T) => Generator<U>): Generator<U> {
    return new FlatMappedGenerator(this, fn);
  }
}

/**
 * Mapped generator
 */
class MappedGenerator<T, U> extends BaseGenerator<U> {
  constructor(private source: Generator<T>, private mapper: (value: T) => U) {
    super();
  }

  generate(): U {
    return this.mapper(this.source.generate());
  }

  shrink(): U[] {
    // For mapped generators, we can't easily shrink back
    // This is a simplified implementation
    return [];
  }

  get description(): string {
    return `mapped(${this.source.description})`;
  }
}

/**
 * Filtered generator
 */
class FilteredGenerator<T> extends BaseGenerator<T> {
  constructor(private source: Generator<T>, private predicate: (value: T) => boolean) {
    super();
  }

  generate(): T {
    let value: T;
    let attempts = 0;
    do {
      value = this.source.generate();
      attempts++;
      if (attempts > 1000) {
        throw new Error(`Failed to generate value satisfying predicate after 1000 attempts`);
      }
    } while (!this.predicate(value));
    return value;
  }

  shrink(value: T): T[] {
    return this.source.shrink(value).filter(this.predicate);
  }

  get description(): string {
    return `filtered(${this.source.description})`;
  }
}

/**
 * Flat mapped generator
 */
class FlatMappedGenerator<T, U> extends BaseGenerator<U> {
  constructor(private source: Generator<T>, private mapper: (value: T) => Generator<U>) {
    super();
  }

  generate(): U {
    const intermediate = this.source.generate();
    const generator = this.mapper(intermediate);
    return generator.generate();
  }

  shrink(): U[] {
    // Simplified shrinking for flatMap
    return [];
  }

  get description(): string {
    return `flatMapped(${this.source.description})`;
  }
}

/**
 * Integer generator
 */
export class IntegerGenerator extends BaseGenerator<number> {
  constructor(private min = -1000, private max = 1000) {
    super();
  }

  generate(): number {
    return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
  }

  shrink(value: number): number[] {
    if (value === 0) return [];
    const candidates = [0];
    if (Math.abs(value) > 1) {
      candidates.push(value > 0 ? Math.floor(value / 2) : Math.ceil(value / 2));
    }
    return candidates;
  }

  get description(): string {
    return `integer(${this.min}, ${this.max})`;
  }
}

/**
 * Positive integer generator
 */
export class PositiveIntegerGenerator extends IntegerGenerator {
  private maxValue: number;

  constructor(max = 1000) {
    super(1, max);
    this.maxValue = max;
  }

  override get description(): string {
    return `positiveInteger(${this.maxValue})`;
  }
}

/**
 * String generator
 */
export class StringGenerator extends BaseGenerator<string> {
  constructor(private minLength = 0, private maxLength = 100) {
    super();
  }

  generate(): string {
    const length = Math.floor(Math.random() * (this.maxLength - this.minLength + 1)) + this.minLength;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  shrink(value: string): string[] {
    if (value.length === 0) return [];
    const candidates = [''];
    if (value.length > 1) {
      candidates.push(value.substring(0, Math.floor(value.length / 2)));
    }
    return candidates;
  }

  get description(): string {
    return `string(${this.minLength}, ${this.maxLength})`;
  }
}

/**
 * Email generator
 */
export class EmailGenerator extends BaseGenerator<string> {
  generate(): string {
    const localPart = new StringGenerator(1, 10).generate().toLowerCase();
    const domain = new StringGenerator(3, 10).generate().toLowerCase();
    const tld = ['com', 'org', 'net', 'edu'][Math.floor(Math.random() * 4)];
    return `${localPart}@${domain}.${tld}`;
  }

  shrink(value: string): string[] {
    const atIndex = value.indexOf('@');
    if (atIndex === -1) return [];
    return [`a@${value.substring(atIndex + 1)}`];
  }

  get description(): string {
    return 'email';
  }
}

/**
 * URL generator
 */
export class UrlGenerator extends BaseGenerator<string> {
  generate(): string {
    const protocol = Math.random() > 0.5 ? 'https' : 'http';
    const domain = new StringGenerator(3, 10).generate().toLowerCase();
    const tld = ['com', 'org', 'net', 'edu'][Math.floor(Math.random() * 4)];
    const path = Math.random() > 0.5 ? `/${new StringGenerator(1, 20).generate()}` : '';
    return `${protocol}://${domain}.${tld}${path}`;
  }

  shrink(): string[] {
    return ['http://example.com'];
  }

  get description(): string {
    return 'url';
  }
}

/**
 * Array generator
 */
export class ArrayGenerator<T> extends BaseGenerator<T[]> {
  constructor(private elementGenerator: Generator<T>, private minLength = 0, private maxLength = 10) {
    super();
  }

  generate(): T[] {
    const length = Math.floor(Math.random() * (this.maxLength - this.minLength + 1)) + this.minLength;
    const result: T[] = [];
    for (let i = 0; i < length; i++) {
      result.push(this.elementGenerator.generate());
    }
    return result;
  }

  shrink(value: T[]): T[][] {
    if (value.length === 0) return [];
    return [value.slice(0, Math.floor(value.length / 2))];
  }

  get description(): string {
    return `array(${this.elementGenerator.description}, ${this.minLength}, ${this.maxLength})`;
  }
}

/**
 * Object generator
 */
export class ObjectGenerator<T extends Record<string, unknown>> extends BaseGenerator<T> {
  constructor(private schema: { [K in keyof T]: Generator<T[K]> }) {
    super();
  }

  generate(): T {
    const result = {} as T;
    for (const key in this.schema) {
      result[key] = this.schema[key].generate();
    }
    return result;
  }

  shrink(): T[] {
    // Simplified shrinking for objects
    return [];
  }

  get description(): string {
    const fields = Object.keys(this.schema).map(key => {
      const gen = this.schema[key];
      return `${key}: ${gen?.description || 'unknown'}`;
    });
    return `object({${fields.join(', ')}})`;
  }
}

/**
 * Boolean generator
 */
export class BooleanGenerator extends BaseGenerator<boolean> {
  generate(): boolean {
    return Math.random() > 0.5;
  }

  shrink(value: boolean): boolean[] {
    return value ? [false] : [];
  }

  get description(): string {
    return 'boolean';
  }
}

/**
 * One of generator (picks randomly from a list)
 */
export class OneOfGenerator<T> extends BaseGenerator<T> {
  constructor(private options: T[]) {
    super();
  }

  generate(): T {
    const option = this.options[Math.floor(Math.random() * this.options.length)];
    if (option === undefined) {
      throw new Error('OneOfGenerator has no options');
    }
    return option;
  }

  shrink(): T[] {
    const option = this.options[Math.floor(Math.random() * this.options.length)];
    return option !== undefined ? [option] : [];
  }

  get description(): string {
    return `oneOf(${this.options.map(o => JSON.stringify(o)).join(', ')})`;
  }
}

/**
 * Property-based testing runner
 */
export class PropertyTester {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
    Math.random = this.seededRandom(this.seed);
  }

  private seededRandom(seed: number): () => number {
    let x = Math.sin(seed) * 10000;
    return () => {
      x = Math.sin(x) * 10000;
      return x - Math.floor(x);
    };
  }

  /**
   * Run a property test
   */
  async forAll<T>(
    generator: Generator<T>,
    property: (value: T) => boolean | Promise<boolean>,
    options: PropertyTestOptions = {}
  ): Promise<PropertyResult> {
    const {
      iterations = 100,
      maxShrinkSteps = 10,
      onFailure,
    } = options;

    const failures: Array<{ input: T; error: Error }> = [];

    for (let i = 0; i < iterations; i++) {
      const input = generator.generate();

      try {
        const result = await property(input);
        if (!result) {
          const error = new Error(`Property failed for input: ${JSON.stringify(input)}`);
          failures.push({ input, error });
          onFailure?.(input, error);
          // Try to shrink the input (async operation, ignore result for now)
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.shrinkInput(input, generator, property, maxShrinkSteps);

          return {
            passed: false,
            iterations: i + 1,
            failedInputs: failures,
          };
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failures.push({ input, error: err });
        onFailure?.(input, err);

        // Try to shrink the input (async operation, ignore result for now)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.shrinkInput(input, generator, property, maxShrinkSteps);

        return {
          passed: false,
          iterations: i + 1,
          failedInputs: failures,
        };
      }
    }

    return {
      passed: true,
      iterations,
    };
  }

  private async shrinkInput<T>(
    input: T,
    generator: Generator<T>,
    property: (value: T) => boolean | Promise<boolean>,
    maxSteps: number
  ): Promise<{ input: T; error: Error } | null> {
    let currentInput = input;
    let currentError: Error | null = null;

    for (let step = 0; step < maxSteps; step++) {
      const candidates = generator.shrink(currentInput);
      let foundBetter = false;

      for (const candidate of candidates) {
        try {
          const result = await property(candidate);
          if (!result) {
            const error = new Error(`Property failed for shrunk input: ${JSON.stringify(candidate)}`);
            currentInput = candidate;
            currentError = error;
            foundBetter = true;
            break;
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          currentInput = candidate;
          currentError = err;
          foundBetter = true;
          break;
        }
      }
      if (!foundBetter) {
        break;
      }
    }

    if (currentError) {
      return { input: currentInput, error: currentError };
    }
    return null;
  }
}

/**
 * Pre-built generators
 */
export const generators = {
  integer: (min = -1000, max = 1000) => new IntegerGenerator(min, max),
  positiveInteger: (max = 1000) => new PositiveIntegerGenerator(max),
  string: (minLength = 0, maxLength = 100) => new StringGenerator(minLength, maxLength),
  email: () => new EmailGenerator(),
  url: () => new UrlGenerator(),
  boolean: () => new BooleanGenerator(),
  array: <T>(elementGen: Generator<T>, minLength = 0, maxLength = 10) =>
    new ArrayGenerator(elementGen, minLength, maxLength),
  object: <T extends Record<string, unknown>>(schema: { [K in keyof T]: Generator<T[K]> }) =>
    new ObjectGenerator(schema),
  oneOf: <T>(options: T[]) => new OneOfGenerator(options),
};

/**
 * Jest integration for property-based testing
 */
export function propertyTest<T>(
  description: string,
  generator: Generator<T>,
  property: (value: T) => boolean | Promise<boolean>,
  options: PropertyTestOptions = {}
): void {
  it(description, async () => {
    const tester = new PropertyTester(options.seed);
    const result = await tester.forAll(generator, property, options);

    if (!result.passed) {
      const failure = result.failedInputs?.[0];
      const shrunkMessage = result.shrunkInput
        ? `\nShrunk to: ${JSON.stringify(result.shrunkInput)}`
        : '';

      throw new Error(
        `Property test failed after ${result.iterations} iterations.\n` +
        `Original failure: ${failure?.error.message}${shrunkMessage}`
      );
    }
  });
}