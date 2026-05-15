// Shared HTMLHint configuration — STD-00011 HTML rules
//
// SSOT: .htmlhintrc (JSON, consumed by htmlhint CLI via --config)
// This file re-exports the same ruleset for programmatic API usage.
//
// inline-script-disabled / inline-style-disabled are intentionally false:
// Astro islands and framework runtimes emit inline scripts/styles at build time.
// A blanket ban would produce false positives across most consumer repos.
//
// Usage:
//   CLI:  htmlhint --config node_modules/@nullvariant/onsa-htmlhint-config/.htmlhintrc
//   API:  import rules from "@nullvariant/onsa-htmlhint-config";
//         HTMLHint.verify(html, rules);

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {Record<string, boolean | string>} */
const config = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), ".htmlhintrc"), "utf8"),
);

export default config;
