import tseslint from "typescript-eslint";

export default [
  {
    files: ["js/**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      // DEMO 8: the plain espree parser (ESLint's default) can only
      // understand JavaScript syntax - it chokes on TypeScript-only
      // syntax like `: string` return types or `interface`. Swapping in
      // typescript-eslint's parser is what lets ESLint read .ts files at
      // all now that the whole app has been migrated (Demo 7).
      parser: tseslint.parser,
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        alert: "readonly",
        Promise: "readonly",
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
];
