module.exports = {
  extends: [
    '@globapay/config/eslint-preset',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};