import { base, security, test, typescript } from "./packages/eslint-config/index.mjs";

export default [
  ...base,
  ...typescript,
  ...security,
  ...test,
  {
    files: ["packages/*/bin/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: [
            "*.mjs",
            "packages/*/index.mjs",
            "packages/*/bin/*.mjs",
          ],
        },
      },
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "packages/tsconfig/**",
    ],
  },
];
