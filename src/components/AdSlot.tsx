"use client";

import { useEffect, useRef } from "react";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Adsense in-content slot. Renders nothing when no publisher id is configured
 * (e.g. before the site has passed AdSense review) so the layout stays clean.
 *
 * Usage:
 *   <AdSlot slot="1234567890" format="auto" />
 *
 * To enable, set the env vars NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-xxxx) on
 * Vercel and add the auto-ads script in [lang]/layout via <AdSenseScript />.
 */
export default function AdSlot({
  slot,
  format = "auto",
  responsive = true,
  className,
  style,
}: {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    if (typeof window === "undefined") return;
    try {
      (window.adsbygoogle ??= []).push({});
    } catch {
      // adsbygoogle not ready or script not loaded yet
    }
  }, []);

  if (!ADSENSE_CLIENT) {
    return null;
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className ?? ""}`}
      style={{ display: "block", ...style }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
