/**
 * Normalize console capture outputs.
 */

export function extractConsoleEntries(
  capture: { entries?: unknown; getEntries?: () => unknown } | null | undefined
): Array<Record<string, unknown>> {
  if (!capture) {
    return [];
  }

  if (Array.isArray(capture.entries)) {
    return capture.entries as Array<Record<string, unknown>>;
  }

  if (typeof capture.getEntries === 'function') {
    const entries = capture.getEntries();
    if (Array.isArray(entries)) {
      return entries as Array<Record<string, unknown>>;
    }
  }

  return [];
}
