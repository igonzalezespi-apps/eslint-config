import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import config from '../base.mjs';

// Regression pin for the `**/*.cjs` files-pattern block in base.mjs.
// Ensures CommonJS globals remain declared and `sourceType` stays `commonjs`
// for `.cjs` files under flat config (which defaults to ESM parsing).

const linter = new Linter({ configType: 'flat' });

// The virtual filenames handed to `linter.verify` must be ABSOLUTE and anchored
// inside this repo. A bare `'example.cjs'` used to work, but a rule that walks
// up from the linted file looking for the closest `package.json` then walks past
// the repo root: `eslint-plugin-sonarjs@4.2.0` does exactly that in S1607 and
// throws `"/" is not nested under topDir`, taking down all five cases here.
// Anchoring to this test file's own directory (not `process.cwd()`) keeps the
// path valid however vitest is invoked. The paths stay virtual — no file is read
// from disk — and still end in `.cjs`/`.ts`, so the `files:` patterns under test
// match exactly as before.
const here = path.dirname(fileURLToPath(import.meta.url));
const virtualFile = (name: string): string => path.join(here, name);

function countNoUndef(messages: Linter.LintMessage[]): number {
  return messages.filter((m) => m.ruleId === 'no-undef').length;
}

describe('eslint-config base — .cjs override', () => {
  it('allows `module.exports` at top level of a .cjs file', () => {
    const code = 'module.exports = { foo: 1 };\n';
    const messages = linter.verify(code, config as Linter.Config[], {
      filename: virtualFile('example.cjs')
    });
    expect(countNoUndef(messages)).toBe(0);
  });

  it('allows `require()` at top level of a .cjs file', () => {
    const code = "const path = require('node:path');\nmodule.exports = { path };\n";
    const messages = linter.verify(code, config as Linter.Config[], {
      filename: virtualFile('example.cjs')
    });
    expect(countNoUndef(messages)).toBe(0);
  });

  it('exposes every canonical CommonJS global in a .cjs file', () => {
    const code =
      'const a = module;\n' +
      'const b = require;\n' +
      'const c = exports;\n' +
      'const d = __dirname;\n' +
      'const e = __filename;\n' +
      'module.exports = { a, b, c, d, e };\n';
    const messages = linter.verify(code, config as Linter.Config[], {
      filename: virtualFile('example.cjs')
    });
    expect(countNoUndef(messages)).toBe(0);
  });

  it('still trips no-undef on typos inside a .cjs file', () => {
    const code = 'module.exports = { x: requireFn };\n';
    const messages = linter.verify(code, config as Linter.Config[], {
      filename: virtualFile('example.cjs')
    });
    const undefMessages = messages.filter((m) => m.ruleId === 'no-undef');
    expect(undefMessages).toHaveLength(1);
    expect(undefMessages[0]?.message).toMatch(/requireFn/);
  });
});

describe('eslint-config base — .ts parsing is unaffected by the .cjs override', () => {
  it('parses TypeScript syntax cleanly (no fatal parser errors)', () => {
    // If the .cjs block bled into .ts files, sourceType would be 'commonjs'
    // and the TypeScript parser would not activate — interface/type syntax
    // would then produce fatal parser errors.
    const code =
      'interface Foo { readonly x: number }\n' + 'export const foo: Foo = { x: 1 } as const;\n';
    const messages = linter.verify(code, config as Linter.Config[], {
      filename: virtualFile('example.ts')
    });
    const fatal = messages.filter((m) => m.fatal);
    expect(fatal).toHaveLength(0);
  });
});
