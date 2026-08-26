import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], 
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    "rules": {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_",
            "destructuredArrayIgnorePattern": "^_"
          }
        ]
      }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
]);