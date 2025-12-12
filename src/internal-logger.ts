/**
 * Internal logger for jest-helpers.
 * Avoids relying on the global logger (which requires initializeLogger).
 */

import { createLogger, type ILogger, type LoggerConfig } from '@kitiumai/logger';

let internalLogger: ILogger | null = null;

export function getInternalLogger(overrides?: Partial<LoggerConfig>): ILogger {
  if (!internalLogger) {
    internalLogger = createLogger('development', {
      serviceName: 'jest-helpers',
      ...overrides,
    });
  }
  return internalLogger;
}

