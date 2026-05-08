import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export default async function Home() {
  const posts = await getAllPosts();
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          你好，欢迎来到
          <br />
          <span className="text-blue-600 dark:text-blue-400">MyWebSet</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          这是一个使用现代技术栈免费搭建的个人博客。
          记录技术探索、学习笔记和生活感悟。
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/blog"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            浏览文章
          </Link>
          <a
            href="https://github.com/GEMLittleY/MyWebSet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            查看源码
          </a>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
          技术栈
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "Next.js", desc: "React 框架" },
            { name: "Supabase", desc: "数据库服务" },
            { name: "Vercel", desc: "部署平台" },
            { name: "Cloudflare", desc: "CDN & 安全" },
          ].map((tech) => (
            <div
              key={tech.name}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {tech.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tech.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            最新文章
          </h2>
          <Link
            href="/blog"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            查看全部 →
          </Link>
        </div>
        <div className="space-y-2">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
