import Link from "next/link";
import type { Metadata } from "next";
import { LandingHeader } from "@/components/nav/LandingHeader";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How UMA stores, processes, protects, exports, and deletes closed-beta data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <LandingHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <Link href="/" className="mb-6 inline-flex min-h-11 items-center text-sm text-[var(--accent)] hover:underline">
          &larr; Back to UMA
        </Link>
        <h1 className="text-3xl font-semibold text-[var(--fg)] mb-6">Privacy policy</h1>
        <div className="prose prose-sm text-[var(--fg)] space-y-4 text-sm leading-relaxed">
          <p className="text-[var(--muted)]">
            Last updated: <time dateTime="2026-07-10">10 July 2026</time>
          </p>

          <h2 className="text-lg font-semibold mt-6">1. Operator and beta scope</h2>
          <p>
            UMA is operated by Soham Kakra as an individual. This release is an
            invite-only closed beta for adults using supplied synthetic or demo records.
            Do not enter real patient information during this beta.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Information UMA processes</h2>
          <p>
            UMA processes account identifiers, profile details, extracted record content,
            medicines, laboratory values, health logs, insurance drafts, settings, and
            chat messages. The web app keeps a browser copy and synchronises structured
            records and conversations to UMA&apos;s hosted PostgreSQL database so they can
            survive reloads and be used across signed-in sessions.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. Documents and AI processing</h2>
          <p>
            Uploaded PDFs may be sent to LlamaParse for text extraction and to Anthropic
            for structuring or direct PDF analysis. Chat may use Anthropic or OpenAI,
            including a user-provided API key when configured. Original PDF bytes remain
            in the browser after processing; extracted text and structured results may be
            synchronised to UMA&apos;s database. Provider retention and contractual terms
            apply to data sent to each provider.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Other service providers</h2>
          <p>
            UMA uses Vercel for application hosting, a managed PostgreSQL provider for
            database storage, Resend for email delivery, and Meta&apos;s WhatsApp platform
            only when those optional features are enabled. Insurance email sending and
            WhatsApp are disabled by default during the closed beta.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Purpose and sharing</h2>
          <p>
            Data is used to provide, secure, test, and improve UMA. UMA does not sell
            health information, display targeted advertising, or use health content to
            build advertising profiles. Data is shared with service providers only as
            needed for the feature you use or when required by law.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Retention and your controls</h2>
          <p>
            Browser data is removed when you sign out. Cloud account data remains until
            you delete individual records or request account deletion. The Profile page
            provides a machine-readable export and a permanent account-deletion control.
            Backups may persist briefly according to the hosting provider&apos;s recovery
            schedule.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Security and limitations</h2>
          <p>
            UMA uses encrypted transport, signed session cookies, access controls, input
            validation, rate limits, and encrypted storage for user-provided AI keys.
            No internet service can guarantee absolute security. Do not use UMA for
            emergencies or as the only copy of an important medical record.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Family features and minors</h2>
          <p>
            Cross-account family sharing is not available in this beta. UMA is intended
            for adults aged 18 and over and is not designed to collect children&apos;s data.
          </p>

          <h2 className="text-lg font-semibold mt-6">9. Contact</h2>
          <p>
            Privacy questions can be sent{" "}
            {supportEmail ? (
              <>
                to{" "}
                <a className="text-[var(--accent)] underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </>
            ) : (
              "to the operator using the contact details in your beta invitation"
            )}
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
