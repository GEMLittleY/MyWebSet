import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AdSenseScript from "@/components/AdSenseScript";
import AnalyticsBoot from "@/components/AnalyticsBoot";
import { LanguageProvider } from "@/components/LanguageProvider";
import { FavoritesProvider } from "@/lib/favorites";
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

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HearthGuide",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [],
  };
  const siteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HearthGuide",
    url: SITE_URL,
    inLanguage: typedLang === "zh" ? "zh-CN" : "en",
  };

  return (
    <html
      lang={typedLang === "zh" ? "zh-CN" : "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0f1419] text-[#e8e6e3]">
        <JsonLd data={[orgLd, siteLd]} />
        <AdSenseScript />
        <Analytics />
        <LanguageProvider lang={typedLang}>
          <FavoritesProvider>
            <AnalyticsBoot />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </FavoritesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
