import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getDict, type Lang } from "@/lib/i18n";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hearthguide.app";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "zh" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") return {};
  const t = getDict(lang as Lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${t.siteName} - ${t.siteDesc}`,
      template: `%s | ${t.siteName}`,
    },
    description: t.hero.desc,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        en: "/en",
        "zh-CN": "/zh",
        "x-default": "/en",
      },
    },
    openGraph: {
      siteName: t.siteName,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      type: "website",
    },
  };
}

export default async function LangLayout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  if (lang !== "en" && lang !== "zh") notFound();
  const typedLang = lang as Lang;

  return (
    <html
      lang={typedLang === "zh" ? "zh-CN" : "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f1419] text-[#e8e6e3]">
        <LanguageProvider lang={typedLang}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
