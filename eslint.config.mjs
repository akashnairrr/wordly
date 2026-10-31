import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Formatting is Prettier's job: turn off ESLint rules that would disagree with it.
  prettier,
  // Prettier wraps code at 120; this only catches what it can't wrap (long strings, comments).
  { rules: { "max-len": ["error", { code: 200 }] } },
  // Every promise is awaited, handled or explicitly `void`ed. Type-aware, so tests (node:test's it() returns a promise) are left out.
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.test.ts"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
])

export default eslintConfig
