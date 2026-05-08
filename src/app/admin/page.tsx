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
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/admin/login");
        return;
      }
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
      if (!file || !file.name.endsWith(".md")) {
        setMessage("请选择 .md 文件");
        return;
      }

      setUploading(true);
      setMessage("");

      try {
        const text = await file.text();
        const matter = await import("gray-matter");
        const { data: frontmatter, content } = matter.default(text);

        if (!frontmatter.title || !frontmatter.slug) {
          setMessage("Markdown 文件缺少 title 或 slug (在 frontmatter 中定义)");
          setUploading(false);
          return;
        }

        const post = {
          title: frontmatter.title,
          slug: frontmatter.slug,
          excerpt: frontmatter.excerpt || "",
          content: content.trim(),
          cover_image: frontmatter.cover_image || null,
          published_at: frontmatter.published_at || new Date().toISOString(),
        };

        const { error } = await supabase.from("posts").upsert(post, {
          onConflict: "slug",
        });

        if (error) {
          setMessage(`发布失败: ${error.message}`);
        } else {
          setMessage(`文章「${post.title}」发布成功！`);
        }
      } catch (err) {
        setMessage(`解析失败: ${err instanceof Error ? err.message : "未知错误"}`);
      }

      setUploading(false);
      e.target.value = "";
    },
    [supabase]
  );

  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setMediaUploading(true);
      setMediaUrl("");

      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (error) {
        setMessage(`媒体上传失败: ${error.message}`);
        setMediaUploading(false);
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      setMediaUrl(data.publicUrl);
      setMediaUploading(false);
      e.target.value = "";
    },
    [supabase]
  );

  const copyToClipboard = (text: string, isVideo: boolean) => {
    const markdown = isVideo
      ? `<video src="${text}" controls width="100%"></video>`
      : `![image](${text})`;
    navigator.clipboard.writeText(markdown);
    setMessage("已复制 Markdown 链接到剪贴板！");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500">{message || "未登录"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          管理后台
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {user.user_metadata?.user_name}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            退出
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
          {message}
        </div>
      )}

      {/* Upload Markdown */}
      <section className="mb-10 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          发布文章
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          上传 Markdown 文件（需包含 frontmatter：title, slug, excerpt）
        </p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-80 transition-opacity cursor-pointer">
          {uploading ? "上传中..." : "选择 .md 文件"}
          <input
            type="file"
            accept=".md"
            onChange={handleMarkdownUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 font-mono">
          <p>---</p>
          <p>title: 文章标题</p>
          <p>slug: url-slug</p>
          <p>excerpt: 文章简介</p>
          <p>cover_image: (可选)</p>
          <p>---</p>
          <p className="mt-1">正文内容...</p>
        </div>
      </section>

      {/* Upload Media */}
      <section className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          上传媒体
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          上传图片或视频，获取 URL 后粘贴到 Markdown 中
        </p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
          {mediaUploading ? "上传中..." : "选择图片/视频"}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            disabled={mediaUploading}
            className="hidden"
          />
        </label>

        {mediaUrl && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
            <p className="text-xs text-gray-500 mb-2">文件 URL：</p>
            <code className="text-xs break-all text-blue-600 dark:text-blue-400">
              {mediaUrl}
            </code>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => copyToClipboard(mediaUrl, false)}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                复制为图片
              </button>
              <button
                onClick={() => copyToClipboard(mediaUrl, true)}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                复制为视频
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
