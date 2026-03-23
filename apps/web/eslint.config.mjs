import rootConfig from "../../eslint.config.js";

/** App-local overrides — Next.js + React 19 JSX runtime (no `React` in scope). */
export default [
  ...rootConfig,
  {
    files: ["**/*.tsx", "**/*.ts"],
    languageOptions: {
      globals: {
        React: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
