import { getAllPosts } from "@/lib/posts";
import GuidesContent from "@/components/GuidesContent";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "攻略文章 - HearthGuide",
  description: "炉石传说上分攻略、版本解析和新手教程",
};

export default async function GuidesPage() {
  const posts = await getAllPosts();
  return <GuidesContent posts={posts} />;
}
