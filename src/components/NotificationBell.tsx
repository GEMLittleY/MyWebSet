"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/useSession";
import { useNotifications } from "@/lib/notifications";
import { useLanguage } from "./LanguageProvider";

function formatLink(lang: string, link: string | null): string {
  if (!link) return `/${lang}/account/notifications`;
  // Internal links from the trigger start with /decks/ or /guides/ — prefix
  // them with the active language so deep-links land on the localised page.
  if (link.startsWith("/")) {
    if (link.startsWith(`/${lang}/`) || link === `/${lang}`) return link;
    return `/${lang}${link}`;
  }
  return link;
}

export default function NotificationBell() {
  const { lang } = useLanguage();
  const { user, loading } = useSession();
  const { list, unread, markRead } = useNotifications(user?.id ?? null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const t =
    lang === "zh"
      ? {
          aria: "通知",
          empty: "暂时没有通知。",
          replyTo: "回复了你",
          markAll: "全部标为已读",
          viewAll: "查看全部",
          system: "系统通知",
          unknown: "通知",
        }
      : {
          aria: "Notifications",
          empty: "No notifications yet.",
          replyTo: "replied to you",
          markAll: "Mark all read",
          viewAll: "View all",
          system: "System update",
          unknown: "Notification",
        };

  if (loading || !user) return null;

  return (
    <div ref={wrapRef} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.aria}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#2a3040] hover:border-[#f0b232]/50 text-gray-300 hover:text-[#f0b232]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl bg-[#0f1419] border border-[#2a3040] shadow-xl z-[60]"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a3040]/60">
            <span className="text-sm text-[#e8e6e3] font-medium">
              {t.aria}
            </span>
            <button
              type="button"
              onClick={() => markRead("all")}
              disabled={unread === 0}
              className="text-xs text-[#4fc3f7] hover:underline disabled:opacity-40 disabled:no-underline"
            >
              {t.markAll}
            </button>
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-6 text-xs text-gray-500 text-center">
              {t.empty}
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto scrollbar-thin">
              {list.slice(0, 8).map((n) => {
                const href = formatLink(lang, n.link);
                const isReply = n.type === "comment_reply";
                const replier =
                  (n.payload?.replier_name as string | undefined) ?? "Someone";
                const preview =
                  (n.payload?.preview as string | undefined) ?? "";
                const time = new Date(n.created_at).toLocaleString(
                  lang === "zh" ? "zh-CN" : "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );
                return (
                  <li
                    key={n.id}
                    className={`border-b border-[#2a3040]/40 last:border-0 ${n.read_at ? "" : "bg-[#1a1f2e]/40"}`}
                  >
                    <Link
                      href={href}
                      onClick={() => {
                        setOpen(false);
                        if (!n.read_at) markRead([n.id]);
                      }}
                      className="block px-4 py-3 hover:bg-[#1a1f2e]"
                    >
                      <p className="text-xs text-[#e8e6e3]">
                        {isReply ? (
                          <>
                            <span className="font-medium">{replier}</span>{" "}
                            {t.replyTo}
                          </>
                        ) : n.type === "system" ? (
                          t.system
                        ) : (
                          t.unknown
                        )}
                      </p>
                      {preview && (
                        <p className="mt-0.5 text-[11px] text-gray-400 line-clamp-2">
                          {preview}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-gray-600">{time}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-[#2a3040]/60 px-4 py-2 text-right">
            <Link
              href={`/${lang}/account/notifications`}
              onClick={() => setOpen(false)}
              className="text-xs text-[#4fc3f7] hover:underline"
            >
              {t.viewAll} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
