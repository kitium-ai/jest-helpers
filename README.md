# @kitiumai/jest-helpers

**Jest wrapper that handles all complexity internally** - Simple API for enterprise testing.

## Philosophy

This package is a **wrapper** around Jest, not just a toolkit. It handles all Jest complexity internally, providing a simple API for downstream consumers. You shouldn't need to know about Jest hooks, setup functions, or internal details.

## Installation

```bash
npm install @kitiumai/jest-helpers
```

**Peer Dependencies:**

- `jest` ^29.0.0
- `typescript` ^5.0.0
- `@kitiumai/logger` ^2.0.0 (for console capture features)

## Quick Start

### Option 1: Auto-Setup (Simplest - Recommended)

```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup'],
};
```

Preset-specific drop-ins for clearer defaults:

```javascript
// jest.config.js
module.exports = {
  // Choose the preset that matches your suite
  setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup/integration'],
};
```

That's it! Everything is configured automatically. Use utilities in your tests:

```typescript
import { setupJest } from '@kitiumai/jest-helpers';

const test = setupJest('unit');
const mockFn = test.utils.mock.createMock({ returnValue: 'test' });
```

### Option 2: Manual Setup (More Control)

```typescript
import { setupJest } from '@kitiumai/jest-helpers';

const test = setupJest('unit');

// One-time setup (handles all complexity)
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);

// Use utilities
const mockFn = test.utils.mock.createMock({ returnValue: 'test' });
```

## Features

- 🎯 **Simple API** - One function (`setupJest()`) to set up everything
- 🎭 **Mock Utilities** - Advanced mock creation and management
- 🧩 **Fixtures** - Lifecycle-managed test fixtures with automatic cleanup
- ✅ **Custom Matchers** - 10+ custom Jest matchers (auto-setup)
- 🗄️ **Database Testing** - Database seeding and verification
- 🌐 **HTTP Mocking** - Comprehensive API mocking utilities
- ⏱️ **Timer Management** - Fake timer utilities
- 📝 **Console Utilities** - Context-aware console capture with trace IDs
- 🔄 **Async Helpers** - Stream testing and async utilities
- 🏗️ **Builders** - Test data and mock builders
- 🔍 **Observability** - Log, metric, and trace assertions
- 🔒 **Strict Mode** - Enterprise-grade presets with best practices

## Main API: `setupJest()`

The recommended way to use this package is through the `setupJest()` wrapper function:

```typescript
import { setupJest } from '@kitiumai/jest-helpers';

// Create wrapper with preset
const test = setupJest('unit'); // or 'integration', 'e2e', 'contract'

// Setup Jest hooks (one-time)
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);

// Use utilities
describe('My tests', () => {
  it('should work', () => {
    const mockFn = test.utils.mock.createMock({ returnValue: 'test' });
    const db = test.fixture('database'); // If fixtures provided
    const logs = test.console().getAll(); // Console capture
    const requests = test.requests().getAll(); // Request recorder
  });
});
```

### Presets

- **`'unit'`** - Fast, isolated tests (default)
- **`'integration'`** - HTTP mocking enabled, request recording
- **`'e2e'`** - Full stack, longer timeouts, all features
- **`'contract'`** - API contract validation, request recording

Each preset can be auto-registered via `@kitiumai/jest-helpers/auto-setup/<preset>` for copy/paste `jest.config.js` snippets.

### With Fixtures

```typescript
import { setupJest, createFixture, defineFixtures } from '@kitiumai/jest-helpers';

const fixtures = defineFixtures({
  database: createFixture(
    async () => setupDatabase(),
    async (db) => db.close()
  ),
  api: createFixture(
    async () => setupApiClient(),
    async (api) => api.disconnect()
  ),
});

const test = setupJest('integration', {
  fixtures,
});

// Setup hooks
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);

// Use fixtures in tests
describe('Integration tests', () => {
  it('should work with database', () => {
    const db = test.fixture('database');
    // Use db - cleanup happens automatically
  });
});
```

## Enterprise Features (Strict Mode)

### Context-Aware Console Capture

Automatically captures console output with trace ID propagation and sensitive data redaction:

```typescript
import { setupContextAwareConsole } from '@kitiumai/jest-helpers';

const hooks = setupContextAwareConsole({
  autoLogToLogger: true,
  redactSensitive: true,
  sensitiveFields: ['password', 'token', 'apiKey'],
});

beforeEach(hooks.beforeEach);
afterEach(hooks.afterEach);

// Access captured logs with trace context
const capture = hooks.getCapture();
expect(capture).toHaveLogWithTraceId('trace-123');
```

