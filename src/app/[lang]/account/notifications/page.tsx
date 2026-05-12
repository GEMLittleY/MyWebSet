import type { Metadata } from "next";
import NotificationsContent from "@/components/NotificationsContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "zh" ? "通知中心" : "Notifications",
    robots: { index: false, follow: false },
    alternates: { canonical: `/${lang}/account/notifications` },
  };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <NotificationsContent lang={lang === "zh" ? "zh" : "en"} />;
}
