"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useSession } from "@/lib/useSession";
import { useLanguage } from "./LanguageProvider";

type CommentTarget = "deck" | "guide";

type CommentRow = {
  id: number;
  user_id: string;
  target_type: CommentTarget;
  target_id: string;
  parent_id: number | null;
  body: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const SELECT_FRAGMENT =
  "id,user_id,target_type,target_id,parent_id,body,deleted,created_at,updated_at,profile:profiles(display_name,avatar_url)";

const MAX_BODY = 2000;

export default function CommentSection({
  type,
  id,
}: {
  type: CommentTarget;
  id: string;
}) {
  const { lang } = useLanguage();
  const { user, loading: sessionLoading } = useSession();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);

  const t =
    lang === "zh"
      ? {
          heading: "讨论",
          loading: "加载中…",
          empty: "暂时还没有评论，来抢沙发吧。",
          composePh: "分享你的看法，做一个友善的玩家…",
          submit: "发表评论",
          reply: "回复",
          replyTo: "回复给",
          cancel: "取消",
          edit: "编辑",
          save: "保存",
          delete: "删除",
          deleted: "（已删除）",
          confirmDelete: "确定要删除这条评论吗？",
          signInTo: "请先",
          signIn: "登录",
          toComment: "后再发表评论。",
          edited: "（已编辑）",
        }
      : {
          heading: "Discussion",
          loading: "Loading…",
          empty: "Be the first to start the conversation.",
          composePh: "Share your thoughts — keep it friendly…",
          submit: "Post comment",
          reply: "Reply",
          replyTo: "Reply to",
          cancel: "Cancel",
          edit: "Edit",
          save: "Save",
          delete: "Delete",
          deleted: "(deleted)",
          confirmDelete: "Delete this comment?",
          signInTo: "Please ",
          signIn: "sign in",
          toComment: " to comment.",
          edited: "(edited)",
        };

  useEffect(() => {
    const supabase = createClient();
    const cancelled = { current: false };

    supabase
      .from("comments")
      .select(SELECT_FRAGMENT)
      .eq("target_type", type)
      .eq("target_id", id)
      .order("created_at", { ascending: true })
      .then(({ data, error: e }) => {
        if (cancelled.current) return;
        if (e) {
          setError(e.message);
          setLoaded(true);
          return;
        }
        setComments((data ?? []) as unknown as CommentRow[]);
        setLoaded(true);
      });

    // Optional realtime: keeps the thread in sync across tabs/users.
    const channel = supabase
      .channel(`comments:${type}:${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `target_id=eq.${id}`,
        },
        () => {
          // Refetch on any change. Cheap because target rows are small.
          supabase
            .from("comments")
            .select(SELECT_FRAGMENT)
            .eq("target_type", type)
            .eq("target_id", id)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
              if (cancelled.current) return;
              setComments((data ?? []) as unknown as CommentRow[]);
            });
        },
      )
      .subscribe();

    return () => {
      cancelled.current = true;
      supabase.removeChannel(channel);
    };
  }, [type, id]);

  const tree = useMemo(() => {
    const top: CommentRow[] = [];
    const repliesByParent = new Map<number, CommentRow[]>();
    for (const c of comments) {
      if (c.parent_id == null) {
        top.push(c);
      } else {
        const arr = repliesByParent.get(c.parent_id) ?? [];
        arr.push(c);
        repliesByParent.set(c.parent_id, arr);
      }
    }
    return { top, repliesByParent };
  }, [comments]);

  const submit = async (parentId: number | null, text: string) => {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase.from("comments").insert({
      user_id: user.id,
      target_type: type,
      target_id: id,
      parent_id: parentId,
      body: trimmed.slice(0, MAX_BODY),
    });
    setSubmitting(false);
    if (e) {
      setError(e.message);
      return;
    }
    if (parentId == null) {
      setComposer("");
    } else {
      setReplyTo(null);
    }
    // realtime listener will refresh the list shortly; refetch as a fallback
    // in case realtime is disabled on this Supabase project.
    supabase
      .from("comments")
      .select(SELECT_FRAGMENT)
      .eq("target_type", type)
      .eq("target_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []) as unknown as CommentRow[]);
      });
  };

  const updateBody = async (commentId: number, newBody: string) => {
    const supabase = createClient();
    const { error: e } = await supabase
      .from("comments")
      .update({ body: newBody.trim().slice(0, MAX_BODY) })
      .eq("id", commentId);
    if (e) setError(e.message);
  };

  const softDelete = async (commentId: number) => {
    if (typeof window !== "undefined" && !window.confirm(t.confirmDelete)) return;
    const supabase = createClient();
    const { error: e } = await supabase
      .from("comments")
      .update({ body: "", deleted: true })
      .eq("id", commentId);
    if (e) setError(e.message);
  };

  return (
    <section className="card p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-[#e8e6e3] mb-4">
        {t.heading}{" "}
        <span className="text-xs text-gray-500 font-normal">
          ({comments.filter((c) => !c.deleted).length})
        </span>
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 text-sm p-3">
          {error}
        </div>
      )}

      {sessionLoading ? null : user ? (
        <form
          className="mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit(null, composer);
          }}
        >
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            rows={3}
            maxLength={MAX_BODY}
            placeholder={t.composePh}
            className="w-full px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232] resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-600">
              {composer.length}/{MAX_BODY}
            </span>
            <button
              type="submit"
              disabled={submitting || !composer.trim()}
              className="px-4 py-2 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.submit}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 text-sm text-gray-400">
          {t.signInTo}
          <Link
            href={`/${lang}/login?next=${typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : `/${lang}`}`}
            className="text-[#4fc3f7] hover:underline"
          >
            {t.signIn}
          </Link>
          {t.toComment}
        </div>
      )}

      {!loaded ? (
        <p className="text-sm text-gray-500">{t.loading}</p>
      ) : tree.top.length === 0 ? (
        <p className="text-sm text-gray-500">{t.empty}</p>
      ) : (
        <ul className="space-y-5">
          {tree.top.map((c) => (
            <li key={c.id}>
              <CommentItem
                comment={c}
                currentUserId={user?.id ?? null}
                lang={lang}
                t={t}
                onReplyClick={() => setReplyTo(c.id)}
                onEditSave={updateBody}
                onDelete={softDelete}
                replying={replyTo === c.id}
                onCancelReply={() => setReplyTo(null)}
                onReplySubmit={(text) => submit(c.id, text)}
                submitting={submitting}
              />
              {(tree.repliesByParent.get(c.id) ?? []).length > 0 && (
                <ul className="mt-3 ml-8 space-y-3 border-l border-[#2a3040] pl-4">
                  {(tree.repliesByParent.get(c.id) ?? []).map((r) => (
                    <li key={r.id}>
                      <CommentItem
                        comment={r}
                        currentUserId={user?.id ?? null}
                        lang={lang}
                        t={t}
                        onEditSave={updateBody}
                        onDelete={softDelete}
                        // No nested replies (1-level threading).
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ItemT = {
  heading: string;
  loading: string;
  empty: string;
  composePh: string;
  submit: string;
  reply: string;
  replyTo: string;
  cancel: string;
  edit: string;
  save: string;
  delete: string;
  deleted: string;
  confirmDelete: string;
  signInTo: string;
  signIn: string;
  toComment: string;
  edited: string;
};

function CommentItem({
  comment,
  currentUserId,
  lang,
  t,
  onReplyClick,
  onCancelReply,
  onReplySubmit,
  onEditSave,
  onDelete,
  replying,
  submitting,
}: {
  comment: CommentRow;
  currentUserId: string | null;
  lang: "en" | "zh";
  t: ItemT;
  onReplyClick?: () => void;
  onCancelReply?: () => void;
  onReplySubmit?: (text: string) => void;
  onEditSave: (id: number, body: string) => void;
  onDelete: (id: number) => void;
  replying?: boolean;
  submitting?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [replyDraft, setReplyDraft] = useState("");

  const isMine = currentUserId === comment.user_id;
  const author = comment.profile?.display_name ?? "Anonymous";
  const avatar = comment.profile?.avatar_url ?? null;
  const wasEdited =
    new Date(comment.updated_at).getTime() -
      new Date(comment.created_at).getTime() >
    1500;
  const time = new Date(comment.created_at).toLocaleString(
    lang === "zh" ? "zh-CN" : "en-US",
    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
  );

  if (comment.deleted) {
    return (
      <div className="flex gap-3 opacity-60">
        <div className="w-8 h-8 rounded-full bg-[#1a1f2e] shrink-0" />
        <div className="text-sm text-gray-500 italic pt-1">{t.deleted}</div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {avatar ? (
        <Image
          src={avatar}
          alt={author}
          width={32}
          height={32}
          unoptimized
          className="rounded-full shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#2a3040] flex items-center justify-center text-xs text-gray-300 shrink-0">
          {author.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#e8e6e3]">{author}</span>
          <span className="text-xs text-gray-500">{time}</span>
          {wasEdited && (
            <span className="text-[10px] text-gray-600">{t.edited}</span>
          )}
        </div>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={MAX_BODY}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232] resize-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onEditSave(comment.id, draft);
                  setEditing(false);
                }}
                className="px-3 py-1 rounded bg-[#f0b232] text-[#0f1419] text-xs font-medium hover:bg-[#d4982a]"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
                className="px-3 py-1 rounded border border-[#2a3040] text-xs text-gray-300 hover:border-[#f0b232]"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-200 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
        )}

        {!editing && (
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
            {onReplyClick && (
              <button
                type="button"
                onClick={onReplyClick}
                className="hover:text-[#f0b232]"
              >
                {t.reply}
              </button>
            )}
            {isMine && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.body);
                    setEditing(true);
                  }}
                  className="hover:text-[#f0b232]"
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  className="hover:text-red-400"
                >
                  {t.delete}
                </button>
              </>
            )}
          </div>
        )}

        {replying && onReplySubmit && (
          <form
            className="mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              onReplySubmit(replyDraft);
              setReplyDraft("");
            }}
          >
            <textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              rows={2}
              maxLength={MAX_BODY}
              placeholder={`${t.replyTo} @${author}`}
              className="w-full px-3 py-2 rounded-lg bg-[#0f1419] border border-[#2a3040] text-sm text-[#e8e6e3] focus:outline-none focus:border-[#f0b232] resize-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting || !replyDraft.trim()}
                className="px-3 py-1 rounded bg-[#f0b232] text-[#0f1419] text-xs font-medium hover:bg-[#d4982a] disabled:opacity-40"
              >
                {t.submit}
              </button>
              <button
                type="button"
                onClick={onCancelReply}
                className="px-3 py-1 rounded border border-[#2a3040] text-xs text-gray-300 hover:border-[#f0b232]"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
