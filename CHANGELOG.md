# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.0.0] - 2025-11-27

### Added

- Preset-specific auto-setup entrypoints for unit, integration, e2e, and contract suites to enable drop-in Jest configuration.
- Typed helper factories (`defineFixtures`, `defineMocks`) for safer fixture and mock definitions.
- `withTimers` helper and stricter timer defaults to keep asynchronous tests consistent across presets.
- `httpClient` helper to streamline HTTP mocking, recording, and contract assertions.

### Changed

- Strengthened strict-mode guardrails to fail on console noise and improve mock/handler resolution.
- Updated documentation to highlight the preferred wrapper API and preset-aligned setup guidance.

## [1.0.0] - 2025-11-24

### Added

#### Main API: Jest Wrapper

- `setupJest()` - **Primary API** - Simple wrapper function that handles all Jest complexity internally
  - Supports presets: `'unit'`, `'integration'`, `'e2e'`, `'contract'`
  - Automatic setup of all Jest hooks
  - Unified access to all utilities via `test.utils.*`
  - Simple fixture access via `test.fixture()`
  - Console capture via `test.console()`
  - Request recording via `test.requests()`
- `jestHelpers` - Quick preset access (`jestHelpers.unit()`, `jestHelpers.integration()`, etc.)
- Auto-setup support - Zero configuration via `@kitiumai/jest-helpers/auto-setup` in `jest.config.js`

#### Enterprise Features (Strict Mode)

- `StrictModePresets` - Pre-configured strict mode presets with best practices
  - `unitTest()` - Fast, isolated tests
  - `integrationTest()` - HTTP mocking, request recording
  - `e2eTest()` - Full stack, longer timeouts
  - `contractTest()` - API contract validation
- `setupContextAwareConsole()` - Context-aware console capture with trace ID propagation
  - Automatic sensitive data redaction
  - Integration with `@kitiumai/logger`
  - Trace context propagation
- `createAutomaticFixtureHooks()` - Playwright/Nest-style fixture management
  - Guaranteed cleanup even on failures
  - Automatic lifecycle management
  - Type-safe fixture access
- `setupObservabilityMatchers()` - Custom Jest matchers for observability
  - `toHaveLogContaining()` - Assert log messages
  - `toHaveLogWithTraceId()` - Assert trace ID in logs
  - `toHaveLogWithContext()` - Assert log context
  - `toHaveMetricValue()` - Assert metrics (placeholder)
  - `toHaveTraceSpan()` - Assert trace spans (placeholder)
- `getGraphQLMockRegistry()` - GraphQL operation mocking
- `createGraphQLFetchMock()` - GraphQL fetch wrapper
- `getRequestRecorder()` - Request recording for contract testing
  - Export contracts
  - Assert contract compliance
  - Request/response validation

#### Mock Utilities

- `createMock()` - Create Jest mock functions with configuration
- `createMockObject()` - Create mock objects with methods
- `createMockModule()` - Create mock modules
- `spyOnFunction()` - Spy on functions with tracking
- `ManagedMock` - Mock with lifecycle management and call tracking
- `MockWrapper` - Enhanced mock wrapper with call tracking
- `resetAllMocks()` - Reset all mocks
- `restoreAllMocks()` - Restore all mocks

#### Fixtures

- `createFixture()` - Create test fixtures with setup/teardown
- `withFixture()` - Run tests with automatic fixture management
- `withFixtures()` - Setup multiple fixtures
- `FixtureManager` - Manage multiple fixtures
- `createAutomaticFixtureHooks()` - Automatic fixture cleanup registry
- `getGlobalFixtureManager()` - Get global fixture manager

#### Custom Matchers

- `setupCustomMatchers()` - Setup custom Jest matchers
- `toBeWithinRange()` - Number range matcher
- `toBeValidEmail()` - Email validation matcher
- `toBeValidUrl()` - URL validation matcher
- `toContainObject()` - Array contains object matcher
- `toHaveBeenCalledWithObject()` - Mock called with object matcher
- `toMatchObject()` - Object shape matcher
- Observability matchers (see Enterprise Features)

#### Console Utilities

- `suppressConsole()` - Suppress console output
- `captureConsole()` - Capture console output for assertions
- `setupContextAwareConsole()` - Context-aware console capture (see Enterprise Features)
- `mockConsoleMethods()` - Mock specific console methods
- `setupConsoleMocks()` - Setup console mocking in hooks
- `restoreConsole()` - Restore console methods

#### Async Utilities

- `consumeStream()` - Consume async iterators
- `createMockStream()` - Create mock async generators
- `retry()` - Retry operations (from `@kitiumai/test-core`)
- `waitFor()` - Wait for conditions (from `@kitiumai/test-core`)
- `sleep()` - Delay execution (from `@kitiumai/test-core`)
- `safeCleanup()` - Safe async cleanup with error handling
- `withCleanup()` - Run tests with automatic cleanup

