import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jurepi.kr';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Jurepi — Free Online Tools',
  description: 'Collection of free online tools for everyday tasks.',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'Jurepi',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  // Search-engine site verification. Set at the root so it's inherited into the
  // <head> of every prerendered page (verifiers may fetch any URL).
  verification: {
    other: {
      'naver-site-verification': [
        '66d158bb0b9b227ac53e363c3af2e9a54d55de4c',
        'b07656b720c0cca4cf67053c691dec6ff10d2535',
      ],
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: '#f7c74a',
};

/**
 * Root layout intentionally returns children only. The `[locale]` layout owns
 * the <html lang> / <body> document so the language attribute reflects the
 * active locale (next-intl App Router pattern).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
