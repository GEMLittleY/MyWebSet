"use client";

import { useEffect, useState } from "react";

const RENDER_URL = (id: string) =>
  `https://art.hearthstonejson.com/v1/render/latest/zhCN/256x/${id}.png`;
const RENDER_URL_LARGE = (id: string) =>
  `https://art.hearthstonejson.com/v1/render/latest/zhCN/512x/${id}.png`;

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
  const [showPreview, setShowPreview] = useState(false);
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

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
        className="relative group cursor-zoom-in block w-full text-left"
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onClick={() => setOpen(true)}
        aria-label={`查看 ${name} 大图`}
      >
        <div className="transition-transform group-hover:scale-105 group-hover:z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RENDER_URL(cardId)}
            alt={name}
            className="w-full h-auto drop-shadow-lg"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          {count > 1 && (
            <div className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold shadow-lg">
              {count}
            </div>
          )}
        </div>

        {/* Desktop hover preview */}
        {showPreview && !open && (
          <div className="fixed z-[90] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RENDER_URL_LARGE(cardId)}
              alt={name}
              className="w-[300px] drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
            />
          </div>
        )}
      </button>

      {/* Click lightbox (works on mobile + desktop) */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-xl hover:bg-white/20 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            aria-label="关闭"
          >
            ✕
          </button>
          <div
            className="max-w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={RENDER_URL_LARGE(cardId)}
              alt={name}
              className="w-auto max-w-[90vw] max-h-[85vh] drop-shadow-[0_8px_30px_rgba(0,0,0,0.7)]"
            />
            <div className="mt-3 text-center text-sm text-white/80">
              {name} · {cost} 费 · ×{count}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
