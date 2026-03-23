// Storybook: use an explicit flat block instead of `storybook.configs["flat/recommended"]`, whose
// getter-based `plugins` can trigger circular JSON errors in ESLint's config validator.
import storybookPlugin from "eslint-plugin-storybook";

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
    "**/coverage/**",
    "*.config.js",
    "*.config.ts",
    ".next/**",
    "**/.next/**",
    "**/next-env.d.ts",
    "**/storybook-static/**",
    "**/*.min.js",
  ],
}, {
  files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)", "**/*.story.@(ts|tsx|js|jsx|mjs|cjs)"],
  plugins: {
    storybook: storybookPlugin,
  },
  rules: {
    "react-hooks/rules-of-hooks": "off",
    "storybook/await-interactions": "error",
    "storybook/context-in-play-function": "error",
    "storybook/default-exports": "error",
    "storybook/hierarchy-separator": "warn",
    "storybook/no-redundant-story-name": "warn",
    "storybook/no-renderer-packages": "error",
    "storybook/prefer-pascal-case": "warn",
    "storybook/story-exports": "error",
    "storybook/use-storybook-expect": "error",
    "storybook/use-storybook-testing-library": "error",
  },
}, {
  files: [".storybook/main.@(js|cjs|mjs|ts)"],
  plugins: {
    storybook: storybookPlugin,
  },
  rules: {
    "storybook/no-uninstalled-addons": "error",
  },
}];
