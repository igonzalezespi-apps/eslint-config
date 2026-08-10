import base from './base.mjs';

/**
 * Studio ESLint config for Next.js apps.
 *
 * Composes the studio `base` preset. Next.js-specific lint rules
 * (`@next/eslint-plugin-next` / `eslint-config-next`) are added as a peer
 * dependency by the consuming app when its dashboard needs them; this preset
 * keeps the shared TypeScript + security + sonarjs + jsdoc + Prettier core.
 */
export default [...base];