### Automatic Fixture Cleanup

Playwright/Nest-style fixture management with guaranteed cleanup:

```typescript
import { createAutomaticFixtureHooks, createFixture } from '@kitiumai/jest-helpers';

const dbFixture = createFixture(
  async () => await setupDatabase(),
  async (db) => await db.close()
);

const hooks = createAutomaticFixtureHooks({
  database: dbFixture,
});

beforeEach(hooks.beforeEach);
afterEach(hooks.afterEach);

// Access fixtures in tests
const db = hooks.getFixture<Database>('database');
```

### Observability Matchers

Assert on logs, metrics, and traces:

```typescript
import { setupObservabilityMatchers } from '@kitiumai/jest-helpers';

setupObservabilityMatchers();

// In your tests
expect(consoleCapture).toHaveLogContaining('User logged in', 'info');
expect(consoleCapture).toHaveLogWithTraceId('trace-123');
expect(consoleCapture).toHaveLogWithContext({ userId: 'user-123' });
expect(context).toHavePropagatedContext();
```

### Typed helpers and opinionated timers

- Use `defineFixtures` and `defineMocks` to infer keys/types without stringly-typed lookups.
- `test.withTimers()` enforces the preset timer policy (fake timers for unit; real timers elsewhere) while keeping cleanup automatic.
- `failOnTimerLeaks` and `failOnConsoleNoise` defaults guard against noisy or flaky tests; override through the `setupJest` options.

### HTTP/GraphQL happy path

`test.httpClient()` returns a facade that couples HTTP mocking, request recording, and contract assertions:

```typescript
const test = setupJest('integration');
const http = test.httpClient();

http.mock.mockGet('/users', { status: 200, data: [{ id: '1' }] });

const response = await http.request({ method: 'GET', url: '/users' });
expect(response.status).toBe(200);
expect(http.assertContract({ name: 'list-users', requests: http.requests() }).passed).toBe(true);
```

### Starter recipes

- **React component**: add `setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup/unit']`, wrap RTL tests with `test.withTimers()` when using fake timers, and declare component fixtures via `defineFixtures`.
- **Node service integration**: use `auto-setup/integration`, register API/database fixtures with `defineFixtures`, and rely on `test.httpClient()` to stub outbound HTTP.
- **Contract test**: enable `auto-setup/contract`, mock endpoints with `http.mock`, and export specs using `http.assertContract`.

### Wrapper-first guidance

Prefer the wrapper (`setupJest` or the `auto-setup` entrypoints) for consistent behavior across suites. Namespace exports remain for advanced/custom setups but lack the opinionated presets, guards, and redaction baked into the wrapper.

### GraphQL & Contract Testing

Mock GraphQL operations and record requests for contract testing:

```typescript
import {
  getGraphQLMockRegistry,
  createGraphQLFetchMock,
  getRequestRecorder,
} from '@kitiumai/jest-helpers';

const registry = getGraphQLMockRegistry();

registry.mockQuery('GetUser', {
  data: { user: { id: '1', name: 'John' } },
});

const mockFetch = createGraphQLFetchMock(registry);
global.fetch = mockFetch;

// Record requests for contract testing
const recorder = getRequestRecorder();
const contract = recorder.exportContract('user-service-v1');
recorder.assertContract(contract);
```

### Strict Mode Presets

Pre-configured strict mode with all best practices:

```typescript
import { StrictModePresets, LogLevel } from '@kitiumai/jest-helpers/strict-mode';

// Integration test preset
const hooks = StrictModePresets.integrationTest({
  fixtures: {
    database: dbFixture,
    api: apiFixture,
  },
  logLevel: LogLevel.INFO,
});

beforeAll(hooks.beforeAll);
beforeEach(hooks.beforeEach);
afterEach(hooks.afterEach);
afterAll(hooks.afterAll);

// Access features
const db = hooks.getFixture<Database>('database');
const capture = hooks.getConsoleCapture();
const recorder = hooks.getRequestRecorder();
```

## Namespace Exports

Avoid naming conflicts with curated namespace exports:

```typescript
import { namespaced } from '@kitiumai/jest-helpers/namespaced';

// Organized imports
const { async, fixtures, http, matchers } = namespaced;

// Use without conflicts
fixtures.automatic.createAutomaticFixtureHooks({ ... });
http.graphql.getGraphQLMockRegistry();
matchers.observability.setupObservabilityMatchers();
```

## API Reference

### Mocks

#### `createMock<T>(options?)`

Create a Jest mock function with configuration.

**Parameters:**

- `options?: { returnValue?: unknown; returnValues?: unknown[]; implementation?: Function; rejectWith?: Error; resolveWith?: unknown }`

