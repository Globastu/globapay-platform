module.exports = {
  extends: ['@globapay/config/eslint-preset'],
  env: {
    browser: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
};