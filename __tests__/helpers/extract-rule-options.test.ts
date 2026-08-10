import { describe, expect, it } from 'vitest';

import config from '../../base.mjs';
import { extractRuleOptions } from './extract-rule-options.js';

describe('extractRuleOptions', () => {
  it('extracts the TS-layer no-explicit-any rule by **/*.ts pattern', () => {
    const result = extractRuleOptions(config, '**/*.ts', '@typescript-eslint/no-explicit-any');
    expect(result).toBe('error');
  });

  it('extracts the consistent-type-imports tuple options', () => {
    const result = extractRuleOptions(config, '**/*.ts', '@typescript-eslint/consistent-type-imports');
    expect(result).toBeInstanceOf(Array);
    const [severity, options] = result as [string, { prefer: string; fixStyle: string }];
    expect(severity).toBe('error');
    expect(options.prefer).toBe('type-imports');
    expect(options.fixStyle).toBe('inline-type-imports');
  });

  it('throws when no config object matches the files pattern', () => {
    expect(() =>
      extractRuleOptions(config, 'nonexistent/**/*.ts', '@typescript-eslint/no-explicit-any')
    ).toThrow(/No config object found.*nonexistent\/\*\*\/\*\.ts/);
  });

  it('throws when no config object has the requested rule', () => {
    expect(() => extractRuleOptions(config, '**/*.ts', 'no-nonexistent-rule')).toThrow(
      /No config object found.*no-nonexistent-rule/
    );
  });
});
