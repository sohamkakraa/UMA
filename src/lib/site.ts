export const SITE_NAME = "UMA — Ur Medical Assistant";
export const SITE_DESCRIPTION =
  "An invite-only synthetic-data beta that organises demo health records into a clear timeline, dashboard, and plain-language chat.";

export function canonicalAppUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    return new URL(configured || "https://uma.sohamkakra.com");
  } catch {
    return new URL("https://uma.sohamkakra.com");
  }
}
