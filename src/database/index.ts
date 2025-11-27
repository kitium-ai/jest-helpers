/**
 * Database helpers for integration testing
 */

export type DatabaseConnection = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, parameters?: unknown[]): Promise<unknown>;
  execute(sql: string, parameters?: unknown[]): Promise<void>;
  transaction<T>(function_: (conn: DatabaseConnection) => Promise<T>): Promise<T>;
  seed(data: Record<string, unknown[]>): Promise<void>;
  clear(tables?: string[]): Promise<void>;
};

export type DatabaseConfig = {
  url: string;
  poolSize?: number;
  timeout?: number;
  ssl?: boolean;
};

/**
 * Database client wrapper for testing
 */
export class TestDatabase implements DatabaseConnection {
  private connected = false;
  private seedData: Record<string, unknown[]> = {};

  constructor(private readonly config: DatabaseConfig) {}

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    // Validate connection URL
    if (!this.config.url) {
      throw new Error('Database URL is required');
    }

    // In real implementation, would establish actual connection
    this.connected = true;
    await Promise.resolve();
  }

  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }
    this.connected = false;
    await Promise.resolve();
  }

  async query(_sql: string, _parameters?: unknown[]): Promise<unknown> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // In real implementation, would execute query
    await Promise.resolve();
    return {
      rows: [],
      rowCount: 0,
    };
  }

  async execute(_sql: string, _parameters?: unknown[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    // In real implementation, would execute statement
    await Promise.resolve();
  }

  async transaction<T>(function_: (conn: DatabaseConnection) => Promise<T>): Promise<T> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    return await function_(this);
  }

  async seed(data: Record<string, unknown[]>): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    this.seedData = data;

    for (const [, records] of Object.entries(data)) {
      for (const _ of records) {
        // In real implementation, would insert records
      }
    }
    await Promise.resolve();
  }

  async clear(tables?: string[]): Promise<void> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }

    const tablesToClear = tables ?? Object.keys(this.seedData);

    for (const _ of tablesToClear) {
      // In real implementation, would clear table
    }
    await Promise.resolve();
  }

  getConnectionStatus(): { connected: boolean; url: string } {
    return {
      connected: this.connected,
      url: this.config.url,
    };
  }
}

/**
 * Create a test database instance
 */
export function createTestDatabase(config: DatabaseConfig): TestDatabase {
  return new TestDatabase(config);
}

/**
 * Database fixture for test setup/teardown
 */
export function createDatabaseFixture(config: DatabaseConfig): {
  setup: () => Promise<TestDatabase>;
  teardown: () => Promise<void>;
} {
  const database = createTestDatabase(config);

  return {
    async setup() {
      await database.connect();
      return database;
    },
    async teardown() {
      await database.disconnect();
    },
  };
}

/**
 * Data builder for fluent database seeding
 */
export class DatabaseDataBuilder {
  private readonly tables: Map<string, unknown[]> = new Map();

  add(tableName: string, records: unknown[]): this {
    this.tables.set(tableName, records);
    return this;
  }

  addSingle(tableName: string, record: unknown): this {
    const records = this.tables.get(tableName) ?? [];
    records.push(record);
    this.tables.set(tableName, records);
    return this;
  }

  async seedInto(database: DatabaseConnection): Promise<void> {
    const data = Object.fromEntries(this.tables);
    await database.seed(data);
  }

  getData(): Record<string, unknown[]> {
    return Object.fromEntries(this.tables);
  }

  clear(): this {
    this.tables.clear();
    return this;
  }
}

/**
 * Create a data builder instance
 */
export function createDataBuilder(): DatabaseDataBuilder {
  return new DatabaseDataBuilder();
}

/**
 * Reset database and seed with fresh data
 */
export async function resetDatabaseWithSeed(
  database: DatabaseConnection,
  seedData: Record<string, unknown[]>
): Promise<void> {
  await database.clear();
  await database.seed(seedData);
}

/**
 * Verify data in database
 */
export async function verifyDatabaseData(
  database: DatabaseConnection,
  table: string,
  expectedData: unknown[]
): Promise<boolean> {
  const result = await database.query(`SELECT * FROM ${table}`);
  const rows = (result as { rows: unknown[] }).rows ?? [];
  return JSON.stringify(rows) === JSON.stringify(expectedData);
}
