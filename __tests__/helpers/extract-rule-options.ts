/**
 * Traverses a flat ESLint config array to extract a rule's options
 * by matching on the `files` pattern. Couples tests to the real config
 * so they break when config patterns change.
 */

interface FlatConfigItem {
  // typescript-eslint's `ConfigArray` types `files` as `(string | string[])[]`:
  // a nested-array entry means "match all of these globs at once" (AND semantics).
  // We only ever query by a single string pattern, but the element type must stay
  // wide enough to accept the real config array without an `as` cast at the call site.
  files?: (string | string[])[];
  rules?: Record<string, unknown>;
}

/** ESLint rule entry: severity string or [severity, ...options] tuple. */
type RuleEntry = string | [string, ...unknown[]];

/**
 * Find a rule's configured value within a flat config array.
 * @param config - The flat ESLint config array to search.
 * @param filesPattern - The `files` glob the target config object declares.
 * @param ruleName - The rule whose entry should be returned.
 * @returns The rule's severity string or `[severity, ...options]` tuple.
 */
export function extractRuleOptions(
  config: FlatConfigItem[],
  filesPattern: string,
  ruleName: string
): RuleEntry {
  // Find by both files pattern AND rule presence — multiple config objects
  // can share the same files pattern (e.g. tseslint.configs.recommended
  // also declares files: ['**/*.ts', ...]).
  const match = config.find(
    (item) =>
      Array.isArray(item.files) &&
      item.files.includes(filesPattern) &&
      item.rules?.[ruleName] !== undefined
  );
  if (!match) {
    throw new Error(
      `No config object found with files pattern including "${filesPattern}" and rule "${ruleName}"`
    );
  }
  return match.rules![ruleName] as RuleEntry;
}
