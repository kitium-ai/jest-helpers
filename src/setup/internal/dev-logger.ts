/**
 * Create a development logger instance for tests.
 * Keeps strict-mode / setup independent from global logger initialization.
 */

import { createLogger, LogLevel, type ILogger } from '@kitiumai/logger';

export function createDevTestLogger(logLevel: LogLevel = LogLevel.INFO): ILogger {
  return createLogger('development', { serviceName: 'jest-helpers', logLevel });
}