**Returns:** `MockFunction<T>`

**Example:**

```typescript
import { createMock } from '@kitiumai/jest-helpers';

const mockFn = createMock({
  returnValue: 'default',
  returnValues: ['first', 'second', 'third'],
});

const asyncMock = createMock({
  resolveWith: { data: 'success' },
});

const errorMock = createMock({
  rejectWith: new Error('Failed'),
});
```

#### `createMockObject<T>(template, mockOverrides?)`

Create a mock object with specified methods.

**Parameters:**

- `template: T` - Template object
- `mockOverrides?: Partial<Record<keyof T, MockSetupOptions>>`

**Returns:** `T`

**Example:**

```typescript
import { createMockObject } from '@kitiumai/jest-helpers';

const mockService = createMockObject(
  {
    getUser: (id: string) => Promise.resolve({ id, name: 'John' }),
    updateUser: (id: string, data: any) => Promise.resolve(data),
  },
  {
    getUser: { resolveWith: { id: '1', name: 'Mock User' } },
  }
);
```

#### `createMockModule<T>(moduleName, mockImplementation)`

Create a mock module.

**Parameters:**

- `moduleName: string` - Module name to mock
- `mockImplementation: T` - Mock implementation

**Returns:** `T`

**Example:**

```typescript
import { createMockModule } from '@kitiumai/jest-helpers';

const mockApi = createMockModule('@api/client', {
  fetch: jest.fn().mockResolvedValue({ data: 'test' }),
});
```

#### `ManagedMock<T>`

Mock with lifecycle management and call tracking.

**Example:**

```typescript
import { ManagedMock } from '@kitiumai/jest-helpers';

const mock = new ManagedMock({ returnValue: 'test' });

mock.fn('arg1', 'arg2');
const calls = mock.getCalls();
const lastCall = mock.getLastCall();
const count = mock.getCallCount();
const wasCalled = mock.wasCalledWith('arg1', 'arg2');

mock.clear(); // Clear call history
mock.reset(); // Reset mock
mock.restore(); // Restore original
```

### Fixtures

#### `createFixture<T>(setup, teardown?)`

Create a test fixture with setup and teardown.

**Parameters:**

- `setup: () => T | Promise<T>` - Setup function
- `teardown?: (data: T) => void | Promise<void>` - Teardown function

**Returns:** `Fixture<T>`

**Example:**

```typescript
import { createFixture } from '@kitiumai/jest-helpers';

const dbFixture = createFixture(
  async () => {
    const db = await connectToDatabase();
    return db;
  },
  async (db) => {
    await db.close();
  }
);

// Use in test
const db = await dbFixture.setup();
// ... test code
await dbFixture.teardown(db);
```

#### `withFixture<T>(fixture, testFn)`

Run test with automatic fixture setup/teardown.

**Example:**

```typescript
import { withFixture } from '@kitiumai/jest-helpers';

await withFixture(userFixture, async (user) => {
  expect(user.id).toBeDefined();
  // Teardown automatically called
});
```

#### `FixtureManager`

Manage multiple fixtures.

**Example:**

```typescript
import { getGlobalFixtureManager } from '@kitiumai/jest-helpers';

const manager = getGlobalFixtureManager();
manager.register('user', userFixture);
manager.register('db', dbFixture);

const user = await manager.setup('user');
const db = await manager.setup('db');

await manager.teardownAll();
```

### Custom Matchers

#### Setup

```typescript
import { setupCustomMatchers } from '@kitiumai/jest-helpers';

beforeAll(() => setupCustomMatchers());
```

#### Available Matchers

- `toBeWithinRange(min, max)` - Number within range
- `toBeValidEmail()` - Valid email format
- `toBeValidUrl()` - Valid URL format
- `toContainObject(object)` - Array contains object
- `toHaveBeenCalledWithObject(object)` - Mock called with object
- `toMatchObject(expected)` - Object matches shape

**Example:**

```typescript
expect(5).toBeWithinRange(1, 10);
expect('user@example.com').toBeValidEmail();
expect('https://example.com').toBeValidUrl();
expect([{ id: 1 }, { id: 2 }]).toContainObject({ id: 1 });
expect(mockFn).toHaveBeenCalledWithObject({ userId: '123' });
```

### Console Utilities

#### `suppressConsole()`

Suppress all console output during tests.

**Returns:** `() => void` - Restore function

**Example:**

```typescript
import { suppressConsole } from '@kitiumai/jest-helpers';

beforeEach(() => {
  const restore = suppressConsole();
  // ... test code
  restore(); // Restore console
});
```

