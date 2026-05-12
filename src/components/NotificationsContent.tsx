"use client";

import Link from "next/link";
import { useSession } from "@/lib/useSession";
import { useNotifications } from "@/lib/notifications";

type Lang = "en" | "zh";

function formatLink(lang: string, link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/")) {
    if (link.startsWith(`/${lang}/`) || link === `/${lang}`) return link;
    return `/${lang}${link}`;
  }
  return link;
}

export default function NotificationsContent({ lang }: { lang: Lang }) {
  const { user, loading: sessionLoading } = useSession();
  const { list, loading, unread, markRead } = useNotifications(user?.id ?? null);

  const t =
    lang === "zh"
      ? {
          title: "通知中心",
          loading: "加载中…",
          notSignedIn: "登录后即可查看通知。",
          signIn: "登录",
          back: "← 返回账户",
          empty: "暂时没有通知。",
          markAll: "全部标为已读",
          replyTo: "回复了你",
          system: "系统通知",
          unknown: "通知",
          openLink: "查看",
        }
      : {
          title: "Notifications",
          loading: "Loading…",
          notSignedIn: "Sign in to see your notifications.",
          signIn: "Sign in",
          back: "← Back to account",
          empty: "Nothing here yet.",
          markAll: "Mark all read",
          replyTo: "replied to you",
          system: "System update",
          unknown: "Notification",
          openLink: "Open",
        };

  if (sessionLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-6">{t.title}</h1>
        <p className="text-sm text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold gold-text mb-3">{t.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{t.notSignedIn}</p>
        <Link
          href={`/${lang}/login?next=/${lang}/account/notifications`}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a]"
        >
          {t.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold gold-text">{t.title}</h1>
        <button
          type="button"
          onClick={() => markRead("all")}
          disabled={unread === 0}
          className="text-xs text-[#4fc3f7] hover:underline disabled:opacity-40 disabled:no-underline"
        >
          {t.markAll}
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        <Link href={`/${lang}/account`} className="hover:text-[#f0b232]">
          {t.back}
        </Link>
      </p>

      {list.length === 0 ? (
        <p className="text-sm text-gray-500">{t.empty}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const href = formatLink(lang, n.link);
            const replier =
              (n.payload?.replier_name as string | undefined) ?? "Someone";
            const preview = (n.payload?.preview as string | undefined) ?? "";
            const isReply = n.type === "comment_reply";
            const time = new Date(n.created_at).toLocaleString(
              lang === "zh" ? "zh-CN" : "en-US",
            );
            return (
              <li
                key={n.id}
                className={`card p-4 ${n.read_at ? "" : "border-[#f0b232]/30 bg-[#1a1f2e]/60"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[#e8e6e3]">
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
                      <p className="mt-1 text-xs text-gray-400 whitespace-pre-wrap break-words">
                        {preview}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-gray-600">{time}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {href && (
                      <Link
                        href={href}
                        onClick={() => {
                          if (!n.read_at) markRead([n.id]);
                        }}
                        className="text-xs text-[#4fc3f7] hover:underline whitespace-nowrap"
                      >
                        {t.openLink} →
                      </Link>
                    )}
                    {!n.read_at && (
                      <button
                        type="button"
                        onClick={() => markRead([n.id])}
                        className="text-[10px] text-gray-500 hover:text-[#f0b232]"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
