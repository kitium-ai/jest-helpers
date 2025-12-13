# @kitiumai/jest-helpers

**Enterprise-grade Jest testing utilities that handle all complexity internally** - The most comprehensive testing toolkit for modern JavaScript applications.

[![npm version](https://badge.fury.io/js/%40kitiumai%2Fjest-helpers.svg)](https://badge.fury.io/js/%40kitiumai%2Fjest-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## What is @kitiumai/jest-helpers?

`@kitiumai/jest-helpers` is a **comprehensive testing framework wrapper** that transforms Jest from a basic testing library into an enterprise-grade testing platform. Unlike traditional Jest toolkits that just provide utilities, this package **handles all Jest complexity internally**, providing a simple, consistent API for developers while enabling advanced testing capabilities.

### Key Philosophy

**"Testing should be simple, but powerful"**

- 🎯 **Simple API**: One function call sets up everything
- 🏢 **Enterprise Features**: Big tech-grade capabilities (Google, Meta, Netflix level)
- 🔧 **Zero Configuration**: Auto-setup with sensible defaults
- 🎭 **Comprehensive**: Covers every testing scenario from unit to E2E

## Why Do You Need This Package?

### The Problem with Traditional Testing

Traditional Jest testing often involves:
- ❌ Complex setup files with dozens of imports
- ❌ Manual mock management and cleanup
- ❌ Inconsistent testing patterns across teams
- ❌ Missing enterprise features (property testing, fluent assertions, etc.)
- ❌ Poor developer experience with cryptic error messages
- ❌ No built-in support for modern testing patterns

### The @kitiumai/jest-helpers Solution

- ✅ **One-line setup**: `setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup']`
- ✅ **Automatic cleanup**: Fixtures, mocks, timers - all cleaned up automatically
- ✅ **Enterprise patterns**: Property testing, fluent assertions, factories
- ✅ **Developer experience**: Clear error messages, debugging tools
- ✅ **Consistent API**: Same patterns across unit, integration, and E2E tests
- ✅ **Modern features**: Visual testing, accessibility testing, contract testing

## Unique Selling Proposition (USP)

### 🏆 **The Only Jest Wrapper That Handles Everything Internally**

While other packages provide testing utilities, `@kitiumai/jest-helpers` is fundamentally different:

| Feature | @kitiumai/jest-helpers | Jest + Toolkits | Testing Library |
|---------|----------------------|-----------------|-----------------|
| **Setup Complexity** | 1 line | 50+ lines | 20+ lines |
| **Internal Complexity** | Hidden | Exposed | Exposed |
| **Enterprise Features** | ✅ Built-in | ❌ Manual | ❌ Manual |
| **Auto-cleanup** | ✅ Everything | ❌ Partial | ❌ Partial |
| **Consistent API** | ✅ Same everywhere | ❌ Varies | ❌ Varies |
| **Property Testing** | ✅ Built-in | ❌ Add library | ❌ Add library |
| **Fluent Assertions** | ✅ Built-in | ❌ Add library | ❌ Add library |
| **Visual Testing** | ✅ Built-in | ❌ Add library | ❌ Add library |

### 🚀 **Big Tech Features in a Simple Package**

Features you'd find at Google, Meta, or Netflix, but with a simple API:
- **Property-based testing** (QuickCheck/Hypothesis style)
- **Fluent assertions** (Google Truth style)
- **Advanced mocking** (Mockito style)
- **Visual regression testing**
- **Accessibility testing**
- **Contract testing**
- **Chaos engineering primitives**

## Competitor Comparison

### vs. Jest Ecosystem
- **jest-extended**: Basic matchers only
- **@testing-library/jest-dom**: DOM-specific matchers only
- **jest-mock-extended**: Mock utilities only
- **@kitiumai/jest-helpers**: Complete testing platform

### vs. Testing Libraries
- **Vitest**: Great for Vite, but missing enterprise features
- **AVA**: Minimalist, but lacks Jest's ecosystem
- **Mocha**: Requires extensive setup and plugins
- **@kitiumai/jest-helpers**: Jest power with enterprise capabilities

### vs. Enterprise Testing Tools
- **Testim**: Commercial, expensive, complex
- **Mabl**: AI-focused, limited customization
- **Applitools**: Visual testing only
- **@kitiumai/jest-helpers**: Open source, comprehensive, developer-friendly

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

That's it! Everything is configured automatically.

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

## Core Features

### 🎯 Simple API
```typescript
import { setupJest } from '@kitiumai/jest-helpers';

const test = setupJest('unit'); // Everything configured automatically!
```

### 🎭 Advanced Mocking
```typescript
const mock = test.utils.mock.createAdvancedMock();
mock.whenCalledWith('arg').return('result');
mock.verify().calledWith('arg');
```

### 🧩 Automatic Fixtures
```typescript
const fixtures = defineFixtures({
  database: createFixture(
    async () => setupDatabase(),
    async (db) => db.close()
  ),
});

const test = setupJest('integration', { fixtures });
```

### ✅ Custom Matchers
```typescript
expect(data).toBeValidJson();
expect(mock).toHaveBeenCalledWithValidArguments();
expect(response).toHaveResponseTimeLessThan(100);
```

### 🗄️ Database Testing
```typescript
const db = test.utils.database.createConnection();
await db.seed({ users: [{ id: 1, name: 'John' }] });
```

### 🌐 HTTP Mocking
```typescript
const mockApi = test.utils.http.createMockServer();
mockApi.get('/api/users').respondWith({ users: [] });
```

### ⏱️ Timer Management
```typescript
const timers = test.utils.timers.createManager();
timers.enableFakeTimers();
timers.advanceBy(1000);
```

### 📝 Console Capture
```typescript
const console = test.utils.console.captureWithContext();
console.getLogs().shouldContain('Expected message');
```

### 🔄 Async Utilities
```typescript
await test.utils.async.waitForCondition(() => api.isReady());
await test.utils.async.retry(() => flakyOperation(), { maxAttempts: 3 });
```

### 🏗️ Test Data Builders
```typescript
const user = test.utils.builders.createUser({ name: 'John' });
const company = test.utils.builders.createCompany({ users: [user] });
```

### 🔍 Observability Matchers
```typescript
expect(logs).toHaveLogWithLevel('error');
expect(metrics).toHaveMetric('requests_total', 42);
expect(trace).toHaveSpan('database_query');
```

## Enterprise Features

### 🎲 Property-Based Testing
```typescript
propertyTest('addition is commutative', [numberGen, numberGen], (a, b) => {
  expect(a + b).toBe(b + a);
});
```

### 🌟 Fluent Assertions
```typescript
expect(user)
  .toBeDefined()
  .toHaveProperty('name')
  .and(user.name)
  .toBeString()
  .toHaveLengthGreaterThan(0);
```

### 🏭 Test Data Factories
```typescript
const UserFactory = createFactory(User, {
  name: () => faker.name.fullName(),
  email: () => faker.internet.email(),
});

const user = UserFactory.build();
const users = UserFactory.buildList(5);
```

### 🎭 Advanced Mock Verification
```typescript
const mock = createAdvancedMock();
mock.verify().calledOnce();
mock.verify().calledWith(validArgumentMatcher);
mock.verify().calledInOrder([call1, call2, call3]);
```

### 👁️ Visual Testing
```typescript
const visual = test.utils.visual.createTester();
await visual.compareScreenshot('homepage', screenshot);
```

### ♿ Accessibility Testing
```typescript
const a11y = test.utils.accessibility.createTester();
const results = await a11y.testPage(page);
expect(results).toHaveNoViolations();
```

### 📊 Parameterized Testing
```typescript
parameterizedTest('addition', [
  [1, 2, 3],
  [4, 5, 9],
  [-1, 1, 0],
], (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

### 🔄 Multi-Framework Support
```typescript
// Same API works with Jest and Vitest
import { universalTest } from '@kitiumai/jest-helpers';

universalTest('works everywhere', () => {
  // Test code that works in both frameworks
});
```

### 🔒 Strict Mode
```typescript
import { setupStrictMode } from '@kitiumai/jest-helpers/strict-mode';

setupStrictMode({
  enforceTimeouts: true,
  preventConsoleLogs: true,
  requireTestDescriptions: true,
});
```

## API Reference

### Main Exports

#### Core Functions
- `setupJest(preset, options?)` - Main setup function
- `jestHelpers` - Direct access to utilities

#### Testing Utilities
- `propertyTest(name, generators, testFn)` - Property-based testing
- `parameterizedTest(name, data, testFn)` - Data-driven tests
- `universalTest(name, testFn)` - Cross-framework tests

### Namespaced Exports

```typescript
import { namespaced } from '@kitiumai/jest-helpers/namespaced';

// Access all utilities through namespaced object
namespaced.mock.createMock();
namespaced.fixtures.createFixture();
namespaced.matchers.toBeValidJson();
```

### Module Exports

#### Core Modules
- `@kitiumai/jest-helpers/mocks` - Mocking utilities
- `@kitiumai/jest-helpers/fixtures` - Fixture management
- `@kitiumai/jest-helpers/matchers` - Custom matchers
- `@kitiumai/jest-helpers/database` - Database testing
- `@kitiumai/jest-helpers/http` - HTTP mocking
- `@kitiumai/jest-helpers/timers` - Timer management
- `@kitiumai/jest-helpers/setup` - Setup utilities
- `@kitiumai/jest-helpers/integration` - Integration testing
- `@kitiumai/jest-helpers/console` - Console capture
- `@kitiumai/jest-helpers/async` - Async utilities
- `@kitiumai/jest-helpers/builders` - Test data builders

#### Enterprise Modules
- `@kitiumai/jest-helpers/strict-mode` - Enterprise presets
- `@kitiumai/jest-helpers/auto-setup` - Auto-setup entry points
- `@kitiumai/jest-helpers/auto-setup/unit` - Unit test preset
- `@kitiumai/jest-helpers/auto-setup/integration` - Integration test preset
- `@kitiumai/jest-helpers/auto-setup/e2e` - E2E test preset
- `@kitiumai/jest-helpers/auto-setup/contract` - Contract test preset

## Examples

### Unit Testing
```typescript
import { setupJest } from '@kitiumai/jest-helpers';

const test = setupJest('unit');

describe('UserService', () => {
  it('should create user', () => {
    const mockRepo = test.utils.mock.createMock();
    const service = new UserService(mockRepo);

    const user = service.createUser({ name: 'John' });

    expect(user).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledWith(user);
  });
});
```

### Integration Testing
```typescript
import { setupJest, defineFixtures } from '@kitiumai/jest-helpers';

const fixtures = defineFixtures({
  database: createFixture(
    async () => setupTestDatabase(),
    async (db) => db.close()
  ),
});

const test = setupJest('integration', { fixtures });

describe('UserAPI', () => {
  it('should return users', async () => {
    const response = await fetch('/api/users');
    const users = await response.json();

    expect(response.status).toBe(200);
    expect(users).toHaveLengthGreaterThan(0);
  });
});
```

### Property-Based Testing
```typescript
import { propertyTest, generators } from '@kitiumai/jest-helpers';

propertyTest(
  'array sort is idempotent',
  [generators.array(generators.number())],
  (arr) => {
    const sorted = [...arr].sort();
    const sortedAgain = [...sorted].sort();
    expect(sorted).toEqual(sortedAgain);
  }
);
```

### Fluent Assertions
```typescript
import { expect } from '@kitiumai/jest-helpers/matchers/fluent';

expect(user)
  .toBeDefined()
  .toHaveProperty('name')
  .and(user.name)
  .toBeString()
  .toHaveLengthGreaterThan(0)
  .and(user)
  .toHaveProperty('email')
  .and(user.email)
  .toMatch(/@example\.com$/);
```

### Advanced Mocking
```typescript
import { createAdvancedMock } from '@kitiumai/jest-helpers';

const mockApi = createAdvancedMock();
mockApi.whenCalledWith('GET', '/users').return(Promise.resolve([]));
mockApi.whenCalledWith('POST', '/users').throw(new Error('Unauthorized'));

// Use in tests
const result = await mockApi('GET', '/users');
expect(result).toEqual([]);

await expect(mockApi('POST', '/users')).rejects.toThrow('Unauthorized');
```

## Configuration

### Jest Config Examples

#### Minimal Setup
```javascript
module.exports = {
  setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup'],
};
```

#### With Custom Configuration
```javascript
module.exports = {
  setupFilesAfterEnv: ['@kitiumai/jest-helpers/auto-setup/integration'],
  testTimeout: 10000,
  testEnvironment: 'jsdom',
};
```

#### Advanced Setup
```javascript
const { createJestConfig } = require('@kitiumai/jest-helpers/setup');

module.exports = createJestConfig({
  preset: 'integration',
  environment: 'jsdom',
  setupFiles: ['./custom-setup.js'],
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/kitium-ai/jest-helpers.git
cd jest-helpers
pnpm install
pnpm build
pnpm test
```

## License

MIT © [Kitium AI](https://github.com/kitium.ai)

## Support

- 📖 [Documentation](https://github.com/kitium-ai/jest-helpers#readme)
- 🐛 [Issues](https://github.com/kitium-ai/jest-helpers/issues)
- 💬 [Discussions](https://github.com/kitium-ai/jest-helpers/discussions)
- 📧 [Email Support](mailto:support@kitium.ai)
