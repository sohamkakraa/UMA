import "./globals.css";
import type { Metadata } from "next";
import { ThemeInit } from "@/components/theme/ThemeInit";

export const metadata: Metadata = {
  title: "UMA — Ur Medical Assistant",
  description: "UMA is your personal health companion and medical record assistant.",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body suppressHydrationWarning className="min-h-screen">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
