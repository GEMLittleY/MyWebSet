import type { Metadata } from "next";
import LoginContent from "@/components/LoginContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "登录" : "Sign in",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${lang}/login`,
    },
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { lang } = await params;
  const sp = await searchParams;
  return (
    <LoginContent
      lang={lang === "zh" ? "zh" : "en"}
      next={sp.next}
      error={sp.error}
    />
  );
}
