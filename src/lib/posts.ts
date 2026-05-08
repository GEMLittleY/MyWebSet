import { supabase, type Post } from "./supabase";

const DEMO_POSTS: Post[] = [
  {
    id: 1,
    title: "欢迎来到我的博客",
    slug: "welcome",
    excerpt: "这是我的第一篇博客文章，记录我的技术探索之旅。",
    content: `# 欢迎来到我的博客

这是我使用 **Next.js + Supabase + Vercel + Cloudflare** 搭建的个人博客。

## 技术栈

- **Next.js** - React 全栈框架
- **Tailwind CSS** - 原子化 CSS 框架
- **Supabase** - 开源 Firebase 替代品
- **Vercel** - 边缘部署平台
- **Cloudflare** - CDN 与安全防护

## 为什么选择这套技术栈？

这套技术栈完全免费，却提供了企业级的性能和安全性。Cloudflare 提供全球 CDN 加速和 DDoS 防护，Vercel 让部署变得极其简单，Supabase 则提供了强大的 PostgreSQL 数据库。

希望你喜欢这个博客！
`,
    cover_image: null,
    published_at: "2024-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "用 Supabase 构建后端服务",
    slug: "supabase-backend",
    excerpt: "Supabase 是一个开源的 Firebase 替代品，提供数据库、认证、存储等一站式服务。",
    content: `# 用 Supabase 构建后端服务

Supabase 基于 PostgreSQL，提供了丰富的功能：

## 核心功能

1. **数据库** - 完整的 PostgreSQL，支持 Row Level Security
2. **认证** - 支持邮箱、OAuth 等多种登录方式
3. **存储** - 文件存储服务，支持大文件上传
4. **实时订阅** - 数据变更实时推送
5. **Edge Functions** - 在边缘运行的 Serverless 函数

## 免费额度

- 500MB 数据库空间
- 1GB 文件存储
- 50,000 月活跃用户
- 无限 API 请求

对于个人项目来说完全够用！
`,
    cover_image: null,
    published_at: "2024-01-15T00:00:00Z",
    created_at: "2024-01-15T00:00:00Z",
  },
  {
    id: 3,
    title: "Cloudflare 免费防护的威力",
    slug: "cloudflare-protection",
    excerpt: "了解 Cloudflare 如何为你的网站提供企业级安全防护，而且完全免费。",
    content: `# Cloudflare 免费防护的威力

Cloudflare 承担了互联网约 20% 的流量转发，是全球最大的网络安全公司之一。

## 免费计划包含什么？

- **DDoS 防护** - 无限制，与付费用户完全一致
- **CDN 加速** - 全球 300+ 节点
- **免费 SSL** - 自动配置 HTTPS
- **Web 应用防火墙 (WAF)** - 基础规则免费
- **DNS 托管** - 世界上最快的 DNS 解析之一

## 配置建议

1. 将域名 NS 记录指向 Cloudflare
2. 开启代理模式（橙色云朵）
3. SSL 设置为 Full (Strict)
4. 开启 Always Use HTTPS

这样你的网站就拥有了企业级的安全防护！
`,
    cover_image: null,
    published_at: "2024-02-01T00:00:00Z",
    created_at: "2024-02-01T00:00:00Z",
  },
];

export async function getAllPosts(): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_POSTS;
    }
    return data;
  } catch {
    return DEMO_POSTS;
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return DEMO_POSTS.find((p) => p.slug === slug) || null;
    }
    return data;
  } catch {
    return DEMO_POSTS.find((p) => p.slug === slug) || null;
  }
}
