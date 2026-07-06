import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Static export for Cloudflare static-asset hosting (no Node server in prod).
  // Security headers live in public/_headers; root → /ko redirect in public/_redirects,
  // because next.config headers()/middleware do not run under output: 'export'.
  output: 'export',
  // Inlined into server AND client bundles at build time — single source for the
  // NEW badge window (isNewTool), so SSG HTML and hydration always agree.
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  images: { unoptimized: true }
};

export default withNextIntl(nextConfig);
