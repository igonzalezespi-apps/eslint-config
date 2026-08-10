import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import baseConfig from '../base.mjs';
import { extractRuleOptions } from './helpers/extract-rule-options';

/**
 * Regression pin for the jsdoc param rules on destructured props.
 *
 * With `checkDestructured` left at its default on `jsdoc/check-param-names`, the
 * auto-fix of this preset contradicted itself on the canonical React component
 * shape `function C({ a, b }: Props)`: `jsdoc/require-param` (a warning, and
 * already `checkDestructured: false`) inserts a block documenting only the root
 * parameter (`@param root0`), and `jsdoc/check-param-names` (an ERROR) then
 * demanded `@param root0.a` / `@param root0.b`, which no fixer ever writes.
 * `eslint --fix` therefore turned a warning into errors, rewrote the file, and
 * stayed red on every later pass — an impassable fix-on-commit hook for every
 * destructured-props component.
 *
 * These cases assert the *behaviour* (fix output + idempotency), not just the
 * option value, and keep a case proving the rule is still live for the
 * non-destructured shape it is meant to police.
 */

// Virtual filenames handed to ESLint must be absolute and anchored inside this
// repo — sonarjs walks up looking for the closest package.json and throws if it
// walks past the root (see cjs-globals.test.ts).
const here = path.dirname(fileURLToPath(import.meta.url));
const virtualFile = (name: string): string => path.join(here, name);

const COMPONENT = [
  'interface Item {',
  '  id: string;',
  '  label: string;',
  '}',
  '',
  'interface BadgeProps {',
  '  item: Item;',
  '  onSelect: (id: string) => void;',
  '}',
  '',
  'export function Badge({ item, onSelect }: BadgeProps) {',
  '  return <button type="button" onClick={() => onSelect(item.id)}>{item.label}</button>;',
  '}',
  ''
].join('\n');

interface FixOutcome {
  /** Source after ESLint applied every fix it could, or the input when nothing changed. */
  text: string;
  /** Whether ESLint rewrote the source at all in this pass. */
  changed: boolean;
  errorIds: string[];
}

/**
 * Lint one source text through the assembled base preset with `--fix` semantics.
 * @param code - The source to lint.
 * @param filePath - Virtual path deciding which `files:` blocks apply.
 * @returns The fixed text plus the rule ids that were reported at error severity.
 */
const lintAndFix = async (code: string, filePath: string): Promise<FixOutcome> => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    baseConfig: baseConfig as never,
    fix: true
  });
  const [result] = await eslint.lintText(code, { filePath });
  if (!result) {
    throw new Error('ESLint.lintText returned no result for the linted snippet');
  }
  return {
    text: result.output ?? code,
    changed: result.output !== undefined,
    errorIds: result.messages.filter((m) => m.severity === 2).map((m) => m.ruleId ?? '(fatal)')
  };
};

describe('base preset — jsdoc param rules on destructured props', () => {
  it('pins checkDestructured:false on BOTH param rules (one alone re-creates the loop)', () => {
    expect(extractRuleOptions(baseConfig as never, '**/*.ts', 'jsdoc/check-param-names')).toEqual([
      'error',
      { checkDestructured: false }
    ]);
    expect(extractRuleOptions(baseConfig as never, '**/*.ts', 'jsdoc/require-param')).toEqual([
      'warn',
      { checkDestructured: false, checkDestructuredRoots: false }
    ]);
  });

  /**
   * The gap this suite had while it was green.
   *
   * The case below asserted `not.toMatch(/@param\s+root0\./)` — with a trailing DOT — so it
   * caught the `root0.<prop>` demands that made the fixer loop, and missed the bare
   * `@param root0` the fixer still injected. Measured 2026-08-09 in a private consumer
   * against v0.2.1: dropping that repo's local override left `--fix` at zero errors AND
   * idempotent, yet it rewrote 20 components and added 30 empty `@param root0` lines.
   *
   * Zero errors plus idempotency is not the same as correct: a stable wrong output is exactly
   * what neither of those two properties can see. Hence a case on the tag itself.
   */
  it('never injects a bare @param root0 either (the props are typed already)', async () => {
    const first = await lintAndFix(COMPONENT, virtualFile('Badge.tsx'));
    expect(first.text).not.toMatch(/@param\s+root0\b/);
  });

  it('leaves a destructured-props component with ZERO errors after --fix', async () => {
    const first = await lintAndFix(COMPONENT, virtualFile('Badge.tsx'));
    expect(first.errorIds).toEqual([]);
  });

  it('never asks for a @param the fixer will not write (no root0.<prop> demands)', async () => {
    const first = await lintAndFix(COMPONENT, virtualFile('Badge.tsx'));
    expect(first.text).not.toMatch(/@param\s+root0\./);
    expect(first.errorIds).not.toContain('jsdoc/check-param-names');
  });

  it('is idempotent: the second --fix pass changes nothing and stays green', async () => {
    const first = await lintAndFix(COMPONENT, virtualFile('Badge.tsx'));
    const second = await lintAndFix(first.text, virtualFile('Badge.tsx'));
    expect(second.changed).toBe(false);
    expect(second.text).toBe(first.text);
    expect(second.errorIds).toEqual([]);
  });

  it('still flags a documented param that does not exist (rule is relaxed, not disabled)', async () => {
    const code = [
      '/**',
      ' * Adds two numbers.',
      ' * @param a - First addend.',
      ' * @param wrongName - Second addend.',
      ' * @returns The sum.',
      ' */',
      'export function add(a: number, b: number): number {',
      '  return a + b;',
      '}',
      ''
    ].join('\n');
    const outcome = await lintAndFix(code, virtualFile('add.ts'));
    expect(outcome.errorIds).toContain('jsdoc/check-param-names');
  });
});
