-- 创建博客文章表
CREATE TABLE IF NOT EXISTS posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 启用 Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 公开读取策略（博客文章对所有人可见）
CREATE POLICY "Posts are publicly readable"
  ON posts FOR SELECT
  USING (true);

-- 插入示例文章（可选）
INSERT INTO posts (title, slug, excerpt, content, published_at) VALUES
(
  '欢迎来到我的博客',
  'welcome',
  '这是我的第一篇博客文章，记录我的技术探索之旅。',
  '# 欢迎来到我的博客

这是我使用 **Next.js + Supabase + Vercel + Cloudflare** 搭建的个人博客。

## 技术栈

- **Next.js** - React 全栈框架
- **Tailwind CSS** - 原子化 CSS 框架
- **Supabase** - 开源 Firebase 替代品
- **Vercel** - 边缘部署平台
- **Cloudflare** - CDN 与安全防护

希望你喜欢这个博客！',
  NOW()
);
