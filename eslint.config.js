import js from "@eslint/js"
import importPlugin from "eslint-plugin-import"

export default [
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin
    },
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        process: "readonly",
        console: "readonly",
        setTimeout: "readonly"
      }
    },
    rules: {
      "no-undef": "off",
      "import/no-unresolved": "off",
      "import/extensions": "off",
      "no-console": "off",

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ]
    }
  }
]
