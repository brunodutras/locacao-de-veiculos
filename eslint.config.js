const js = require("@eslint/js");
const ts = require("typescript-eslint");
const globals = require("globals");
module.exports = ts.config(
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
