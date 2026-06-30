import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Static export for Cloudflare static-asset hosting (no Node server in prod).
  // Security headers live in public/_headers; root → /ko redirect in public/_redirects,
  // because next.config headers()/middleware do not run under output: 'export'.
  output: 'export',
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: { unoptimized: true }
};

export default withNextIntl(nextConfig);
