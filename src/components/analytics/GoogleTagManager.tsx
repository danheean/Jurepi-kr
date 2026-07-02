/**
 * Google Tag Manager (GTM).
 *
 * Split into two parts, both env-gated on `NEXT_PUBLIC_GTM_ID` (renders nothing
 * when unset):
 *
 *  - `GoogleTagManager` → the <head> loader. A plain inline <script> (not
 *    next/script) so it is emitted verbatim into the static HTML and executes
 *    on parse — after the synchronous Consent Mode default (see ConsentMode),
 *    which must be rendered before this in <head>. GTM inherits those default
 *    consent signals; Consent Mode v2 then governs which tags fire inside the
 *    container. Static-export compatible.
 *
 *  - `GoogleTagManagerNoscript` → the <body> fallback iframe, rendered as the
 *    first child of <body> per Google's snippet.
 */

export function GoogleTagManager(): React.ReactNode {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!gtmId) return null;

  const script = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function GoogleTagManagerNoscript(): React.ReactNode {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
