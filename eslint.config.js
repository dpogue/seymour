export default [{
  ignores: ['coverage/**']
}, {
  languageOptions: {
    ecmaVersion: 2025,
    sourceType: "module"
  },
  rules: {
    "brace-style": ["error", "1tbs"],
    "curly": "error",
    "eol-last": ["error", "always"],
    "eqeqeq": "error",
    "guard-for-in": "error",
    "linebreak-style": ["error", "unix"],
    "no-unused-labels": "error",
    "no-caller": "error",
    "no-new-wrappers": "error",
    "no-debugger": "error",
    "no-redeclare": "error",
    "no-eval": "error",
    "no-trailing-spaces": "error",
    "prefer-const": "warn",
    "radix": "error",
    "semi": ["error", "always"]
  }
}];