#### `captureConsole()`

Capture console output for assertions.

**Returns:** `ConsoleCapture`

**Example:**

```typescript
import { captureConsole } from '@kitiumai/jest-helpers';

const capture = captureConsole();
console.log('Test message');
console.error('Error message');

expect(capture.hasOutput()).toBe(true);
expect(capture.errors).toHaveLength(1);
expect(capture.getByLevel('log')).toHaveLength(1);
```

#### `setupConsoleMocks(options)`

Setup console mocking in beforeEach/afterEach.

**Example:**

```typescript
import { setupConsoleMocks } from '@kitiumai/jest-helpers';

const consoleMocks = setupConsoleMocks({ suppress: true });

beforeEach(() => consoleMocks.beforeEach());
afterEach(() => consoleMocks.afterEach());
```

### Async Utilities

#### `consumeStream<T>(stream, options?)`

Consume async iterator and collect values.

**Parameters:**

- `stream: AsyncIterable<T>`
- `options?: { filter?: (value: T) => boolean; limit?: number; timeout?: number }`

**Returns:** `Promise<T[]>`

**Example:**

```typescript
import { consumeStream } from '@kitiumai/jest-helpers';

const stream = async function* () {
  yield 1;
  yield 2;
  yield 3;
};

const values = await consumeStream(stream(), { limit: 2 });
// [1, 2]
```

#### `createMockStream<T>(values, options?)`

Create mock async generator.

**Example:**

```typescript
import { createMockStream } from '@kitiumai/jest-helpers';

const stream = createMockStream(['a', 'b', 'c'], {
  delay: 100,
  errorAfter: 2,
});

for await (const value of stream) {
  console.log(value);
}
```

#### `safeCleanup(cleanupFn)`

Safe async cleanup with error handling.

**Example:**

```typescript
import { safeCleanup } from '@kitiumai/jest-helpers';

afterEach(async () => {
  await safeCleanup(async () => {
    await db.close();
  });
});
```

#### `withCleanup<T>(setup, cleanup, testFn)`

Run test with automatic cleanup.

**Example:**

```typescript
import { withCleanup } from '@kitiumai/jest-helpers';

await withCleanup(
  async () => await connectDB(),
  async (db) => await db.close(),
  async (db) => {
    // Test code
  }
);
```

### Builders

#### `createMockProvider<T>(methods)`

Create mock provider with methods.

**Example:**

```typescript
import { createMockProvider } from '@kitiumai/jest-helpers';

const provider = createMockProvider({
  chat: jest.fn().mockResolvedValue({ content: 'Hello' }),
  validate: jest.fn().mockReturnValue(true),
});
```

#### `createMockFetch(responses)`

Create mock fetch function.

**Example:**

```typescript
import { createMockFetch, createMockFetchResponse } from '@kitiumai/jest-helpers';

global.fetch = createMockFetch([
  createMockFetchResponse({ data: 'test' }, { status: 200 }),
  createMockFetchResponse({ error: 'Not found' }, { status: 404 }),
]);
```

#### `TestDataBuilder<T>`

Fluent builder for test data.

**Example:**

```typescript
import { createTestDataBuilder } from '@kitiumai/jest-helpers';

const builder = createTestDataBuilder({ id: '1', name: 'Default' })
  .with('name', 'Custom Name')
  .withMany({ age: 30, email: 'test@example.com' });

const data = builder.build();
```

### HTTP Mocking

#### `HttpMockRegistry`

HTTP mock handler registry.

**Example:**

```typescript
import { createHttpMockRegistry, ApiMocks } from '@kitiumai/jest-helpers';

const registry = createHttpMockRegistry();
registry.mockGet('/api/users', ApiMocks.success([{ id: 1 }]));
registry.mockPost('/api/users', ApiMocks.error('Validation failed', 400));

const handler = registry.getHandler({ method: 'GET', url: '/api/users' });
```

#### `ApiMocks`

Pre-built API response mocks.

**Example:**

```typescript
import { ApiMocks } from '@kitiumai/jest-helpers';

const success = ApiMocks.success({ data: 'test' });
const error = ApiMocks.error('Not found', 404);
const notFound = ApiMocks.notFound('User');
const paginated = ApiMocks.paginated([1, 2, 3], 1, 10, 100);
```

### Test Setup

#### `TestEnvironment`

Test environment setup and management.

**Example:**

```typescript
import { setupGlobalTestEnvironment, TestPresets } from '@kitiumai/jest-helpers';

const env = setupGlobalTestEnvironment(TestPresets.unitTest());

// ... tests

cleanupGlobalTestEnvironment();
```

