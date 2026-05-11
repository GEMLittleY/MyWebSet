"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const RENDER_URL = (id: string) =>
  `https://art.hearthstonejson.com/v1/render/latest/zhCN/256x/${id}.png`;
const RENDER_URL_LARGE = (id: string) =>
  `https://art.hearthstonejson.com/v1/render/latest/zhCN/512x/${id}.png`;

// Desktop-only: how long the mouse must dwell on a card before the
// hover preview fades in. Prevents flicker when sweeping past a row.
const HOVER_OPEN_DELAY_MS = 180;

export default function CardImage({
  cardId,
  name,
  cost,
  count,
}: {
  cardId?: string;
  name: string;
  cost: number;
  count: number;
}) {
  const [hoverPreview, setHoverPreview] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lightbox: lock body scroll + close on Escape.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  // Hover preview: dismiss whenever the page scrolls so the floating
  // image never "sticks" while the user moves around the deck list.
  useEffect(() => {
    if (!hoverPreview) return;
    const dismiss = () => setHoverPreview(false);
    window.addEventListener("scroll", dismiss, { passive: true });
    window.addEventListener("wheel", dismiss, { passive: true });
    return () => {
      window.removeEventListener("scroll", dismiss);
      window.removeEventListener("wheel", dismiss);
    };
  }, [hoverPreview]);

  // Clean up any pending hover timer on unmount.
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const openHover = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setHoverPreview(true);
    }, HOVER_OPEN_DELAY_MS);
  };
  const closeHover = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverPreview(false);
  };

  if (!cardId || imgError) {
    return (
      <div className="flex flex-col items-center p-2 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="w-full aspect-[3/4] flex items-center justify-center rounded bg-[#2a3040] mb-2">
          <span className="text-2xl font-bold text-[#4fc3f7]">{cost}</span>
        </div>
        <div className="text-xs text-gray-300 text-center truncate w-full">
          {name}
        </div>
        <div className="text-[10px] text-gray-500">x{count}</div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="relative block w-full text-left rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#f0b232] transition-shadow hover:shadow-[0_6px_20px_rgba(0,0,0,0.45)]"
        onMouseEnter={openHover}
        onMouseLeave={closeHover}
        onFocus={openHover}
        onBlur={closeHover}
        onClick={() => {
          closeHover();
          setLightbox(true);
        }}
        aria-label={`查看 ${name} 大图`}
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RENDER_URL(cardId)}
            alt={name}
            className="w-full h-auto drop-shadow-lg select-none"
            onError={() => setImgError(true)}
            loading="lazy"
            draggable={false}
          />
          {count > 1 && (
            <div className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold shadow-lg pointer-events-none">
              {count}
            </div>
          )}
        </div>
      </button>

      {/* Desktop hover preview — portaled to body so no ancestor transform
          can clip / re-anchor it. pointer-events-none + dismiss-on-scroll
          ensures it never traps interaction. Portal is only mounted on
          interaction so SSR never sees document. */}
      {typeof document !== "undefined" && hoverPreview && !lightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] pointer-events-none hidden md:flex items-center justify-center"
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RENDER_URL_LARGE(cardId)}
              alt=""
              className="w-[320px] max-w-[40vw] drop-shadow-[0_8px_30px_rgba(0,0,0,0.85)]"
            />
          </div>,
          document.body,
        )}

      {/* Lightbox — tap / click anywhere outside to close. */}
      {typeof document !== "undefined" && lightbox &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} 大图`}
          >
            <button
              type="button"
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox(false);
              }}
              aria-label="关闭"
            >
              ✕
            </button>
            <div
              className="max-w-full max-h-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={RENDER_URL_LARGE(cardId)}
                alt={name}
                className="w-auto max-w-[92vw] max-h-[82vh] drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)] select-none"
                draggable={false}
              />
              <div className="mt-3 text-center text-sm text-white/80">
                {name} · {cost} 费 · ×{count}
              </div>
              <div className="mt-2 text-center text-[11px] text-white/50">
                点击空白处或按 Esc 关闭
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
