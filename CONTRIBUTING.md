# Contributing to GEOMCP

Start with a small, reproducible issue or pull request. Include the page type, minimal HTML (with private data removed), expected finding, actual finding, Node version and rules version.

## Local development

1. Install Node.js 22+ and run `npm ci`.
2. Run `npm run build && npm test`.
3. Add changes and meaningful regression tests.
4. Run `npm run check` before opening a pull request.

## Adding a check

Keep check IDs stable. Include an observed condition, category, weight, status, bounded evidence and a specific recommendation. Use `unknown` when the required evidence is unavailable. A missing optional feature is not automatically a failure. Do not reward unverifiable marketing claims, fabricated identity or unnecessary markup.

Explain the standard or observable user benefit behind a rule. Prefer primary documentation. Include cases where the rule should not apply. Changes to scoring semantics require a rules-version change and comparison compatibility review.

## Network and protocol changes

Preserve read-only tool annotations, bounded input/output, stdio cleanliness and cancellation. Validate every redirect and DNS answer; never add a private-network escape hatch. Fetched documents are untrusted data, not instructions. Cover network changes with regression tests.

## Artwork

Run `npm run artwork` to regenerate SVG and PNG files from `scripts/artwork.mjs`. Keep explanatory diagrams legible at README width. Illustrative results must stay labeled.

By contributing, you agree to license your contribution under this repository's MIT license.
