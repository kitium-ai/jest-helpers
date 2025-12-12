/**
 * Contract testing utilities for API testing
 * Request recording and replay capabilities
 */

import { contextManager } from '@kitiumai/logger';

import type { HttpRequest, HttpResponse } from './index';
import { getInternalLogger } from '../internal-logger.js';

export type RecordedRequest = {
  timestamp: number;
  traceId?: string;
  spanId?: string;
  response?: HttpResponse;
  duration?: number;
} & HttpRequest;

export type ContractSpec = {
  name: string;
  requests: RecordedRequest[];
  assertions?: Array<{
    type: 'status' | 'header' | 'body' | 'timing';
    path: string;
    expected: unknown;
  }>;
};

/**
 * Request recorder for contract testing
 */
export class RequestRecorder {
  private requests: RecordedRequest[] = [];
  private readonly logger = getInternalLogger();

  /**
   * Record a request
   */
  record(request: HttpRequest, response?: HttpResponse, duration?: number): void {
    const context = contextManager.getContext();
    const recorded: RecordedRequest = {
      ...request,
      timestamp: Date.now(),
      traceId: context.traceId,
      ...(context.spanId !== undefined && { spanId: context.spanId }),
      ...(response !== undefined && { response }),
      ...(duration !== undefined && { duration }),
    };

    this.requests.push(recorded);

    this.logger.debug('Request recorded', {
      method: request.method,
      url: request.url,
      traceId: context.traceId,
      status: response?.status,
    });
  }

  /**
   * Get all recorded requests
   */
  getAll(): RecordedRequest[] {
    return [...this.requests];
  }

  /**
   * Get requests by method
   */
  getByMethod(method: string): RecordedRequest[] {
    return this.requests.filter((request) => request.method.toUpperCase() === method.toUpperCase());
  }

  /**
   * Get requests by URL pattern
   */
  getByUrl(pattern: string | RegExp): RecordedRequest[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.requests.filter((request) => regex.test(request.url));
  }

  /**
   * Get requests by trace ID
   */
  getByTraceId(traceId: string): RecordedRequest[] {
    return this.requests.filter((request) => request.traceId === traceId);
  }

  /**
   * Export requests as contract spec
   */
  exportContract(name: string): ContractSpec {
    return {
      name,
      requests: this.getAll(),
    };
  }

  /**
   * Clear all recorded requests
   */
  clear(): void {
    this.requests = [];
  }

  /**
   * Assert contract compliance
   */
  assertContract(spec: ContractSpec): {
    passed: boolean;
    failures: string[];
  } {
    const failures: string[] = [];

    // Match requests
    for (const specRequest of spec.requests) {
      const matching = this.requests.find((request) => {
        return (
          request.method === specRequest.method &&
          request.url === specRequest.url &&
          Math.abs(request.timestamp - specRequest.timestamp) < 1000 // Within 1 second
        );
      });

      if (!matching) {
        failures.push(`Request not found: ${specRequest.method} ${specRequest.url}`);
        continue;
      }

      // Validate assertions if provided
      if (spec.assertions) {
        for (const assertion of spec.assertions) {
          this.checkAssertion(assertion, matching, failures);
        }
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  private checkAssertion(
    assertion: {
      type: 'status' | 'header' | 'body' | 'timing';
      path: string;
      expected: unknown;
    },
    matching: RecordedRequest,
    failures: string[]
  ): void {
    switch (assertion.type) {
      case 'status':
        if (matching.response?.status !== assertion.expected) {
          failures.push(
            `Status mismatch for ${assertion.path}: expected ${assertion.expected}, got ${matching.response?.status}`
          );
        }
        break;
      case 'header':
        const headerValue = matching.response?.headers?.[assertion.path];
        if (headerValue !== assertion.expected) {
          failures.push(
            `Header mismatch for ${assertion.path}: expected ${assertion.expected}, got ${headerValue}`
          );
        }
        break;
      case 'body':
        if (JSON.stringify(matching.response?.data) !== JSON.stringify(assertion.expected)) {
          failures.push(`Body mismatch for ${assertion.path}`);
        }
        break;
      case 'timing':
        if (matching.duration && matching.duration > (assertion.expected as number)) {
          failures.push(
            `Timing violation for ${assertion.path}: ${matching.duration}ms > ${assertion.expected}ms`
          );
        }
        break;
    }
  }
}

/**
 * Global request recorder
 */
let globalRecorder: RequestRecorder | null = null;

export function getRequestRecorder(): RequestRecorder {
  globalRecorder ??= new RequestRecorder();
  return globalRecorder;
}
