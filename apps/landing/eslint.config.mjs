import base from "@vettguard/config/eslint"

export default [
  ...base,
  {
    rules: {
      "@typescript-eslint/no-misused-promises": "off",
    },
  },
]
