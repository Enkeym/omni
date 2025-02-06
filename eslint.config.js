import js from "@eslint/js"

export default [
  js.configs.recommended,
  {
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-console": "off",
      "import/no-unresolved": "off"
    }
  }
]
