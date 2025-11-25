/**
 * Async and stream testing utilities
 * Re-exports common utilities from @kitiumai/test-core and adds Jest-specific helpers
 */

// Re-export from test-core
import { retry, waitUntil, sleep } from '@kitiumai/test-core';
export { retry, waitUntil, sleep };

/**
 * Alias for sleep from test-core (for convenience)
 */
export const delay = sleep;

/**
 * Alias for waitUntil from test-core (for convenience)
 * Note: Uses pollIntervalMs parameter (not interval) to match test-core's waitUntil signature
 */
export const waitForCondition = waitUntil;

/**
 * Consume an async iterator/stream and collect all values
 */
export async function consumeStream<T>(
  stream: AsyncIterable<T>,
  options: {
    filter?: (value: T) => boolean;
    limit?: number;
    timeout?: number;
  } = {}
): Promise<T[]> {
  const { filter, limit, timeout = 5000 } = options;
  const results: T[] = [];
  const startTime = Date.now();

  try {
    for await (const value of stream) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Stream consumption timed out after ${timeout}ms`);
      }

      if (!filter || filter(value)) {
        results.push(value);
      }

      if (limit && results.length >= limit) {
        break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw error;
    }
    // Re-throw other errors
    throw error;
  }

  return results;
}

/**
 * Create a mock async generator/stream
 */
export function createMockStream<T>(
  values: T[],
  options: {
    delay?: number;
    errorAfter?: number;
    error?: Error;
  } = {}
): AsyncGenerator<T, void, unknown> {
  const { delay: delayMs = 0, errorAfter, error } = options;
  let index = 0;

  return (async function* (): AsyncGenerator<T, void, unknown> {
    while (index < values.length) {
      if (errorAfter && index >= errorAfter) {
        throw error ?? new Error('Mock stream error');
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }

      const value = values[index++];
      if (value !== undefined) {
        yield value;
      }
    }
  })();
}

/**
 * Wait for a promise with timeout
 */
export async function waitForPromise<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  message?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(message ?? `Promise timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Safe async cleanup helper
 */
export async function safeCleanup(cleanupFn: () => void | Promise<void>): Promise<void> {
  try {
    await cleanupFn();
  } catch (error) {
    // Ignore cleanup errors
    if (process.env['DEBUG']) {
      // Use @kitiumai/logger for debug logging
      const { getLogger } = await import('@kitiumai/logger');
      getLogger().debug('Cleanup error (ignored)', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Run test with automatic cleanup
 */
export async function withCleanup<T>(
  setup: () => T | Promise<T>,
  cleanup: (data: T) => void | Promise<void>,
  testFn: (data: T) => Promise<void> | void
): Promise<void> {
  const data = await setup();
  try {
    await testFn(data);
  } finally {
    await safeCleanup(() => cleanup(data));
  }
}

/**
 * Collect all values from an async iterator with timeout
 */
export async function collectAsyncIterator<T>(
  iterator: AsyncIterator<T>,
  timeoutMs = 5000
): Promise<T[]> {
  const results: T[] = [];
  const startTime = Date.now();

  while (true) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Iterator collection timed out after ${timeoutMs}ms`);
    }

    const { value, done } = await iterator.next();
    if (done) {
      break;
    }
    results.push(value);
  }

  return results;
}

/**
 * Test async generator with collected results
 */
export async function testAsyncGenerator<T>(
  generator: AsyncGenerator<T>,
  testFn: (values: T[]) => void | Promise<void>
): Promise<void> {
  const values: T[] = [];
  for await (const value of generator) {
    values.push(value);
  }
  await testFn(values);
}
