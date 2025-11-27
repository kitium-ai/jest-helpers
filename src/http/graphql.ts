/**
 * GraphQL mocking and contract testing utilities
 * Enterprise-grade GraphQL testing helpers
 */

import { contextManager, getLogger } from '@kitiumai/logger';

export type GraphQLRequest = {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
};

export type GraphQLResponse = {
  data?: unknown;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
    extensions?: Record<string, unknown>;
  }>;
  extensions?: Record<string, unknown>;
};

export type GraphQLMock = {
  operationName?: string;
  query?: string | RegExp;
  variables?: Record<string, unknown> | ((variables: Record<string, unknown>) => boolean);
  response: GraphQLResponse | (() => GraphQLResponse);
  delay?: number;
};

/**
 * GraphQL mock registry with contract testing support
 */
export class GraphQLMockRegistry {
  private mocks: GraphQLMock[] = [];
  private requests: Array<GraphQLRequest & { timestamp: number; traceId?: string }> = [];
  private readonly logger = getLogger();

  /**
   * Register a GraphQL mock
   */
  register(mock: GraphQLMock): void {
    this.mocks.push(mock);
  }

  /**
   * Mock a GraphQL query
   */
  mockQuery(
    operationName: string,
    response: GraphQLResponse | (() => GraphQLResponse),
    options?: {
      query?: string | RegExp;
      variables?: Record<string, unknown> | ((variables: Record<string, unknown>) => boolean);
      delay?: number;
    }
  ): void {
    const mock: GraphQLMock = {
      operationName,
      response,
    };
    if (options?.query !== undefined) {
      mock.query = options.query;
    }
    if (options?.variables !== undefined) {
      mock.variables = options.variables;
    }
    if (options?.delay !== undefined) {
      mock.delay = options.delay;
    }
    this.register(mock);
  }

  /**
   * Mock a GraphQL mutation
   */
  mockMutation(
    operationName: string,
    response: GraphQLResponse | (() => GraphQLResponse),
    options?: {
      query?: string | RegExp;
      variables?: Record<string, unknown> | ((variables: Record<string, unknown>) => boolean);
      delay?: number;
    }
  ): void {
    const mock: GraphQLMock = {
      operationName,
      response,
    };
    if (options?.query !== undefined) {
      mock.query = options.query;
    }
    if (options?.variables !== undefined) {
      mock.variables = options.variables;
    }
    if (options?.delay !== undefined) {
      mock.delay = options.delay;
    }
    this.register(mock);
  }

  /**
   * Handle GraphQL request
   */
  async handleRequest(request: GraphQLRequest): Promise<GraphQLResponse> {
    const context = contextManager.getContext();
    const timestamp = Date.now();

    // Record request
    this.requests.push({
      ...request,
      timestamp,
      traceId: context.traceId,
    });

    // Find matching mock
    const mock = this.findMatchingMock(request);

    if (!mock) {
      this.logger.warn('No GraphQL mock found for request', {
        operationName: request.operationName,
        query: request.query.substring(0, 100),
        traceId: context.traceId,
      });

      return {
        errors: [
          {
            message: `No mock found for operation: ${request.operationName ?? 'unknown'}`,
          },
        ],
      };
    }

    // Apply delay if specified
    if (mock.delay) {
      await new Promise((resolve) => setTimeout(resolve, mock.delay));
    }

    // Get response
    const response = typeof mock.response === 'function' ? mock.response() : mock.response;

    this.logger.debug('GraphQL mock response', {
      operationName: request.operationName,
      hasData: !!response.data,
      hasErrors: !!response.errors,
      traceId: context.traceId,
    });

    return response;
  }

  /**
   * Get all recorded requests
   */
  getRequests(): Array<GraphQLRequest & { timestamp: number; traceId?: string }> {
    return [...this.requests];
  }

  /**
   * Get requests by operation name
   */
  getRequestsByOperation(
    operationName: string
  ): Array<GraphQLRequest & { timestamp: number; traceId?: string }> {
    return this.requests.filter((request) => request.operationName === operationName);
  }

  /**
   * Get requests by trace ID
   */
  getRequestsByTraceId(
    traceId: string
  ): Array<GraphQLRequest & { timestamp: number; traceId?: string }> {
    return this.requests.filter((request) => request.traceId === traceId);
  }

  /**
   * Clear all mocks and requests
   */
  clear(): void {
    this.mocks = [];
    this.requests = [];
  }

  /**
   * Validate GraphQL contract (schema compliance)
   */
  validateContract(
    request: GraphQLRequest,
    _schema?: unknown
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!request.query || request.query.trim().length === 0) {
      errors.push('Query is required');
    }

    // Schema validation would go here (requires GraphQL schema parser)
    // For now, we'll do basic structure validation

    return {
      valid: errors.length === 0,
      errors,
    };
  }
  private findMatchingMock(request: GraphQLRequest): GraphQLMock | undefined {
    return this.mocks.find((m) => {
      // Match operation name
      if (m.operationName && request.operationName !== m.operationName) {
        return false;
      }

      // Match query
      if (m.query) {
        if (typeof m.query === 'string') {
          if (!request.query.includes(m.query)) {
            return false;
          }
        } else if (!m.query.test(request.query)) {
          return false;
        }
      }

      // Match variables
      if (m.variables && request.variables) {
        if (typeof m.variables === 'function') {
          if (!m.variables(request.variables)) {
            return false;
          }
        } else {
          const mockVariables = m.variables as Record<string, unknown>;
          const variablesMatch = Object.keys(mockVariables).every((key) => {
            return request.variables?.[key] === mockVariables[key];
          });
          if (!variablesMatch) {
            return false;
          }
        }
      }

      return true;
    });
  }
}

/**
 * Global GraphQL mock registry
 */
let globalGraphQLRegistry: GraphQLMockRegistry | null = null;

export function getGraphQLMockRegistry(): GraphQLMockRegistry {
  globalGraphQLRegistry ??= new GraphQLMockRegistry();
  return globalGraphQLRegistry;
}

/**
 * Create a GraphQL fetch mock
 */
export function createGraphQLFetchMock(
  registry: GraphQLMockRegistry = getGraphQLMockRegistry()
): jest.Mock {
  return jest.fn(async (_url: string, options?: RequestInit) => {
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const request: GraphQLRequest = {
      query: body.query ?? '',
      variables: body.variables,
      operationName: body.operationName,
    };

    const response = await registry.handleRequest(request);

    return {
      ok: !response.errors || response.errors.length === 0,
      status: response.errors ? 400 : 200,
      statusText: response.errors ? 'Bad Request' : 'OK',
      json: async () => Promise.resolve(response),
      text: async () => Promise.resolve(JSON.stringify(response)),
    } as Response;
  });
}
