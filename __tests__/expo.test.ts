import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import expoConfig from '../expo.mjs';

/**
 * Regression pin for the studio `expo` preset.
 *
 * The TS rule tuning layered on top of eslint-config-expo must be scoped to
 * `**\/*.{ts,tsx}`. eslint-config-expo registers the typescript-eslint plugin
 * only on TS files, so an unscoped `@typescript-eslint/*` rule makes ESLint
 * abort config resolution on any non-TS file (`babel.config.js`,
 * `metro.config.js`) with "could not find plugin @typescript-eslint".
 *
 * This asserts on config *resolution* specifically: the plugin-not-found error
 * is thrown before any rule runs, so the check is decoupled from individual
 * plugin rule behaviour (e.g. eslint-plugin-react vs the running ESLint major).
 */
const pluginResolutionError = (filename: string): string | null => {
  const linter = new Linter({ configType: 'flat' });
  try {
    linter.verify('', expoConfig as never, { filename });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Only the plugin-resolution failure is in scope for this regression; rule
    // execution errors from other plugins are a separate concern.
    return /could not find plugin/i.test(message) ? message : null;
  }
};

describe('studio expo preset — TS rules scoped to TS files', () => {
  it('does not reference @typescript-eslint out of scope on babel.config.js', () => {
    expect(pluginResolutionError('babel.config.js')).toBeNull();
  });

  it('does not reference @typescript-eslint out of scope on metro.config.js', () => {
    expect(pluginResolutionError('metro.config.js')).toBeNull();
  });

  it('resolves cleanly for a TS file', () => {
    expect(pluginResolutionError('src/example.ts')).toBeNull();
  });
});
