/**
 * Shared error-handler wiring for Jest environments.
 * SRP: attach process/console handlers based on options.
 */

import type { ILogger } from '@kitiumai/logger';

export type ErrorHandlerOptions = {
  logger: ILogger;
  shouldFailOnUnhandledRejection: boolean;
  shouldFailOnConsoleError: boolean;
};

export function setupErrorHandlers(options: ErrorHandlerOptions): void {
  const { logger, shouldFailOnUnhandledRejection, shouldFailOnConsoleError } = options;

  if (shouldFailOnUnhandledRejection) {
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection in test', {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
      throw reason;
    });
  }

  if (shouldFailOnConsoleError) {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      logger.error('Console error in test', {
        message: args.map(String).join(' '),
      });
      originalError(...args);
      throw new Error('Console error detected in test');
    };
  }
}