#### `TestPresets`

Pre-configured test presets.

**Example:**

```typescript
import { TestPresets } from '@kitiumai/jest-helpers';

const unitOptions = TestPresets.unitTest();
const integrationOptions = TestPresets.integrationTest();
const dbOptions = TestPresets.databaseTest();
const apiOptions = TestPresets.apiTest();
```

### Timers

#### `TimerManager`

Fake timer management.

**Example:**

```typescript
import { getTimerManager } from '@kitiumai/jest-helpers';

const timers = getTimerManager();
timers.enableFakeTimers();
timers.advanceBy(1000);
timers.disableFakeTimers();
```

## Examples

### Complete Test Example (Simple API)

```typescript
import { setupJest, createFixture } from '@kitiumai/jest-helpers';

const test = setupJest('unit', {
  fixtures: {
    user: createFixture(
      () => ({ id: '1', name: 'John', email: 'john@example.com' }),
      (user) => console.log('Cleanup:', user.id)
    ),
  },
});

// Setup hooks
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);

describe('UserService', () => {
  it('should create user', async () => {
    const mockApi = test.utils.mock.createMock({
      resolveWith: { success: true },
    });

    const user = test.fixture('user');
    const result = await mockApi(user);

    expect(result.success).toBe(true);
    expect(mockApi).toHaveBeenCalledWith(user);
  });
});
```

### Stream Testing

```typescript
import { consumeStream, createMockStream } from '@kitiumai/jest-helpers';

describe('Stream Processing', () => {
  it('should consume async stream', async () => {
    const stream = createMockStream(['a', 'b', 'c'], { delay: 10 });
    const values = await consumeStream(stream, { limit: 2 });
    expect(values).toEqual(['a', 'b']);
  });
});
```

### HTTP Mocking

```typescript
import { createHttpMockRegistry, ApiMocks } from '@kitiumai/jest-helpers';

describe('API Client', () => {
  it('should handle mocked responses', () => {
    const registry = createHttpMockRegistry();
    registry.mockGet('/api/users', ApiMocks.success([{ id: 1 }]));

    const handler = registry.getHandler({
      method: 'GET',
      url: '/api/users',
    });

    expect(handler).toBeDefined();
  });
});
```

## Configuration

All features integrate with the 5 internal packages:

- `@kitiumai/config` - Shared configuration
- `@kitiumai/lint` - Linting rules
- `@kitiumai/logger` - Structured logging with context (v2.0.0+)
- `@kitiumai/scripts` - Build scripts
- `@kitiumai/test-core` - Core utilities

## Best Practices

1. **Use `setupJest()` as the primary API** - Handles all complexity internally
2. **Use auto-setup for zero configuration** - Add to `jest.config.js` setupFilesAfterEnv
3. **Use strict mode for integration/E2E tests** - Prevents common mistakes
4. **Enable context propagation** - Essential for distributed tracing
5. **Use automatic fixtures** - Guarantees cleanup even on failures
6. **Record requests for contract testing** - Validates API contracts
7. **Use namespace exports** - Avoids naming conflicts when needed

## Migration Guide

### From Manual Setup to Simple API

**Before (Complex):**

```typescript
import {
  setupCustomMatchers,
  setupContextAwareConsole,
  createAutomaticFixtureHooks,
} from '@kitiumai/jest-helpers';

beforeAll(() => setupCustomMatchers());
const consoleHooks = setupContextAwareConsole();
beforeEach(consoleHooks.beforeEach);
afterEach(consoleHooks.afterEach);
// ... more setup
```

**After (Simple):**

```typescript
import { setupJest } from '@kitiumai/jest-helpers';

const test = setupJest('unit');
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);
```

### From Manual to Automatic Fixtures

**Before:**

```typescript
let db: Database;
beforeEach(async () => {
  db = await setupDatabase();
});
afterEach(async () => {
  await db.close();
});
```

**After:**

```typescript
import { setupJest, createFixture } from '@kitiumai/jest-helpers';

const test = setupJest('integration', {
  fixtures: {
    database: createFixture(setupDatabase, (db) => db.close()),
  },
});

// Setup hooks once
beforeAll(test.setup.beforeAll);
beforeEach(test.setup.beforeEach);
afterEach(test.setup.afterEach);
afterAll(test.setup.afterAll);

// Use in tests
const db = test.fixture('database');
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions.

```typescript
import type {
  MockFunction,
  MockSetupOptions,
  Fixture,
  ConsoleCapture,
  JestWrapper,
  JestPreset,
} from '@kitiumai/jest-helpers';
```

## License

MIT
