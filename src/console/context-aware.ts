/**
 * Jest-specific wrapper for context-aware console capture
 * Uses @kitiumai/logger's console capture utilities
 */

import {
  captureConsole,
  contextManager,
  type ConsoleCapture,
  type ConsoleCaptureOptions,
} from '@kitiumai/logger';

// Re-export types for convenience
export type { ConsoleCapture, ConsoleCaptureEntry, ConsoleCaptureOptions } from '@kitiumai/logger';

// Alias for Jest-specific usage
export type ContextAwareConsoleCapture = ConsoleCapture;
export type ContextAwareConsoleOutput = ConsoleCapture['entries'][number];

/**
 * Capture console output with context propagation (Jest wrapper)
 * Uses @kitiumai/logger's captureConsole under the hood
 */
export function captureConsoleWithContext(
  options: ConsoleCaptureOptions = {}
): ContextAwareConsoleCapture {
  return captureConsole(options);
}

/**
 * Setup context-aware console capture in Jest test hooks
 * Jest-specific wrapper that integrates with Jest's test lifecycle
 */
export function setupContextAwareConsole(options: ConsoleCaptureOptions = {}): {
  beforeEach: () => void;
  afterEach: () => void;
  getCapture: () => ContextAwareConsoleCapture;
} {
  let consoleCapture: ContextAwareConsoleCapture | null = null;

  return {
    beforeEach() {
      // Initialize test context with Jest-specific metadata
      const testContext = contextManager.initContext({
        requestId: `test-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        metadata: {
          testName: expect.getState().currentTestName ?? 'unknown',
          testPath: expect.getState().testPath ?? 'unknown',
        },
      });
      contextManager.run(testContext, () => {
        consoleCapture = captureConsoleWithContext(options);
      });
    },
    afterEach() {
      if (consoleCapture) {
        // Optionally export to logger before clearing
        if (options.autoLogToLogger) {
          consoleCapture.exportToLogger();
        }
        consoleCapture.clear();
        consoleCapture = null;
      }
    },
    getCapture() {
      if (!consoleCapture) {
        throw new Error('Console capture not initialized. Call beforeEach first.');
      }
      return consoleCapture;
    },
  };
}
