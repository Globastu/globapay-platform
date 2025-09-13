/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@globapay/ui', '@globapay/sdk'],
  env: {
    NEXT_PUBLIC_MOCK: process.env.NEXT_PUBLIC_MOCK || '1',
  },
};

module.exports = nextConfig;