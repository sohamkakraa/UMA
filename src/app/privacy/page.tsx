"use client";

import Link from "next/link";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { Footer } from "@/components/ui/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <AppTopNav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <Link href="/dashboard" className="text-xs text-[var(--accent)] hover:underline mb-6 inline-block">&larr; Back to dashboard</Link>
        <h1 className="text-2xl font-bold text-[var(--fg)] mb-6">Privacy Policy</h1>
        <div className="prose prose-sm text-[var(--fg)] space-y-4 text-sm leading-relaxed">
          <p className="text-[var(--muted)] text-xs italic">Last updated: April 2026</p>

          <h2 className="text-lg font-semibold mt-6">1. What UMA does</h2>
          <p>
            UMA (Ur Medical Assistant) is a personal health companion that helps you organise and understand your medical records. It is <strong>not</strong> a medical device and does not provide diagnoses, treatment plans, or clinical advice.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Data storage</h2>
          <p>
            All health data you upload or enter into UMA is stored <strong>locally on your device</strong> using your browser&apos;s localStorage. UMA does not maintain a server-side database of your medical records. Your data never leaves your device unless you explicitly choose to export or share it.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. PDF processing</h2>
          <p>
            When you upload a PDF for extraction, the document content is sent to a third-party AI service (Anthropic Claude) for processing. This is necessary to extract structured data from your medical reports. The AI provider&apos;s own privacy policies apply to this processing. UMA does not store your PDFs on any external server after processing is complete.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Chat functionality</h2>
          <p>
            Chat messages and your health context are sent to an AI provider to generate responses. These conversations are not stored server-side by UMA. The AI provider may process your messages according to their own data retention policies.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. No advertising or tracking</h2>
          <p>
            UMA does not display advertisements, sell your data, or use third-party analytics trackers. We do not build advertising profiles from your health information.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Data you control</h2>
          <p>
            You can delete all your data at any time by clearing your browser&apos;s localStorage for this site. You can also remove individual documents, medications, or log entries from within the app.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Family profiles</h2>
          <p>
            Family member profiles you create are stored locally alongside your own data. Cross-account family connections require both parties to accept a link request. Visibility settings let each person control what health information is shared.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Contact</h2>
          <p>
            If you have questions about this privacy policy or how UMA handles your data, please reach out to our support team.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
