import type { Metadata } from "next";
import AccountContent from "@/components/AccountContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "我的账户" : "Account",
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${lang}/account`,
    },
  };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <AccountContent lang={lang === "zh" ? "zh" : "en"} />;
}
