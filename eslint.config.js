// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [eslint.configs.recommended, {
  files: ["**/*.ts", "**/*.tsx"],
  languageOptions: {
    parser: tsparser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    globals: {
      ...globals.node,
      ...globals.browser,
    },
  },
  plugins: {
    "@typescript-eslint": tseslint,
  },
  rules: {
    ...tseslint.configs.recommended.rules,
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { allow: ["warn", "error", "log"] }],
  },
}, {
  files: ["**/*.mjs", "**/*.js"],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    globals: {
      ...globals.node,
      ...globals.nodeBuiltin,
    },
  },
  rules: {
    "no-undef": "off",
  },
}, {
  ignores: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "*.config.js",
    "*.config.ts",
    ".next/**",
    "apps/web/.next/**",
    "**/.next/**",
    "**/next-env.d.ts",
  ],
}, ...storybook.configs["flat/recommended"]];
