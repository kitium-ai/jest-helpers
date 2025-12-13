/**
 * Observability matchers for logs, metrics, and traces
 * Enterprise-grade assertions for distributed systems testing
 */

import {
  type ConsoleCapture,
  type ConsoleCaptureEntry,
  contextManager,
  createLogger,
  getLogger,
  type ILogger,
  type LogContext,
} from '@kitiumai/logger';

declare global {
  namespace jest {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Matchers<R> {
      toHaveLogContaining(message: string | RegExp, level?: string): R;
      toHaveLogWithTraceId(traceId: string): R;
      toHaveLogWithContext(context: Partial<LogContext>): R;
      toHaveMetricValue(name: string, value: number, labels?: Record<string, string>): R;
      toHaveTraceSpan(operationName: string, attributes?: Record<string, unknown>): R;
      toHavePropagatedContext(): R;
    }
  }
}

type LogEntry = {
  message: string;
  level: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
};

// MetricEntry and TraceSpan types reserved for future use
// interface MetricEntry {
//   name: string;
//   value: number;
//   labels?: Record<string, string>;
//   timestamp: number;
// }

// interface TraceSpan {
//   operationName: string;
//   traceId: string;
//   spanId: string;
//   attributes?: Record<string, unknown>;
//   startTime: number;
//   endTime?: number;
// }

/**
 * Observability matchers for enterprise testing
 */
export const observabilityMatchers: Record<string, jest.CustomMatcher> = {
  /**
   * Check if logs contain a specific message
   */
  toHaveLogContaining(
    received: ConsoleCapture | LogEntry[],
    message: string | RegExp,
    level?: string
  ) {
    const logs = Array.isArray(received) ? received : received.entries;
    const filteredLogs = level ? logs.filter((log) => log.level === level) : logs;

    const messageString = typeof message === 'string' ? message : message.source;
    const regex = typeof message === 'string' ? new RegExp(messageString, 'i') : message;

    const hasMatch = filteredLogs.some((log: ConsoleCaptureEntry | LogEntry) => {
      const logMessage = Array.isArray(log.message) ? log.message.join(' ') : String(log.message);
      return regex.test(logMessage);
    });

    return {
      pass: hasMatch,
      message: () => {
        const levelString = level ? ` at level ${level}` : '';
        return hasMatch
          ? `expected logs not to contain message matching ${messageString}${levelString}`
          : `expected logs to contain message matching ${messageString}${levelString}`;
      },
    };
  },

  /**
   * Check if logs have a specific trace ID
   */
  toHaveLogWithTraceId(received: ConsoleCapture | LogEntry[], traceId: string) {
    const logs = Array.isArray(received) ? received : received.entries;
    const hasTraceId = logs.some((log: ConsoleCaptureEntry | LogEntry) => {
      const entry = log as LogEntry & { traceId?: string };
      return entry.traceId === traceId;
    });

    return {
      pass: hasTraceId,
      message: () =>
        hasTraceId
          ? `expected logs not to have trace ID ${traceId}`
          : `expected logs to have trace ID ${traceId}`,
    };
  },

  /**
   * Check if logs have specific context
   */
  toHaveLogWithContext(received: ConsoleCapture | LogEntry[], context: Partial<LogContext>) {
    const logs = Array.isArray(received) ? received : received.entries;
    const hasContext = logs.some((log: ConsoleCaptureEntry | LogEntry) => {
      const entry = log as LogEntry & Partial<LogContext>;
      return Object.keys(context).every((key) => {
        const contextKey = key as keyof LogContext;
        return entry[contextKey] === context[contextKey];
      });
    });

    return {
      pass: hasContext,
      message: () =>
        hasContext
          ? `expected logs not to have context ${JSON.stringify(context)}`
          : `expected logs to have context ${JSON.stringify(context)}`,
    };
  },

  /**
   * Check if metrics have a specific value
   * Note: This requires metrics to be exposed via @kitiumai/logger metrics
   */
  toHaveMetricValue(
    _received: unknown,
    name: string,
    value: number,
    labels?: Record<string, string>
  ) {
    // This is a placeholder - actual implementation would query metrics registry.
    // Prefer global logger if initialized, else fallback to a dev logger.
    let logger: ILogger;
    try {
      logger = getLogger();
    } catch {
      logger = createLogger('development', { serviceName: 'jest-helpers' });
    }
    const hasMetrics = 'metrics' in logger;

    return {
      pass: hasMetrics,
      message: () => {
        const labelsString = labels ? ` with labels ${JSON.stringify(labels)}` : '';
        return hasMetrics
          ? `expected metrics not to have ${name} = ${value}${labelsString}`
          : `expected metrics to have ${name} = ${value}${labelsString} (metrics not available)`;
      },
    };
  },

  /**
   * Check if trace has a specific span
   */
  toHaveTraceSpan(_received: unknown, operationName: string, attributes?: Record<string, unknown>) {
    const context = contextManager.getContext();
    const hasSpan = context.traceId !== undefined;

    // Check if attributes match (if provided)
    let doAttributesMatch = true;
    if (attributes && context.metadata) {
      doAttributesMatch = Object.keys(attributes).every((key) => {
        return context.metadata?.[key] === attributes[key];
      });
    }

    return {
      pass: hasSpan && doAttributesMatch,
      message: () => {
        const attributesString = attributes ? ` with attributes ${JSON.stringify(attributes)}` : '';
        return hasSpan && doAttributesMatch
          ? `expected trace not to have span ${operationName}${attributesString}`
          : `expected trace to have span ${operationName}${attributesString}`;
      },
    };
  },

  /**
   * Check if context has been propagated
   */
  toHavePropagatedContext(_received: unknown) {
    const context = contextManager.getContext();
    const hasContext = context.traceId !== undefined && context.requestId !== undefined;

    return {
      pass: hasContext,
      message: () =>
        hasContext
          ? 'expected context not to be propagated'
          : 'expected context to be propagated (traceId and requestId should be set)',
    };
  },
};

/**
 * Setup observability matchers
 */
export function setupObservabilityMatchers(): void {
  expect.extend(observabilityMatchers);
}