#### Builders

- `createMockProvider()` - Create mock providers
- `createMockProviderWithDefaults()` - Create providers with defaults
- `createTestConfig()` - Create test configurations
- `createMockRegistry()` - Create mock registries
- `createMockFetch()` - Create mock fetch functions
- `createMockFetchResponse()` - Create mock Response objects
- `createMockFetchError()` - Create mock fetch errors
- `createMockFetchWithRetries()` - Mock fetch with rate limiting
- `TestDataBuilder` - Fluent builder for test data
- `createTestDataBuilder()` - Create test data builder

#### HTTP Mocking

- `HttpMockRegistry` - HTTP mock handler registry
- `createHttpMockRegistry()` - Create HTTP mock registry
- `ApiMocks` - Pre-built API response mocks
  - `success()` - Success response
  - `error()` - Error response
  - `notFound()` - 404 response
  - `paginated()` - Paginated response
- `ApiResponseChain` - Response chain for multiple responses
- Request/response recording for contract testing

#### GraphQL & Contract Testing

- `getGraphQLMockRegistry()` - GraphQL mock registry
- `createGraphQLFetchMock()` - GraphQL fetch wrapper
- `GraphQLMock` - GraphQL operation mock
- Request recording and contract validation
- Contract export and assertion

#### Database Testing

- Database seeding utilities
- Database verification helpers
- Transaction management
- Connection pooling for tests
- `TestDatabase` - In-memory test database
- `createDatabaseFixture()` - Database fixture helper

#### Timer Management

- `TimerManager` - Fake timer management
- `getTimerManager()` - Get timer manager instance
- `createTimerManager()` - Create timer manager
- `runWithFakeTimers()` - Run tests with fake timers
- `timeout()` - Timeout helper
- `withTimeout()` - Race promise against timeout
- `debounce()` - Debounce function
- `throttle()` - Throttle function
- `delay()` - Delay promise resolution
- `waitFor()` - Wait with condition polling
- `measureTime()` - Measure execution time
- `assertExecutionTime()` - Assert execution time bounds

#### Test Setup

- `TestEnvironment` - Test environment setup
- `setupGlobalTestEnvironment()` - Setup global test environment
- `cleanupGlobalTestEnvironment()` - Cleanup global test environment
- `setupTestSuite()` - Test suite setup helper
- `TestPresets` - Pre-configured test presets
  - `unitTest()` - Unit test preset
  - `integrationTest()` - Integration test preset
  - `databaseTest()` - Database test preset
  - `apiTest()` - API test preset
- `StrictModePresets` - Enterprise-grade strict mode presets (see Enterprise Features)

#### Integration Testing

- `IntegrationTestEnvironment` - Integration test environment
- `createIntegrationTestEnvironment()` - Create integration test environment
- `TestResource` - Test resource interface
- `IntegrationTestContext` - Integration test context
- Multi-system testing helpers
- Event-driven testing

#### Namespace Exports

- `namespaced` - Curated namespace exports to avoid naming conflicts
- Organized imports: `async`, `fixtures`, `http`, `matchers`, etc.
- Type-safe namespace access

### Changed

- **Breaking**: Package now focuses on wrapper API (`setupJest()`) as primary interface
- Re-exported `retry`, `waitFor`, and `sleep` from `@kitiumai/test-core` to avoid duplication
- Integrated with `@kitiumai/logger` v2.0.0+ for console capture and context propagation
- Integrated with `@kitiumai/lint` for consistent code quality
- All utilities accessible via `test.utils.*` in wrapper mode
- Console capture now uses `@kitiumai/logger`'s context-aware implementation

### Dependencies

- `@kitiumai/config` ^2.0.0 - Shared configuration
- `@kitiumai/lint` ^2.0.0 - Linting rules
- `@kitiumai/logger` ^2.0.0 - Structured logging with context (for console capture)
- `@kitiumai/scripts` ^1.0.0 - Build scripts
- `@kitiumai/test-core` ^2.0.0 - Core test utilities

### Features

- **Simple API** - One function (`setupJest()`) to set up everything
- **Auto-setup** - Zero configuration via `jest.config.js`
- **Enterprise-grade** - Strict mode presets with best practices
- **Context-aware** - Trace ID propagation and context management
- **Observability** - Log, metric, and trace assertions
- **Contract testing** - API contract validation and recording
- Full TypeScript support with comprehensive type definitions
- Comprehensive mock management
- Lifecycle-managed fixtures with automatic cleanup
- Custom Jest matchers (10+)
- Console output control with context propagation
- Async stream testing
- HTTP/API mocking with GraphQL support
- Timer utilities
- Test environment presets

### Documentation

- Complete API documentation in README.md
- Simple API guide with examples
- Enterprise features documentation
- Migration guide from manual setup
- Usage examples for all features
- TypeScript type definitions
- Best practices guide
