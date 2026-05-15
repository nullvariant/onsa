// @ts-check
import eslint from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import astroPlugin from "eslint-plugin-astro";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

// ---------------------------------------------------------------------------
// base — language-agnostic quality rules (STD-00011 B1-B7 + guardrails)
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const base = [
  eslint.configs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs["recommended"],
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "import-x": importX,
    },
    rules: {
      // B1-B7: Basic quality
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Guardrail #4: Error handling — no-empty is in eslint recommended

      // Guardrail #7: Cognitive Complexity
      "sonarjs/cognitive-complexity": ["error", 15],

      // Guardrail #9: Bit ops / legacy API
      "no-bitwise": "error",
      "unicorn/prefer-number-properties": "error",

      // Guardrail #14: Promise quality
      "prefer-promise-reject-errors": "error",

      // Guardrail #16: SonarQube patterns
      "import-x/no-duplicates": "error",
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/numeric-separators-style": "error",

      // Import sorting
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",

      // Unicorn overrides (disable overly opinionated rules)
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-abusive-eslint-disable": "off",
      "unicorn/import-style": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prefer-module": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
];

// ---------------------------------------------------------------------------
// typescript — type-aware rules requiring typescript-eslint + projectService
//
// Consumers MUST set `tsconfigRootDir: import.meta.dirname` in their
// eslint.config.mjs to enable projectService resolution.
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const typescript = [
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      // B3/B4: Unused vars/imports
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_|^error$",
        },
      ],

      // Type safety
      "@typescript-eslint/no-explicit-any": "error",

      // Guardrail #10: Readonly
      "@typescript-eslint/prefer-readonly": "error",

      // Guardrail #12: Modern API
      "@typescript-eslint/prefer-optional-chain": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-regexp-test": "error",
      "unicorn/prefer-string-starts-ends-with": "error",

      // Guardrail #14: Promise quality (type-aware)
      "@typescript-eslint/no-floating-promises": "error",

      // Guardrail #16: SonarQube patterns (type-aware)
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },
];

// ---------------------------------------------------------------------------
// security — security rules (currently: code injection prevention + ReDoS)
//
// Broader security rules (credentials, protocols) are provided via sonarjs
// in the base config. This export adds rules not covered by sonarjs recommended.
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const security = [
  {
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "sonarjs/slow-regex": "error",
    },
  },
];

// ---------------------------------------------------------------------------
// react — JSX accessibility + React DOM rules (Preact/React projects)
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const react = [
  jsxA11y.flatConfigs.recommended,
  {
    ...eslintReact.configs["recommended-type-checked"],
    rules: {
      ...eslintReact.configs["recommended-type-checked"].rules,
      "@eslint-react/dom/no-missing-button-type": "error",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];

// ---------------------------------------------------------------------------
// astro — Astro framework support (parser + a11y)
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const astro = [
  ...astroPlugin.configs.recommended,
  ...astroPlugin.configs["jsx-a11y-recommended"],
];

// ---------------------------------------------------------------------------
// test — relaxed rules for test files
// ---------------------------------------------------------------------------

/** @type {import("eslint").Linter.Config[]} */
export const test = [
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "no-bitwise": "off",
      "sonarjs/no-empty-test-file": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-redundant-jump": "off",
      "unicorn/consistent-function-scoping": "off",
    },
  },
];
