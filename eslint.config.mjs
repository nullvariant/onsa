import { base, security, test, typescript } from "./packages/eslint-config/index.mjs";

export default [
  ...base,
  ...typescript,
  ...security,
  ...test,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        projectService: {
          allowDefaultProject: ["*.mjs", "packages/*/index.mjs"],
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
