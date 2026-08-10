import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig from '../base.mjs';

/**
 * The five sonarjs rules that detect COMMITTED SECRETS were globally off under a
 * comment claiming they overlapped with eslint-plugin-security. Verified rule by
 * rule: that plugin has fourteen rules and NONE of them looks for a hardcoded
 * secret, password or IP address. The claim was true for `code-eval`,
 * `os-command` and `pseudo-random`, and being true for some is exactly what made
 * it invisible.
 *
 * Every case below comes in a PAIR: the rule fires in production code, and the
 * same snippet is silent in a test file. Without the pair, "no finding in tests"
 * does not distinguish the deliberate exclusion from a rule that is simply off
 * again — which is the state this file exists to prevent from recurring.
 */
const lintSnippet = async (code: string, filePath: string): Promise<string[]> => {
  const eslint = new ESLint({ overrideConfigFile: true, baseConfig: baseConfig as never });
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) {
    throw new Error('ESLint.lintText returned no result for the linted snippet');
  }
  return result.messages.map((m) => m.ruleId ?? '(fatal)');
};

const PROD = 'src/example.ts';
const TEST = 'src/__tests__/example.test.ts';

const CASES: { rule: string; code: string }[] = [
  {
    rule: 'sonarjs/no-hardcoded-passwords',
    code: 'export const password = "s3cr3t-p4ssw0rd-value";\n'
  },
  {
    rule: 'sonarjs/no-hardcoded-ip',
    code: 'export const host = "10.24.7.31";\n'
  },
  {
    rule: 'sonarjs/no-clear-text-protocols',
    // NOT `example.com` and NOT a `.test` TLD: the rule deliberately ignores the
    // documentation and testing domains reserved by RFC 2606, so a snippet using
    // them looks like a passing test while proving nothing. Measured — both were
    // silent here before this comment existed.
    code: 'export const endpoint = "http://intranet.corp.local/api";\n'
  }
];

describe('secret detectors — production code', () => {
  for (const { rule, code } of CASES) {
    it(`fires ${rule}`, async () => {
      const ruleIds = await lintSnippet(code, PROD);
      expect(ruleIds).toContain(rule);
    });
  }
});

describe('secret detectors — test files are exempt, deliberately', () => {
  for (const { rule, code } of CASES) {
    it(`does not fire ${rule}`, async () => {
      const ruleIds = await lintSnippet(code, TEST);
      expect(ruleIds).not.toContain(rule);
    });
  }
});

describe('the exemption is scoped to tests, not global', () => {
  it('a file merely named like a test elsewhere still gets linted', async () => {
    // `src/testing/helpers.ts` is production code that happens to sit under a
    // directory starting with "test". It must NOT inherit the exemption: the
    // glob is `**/test/**`, not `**/test*/**`.
    const ruleIds = await lintSnippet(CASES[0]!.code, 'src/testing/helpers.ts');
    expect(ruleIds).toContain('sonarjs/no-hardcoded-passwords');
  });
});
