/**
 * Google AdSense loader (adsbygoogle.js).
 *
 * Rendered in <head> so the loader tag is present in the served HTML — reliable
 * for AdSense site verification and Auto Ads. Loads on every page and is NOT
 * consent-gated (AdSense standard; Google's own CMP / Consent Mode handles GDPR
 * for ads, while the consent banner governs analytics). Renders nothing unless
 * NEXT_PUBLIC_ADSENSE_CLIENT is set.
 */
export function GoogleAdsense(): React.ReactNode {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  if (!client) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      crossOrigin="anonymous"
    />
  );
}
