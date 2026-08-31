"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getHydrationSafeStore, getStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { LabReadingTile } from "@/components/labs/LabReadingTile";
import { downloadMarkdownFile, downloadPdfFromBase64 } from "@/lib/downloads";
import { buildSyntheticMarkdownArtifact, parseOverviewSection } from "@/lib/markdownDoc";
import { enrichDocFromMarkdown } from "@/lib/parseMarkdownArtifact";
import { interpretLab } from "@/lib/labInterpret";
import { getLabMeta } from "@/lib/labMeta";
import { ArrowLeft, Download } from "lucide-react";

function HealthInsightsCard({ record }: { record: ReturnType<typeof getStore>["docs"][0] }) {
  if (record.type !== "Lab report") return null;
  if (!record.labs?.length) return null;

  const evaluatedLabs = record.labs
    .filter((lab) => Boolean(lab.refRange?.trim()))
    .map((lab) => ({ lab, interpretation: interpretLab(lab) }))
    .filter(({ interpretation }) => interpretation.flag !== "unknown");
  const abnormalLabs = evaluatedLabs.filter(
    ({ interpretation }) => interpretation.flag === "high" || interpretation.flag === "low",
  );
  const inRangeCount = evaluatedLabs.filter(
    ({ interpretation }) => interpretation.flag === "in_range",
  ).length;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">What this means for you</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluatedLabs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            UMA could not read a reference range from this report. Use the original report and ask your care team what the values mean for you.
          </p>
        ) : abnormalLabs.length === 0 ? (
          <div>
            <p className="text-sm text-[var(--fg)] mb-2">
              UMA did not flag a value in this summary.
            </p>
            <p className="text-sm text-[var(--muted)]">
              {inRangeCount} result{inRangeCount === 1 ? " is" : "s are"} within the range printed on this report. Check the original report before acting.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[var(--fg)]">Concerns</p>
            {abnormalLabs.map(({ lab, interpretation }, idx) => {
              const meta = getLabMeta(lab.name);
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-[var(--accent-2)]/30 bg-[var(--accent-2)]/10 p-3 text-sm text-[var(--fg)]"
                >
                  <p className="font-semibold mb-1">
                    {meta?.friendlyName ?? lab.name}{" "}
                    {interpretation.flag === "low" ? "(below report range)" : "(above report range)"}
                  </p>
                  {meta?.whyItMatters && (
                    <p className="text-sm text-[var(--muted)]">{meta.whyItMatters}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-sm font-medium text-[var(--muted)]">
          Not medical advice — report ranges vary by person and laboratory. Ask your care team before acting.
        </p>
      </CardContent>
    </Card>
  );
}

export default function DocDetailClient() {
  const params = useParams();
  const docId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] ?? "" : "";

  const [store, setStore] = useState(() => getHydrationSafeStore());

  useEffect(() => {
    queueMicrotask(() => setStore(getStore()));
    const onFocus = () => setStore(getStore());
    const onCustom = () => setStore(getStore());
    window.addEventListener("focus", onFocus);
    window.addEventListener("mv-store-update", onCustom as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mv-store-update", onCustom as EventListener);
    };
  }, []);

  const doc = useMemo(() => store.docs.find((d) => d.id === docId), [store.docs, docId]);

  if (!doc) {
    return (
      <div className="min-h-screen pb-24">
        <AppTopNav rightSlot={<Badge>Your files</Badge>} />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="py-6">
              <h1 className="text-lg font-semibold">File not found</h1>
              <p className="text-sm mv-muted mt-1">
                We could not find this file in your saved records.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--panel-2)]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to home
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const record = enrichDocFromMarkdown(doc, store.standardLexicon ?? []);

  const markdownDownloadName = `${(record.artifactSlug ?? record.id ?? "uma-record").replace(/[^\w.-]+/g, "_")}.md`;
  const pdfDownloadName = (() => {
    const fromDoc = record.originalFileName?.trim();
    if (fromDoc && /\.pdf$/i.test(fromDoc)) return fromDoc;
    const base = (record.artifactSlug ?? record.id).replace(/[^\w.-]+/g, "_");
    return `${base}.pdf`;
  })();

  // On the detail page show the full overview — no 280-char truncation.
  const summaryLine = (() => {
    if (record.markdownArtifact) {
      const fromMd = parseOverviewSection(record.markdownArtifact);
      if (fromMd) return fromMd.replace(/\s+/g, " ").trim();
    }
    return (record.summary ?? "").replace(/\s+/g, " ").trim();
  })();

  function downloadSyntheticMarkdown() {
    const md = buildSyntheticMarkdownArtifact(
      record,
      {
        originalFileName: record.originalFileName ?? "record.pdf",
        uploadedAtISO: record.uploadedAtISO ?? store.updatedAtISO,
      },
      store.standardLexicon
    );
    downloadMarkdownFile(md, markdownDownloadName);
  }

  return (
    <div className="min-h-screen pb-24">
      <AppTopNav rightSlot={<Badge>Your files</Badge>} />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--panel-2)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <h1 className="text-lg font-semibold">File details</h1>
            <p className="text-xs mv-muted">{record.title}</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge>{record.type}</Badge>
              {record.dateISO ? <Badge>Date: {record.dateISO}</Badge> : null}
              {record.provider ? <Badge>Provider: {record.provider}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="prose-uma text-sm text-[var(--fg)] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryLine}</ReactMarkdown>
            </div>
            <p className="text-sm font-medium text-[var(--muted)]">
              AI-generated summary. Not medical advice — verify it against the original file.
            </p>
          </CardContent>
        </Card>

        <HealthInsightsCard record={record} />

        {record.medications?.length ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Medicines</h2>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {record.medications.map((m, i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3 text-sm">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs mv-muted">
                    {m.dose ? `${m.dose} · ` : ""}{m.frequency ?? ""}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {record.labs?.length ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Test results</h2>
              <p className="text-xs mv-muted mt-1">
                Point at or tap a row for a simple explanation and usual ranges. Highlights show values outside the
                range UMA used—not a diagnosis.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {record.labs.map((l, i) => (
                <LabReadingTile
                  key={i}
                  lab={l}
                  extensions={store.standardLexicon}
                  showDate={false}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Downloads</h2>
            <p className="text-xs mv-muted mt-1">
              Files stay on this device inside UMA.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {record.markdownArtifact ? (
                <Button
                  variant="ghost"
                  className="gap-2 border border-[var(--border)]"
                  onClick={() => downloadMarkdownFile(record.markdownArtifact!, markdownDownloadName)}
                >
                  <Download className="h-4 w-4" />
                  Download summary text (.md)
                </Button>
              ) : (
                <Button variant="ghost" className="gap-2 border border-[var(--border)]" onClick={downloadSyntheticMarkdown}>
                  <Download className="h-4 w-4" />
                  Download text built from saved data
                </Button>
              )}
              {record.originalPdfBase64 ? (
                <Button
                  variant="ghost"
                  className="gap-2 border border-[var(--border)]"
                  onClick={() => downloadPdfFromBase64(record.originalPdfBase64!, pdfDownloadName)}
                >
                  <Download className="h-4 w-4" />
                  Download original PDF
                </Button>
              ) : null}
            </div>
            {!record.markdownArtifact ? (
              <p className="text-xs mv-muted">
                A full written summary is created when you upload a PDF. This button builds a simple text file from the
                data already saved here.
              </p>
            ) : null}
            {record.markdownArtifact && !record.originalPdfBase64 ? (
              <p className="text-xs mv-muted">
                The original PDF is only kept for files you saved from an upload on this device.
              </p>
            ) : null}
            {!record.markdownArtifact && !record.originalPdfBase64 ? (
              <p className="text-xs mv-muted">No original PDF is stored for this file.</p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
