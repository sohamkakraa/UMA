"use client";

import Link from "next/link";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { Footer } from "@/components/ui/Footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <AppTopNav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
        <Link href="/dashboard" className="text-xs text-[var(--accent)] hover:underline mb-6 inline-block">&larr; Back to dashboard</Link>
        <h1 className="text-2xl font-bold text-[var(--fg)] mb-6">Terms &amp; Conditions</h1>
        <div className="prose prose-sm text-[var(--fg)] space-y-4 text-sm leading-relaxed">
          <p className="text-[var(--muted)] text-xs italic">Last updated: April 2026</p>

          <h2 className="text-lg font-semibold mt-6">1. Acceptance of terms</h2>
          <p>
            By using UMA, you agree to these terms and conditions. If you do not agree, please do not use the application.
          </p>

          <h2 className="text-lg font-semibold mt-6">2. Not medical advice</h2>
          <p>
            UMA is a personal health organiser, <strong>not</strong> a medical device, diagnostic tool, or substitute for professional medical advice. All AI-generated summaries, explanations, and suggestions are for informational purposes only. Always consult a qualified healthcare professional before making health decisions.
          </p>

          <h2 className="text-lg font-semibold mt-6">3. Accuracy</h2>
          <p>
            While UMA strives to accurately extract and display information from your medical documents, we cannot guarantee 100% accuracy in PDF extraction or AI-generated interpretations. Always verify important health information against your original documents and consult your healthcare provider.
          </p>

          <h2 className="text-lg font-semibold mt-6">4. Your data</h2>
          <p>
            You retain full ownership of all health data you enter or upload. UMA stores data locally on your device. You are responsible for maintaining backups of important health records. Clearing your browser data will permanently delete your UMA data.
          </p>

          <h2 className="text-lg font-semibold mt-6">5. Third-party services</h2>
          <p>
            UMA uses third-party AI services (such as Anthropic Claude) to process documents and power chat functionality. By using these features, you acknowledge that your data will be processed by these services according to their own terms and privacy policies.
          </p>

          <h2 className="text-lg font-semibold mt-6">6. Medication reminders</h2>
          <p>
            Medication reminders in UMA are convenience features only. They are <strong>not</strong> guaranteed alarms and should not be relied upon as the sole method for medication adherence. UMA is not responsible for missed doses due to technical issues, browser closures, or notification failures.
          </p>

          <h2 className="text-lg font-semibold mt-6">7. Limitation of liability</h2>
          <p>
            UMA is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any health outcomes, data loss, or damages arising from the use of this application.
          </p>

          <h2 className="text-lg font-semibold mt-6">8. Changes to terms</h2>
          <p>
            We may update these terms from time to time. Continued use of UMA after changes constitutes acceptance of the updated terms.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
