import base from "@vettguard/config/eslint"

export default [
  ...base,
  {
    languageOptions: {
      globals: {
        chrome: "readonly",
      },
    },
  },
]
