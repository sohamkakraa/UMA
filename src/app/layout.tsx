import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeInit } from "@/components/theme/ThemeInit";
import { MedicationReminderRunner } from "@/components/health/MedicationReminderRunner";
import { AutoModeRunner } from "@/components/notifications/AutoModeRunner";
import { FamilyRiskRunner } from "@/components/family/FamilyRiskRunner";
import { PatientStoreBootstrap } from "@/components/providers/PatientStoreBootstrap";
import { GlobalUploadProvider } from "@/lib/uploadContext";
import { GlobalUploadBadge } from "@/components/ui/GlobalUploadBadge";
import { UploadProgressSheet } from "@/components/ui/UploadProgressSheet";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { AppShell } from "@/components/nav/AppShell";
import { THEME_BOOT_SCRIPT } from "@/lib/themePreference";

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
  title: "UMA — Ur Medical Assistant",
  description: "UMA is your personal health companion and medical record assistant.",
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
    <html lang="en" suppressHydrationWarning className="h-full min-h-dvh w-full min-w-0">
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
        <ThemeInit />
        {/* One root mount: runs on every route except /login (see PatientStoreBootstrap). */}
        <PatientStoreBootstrap />
        <MedicationReminderRunner />
        <AutoModeRunner />
        <FamilyRiskRunner />
        <TooltipProvider delayDuration={300}>
          <GlobalUploadProvider>
            <AppShell>
              <div className="relative w-full min-w-0 flex-1">{children}</div>
            </AppShell>
            <UploadProgressSheet />
            <GlobalUploadBadge />
          </GlobalUploadProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
