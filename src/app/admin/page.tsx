"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

const ADMIN_GITHUB_USERNAME = process.env.NEXT_PUBLIC_ADMIN_GITHUB_ID || "GEMLittleY";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [deckUploading, setDeckUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/admin/login"); return; }
      const githubUsername = user.user_metadata?.user_name;
      if (githubUsername !== ADMIN_GITHUB_USERNAME) {
        setMessage("权限不足：你不是管理员");
        setLoading(false);
        return;
      }
      setUser(user);
      setLoading(false);
    });
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleMarkdownUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.name.endsWith(".md")) { setMessage("请选择 .md 文件"); return; }
      setUploading(true); setMessage("");
      try {
        const text = await file.text();
        const matter = await import("gray-matter");
        const { data: frontmatter, content } = matter.default(text);
        if (!frontmatter.title || !frontmatter.slug) {
          setMessage("Markdown 文件缺少 title 或 slug"); setUploading(false); return;
        }
        const post = {
          title: frontmatter.title, slug: frontmatter.slug,
          excerpt: frontmatter.excerpt || "", content: content.trim(),
          cover_image: frontmatter.cover_image || null,
          title_en: frontmatter.title_en || "",
          category: frontmatter.category || "general",
          published_at: frontmatter.published_at || new Date().toISOString(),
        };
        const { error } = await supabase.from("posts").upsert(post, { onConflict: "slug" });
        if (error) setMessage(`发布失败: ${error.message}`);
        else setMessage(`攻略「${post.title}」发布成功！`);
      } catch (err) {
        setMessage(`解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
      setUploading(false); e.target.value = "";
    }, [supabase]
  );

  const handleDeckUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.name.endsWith(".json")) { setMessage("请选择 .json 文件"); return; }
      setDeckUploading(true); setMessage("");
      try {
        const text = await file.text();
        const deck = JSON.parse(text);
        if (!deck.title || !deck.slug || !deck.hero_class) {
          setMessage("JSON 文件缺少 title、slug 或 hero_class");
          setDeckUploading(false); return;
        }
        const deckData = {
          title: deck.title, title_en: deck.title_en || "", slug: deck.slug,
          hero_class: deck.hero_class, archetype: deck.archetype || "midrange",
          deck_code: deck.deck_code || "", dust_cost: deck.dust_cost || 0,
          tier: deck.tier || 3, win_rate: deck.win_rate || 50,
          guide: deck.guide || "", card_list: deck.card_list || [],
          matchups: deck.matchups || {},
          published_at: deck.published_at || new Date().toISOString(),
        };
        const { error } = await supabase.from("decks").upsert(deckData, { onConflict: "slug" });
        if (error) setMessage(`卡组发布失败: ${error.message}`);
        else setMessage(`卡组「${deckData.title}」发布成功！`);
      } catch (err) {
        setMessage(`解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }
      setDeckUploading(false); e.target.value = "";
    }, [supabase]
  );

  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setMediaUploading(true); setMediaUrl("");
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(fileName, file);
      if (error) { setMessage(`媒体上传失败: ${error.message}`); setMediaUploading(false); return; }
      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      setMediaUrl(data.publicUrl);
      setMediaUploading(false); e.target.value = "";
    }, [supabase]
  );

  const copyToClipboard = (text: string, isVideo: boolean) => {
    const markdown = isVideo ? `<video src="${text}" controls width="100%"></video>` : `![image](${text})`;
    navigator.clipboard.writeText(markdown);
    setMessage("已复制 Markdown 链接到剪贴板！");
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-gray-500">加载中...</p></div>;
  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><p className="text-red-500">{message || "未登录"}</p></div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold gold-text">管理后台</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.user_metadata?.user_name}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">退出</button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-[#1a1f2e] border border-[#f0b232]/30 text-[#f0b232] text-sm">
          {message}
        </div>
      )}

      {/* Upload Guide */}
      <section className="mb-8 card p-6">
        <h2 className="text-lg font-semibold text-[#e8e6e3] mb-2">发布攻略</h2>
        <p className="text-xs text-gray-500 mb-4">上传 .md 文件（frontmatter: title, slug, excerpt, category）</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f0b232] text-[#0f1419] text-sm font-medium hover:bg-[#d4982a] cursor-pointer">
          {uploading ? "上传中..." : "选择 .md 文件"}
          <input type="file" accept=".md" onChange={handleMarkdownUpload} disabled={uploading} className="hidden" />
        </label>
      </section>

      {/* Upload Deck */}
      <section className="mb-8 card p-6">
        <h2 className="text-lg font-semibold text-[#e8e6e3] mb-2">发布卡组</h2>
        <p className="text-xs text-gray-500 mb-4">上传 .json 文件（字段: title, slug, hero_class, deck_code, tier, win_rate 等）</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4fc3f7] text-[#0f1419] text-sm font-medium hover:bg-[#3aa8d8] cursor-pointer">
          {deckUploading ? "上传中..." : "选择 .json 文件"}
          <input type="file" accept=".json" onChange={handleDeckUpload} disabled={deckUploading} className="hidden" />
        </label>
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer">查看 JSON 格式示例</summary>
          <pre className="mt-2 p-3 rounded bg-[#0f1419] text-xs text-gray-400 overflow-x-auto">
{`{
  "title": "卡组名称",
  "title_en": "English Name",
  "slug": "deck-slug",
  "hero_class": "mage",
  "archetype": "combo",
  "deck_code": "AAECAf0E...",
  "dust_cost": 8000,
  "tier": 2,
  "win_rate": 54.5,
  "guide": "## 攻略\\n正文...",
  "card_list": [{"name":"火球术","cost":4,"count":2}],
  "matchups": {"warrior":55,"mage":50}
}`}
          </pre>
        </details>
      </section>

      {/* Upload Media */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-[#e8e6e3] mb-2">上传媒体</h2>
        <p className="text-xs text-gray-500 mb-4">上传图片/视频，获取 URL 粘贴到 Markdown 中</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#2a3040] text-gray-300 text-sm font-medium hover:border-[#f0b232] cursor-pointer">
          {mediaUploading ? "上传中..." : "选择图片/视频"}
          <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={mediaUploading} className="hidden" />
        </label>
        {mediaUrl && (
          <div className="mt-4 p-4 rounded-lg bg-[#0f1419]">
            <code className="text-xs break-all text-[#4fc3f7]">{mediaUrl}</code>
            <div className="mt-3 flex gap-2">
              <button onClick={() => copyToClipboard(mediaUrl, false)} className="text-xs px-3 py-1.5 rounded bg-[#2a3040] hover:bg-[#3a4050]">复制为图片</button>
              <button onClick={() => copyToClipboard(mediaUrl, true)} className="text-xs px-3 py-1.5 rounded bg-[#2a3040] hover:bg-[#3a4050]">复制为视频</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
