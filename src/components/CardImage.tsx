"use client";

import { useState } from "react";

const TILE_URL = (id: string) =>
  `https://art.hearthstonejson.com/v1/tiles/${id}.png`;
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
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[#2a3040] group">
        <span className="w-6 h-6 flex items-center justify-center rounded bg-[#4fc3f7]/20 text-[#4fc3f7] text-xs font-bold shrink-0">
          {cost}
        </span>
        <span className="flex-1 text-sm text-gray-300">{name}</span>
        <span className="text-xs text-gray-500">x{count}</span>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center rounded overflow-hidden hover:brightness-125 transition-all cursor-pointer group"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TILE_URL(cardId)}
          alt=""
          className="w-full h-full object-cover opacity-40"
          onError={() => setImgError(true)}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1f2e] via-[#1a1f2e]/70 to-transparent" />
      </div>

      <div className="relative z-10 flex items-center gap-2 py-1.5 px-2 w-full">
        <span className="w-6 h-6 flex items-center justify-center rounded bg-[#4fc3f7]/80 text-white text-xs font-bold shrink-0">
          {cost}
        </span>
        <span className="flex-1 text-sm text-gray-200 font-medium truncate">
          {name}
        </span>
        <span className="text-xs text-gray-400 font-medium">x{count}</span>
      </div>

      {showPreview && (
        <div className="absolute z-50 left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={RENDER_URL(cardId)}
            alt={name}
            className="w-[200px] rounded-lg shadow-2xl shadow-black/50"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
