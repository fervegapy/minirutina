import type { Metadata, Viewport } from "next";
import { Rubik, Inter } from "next/font/google";
import "./globals.css";
import { getSiteConfig } from "@/lib/site-config";
import PostHogProvider from "@/components/PostHogProvider";
import WhatsAppFloat from "@/components/WhatsAppFloat";

// Force dynamic rendering so generateMetadata() always reads the latest
// site_config (logo/favicon/title change → next request, not next deploy).
export const dynamic = "force-dynamic";

// Inter = body / subtítulos. Rubik = títulos (h1–h6).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  weight: ["400", "500", "700"],
  display: "swap",
});

// Pulls site name / description / OG image / favicon from site_config so
// admin edits surface in the browser tab + social previews without a redeploy.
export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig();
  const title = `${cfg.site_name} — Tableros personalizados para niños`;
  return {
    title:       { default: title, template: `%s · ${cfg.site_name}` },
    description: cfg.site_description,
    icons: cfg.favicon_url
      ? { icon: cfg.favicon_url, shortcut: cfg.favicon_url, apple: cfg.favicon_url }
      : undefined,
    openGraph: {
      title,
      description: cfg.site_description,
      type:        "website",
      siteName:    cfg.site_name,
      images:      cfg.og_image_url ? [{ url: cfg.og_image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description: cfg.site_description,
      images:      cfg.og_image_url ? [cfg.og_image_url] : [],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const cfg = await getSiteConfig();
  return { themeColor: cfg.theme_color };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${rubik.variable}`}>
      <body className="antialiased">
        <PostHogProvider>{children}</PostHogProvider>
        <WhatsAppFloat />
      </body>
    </html>
  );
}
