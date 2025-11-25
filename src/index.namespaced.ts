/**
 * Namespace exports to avoid naming conflicts
 * Provides curated, organized API surface
 */

// Core utilities
import * as asyncUtils from './async';
import * as builders from './builders';
import * as consoleUtils from './console';
import * as databaseUtils from './database';
import * as fixtures from './fixtures';
import * as httpUtils from './http';
import * as integrationUtils from './integration';
import * as matchers from './matchers';
import * as mocks from './mocks';
import * as setupUtils from './setup';
import * as timers from './timers';

// Enhanced modules
import * as contextAwareConsole from './console/context-aware';
import * as automaticFixtures from './fixtures/registry';
import * as observabilityMatchers from './matchers/observability';
import * as graphqlUtils from './http/graphql';
import * as contractTesting from './http/contract-testing';
import * as strictMode from './setup/strict-mode';

/**
 * Namespace exports for organized imports
 * Usage: import { async, fixtures, http } from '@kitiumai/jest-helpers/namespaced';
 */
export const namespaced = {
  /**
   * Async utilities (retry, waitUntil, sleep, etc.)
   */
  async: asyncUtils,

  /**
   * Test data builders and factories
   */
  builders,

  /**
   * Console mocking and capture utilities
   */
  console: {
    ...consoleUtils,
    contextAware: contextAwareConsole,
  },

  /**
   * Database testing utilities
   */
  database: databaseUtils,

  /**
   * Fixture management
   */
  fixtures: {
    ...fixtures,
    automatic: automaticFixtures,
  },

  /**
   * HTTP and API mocking
   */
  http: {
    ...httpUtils,
    graphql: graphqlUtils,
    contract: contractTesting,
  },

  /**
   * Integration testing utilities
   */
  integration: integrationUtils,

  /**
   * Custom Jest matchers
   */
  matchers: {
    ...matchers,
    observability: observabilityMatchers,
  },

  /**
   * Mock utilities
   */
  mocks,

  /**
   * Test setup and configuration
   */
  setup: {
    ...setupUtils,
    strictMode,
  },

  /**
   * Timer utilities
   */
  timers,
};

/**
 * Default export for namespace access
 */
export default namespaced;
