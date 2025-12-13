/**
 * Create a development logger instance for tests.
 * Keeps strict-mode / setup independent from global logger initialization.
 */

import { createLogger, type ILogger, LogLevel } from '@kitiumai/logger';

export function createDevelopmentTestLogger(logLevel: LogLevel = LogLevel.INFO): ILogger {
  return createLogger('development', { serviceName: 'jest-helpers', logLevel });
}
