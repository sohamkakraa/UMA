import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { ThemeInit } from "@/components/theme/ThemeInit";
import { AuthenticatedRunners } from "@/components/providers/AuthenticatedRunners";
import { GlobalUploadProvider } from "@/lib/uploadContext";
import { GlobalUploadBadge } from "@/components/ui/GlobalUploadBadge";
import { UploadProgressSheet } from "@/components/ui/UploadProgressSheet";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { AppShell } from "@/components/nav/AppShell";
import { THEME_BOOT_SCRIPT } from "@/lib/themePreference";
import { canonicalAppUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

/** Mobile / tablet / desktop: correct initial scale, notches, and theme color in browser chrome. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1114" },
  ],
};

export const metadata: Metadata = {
  metadataBase: canonicalAppUrl(),
  applicationName: "UMA",
  title: {
    default: SITE_NAME,
    template: "%s | UMA",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  authors: [{ name: "Soham Kakra" }],
  creator: "Soham Kakra",
  category: "health record organisation",
  keywords: [
    "health record organiser",
    "medical report explainer",
    "medication organiser",
    "synthetic health data beta",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "UMA",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: "/logo.svg", alt: "UMA logo" }],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  // Favicon: `src/app/icon.svg` (App Router). Legacy `/favicon.ico` → `/logo.svg` in `next.config.ts`.
  icons: {
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    title: "UMA",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable} h-full min-h-dvh w-full min-w-0`}
    >
      <head>
        {/*
          Inline boot (not next/script): React 19 warns when a <script> is rendered through
          the normal body tree; head + RSC output avoids that and still runs before paint.
        */}
        <script
          id="uma-theme-boot"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-dvh min-h-screen w-full min-w-0 overflow-x-hidden antialiased"
      >
        <a
          href="#main-content"
          className="sr-only fixed left-3 top-3 z-[500] min-h-11 items-center rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-contrast)] focus:not-sr-only focus:flex"
        >
          Skip to main content
        </a>
        <ThemeInit />
        <AuthenticatedRunners />
        <TooltipProvider delayDuration={300}>
          <GlobalUploadProvider>
            <AppShell>
              <div id="main-content" tabIndex={-1} className="relative w-full min-w-0 flex-1">
                {children}
              </div>
            </AppShell>
            <UploadProgressSheet />
            <GlobalUploadBadge />
          </GlobalUploadProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
