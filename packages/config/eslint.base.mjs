// Shared ESLint flat config base for VettGuard monorepo.
// Consumer apps/packages: `import base from "@vettguard/config/eslint"` and spread/extend.

import js from "@eslint/js"
import tseslint from "typescript-eslint"
import globals from "globals"
import prettier from "eslint-config-prettier"

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/*.config.{js,mjs,ts}",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  prettier,
]
