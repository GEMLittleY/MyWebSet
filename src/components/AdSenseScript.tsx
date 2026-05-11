import Script from "next/script";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

/**
 * Injects the AdSense loader script once per page. Renders nothing when
 * NEXT_PUBLIC_ADSENSE_CLIENT is unset (e.g. local dev / pre-review).
 */
export default function AdSenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      async
      crossOrigin="anonymous"
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
