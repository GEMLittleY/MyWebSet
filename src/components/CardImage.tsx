"use client";

import { useState } from "react";

const RENDER_URL = (id: string) =>
  `https://art.hearthstonejson.com/v1/render/latest/zhCN/256x/${id}.png`;

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
  const [imgError, setImgError] = useState(false);

  if (!cardId || imgError) {
    return (
      <div className="flex flex-col items-center p-2 rounded-lg bg-[#1a1f2e] border border-[#2a3040]">
        <div className="w-full aspect-[3/4] flex items-center justify-center rounded bg-[#2a3040] mb-2">
          <span className="text-2xl font-bold text-[#4fc3f7]">{cost}</span>
        </div>
        <div className="text-xs text-gray-300 text-center truncate w-full">{name}</div>
        <div className="text-[10px] text-gray-500">x{count}</div>
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="relative rounded-lg overflow-hidden transition-transform group-hover:scale-105 group-hover:z-10 shadow-md group-hover:shadow-xl group-hover:shadow-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={RENDER_URL(cardId)}
          alt={name}
          className="w-full h-auto"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        {/* Count badge */}
        {count > 1 && (
          <div className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold shadow-lg">
            {count}
          </div>
        )}
        {count === 1 && (
          <div className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-[#f0b232] text-[#0f1419] text-xs font-bold shadow-lg">
            ★
          </div>
        )}
      </div>

      {/* Hover preview - large card */}
      {showPreview && (
        <div className="fixed z-[100] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RENDER_URL(cardId)}
            alt={name}
            className="w-[300px] rounded-xl shadow-2xl shadow-black/70"
          />
        </div>
      )}
    </div>
  );
}
