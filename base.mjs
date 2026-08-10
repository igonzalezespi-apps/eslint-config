import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Studio shared flat ESLint base config.
 *
 * Pipeline (order matters): JS recommended → typescript-eslint recommended →
 * security recommended → sonarjs recommended → sonarjs tuning → prettier
 * (disables stylistic rules so Prettier owns formatting) → TS rule layer.
 *
 * This base intentionally does NOT encode any repo-specific boundary policy
 * (workspace aliases, internal/ restrictions, etc.). Each consumer composes
 * its own `no-restricted-imports` / `no-restricted-syntax` blocks on top.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/coverage/**',
      '.claude/**',
      '.spec-gen/**',
      'plop-templates/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  sonarjs.configs.recommended,
  {
    // sonarjs overrides — applied globally after recommended config
    rules: {
      // keep cognitive-complexity + no-identical-functions
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'warn',
      // Disabled because eslint-plugin-security ALREADY covers them. Verified
      // rule by rule against node_modules/eslint-plugin-security/rules/ — this
      // comment used to cover ten rules and only these three were true:
      //   code-eval      -> security/detect-eval-with-expression
      //   os-command     -> security/detect-child-process
      //   pseudo-random  -> security/detect-pseudoRandomBytes
      'sonarjs/os-command': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/code-eval': 'off',
      'sonarjs/pseudo-random': 'off',

      // The five below detect COMMITTED SECRETS, and eslint-plugin-security has
      // no counterpart for any of them: its fourteen rules are about eval,
      // child_process, non-literal fs, regexp and require, object injection,
      // timing attacks, unsafe regex, buffers, bidi characters, CSRF and
      // mustache escaping. None of them looks for a hardcoded secret, password
      // or IP address.
      //
      // They were off under a comment that claimed the overlap, which was true
      // for the three above and false for these — and being true for some is
      // exactly what made it invisible. Meanwhile "secrets are never committed,
      // no tokens or IPs in any repo" is a HARD RULE of the studio, so the
      // automatic detectors for it sat switched off while the rule stayed.
      //
      // Measured before turning them back on, forced with --rule over the real
      // source of the three TypeScript consumers: 37 findings, and every single
      // one inside a test file. ZERO in production code. The gate is born green:
      // it brings nothing down today and brings down the first regression,
      // which is when it is cheap.
      'sonarjs/publicly-writable-directories': 'error',
      'sonarjs/no-clear-text-protocols': 'error',
      'sonarjs/no-hardcoded-ip': 'error',
      'sonarjs/no-hardcoded-passwords': 'error',
      'sonarjs/no-hardcoded-secrets': 'error',
      'sonarjs/hardcoded-secret-signatures': 'error',
      // Disable style-opinion rules too aggressive for general use
      'sonarjs/public-static-readonly': 'off',
      'sonarjs/void-use': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/single-character-alternation': 'off',
      'sonarjs/concise-regex': 'off',
      // regex-complexity stays off, and the reason is NOT "ReDoS is covered
      // elsewhere so we do not care" — it is that this rule does not measure
      // ReDoS at all. It caps a complexity SCORE (readability). Actual ReDoS
      // coverage in this preset comes from security/detect-unsafe-regex and
      // sonarjs/slow-regex, both active.
      //
      // Measured across the three TypeScript consumers: 1 finding total, a
      // regex scoring 38 against a limit of 20, and no security implication.
      'sonarjs/regex-complexity': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/assertions-in-tests': 'off',
      // no-redundant-optional contradicts the companion tsconfig preset, which sets
      // `exactOptionalPropertyTypes: true`. Under that flag `x?: T | undefined` and
      // `x?: T` are DIFFERENT types: the first accepts an explicit `undefined`, the
      // second only accepts the key being absent. So the union the rule calls
      // redundant is load-bearing, and "fixing" the lint silently narrows the type.
      // TypeScript says so itself when you strip it — TS2375: "Consider adding
      // 'undefined' to the types of the target's properties", i.e. the exact opposite
      // of what this rule demands. The rule is right only where the flag is off; in
      // this fleet it never is.
      'sonarjs/no-redundant-optional': 'off',

      // detect-object-injection stays off, and this one is a real trade-off,
      // not an oversight: measured 36 findings in PRODUCTION code of a single
      // consumer (plus 44 in its tests). The rule fires on any computed member
      // access with a non-literal key, which in TypeScript is overwhelmingly
      // safe and type-checked. At that volume it is not a gate, it is a
      // permanent red that trains everyone to ignore the security layer.
      'security/detect-object-injection': 'off',
      // Downgrade to warnings
      // slow-regex and detect-unsafe-regex stay at WARN on purpose, measured
      // rather than assumed. Promoting detect-unsafe-regex to error was tried
      // against the fleet: 3 findings, and NONE of them is a defect.
      //   - 2 live in a test-utils module that deliberately holds ReDoS
      //     patterns, which is its whole job.
      //   - 1 is a false positive on an email regex that carries a comment
      //     explaining it was rewritten precisely to keep matching linear. The
      //     `safe-regex` heuristic behind the rule flags nested quantifiers even
      //     when the character classes are disjoint and no backtracking is
      //     possible.
      // Turning it into an error would paint the fleet red over correct code,
      // which is how a security rule loses its audience.
      'sonarjs/slow-regex': 'warn',
      'sonarjs/no-nested-conditional': 'warn'
    }
  },
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { jsdoc },
    rules: {
      'no-undef': 'off',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: false,
            ClassDeclaration: false,
            ClassExpression: false,
            FunctionExpression: false,
            ArrowFunctionExpression: false,
            MethodDefinition: false
          },
          checkConstructors: false,
          contexts: [
            'ExportNamedDeclaration > FunctionDeclaration',
            'ExportNamedDeclaration > ClassDeclaration'
          ]
        }
      ],
      // `checkDestructured: false` on BOTH jsdoc param rules, or the auto-fix contradicts
      // itself on the React `function C({ a, b }: Props)` shape. require-param (a warning)
      // already had it, so its fixer writes a block with a single `@param root0` and never
      // documents the destructured properties. check-param-names (an ERROR) defaulted to
      // checking them, so it then demanded `@param root0.a` / `@param root0.b` — parameters
      // the fixer it runs next to will never write. Net effect measured on a real component:
      // `eslint --fix` turned a warning into two errors, rewrote the file, and stayed red on
      // every subsequent pass, which makes a fix-on-commit hook impassable for every
      // destructured-props component in the repo. Documenting each prop belongs in the
      // component's own prose (or the props interface), not in a machine-inserted stub.
      //
      // `checkDestructuredRoots: false` is the OTHER half, and without it the cure is only
      // half applied. `checkDestructured: false` stops the rule demanding the destructured
      // PROPERTIES; the root parameter itself is still required, so `require-param`'s fixer
      // keeps inserting a bare `@param root0` — a tag that documents nothing, since the props
      // are already typed by TypeScript.
      //
      // Measured 2026-08-09 in a private consumer, on this very config at v0.2.1: dropping that repo's
      // local override left `eslint --fix` at 0 errors and idempotent — it looked cured — yet
      // it rewrote 20 components and injected 30 empty `@param root0` lines. Green, stable,
      // and still wrong: exactly the shape of failure a red build would have caught.
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/check-tag-names': ['error', { typed: true }],
      'jsdoc/require-param': ['warn', { checkDestructured: false, checkDestructuredRoots: false }],
      'jsdoc/require-returns': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
      ],
      // Allow `interface X extends Y {}`: used for module augmentation.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' }
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      complexity: ['warn', 20],
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-object-injection': 'off'
    }
  },
  {
    // Test files — relax security + complexity heuristics that fight test code.
    files: [
      '**/__tests__/**',
      '**/test/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'sonarjs/cognitive-complexity': 'off',

      // Secret detectors, off HERE ONLY. This is not a convenience exemption:
      // a redaction test MUST contain a fake secret, an SSRF test MUST contain
      // a plain-text URL, and a rate-limiter test MUST contain an IP. Measured
      // across the three TypeScript consumers, all 37 findings of these rules
      // were in test files of exactly that kind — without this block they are
      // noise, and noise is what kills a rule within weeks.
      //
      // In production code they stay ON, which is the whole point: the studio's
      // hard rule is that secrets, tokens and IPs are never committed.
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-hardcoded-secrets': 'off',
      'sonarjs/hardcoded-secret-signatures': 'off',

      // publicly-writable-directories belongs in this list for the same reason
      // and it was MISSED when the others were turned on: the measurement that
      // justified the change covered the five secret detectors, and the block
      // that was switched on held SIX rules. Measured afterwards on the largest
      // consumer: 143 findings, ALL of them in test files and NONE in
      // production. Writing to /tmp is what a test is supposed to do.
      //
      // It surfaced late because `turbo run lint` served a CACHE HIT and
      // reported 9 of 9 green; only `--force` showed 6 of 9 failing.
      'sonarjs/publicly-writable-directories': 'off'
    }
  },
  {
    // Dev scripts — console, fs, and Node globals are expected.
    files: ['scripts/**/*.ts', 'scripts/**/*.mjs', 'plopfile.mjs'],
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off'
    }
  },
  {
    // CommonJS files (`.cjs`) — ESLint defaults to ESM parsing under flat config,
    // which fires `no-undef` on CJS wrapper globals (module, require, exports,
    // __dirname, __filename) and on Node runtime globals (Buffer, process, etc.).
    // `globals.node` is the superset: CJS wrappers + Node builtins.
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
);
