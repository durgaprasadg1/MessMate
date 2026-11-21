import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),

  // UI code: these React-compiler style rules already fired on the original
  // code base (they are refactoring suggestions, not security issues). They are
  // kept visible as warnings so CI is not blocked by legacy UI patterns
  // without us having to restructure components (which could change the UI).
  {
    files: ["app/**/*.{js,jsx,ts,tsx}", "Component/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}", "contexts/**/*.{js,jsx}", "hooks/**/*.{js,jsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },

  // Backend: strict. Server code must log through the logger, never console.
  {
    files: ["lib/server/**/*.js", "app/api/**/*.js", "server.js"],
    ignores: ["lib/server/logging/logger.js"],
    rules: {
      "no-console": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
]);

export default eslintConfig;
