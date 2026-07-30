import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      complexity: ["error", 12],
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 80, skipBlankLines: true, skipComments: true }],
      "no-else-return": "error",
      "no-nested-ternary": "error",
      "object-shorthand": "error",
      "prefer-template": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/self-closing-comp": "error",
    },
  },
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
