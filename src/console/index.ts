/**
 * Console utilities for Jest testing
 * Re-exports context-aware console utilities
 */

export { captureConsoleWithContext, setupContextAwareConsole } from './context-aware';
export type {
  ConsoleCapture,
  ConsoleCaptureEntry,
  ConsoleCaptureOptions,
  ContextAwareConsoleCapture,
  ContextAwareConsoleOutput,
} from './context-aware';

// Re-export for backward compatibility
export { restoreConsole } from '@kitiumai/logger';
