'use client';

import Script from 'next/script';
import { useConsent } from '@/components/consent/ConsentProvider';
import { isAnalyticsAllowed } from '@/lib/consent/consent';

/**
 * Google Analytics 4 (gtag.js).
 *
 * Renders nothing unless:
 * - `NEXT_PUBLIC_GA_ID` is set
 * - User has granted consent via ConsentBanner
 *
 * Opt-in design: GA is not loaded until the user explicitly accepts analytics.
 * Loaded `afterInteractive` → static-export compatible.
 * GA4 enhanced measurement (on by default) tracks client-side history navigations,
 * so SPA route changes are captured without manual pageview wiring.
 */
export function GoogleAnalytics(): React.ReactNode {
  const gaId = process.env.NEXT_PUBLIC_GA_ID?.trim();
  const { consent } = useConsent();

  // Only load GA if consent is granted and env is configured
  if (!gaId || !isAnalyticsAllowed(consent)) {
    return null;
  }

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
