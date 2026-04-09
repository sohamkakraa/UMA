"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getHydrationSafeStore, getStore } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { LabReadingTile } from "@/components/labs/LabReadingTile";
import { downloadMarkdownFile, downloadPdfFromBase64 } from "@/lib/downloads";
import { buildSyntheticMarkdownArtifact, displaySummaryForDoc } from "@/lib/markdownDoc";
import { ArrowLeft, Download } from "lucide-react";

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
        <AppTopNav rightSlot={<Badge>UMA Records</Badge>} />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Card>
            <CardContent className="py-6">
              <h1 className="text-lg font-semibold">Record not found</h1>
              <p className="text-sm mv-muted mt-1">
                UMA could not locate this document in your saved records.
              </p>
              <Link href="/dashboard" className="inline-block mt-3">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back to dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const record = doc;

  const markdownDownloadName = `${(record.artifactSlug ?? record.id ?? "uma-record").replace(/[^\w.-]+/g, "_")}.md`;
  const pdfDownloadName = (() => {
    const fromDoc = record.originalFileName?.trim();
    if (fromDoc && /\.pdf$/i.test(fromDoc)) return fromDoc;
    const base = (record.artifactSlug ?? record.id).replace(/[^\w.-]+/g, "_");
    return `${base}.pdf`;
  })();

  const summaryLine = displaySummaryForDoc(record);

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
      <AppTopNav rightSlot={<Badge>UMA Records</Badge>} />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Record details</h1>
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
            <p className="text-sm text-[var(--fg)] leading-relaxed">{summaryLine}</p>
            <p className="text-xs mv-muted">Not medical advice. Talk to a clinician about your results.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Downloads</h2>
            <p className="text-xs mv-muted mt-1">
              Files stay on this device in UMA. Not medical advice.
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
                  Download agent markdown (.md)
                </Button>
              ) : (
                <Button variant="ghost" className="gap-2 border border-[var(--border)]" onClick={downloadSyntheticMarkdown}>
                  <Download className="h-4 w-4" />
                  Download markdown from stored data
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
                Agent-generated markdown is created when you upload a PDF with OpenAI enabled. This button builds a file
                from the structured data already saved for this record.
              </p>
            ) : null}
            {record.markdownArtifact && !record.originalPdfBase64 ? (
              <p className="text-xs mv-muted">
                Original PDF is available only for records you confirmed from an upload on this device.
              </p>
            ) : null}
            {!record.markdownArtifact && !record.originalPdfBase64 ? (
              <p className="text-xs mv-muted">No original PDF is stored for this record.</p>
            ) : null}
          </CardContent>
        </Card>

        {record.sections?.length ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Highlights</h2>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {record.sections.map((s, i) => (
                <div key={`${s.title}-${i}`} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
                  <p className="text-xs font-semibold">{s.title}</p>
                  <ul className="mt-2 text-xs mv-muted list-disc pl-4">
                    {(s.items ?? []).map((item, idx) => (
                      <li key={`${s.title}-${idx}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {record.medications?.length ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Medications</h2>
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
              <h2 className="text-sm font-medium">Lab values</h2>
              <p className="text-xs mv-muted mt-1">
                Hover or focus a row for plain-language meaning and typical ranges. Flags highlight values outside the
                range UMA used — not a diagnosis. Not medical advice.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {record.labs.map((l, i) => (
                <LabReadingTile
                  key={i}
                  lab={l}
                  extensions={store.standardLexicon}
                  showDate={false}
                  showInteractionHint={false}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
