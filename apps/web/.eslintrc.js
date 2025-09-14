module.exports = {
  extends: [
    '../../packages/config/eslint-preset.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};