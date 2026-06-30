'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 (gtag.js).
 *
 * Renders nothing unless `NEXT_PUBLIC_GA_ID` is set, so local/preview/unconfigured
 * builds stay analytics-free. Loaded `afterInteractive` → static-export compatible.
 * GA4 enhanced measurement (on by default) tracks client-side history navigations,
 * so SPA route changes are captured without manual pageview wiring.
 */
export function GoogleAnalytics(): React.ReactNode {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
