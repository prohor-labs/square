import type { Metadata } from "next";
import { ReactQueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { anekBangla } from "@/lib/fonts";
import "@/app/globals.css";
import "katex/dist/katex.min.css";

import { dictionary } from "@/lib/dictionary";
import { siteJsonLd, siteMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary;

  return {
    ...siteMetadata,
    title: dict.meta.title,
    description: dict.meta.description,
    authors: [{ name: "Prohor Team", url: "https://github.com/TeamProhor" }],
    creator: "Prohor Team",
    publisher: "Prohor Team",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
      date: false,
    },
    alternates: {
      canonical: `/`,
      languages: {
        "en-US": "/en",
        "bn-BD": "/bn",
      },
    },
    openGraph: {
      ...siteMetadata.openGraph,
      title: dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      locale: "bn_BD",
      url: `https://prohor-nextjs-starter-kit.vercel.app/`,
    },
    twitter: {
      ...siteMetadata.twitter,
      title: dict.meta.twitterTitle,
      description: dict.meta.twitterDescription,
      site: "@TeamProhor",
      creator: "@TeamProhor",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dict = dictionary;

  const dynamicJsonLd = {
    ...siteJsonLd,
    "@graph": siteJsonLd["@graph"].map((item) => {
      if (item["@type"] === "WebSite") {
        return {
          ...item,
          name: dict.jsonLd.name,
          description: dict.jsonLd.description,
          inLanguage: dict.jsonLd.language,
          url: `https://prohor-nextjs-starter-kit.vercel.app/`,
        };
      }
      return item;
    }),
  };

  const jsonLdString = JSON.stringify(dynamicJsonLd)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <html
      lang="bn"
      className={`${anekBangla.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safely serialized
          dangerouslySetInnerHTML={{ __html: jsonLdString }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <ReactQueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
