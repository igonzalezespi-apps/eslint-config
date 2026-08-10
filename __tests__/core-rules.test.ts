import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig from '../base.mjs';

/**
 * Behavioral pins for the studio `base` preset. These lint real snippets
 * through the assembled flat config (not a single rule in isolation) so that
 * a regression in the security / sonarjs / TS layers or in rule ordering is
 * caught.
 */
const lintSnippet = async (code: string, filePath = 'src/example.ts'): Promise<string[]> => {
  const eslint = new ESLint({ overrideConfigFile: true, baseConfig: baseConfig as never });
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) {
    throw new Error('ESLint.lintText returned no result for the linted snippet');
  }
  return result.messages.map((m) => m.ruleId ?? '(fatal)');
};

describe('studio base preset — TypeScript layer', () => {
  it('flags `any` via @typescript-eslint/no-explicit-any', async () => {
    const ruleIds = await lintSnippet('export const x: any = 1;\n');
    expect(ruleIds).toContain('@typescript-eslint/no-explicit-any');
  });

  it('flags loose equality via eqeqeq', async () => {
    const ruleIds = await lintSnippet('export const x = (1 as number) == (2 as number);\n');
    expect(ruleIds).toContain('eqeqeq');
  });

  it('does not flag clean, fully-typed code', async () => {
    const ruleIds = await lintSnippet(
      'export function add(a: number, b: number): number {\n  return a + b;\n}\n'
    );
    expect(ruleIds).not.toContain('@typescript-eslint/no-explicit-any');
    expect(ruleIds).not.toContain('eqeqeq');
    expect(ruleIds).not.toContain('(fatal)');
  });
});

describe('studio base preset — security layer', () => {
  it('warns on child_process usage via eslint-plugin-security', async () => {
    const ruleIds = await lintSnippet(
      "import { exec } from 'node:child_process';\nexport const run = (c: string): void => exec(c);\n"
    );
    expect(ruleIds).toContain('security/detect-child-process');
  });
});

describe('studio base preset — test-file overrides', () => {
  it('relaxes cognitive-complexity inside test files', async () => {
    // A test file should not be linted for sonarjs/cognitive-complexity.
    const ruleIds = await lintSnippet('export const t = 1;\n', 'src/thing.test.ts');
    expect(ruleIds).not.toContain('sonarjs/cognitive-complexity');
  });
});
