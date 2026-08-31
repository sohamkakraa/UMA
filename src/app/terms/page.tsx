import Link from "next/link";
import type { Metadata } from "next";
import { LandingHeader } from "@/components/nav/LandingHeader";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Closed-beta terms",
  description: "Terms for using UMA's invite-only synthetic-data closed beta.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <LandingHeader />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <Link href="/" className="mb-6 inline-flex min-h-11 items-center text-sm text-[var(--accent)] hover:underline">
          &larr; Back to UMA
        </Link>
        <h1 className="text-3xl font-semibold text-[var(--fg)] mb-6">Closed-beta terms</h1>
        <div className="prose prose-sm text-[var(--fg)] space-y-4 text-sm leading-relaxed">
          <p className="text-[var(--muted)]">
            Last updated: <time dateTime="2026-07-10">10 July 2026</time>
          </p>

          <h2 className="text-lg font-semibold mt-6">1. Acceptance of terms</h2>
          <p>
            UMA is operated by Soham Kakra as an individual. By joining the
            invite-only beta, you agree to these terms and the privacy policy.
            Stop using UMA if you do not agree.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Synthetic-data beta</h2>
          <p>
            Use only synthetic or supplied demo records. Do not upload or enter real
            patient information. Features may change, be disabled, or lose beta data
            while UMA is being tested.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. Not medical advice</h2>
          <p>
            UMA is a record organiser, <strong>not</strong> a medical device,
            diagnostic service, emergency service, or substitute for a qualified
            clinician. Do not make treatment, medication, or emergency decisions from
            UMA. Contact local emergency services for urgent help.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Accuracy and verification</h2>
          <p>
            PDF extraction, charts, summaries, and AI replies can be incomplete or
            wrong. Verify every important value against the original record. Report
            ranges and clinician guidance take priority over UMA&apos;s presentation.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Your account and data</h2>
          <p>
            You retain rights in data you provide. You are responsible for securing
            access to your email, phone, and signed-in devices. UMA stores browser and
            cloud copies as described in the privacy policy. Keep independent copies of
            important records.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Acceptable use</h2>
          <p>
            Do not probe other accounts, bypass safeguards, automate abusive traffic,
            send unsolicited email, upload unlawful content, or use UMA to make
            decisions about another person without their informed permission.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Third-party services</h2>
          <p>
            Hosting, database, AI, email, and optional messaging providers process data
            needed for their functions under their own terms. Availability, retention,
            and errors in those services are outside UMA&apos;s full control.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Reminders and experimental features</h2>
          <p>
            Reminders are convenience prompts, not guaranteed alarms. Insurance,
            WhatsApp, family sharing, wearable sync, and other labelled experiments
            must not be relied on until UMA states that they are available.
          </p>

          <h2 className="text-lg font-semibold mt-6">9. Availability and liability</h2>
          <p>
            The beta is provided &ldquo;as is&rdquo; and may be interrupted or withdrawn.
            To the extent permitted by applicable law, the operator disclaims warranties
            and liability for decisions made from beta output, missed reminders, provider
            failures, or loss of beta data.
          </p>

          <h2 className="text-lg font-semibold mt-6">10. Suspension and changes</h2>
          <p>
            Access may be suspended for security, abuse, legal, or operational reasons.
            Material term changes will be shown with a new effective date before they
            apply to continued beta use.
          </p>

          <h2 className="text-lg font-semibold mt-6">11. Contact</h2>
          <p>
            Questions can be sent{" "}
            {supportEmail ? (
              <>
                to{" "}
                <a className="text-[var(--accent)] underline" href={`mailto:${supportEmail}`}>
                  {supportEmail}
                </a>
              </>
            ) : (
              "using the contact details in your beta invitation"
            )}
            .
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
