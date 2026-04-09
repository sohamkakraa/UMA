import { Resend } from "resend";

export function isOtpEmailDeliveryConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  return Boolean(key && from);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends a 6-digit sign-in code. Does not log the recipient or code.
 */
export async function sendSignInOtpEmail(
  to: string,
  code: string,
): Promise<{ ok: true } | { ok: false }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!key || !from) return { ok: false };

  const resend = new Resend(key);
  const safeCode = escapeHtml(code);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Your UMA sign-in code",
    text: `Your UMA sign-in code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#151515">Your UMA sign-in code is:</p>
<p style="font-family:ui-monospace,monospace;font-size:28px;font-weight:600;letter-spacing:0.2em;margin:16px 0">${safeCode}</p>
<p style="font-family:system-ui,sans-serif;font-size:14px;color:#555">This code expires in 10 minutes. If you did not try to sign in, you can ignore this message.</p>`,
  });

  if (error) return { ok: false };
  return { ok: true };
}
