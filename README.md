# MyWebSet

使用 **Next.js + Supabase + Vercel + Cloudflare** 搭建的免费个人博客。

## 技术栈

- **Next.js 16** - React 全栈框架 (App Router)
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Supabase** - PostgreSQL 数据库 + API
- **Vercel** - 自动部署平台
- **Cloudflare** - CDN 加速 + DDoS 防护

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local 填入你的 Supabase 信息

# 启动开发服务器
npm run dev
```

## Supabase 数据库设置

在 Supabase SQL Editor 中执行以下 SQL 创建文章表：

```sql
CREATE TABLE posts (
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

-- 允许所有人读取文章（公开博客）
CREATE POLICY "Posts are publicly readable"
  ON posts FOR SELECT
  USING (true);
```

## 部署

### Vercel
1. 在 Vercel 中 Import GitHub 仓库
2. 添加环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 部署会自动完成

### Cloudflare
1. 将域名 NS 记录指向 Cloudflare
2. 添加 CNAME 记录指向 `cname.vercel-dns.com`
3. 代理状态开启（橙色云朵）
4. SSL 设置为 **Full (Strict)**

## 线上地址

https://my-web-set.vercel.app
