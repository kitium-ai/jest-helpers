/**
 * Console utilities for Jest testing
 * Re-exports console utilities from @kitiumai/logger and context-aware helpers
 */

// Re-export from logger for console capture
export type { ConsoleCapture, ConsoleCaptureEntry, ConsoleCaptureOptions } from '@kitiumai/logger';
export { captureConsole, restoreConsole } from '@kitiumai/logger';

// Context-aware console utilities (Jest-specific)
export type { ContextAwareConsoleCapture, ContextAwareConsoleOutput } from './context-aware';
export { captureConsoleWithContext, setupContextAwareConsole } from './context-aware';
