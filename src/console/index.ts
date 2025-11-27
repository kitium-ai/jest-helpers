/**
 * Console utilities for Jest testing
 * Re-exports context-aware console utilities
 */

export type {
  ConsoleCapture,
  ConsoleCaptureEntry,
  ConsoleCaptureOptions,
  ContextAwareConsoleCapture,
  ContextAwareConsoleOutput,
} from './context-aware';
export { captureConsoleWithContext, setupContextAwareConsole } from './context-aware';

// Re-export for backward compatibility
export { restoreConsole } from '@kitiumai/logger';
