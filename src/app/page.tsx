import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileText,
  LineChart,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/ui/Footer";
import { LandingHeader } from "@/components/nav/LandingHeader";
import { canonicalAppUrl, SITE_DESCRIPTION } from "@/lib/site";

const betaFeatures = [
  {
    icon: FileText,
    title: "Turn demo reports into a timeline",
    body: "Upload a supplied synthetic PDF, check the extracted details, and keep the original beside the summary.",
  },
  {
    icon: LineChart,
    title: "See changes without the jargon",
    body: "Review demo laboratory values, medicines, appointments, and health logs in one calm dashboard.",
  },
  {
    icon: MessageCircle,
    title: "Ask about the records on screen",
    body: "Use plain language to find a stored value or understand a term. UMA shows its limits and does not diagnose.",
  },
];

const frequentlyAsked = [
  {
    question: "Can I use my real medical records?",
    answer: "Not during this closed beta. Use only the synthetic records supplied with your invitation.",
  },
  {
    question: "Is UMA medical advice?",
    answer: "No. UMA is a record organiser and explainer. A qualified clinician should make medical decisions.",
  },
  {
    question: "Does UMA save beta activity?",
    answer: "Yes. Structured demo records and chat history are stored in UMA’s hosted database, with a browser copy on your device.",
  },
];

export default function HomePage() {
  const siteUrl = canonicalAppUrl().toString();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "UMA",
        url: siteUrl,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "SoftwareApplication",
        name: "UMA — Ur Medical Assistant",
        url: siteUrl,
        applicationCategory: "HealthApplication",
        operatingSystem: "Web",
        description: SITE_DESCRIPTION,
        isAccessibleForFree: true,
        audience: {
          "@type": "Audience",
          audienceType: "Invited adult closed-beta testers using synthetic records",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <LandingHeader />
      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[minmax(0,1fr)_360px] md:items-center md:py-24">
          <div>
            <p className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 text-sm font-medium text-[var(--accent)]">
              Invite-only synthetic-data beta
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              Your health records, made easier to follow
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
              UMA organises demo reports, medicines, laboratory results, and notes
              into one readable story. It helps you find information; it does not
              diagnose or replace your doctor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Open the beta
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                Read how data is handled
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)]">
            <ShieldCheck className="h-8 w-8 text-[var(--accent)]" aria-hidden />
            <h2 className="mt-5 text-xl font-semibold">A careful beta boundary</h2>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
              {[
                "Synthetic records only",
                "Every extraction must be checked",
                "No diagnosis or emergency guidance",
                "Export or delete your beta account",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--panel-2)]">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-semibold tracking-tight">What you can test</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)]">
              Three focused workflows, designed for people who want clarity rather than another clinical portal.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {betaFeatures.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"
                >
                  <feature.icon className="h-6 w-6 text-[var(--accent)]" aria-hidden />
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">How the beta works</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                One record, one review, one useful next step at a time.
              </p>
            </div>
            <ol className="grid gap-4">
              {[
                ["Sign in", "Use the private invitation and one-time code provided for your test account."],
                ["Use a demo report", "Upload a supplied synthetic PDF and compare every extracted item with the source."],
                ["Share feedback", "Tell us what was clear, what was difficult, and what you expected to happen next."],
              ].map(([title, body], index) => (
                <li
                  key={title}
                  className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-semibold text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-[var(--panel)]">
          <div className="mx-auto max-w-3xl px-4 py-16">
            <h2 className="text-3xl font-semibold tracking-tight">Questions before you join</h2>
            <div className="mt-8 divide-y divide-[var(--border)]">
              {frequentlyAsked.map((item) => (
                <article key={item.question} className="py-6 first:pt-0 last:pb-0">
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
