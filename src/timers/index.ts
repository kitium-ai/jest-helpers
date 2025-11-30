/**
 * Timer and timeout helpers for testing
 * Re-exports framework-agnostic utilities from @kitiumai/test-core
 */

// Re-export framework-agnostic timer utilities from test-core
export {
  assertExecutionTime,
  debounce,
  measureTime,
  sleep,
  throttle,
  timeout,
  withTimeout,
} from '@kitiumai/test-core';

export type TimerStats = {
  total: number;
  processed: number;
  pending: number;
};

/**
 * Timer management utilities
 */
export class TimerManager {
  private isUsingFakeTimers = false;
  private timerStats: TimerStats = { total: 0, processed: 0, pending: 0 };

  /**
   * Enable fake timers
   */
  enableFakeTimers(): void {
    if (!this.isUsingFakeTimers) {
      jest.useFakeTimers();
      this.isUsingFakeTimers = true;
    }
  }

  /**
   * Disable fake timers
   */
  disableFakeTimers(): void {
    if (this.isUsingFakeTimers) {
      jest.useRealTimers();
      this.isUsingFakeTimers = false;
      this.timerStats = { total: 0, processed: 0, pending: 0 };
    }
  }

  /**
   * Advance timers by a specific amount
   */
  advanceBy(ms: number): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.advanceTimersByTime(ms);
    this.timerStats.processed += Math.floor(ms / 100); // Rough estimation
  }

  /**
   * Advance to next timer
   */
  advanceToNextTimer(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.runOnlyPendingTimers();
    this.timerStats.processed++;
  }

  /**
   * Advance all timers
   */
  advanceAllTimers(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.runAllTimers();
    this.timerStats.processed = this.timerStats.total;
  }

  /**
   * Clear all timers
   */
  clearAll(): void {
    if (!this.isUsingFakeTimers) {
      throw new Error('Fake timers must be enabled');
    }
    jest.clearAllTimers();
    this.timerStats.pending = 0;
  }

  /**
   * Get current timer statistics
   */
  getStats(): TimerStats {
    return { ...this.timerStats };
  }

  /**
   * Check if fake timers are enabled
   */
  isEnabled(): boolean {
    return this.isUsingFakeTimers;
  }
}

/**
 * Single instance timer manager
 */
const timerManager = new TimerManager();

export function getTimerManager(): TimerManager {
  return timerManager;
}

/**
 * Create a timer manager instance
 */
export function createTimerManager(): TimerManager {
  return new TimerManager();
}

/**
 * Run test with fake timers
 */
export async function runWithFakeTimers<T>(
  testFunction: (timers: TimerManager) => T | Promise<T>
): Promise<T> {
  const manager = createTimerManager();
  manager.enableFakeTimers();

  try {
    return await testFunction(manager);
  } finally {
    manager.disableFakeTimers();
  }
}

// Note: delay and waitFor are kept for backward compatibility
// but users should prefer sleep() and waitFor()/waitForValue() from @kitiumai/test-core

/**
 * Delay promise resolution
 * @deprecated Use sleep() from @kitiumai/test-core/async instead
 */
export function delay<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

/**
 * Wait with condition polling
 * @deprecated Use waitUntil() wrapper in this module or waitFor() from @kitiumai/test-core instead
 */
export async function waitFor(
  condition: () => boolean,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
): Promise<void> {
  const { timeoutMs = 5000, intervalMs = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return;
    }
    await delay(intervalMs);
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`);
}
