import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig from '../base.mjs';

/**
 * `publicly-writable-directories` was turned on together with the five secret
 * detectors, but the measurement that justified that change only covered the
 * five — and the block held six rules. Measured afterwards on the largest
 * consumer: 143 findings, all of them in test files, none in production.
 * Writing to /tmp is what a test is supposed to do.
 *
 * The pair below is what would have caught it: it must fire in production and
 * be silent in a test. It surfaced late in the first place because
 * `turbo run lint` served a CACHE HIT and reported green; only `--force`
 * revealed 6 of 9 packages failing.
 */
const lintSnippet = async (code: string, filePath: string): Promise<string[]> => {
  const eslint = new ESLint({ overrideConfigFile: true, baseConfig: baseConfig as never });
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) {
    throw new Error('ESLint.lintText returned no result for the linted snippet');
  }
  return result.messages.map((m) => m.ruleId ?? '(fatal)');
};

const CODE = 'export const cacheDir = "/tmp/mirror-cache";\n';
const RULE = 'sonarjs/publicly-writable-directories';

describe('publicly-writable-directories', () => {
  it('fires in production code', async () => {
    expect(await lintSnippet(CODE, 'src/example.ts')).toContain(RULE);
  });

  it('is silent in a test file — writing to /tmp is what a test does', async () => {
    expect(await lintSnippet(CODE, 'src/__tests__/example.test.ts')).not.toContain(RULE);
  });
});
