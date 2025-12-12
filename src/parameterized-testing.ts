/**
 * Parameterized testing utilities
 * Run the same test with different data sets
 */

export type TestParameter<T> = {
  name: string;
  value: T;
  expected?: unknown;
  description?: string;
};

export type ParameterizedTestOptions = {
  namePattern?: string;
  skip?: (params: TestParameter<any>[]) => boolean;
  only?: (params: TestParameter<any>[]) => boolean;
};

export type DataSource<T> = T[] | (() => T[]) | (() => Promise<T[]>);

/**
 * Parameterized test runner
 */
export class ParameterizedTestRunner {
  /**
   * Run parameterized test with single parameter
   */
  static test<T>(
    description: string,
    dataSource: DataSource<TestParameter<T>>,
    testFn: (param: T, expected?: unknown) => void | Promise<void>,
    options: ParameterizedTestOptions = {}
  ): void {
    const { namePattern = '{name}: {description}' } = options;

    this.runParameterizedTest(
      description,
      dataSource,
      (params) => {
        const param = params[0];
        if (param) {
          it(this.formatTestName(namePattern, param), async () => testFn(param.value, param.expected));
        }
      },
      options
    );
  }

  /**
   * Run parameterized test with multiple parameters
   */
  static testWithMultipleParams<T extends unknown[]>(
    description: string,
    dataSource: DataSource<TestParameter<T[number]>>,
    testFn: (...params: T) => void | Promise<void>,
    options: ParameterizedTestOptions = {}
  ): void {
    const { namePattern = '{name}: {description}' } = options;

    this.runParameterizedTest(
      description,
      dataSource,
      (params) => {
        const values = params.map(p => p.value) as T;
        const testName = params.map(p => this.formatTestName(namePattern, p)).join(' | ');
        it(testName, async () => testFn(...values));
      },
      options
    );
  }

  /**
   * Run parameterized test with cartesian product of parameters
   */
  static testCartesian<T1, T2>(
    description: string,
    dataSource1: DataSource<TestParameter<T1>>,
    dataSource2: DataSource<TestParameter<T2>>,
    testFn: (param1: T1, param2: T2) => void | Promise<void>,
    options: ParameterizedTestOptions = {}
  ): void {
    const { namePattern = '{name}: {description}' } = options;

    describe(description, () => {
      const params1 = this.resolveDataSource(dataSource1);
      const params2 = this.resolveDataSource(dataSource2);

      params1.forEach(param1 => {
        params2.forEach(param2 => {
          const testName = `${this.formatTestName(namePattern, param1)} | ${this.formatTestName(namePattern, param2)}`;
          it(testName, async () => testFn(param1.value, param2.value));
        });
      });
    });
  }

  /**
   * Create CSV-driven parameterized test
   */
  static testFromCSV<T>(
    description: string,
    csvContent: string,
    rowMapper: (row: Record<string, string>) => TestParameter<T>,
    testFn: (param: T) => void | Promise<void>,
    options: ParameterizedTestOptions = {}
  ): void {
    const dataSource = this.parseCSV(csvContent).map(rowMapper);
    this.test(description, dataSource, testFn, options);
  }

  /**
   * Create JSON-driven parameterized test
   */
  static testFromJSON<T>(
    description: string,
    jsonContent: string,
    testFn: (param: T) => void | Promise<void>,
    options: ParameterizedTestOptions = {}
  ): void {
    const dataSource: TestParameter<T>[] = JSON.parse(jsonContent);
    this.test(description, dataSource, testFn, options);
  }

  private static async runParameterizedTest(
    description: string,
    dataSource: DataSource<TestParameter<any>>,
    testRunner: (params: TestParameter<any>[]) => void,
    options: ParameterizedTestOptions
  ): Promise<void> {
    describe(description, () => {
      const params = this.resolveDataSourceSync(dataSource);

      if (options.skip && options.skip(params)) {
        describe.skip('', () => {});
        return;
      }

      if (options.only && options.only(params)) {
        describe.only('', () => {});
        return;
      }

      testRunner(params);
    });
  }

  private static resolveDataSource<T>(dataSource: DataSource<T>): T[] {
    if (typeof dataSource === 'function') {
      const result = dataSource();
      if (Array.isArray(result)) {
        return result;
      }
      return result as unknown as T[];
    }
    return dataSource;
  }

  private static resolveDataSourceSync<T>(dataSource: DataSource<T>): T[] {
    return this.resolveDataSource(dataSource);
  }

  private static formatTestName(pattern: string, param: TestParameter<any>): string {
    return pattern
      .replace('{name}', param.name)
      .replace('{description}', param.description || param.name)
      .replace('{value}', String(param.value));
  }

  private static parseCSV(csvContent: string): Record<string, string>[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    if (!headerLine) return [];
    
    const headers = headerLine.split(',').map(h => h.trim());
    const rows = lines.slice(1);

    return rows.map(row => {
      const values = row.split(',').map(v => v.trim());
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      return record;
    });
  }
}

/**
 * Data providers for common test scenarios
 */
export class DataProviders {
  /**
   * Numbers data provider
   */
  static numbers(): TestParameter<number>[] {
    return [
      { name: 'zero', value: 0 },
      { name: 'positive', value: 42 },
      { name: 'negative', value: -17 },
      { name: 'large', value: 1000000 },
      { name: 'decimal', value: 3.14 },
    ];
  }

