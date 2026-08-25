import globals from "globals"
import pluginJs from "@eslint/js"

export default [
  // assets/pydevices holds the vendored MicroPython runtime: generated
  // Emscripten output, not ours to lint.
  { ignores: ["build/", "src/websocket_relay.cjs", "mcp/", "assets/pydevices/"] },
  { languageOptions: { globals: globals.browser }},
  { files: ["*.mjs"], languageOptions: { globals: globals.node }},
  { files: ["test/**/*.js"], languageOptions: { globals: { ...globals.node, ...globals.mocha }}},
  pluginJs.configs.recommended,
  {
    rules: {
      "no-unused-vars": [ "warn", {
          argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_"
      }],
      "no-use-before-define": [ "error", {
          functions: false,
          variables: false,
      }],
      "no-undef": "error",
      "no-empty": "warn",
    },
    languageOptions: {
      globals: {
        analytics:          "readonly",
        VIPER_IDE_VERSION:  "readonly",
        VIPER_IDE_BUILD:    "readonly",
        VIPER_IDE_BASE_URL: "readonly",
      }
    }
  }
]
