// eslint-config-next 16 ships flat-config-native arrays (Linter.Config[]) rather than the legacy
// eslintrc shareable-config format, so this is imported directly instead of via
// @eslint/eslintrc's FlatCompat (which chokes trying to validate an already-flat config against
// the legacy schema).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    rules: {
      // Every role's brief bans `any` outright (BUILD_PROMPT.md §12); enforce it at lint time too.
      "@typescript-eslint/no-explicit-any": "error",
      // Wave 0 stubs (and later, in-progress work) commonly accept a typed prop bag before the
      // body is implemented — leading-underscore names are the standard "intentionally unused"
      // signal, not a real bug.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