  /**
   * Strings data provider
   */
  static strings(): TestParameter<string>[] {
    return [
      { name: 'empty', value: '' },
      { name: 'simple', value: 'hello' },
      { name: 'with_spaces', value: 'hello world' },
      { name: 'special_chars', value: 'hello@world.com' },
      { name: 'unicode', value: 'héllo wörld' },
      { name: 'long', value: 'a'.repeat(1000) },
    ];
  }

  /**
   * Arrays data provider
   */
  static arrays(): TestParameter<unknown[]>[] {
    return [
      { name: 'empty', value: [] },
      { name: 'single_item', value: [1] },
      { name: 'multiple_items', value: [1, 2, 3] },
      { name: 'mixed_types', value: [1, 'hello', true, null] },
      { name: 'nested', value: [[1, 2], [3, 4]] },
    ];
  }

  /**
   * Objects data provider
   */
  static objects(): TestParameter<Record<string, unknown>>[] {
    return [
      { name: 'empty', value: {} },
      { name: 'simple', value: { name: 'John', age: 30 } },
      { name: 'nested', value: { user: { name: 'John', age: 30 }, active: true } },
      { name: 'with_arrays', value: { items: [1, 2, 3], tags: ['a', 'b'] } },
      { name: 'with_null', value: { name: null, age: undefined } },
    ];
  }

  /**
   * Boolean data provider
   */
  static booleans(): TestParameter<boolean>[] {
    return [
      { name: 'true', value: true },
      { name: 'false', value: false },
    ];
  }

  /**
   * HTTP status codes data provider
   */
  static httpStatusCodes(): TestParameter<number>[] {
    return [
      { name: 'ok', value: 200 },
      { name: 'created', value: 201 },
      { name: 'bad_request', value: 400 },
      { name: 'unauthorized', value: 401 },
      { name: 'forbidden', value: 403 },
      { name: 'not_found', value: 404 },
      { name: 'internal_error', value: 500 },
    ];
  }

  /**
   * Email validation data provider
   */
  static emailValidation(): TestParameter<{ email: string; valid: boolean }>[] {
    return [
      { name: 'valid_simple', value: { email: 'user@example.com', valid: true } },
      { name: 'valid_complex', value: { email: 'user.name+tag@example.co.uk', valid: true } },
      { name: 'invalid_no_at', value: { email: 'userexample.com', valid: false } },
      { name: 'invalid_no_domain', value: { email: 'user@', valid: false } },
      { name: 'invalid_spaces', value: { email: 'user @ example.com', valid: false } },
      { name: 'empty', value: { email: '', valid: false } },
    ];
  }

  /**
   * Date validation data provider
   */
  static dates(): TestParameter<Date>[] {
    return [
      { name: 'now', value: new Date() },
      { name: 'past', value: new Date('2020-01-01') },
      { name: 'future', value: new Date('2030-01-01') },
      { name: 'epoch', value: new Date(0) },
      { name: 'invalid', value: new Date('invalid') },
    ];
  }
}

/**
 * Combinatorial testing utilities
 */
export class CombinatorialTester {
  /**
   * Generate all combinations of parameters
   */
  static combinations<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) {
      const first = arrays[0];
      return first ? first.map(item => [item]) : [];
    }

    const [first, ...rest] = arrays;
    if (!first) return [];
    
    const restCombinations = this.combinations(rest);

    return first.flatMap(item =>
      restCombinations.map(combination => [item, ...combination])
    );
  }

  /**
   * Generate pairwise combinations (reduced combinatorial testing)
   */
  static pairwise<T>(arrays: T[][]): T[][] {
    // Simplified pairwise implementation
    // In a real implementation, use a proper pairwise algorithm
    const combinations: T[][] = [];

    const first = arrays[0];
    const second = arrays[1];
    
    if (!first || !second) return [];

    for (let i = 0; i < first.length; i++) {
      for (let j = 0; j < second.length; j++) {
        const firstItem = first[i];
        const secondItem = second[j];
        if (firstItem !== undefined && secondItem !== undefined) {
          combinations.push([firstItem, secondItem]);
        }
      }
    }

    return combinations;
  }
}

/**
 * Jest integration for parameterized testing
 */
export function parameterizedTest<T>(
  description: string,
  dataSource: DataSource<TestParameter<T>>,
  testFn: (param: T, expected?: unknown) => void | Promise<void>,
  options?: ParameterizedTestOptions
): void {
  ParameterizedTestRunner.test(description, dataSource, testFn, options);
}

export function parameterizedTestCSV<T>(
  description: string,
  csvContent: string,
  rowMapper: (row: Record<string, string>) => TestParameter<T>,
  testFn: (param: T) => void | Promise<void>,
  options?: ParameterizedTestOptions
): void {
  ParameterizedTestRunner.testFromCSV(description, csvContent, rowMapper, testFn, options);
}

/**
 * Setup parameterized testing
 */
export function setupParameterizedTesting(): void {
  // Add global test functions
  (global as any).parameterizedTest = parameterizedTest;
  (global as any).parameterizedTestCSV = parameterizedTestCSV;
}