"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { LabReadingTile } from "@/components/labs/LabReadingTile";
import { RecordNoticeToast } from "@/components/ui/RecordNoticeToast";
import { getHydrationSafeStore, getStore, saveStore, removeDoc, mergeExtractedDoc } from "@/lib/store";
import { DocType, ExtractedDoc, ExtractedLab, ExtractedMedication, StandardLexiconEntry } from "@/lib/types";
import { displaySummaryForDoc } from "@/lib/markdownDoc";
import { labMatchesTrendMetric } from "@/lib/standardized";
import { summarizeMenstrualCycle } from "@/lib/menstrualCycle";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  Info,
  FileText,
  FileUp,
  HeartPulse,
  Loader2,
  Pill,
  Plus,
  RotateCw,
  Trash2,
  User,
  X,
  Droplets,
} from "lucide-react";

function toChartPoints(labs: ExtractedLab[], metricName: string, extensions?: StandardLexiconEntry[]) {
  const filtered = labs
    .filter((l) => labMatchesTrendMetric(l.name, metricName, extensions))
    .map((l) => ({
      date: l.date ?? "",
      value: parseFloat(String(l.value).replace(/[^\d.]/g, "")) || null,
    }))
    .filter((p) => p.value !== null && p.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  return filtered;
}

function toSixMonthSeries(points: Array<{ date: string; value: number | null }>) {
  if (!points.length) return [];
  const withDate = points
    .map((p) => ({ ...p, d: new Date(p.date) }))
    .filter((p) => !Number.isNaN(p.d.getTime()) && typeof p.value === "number")
    .sort((a, b) => a.d.getTime() - b.d.getTime());
  if (!withDate.length) return points;

  const series: Array<{ date: string; value: number | null }> = [];
  const start = new Date(withDate[0].d);
  start.setDate(1);
  const end = new Date(withDate[withDate.length - 1].d);
  end.setDate(1);

  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 6)) {
    const nearest = withDate.reduce((best, curr) => {
      if (!best) return curr;
      const distBest = Math.abs(best.d.getTime() - cursor.getTime());
      const distCurr = Math.abs(curr.d.getTime() - cursor.getTime());
      return distCurr < distBest ? curr : best;
    }, withDate[0]);
    series.push({
      date: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      value: nearest.value,
    });
  }
  return series;
}

function parseDailyDose(frequency?: string) {
  if (!frequency) return 1;
  const f = frequency.toLowerCase();
  if (f.includes("tid") || f.includes("three")) return 3;
  if (f.includes("qid") || f.includes("four")) return 4;
  if (f.includes("bid") || f.includes("twice")) return 2;
  if (f.includes("weekly")) return 1 / 7;
  if (f.includes("monthly")) return 1 / 30;
  const qh = f.match(/q(\d+)h/);
  if (qh) {
    const hours = Number(qh[1]);
    if (hours > 0) return 24 / hours;
  }
  return 1;
}

function estimateRemainingStock(med: ExtractedMedication) {
  const start = med.startDate ? new Date(med.startDate) : new Date();
  const now = new Date();
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86400000));
  const dailyDose = parseDailyDose(med.frequency);
  const consumed = Math.floor(elapsedDays * dailyDose);
  const baseline = med.stockCount ?? 30;
  const missed = med.missedDoses ?? 0;
  return Math.max(0, baseline - consumed + missed);
}

function nextDoseWindow(frequency?: string) {
  if (!frequency) return "Once daily (suggested: 9:00 AM)";
  const f = frequency.toLowerCase();
  if (f.includes("bid") || f.includes("twice")) return "Morning and evening (e.g., 8 AM and 8 PM)";
  if (f.includes("tid") || f.includes("three")) return "Morning, afternoon, and evening";
  if (f.includes("night")) return "Night dose (around 9-10 PM)";
  if (f.includes("weekly")) return "Once weekly (same day each week)";
  return "Follow prescribed timing from your doctor";
}

function generateDemoCurve(points: Array<{ date: string; value: number | null }>) {
  if (points.length === 0) return [];
  if (points.length >= 3) return points;
  const base = points[points.length - 1]?.value ?? points[0]?.value ?? 0;
  if (typeof base !== "number") return points;
  const anchor = new Date();
  anchor.setDate(1);
  anchor.setMonth(anchor.getMonth() - 18);
  return Array.from({ length: 4 }).map((_, i) => {
    const d = new Date(anchor);
    d.setMonth(d.getMonth() + i * 6);
    return {
      date: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      value: Number((base + Math.sin(i * 1.4) * (base * 0.03 + 1) + (i % 2 === 0 ? 0.6 : -0.3)).toFixed(2)),
    };
  });
}

type OverlayKind = "reports" | "meds" | "labs" | "add-med" | "add-report" | "upload-report" | null;
const UPLOAD_TYPES: DocType[] = ["Lab report", "Prescription", "Bill", "Imaging", "Other"];

export default function DashboardPage() {
  const [store, setStore] = useState(() => getHydrationSafeStore());
  const [printing, setPrinting] = useState(false);
  const [overlay, setOverlay] = useState<OverlayKind>(null);
  const [activeMedInfo, setActiveMedInfo] = useState<string | null>(null);
  const [chartsReady, setChartsReady] = useState(false);
  const medNameInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<DocType>("Lab report");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<ExtractedDoc | null>(null);
  const [uploadLexiconPatches, setUploadLexiconPatches] = useState<StandardLexiconEntry[]>([]);
  const [uploadNameMismatch, setUploadNameMismatch] = useState<{
    namesOnDocument: string[];
    profileDisplayName: string;
  } | null>(null);
  const [recordNotice, setRecordNotice] = useState<string | null>(null);
  const dismissRecordNotice = useCallback(() => setRecordNotice(null), []);
  const [newMed, setNewMed] = useState<ExtractedMedication>({
    name: "",
    dose: "",
    frequency: "",
  });

  useEffect(() => {
    setStore(getStore());
    const onFocus = () => setStore(getStore());
    window.addEventListener("focus", onFocus);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "mv_patient_store_v1") setStore(getStore());
    };
    const onCustom = () => setStore(getStore());
    window.addEventListener("storage", onStorage);
    window.addEventListener("mv-store-update", onCustom as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mv-store-update", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  useEffect(() => {
    const onAfterPrint = () => setPrinting(false);
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function updateStore(next: typeof store) {
    setStore(next);
    saveStore(next);
  }

  function updateMed(index: number, patch: Partial<ExtractedMedication>) {
    const next = {
      ...store,
      meds: store.meds.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    };
    updateStore(next);
  }

  function removeMed(index: number) {
    const next = { ...store, meds: store.meds.filter((_, i) => i !== index) };
    updateStore(next);
  }

  function logMissedDose(index: number) {
    const target = store.meds[index];
    const missed = (target.missedDoses ?? 0) + 1;
    updateMed(index, { missedDoses: missed, lastMissedISO: new Date().toISOString().slice(0, 10) });
  }

  function refillMed(index: number) {
    updateMed(index, { stockCount: 30, missedDoses: 0 });
  }

  function addMed() {
    if (!newMed.name?.trim()) return;
    const trimmed = {
      ...newMed,
      name: newMed.name.trim(),
      dose: newMed.dose?.trim() || undefined,
      frequency: newMed.frequency?.trim() || undefined,
      stockCount: 30,
      missedDoses: 0,
      startDate: new Date().toISOString().slice(0, 10),
    };
    const next = { ...store, meds: [trimmed, ...store.meds] };
    updateStore(next);
    setNewMed({ name: "", dose: "", frequency: "" });
  }

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const r = reader.result as string;
        const comma = r.indexOf(",");
        resolve(comma >= 0 ? r.slice(comma + 1) : r);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function extractUploadDoc() {
    if (!uploadFile) return;
    setUploadError(null);
    setUploadLoading(true);
    setUploadPreview(null);
    setUploadLexiconPatches([]);
    setUploadNameMismatch(null);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("typeHint", uploadType);
      fd.append("patientName", store.profile.name?.trim() ?? "");
      fd.append(
        "existingContentHashes",
        JSON.stringify(store.docs.map((d) => d.contentHash).filter(Boolean))
      );
      fd.append("standardLexicon", JSON.stringify(store.standardLexicon ?? []));
      const r = await fetch("/api/extract", { method: "POST", body: fd });
      const j = await r.json();
      if (r.ok) {
        setUploadPreview(j.doc as ExtractedDoc);
        setUploadLexiconPatches((j.lexiconPatches as StandardLexiconEntry[]) ?? []);
        setRecordNotice("Extract ready — review the summary below, then confirm to add it to your records.");
        return;
      }
      if (j.code === "patient_name_mismatch" && j.doc) {
        setUploadPreview(j.doc as ExtractedDoc);
        setUploadLexiconPatches((j.lexiconPatches as StandardLexiconEntry[]) ?? []);
        setUploadNameMismatch({
          namesOnDocument: Array.isArray(j.namesOnDocument) ? j.namesOnDocument : [],
          profileDisplayName: String(j.profileDisplayName ?? ""),
        });
        setRecordNotice(
          "The name on this PDF does not match your profile — read the comparison below, then choose whether to add it."
        );
        return;
      }
      throw new Error(j?.error ?? "Extraction failed");
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setUploadLoading(false);
    }
  }

  async function commitUploadDoc() {
    if (!uploadPreview) return;
    let doc: ExtractedDoc = uploadPreview;
    if (uploadFile) {
      try {
        const originalPdfBase64 = await readFileAsBase64(uploadFile);
        doc = { ...uploadPreview, originalPdfBase64 };
      } catch {
        doc = uploadPreview;
      }
    }
    const next = mergeExtractedDoc(doc, {
      standardLexiconPatches: uploadLexiconPatches,
    });
    setStore(next);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadLexiconPatches([]);
    setUploadNameMismatch(null);
    setUploadError(null);
    setOverlay(null);
    setRecordNotice("New data added. Your dashboard, documents list, and charts now include this report.");
  }

  function exportPdf() {
    setPrinting(true);
    setTimeout(() => window.print(), 50);
  }

  function deleteDoc(docId: string) {
    if (!confirm("Delete this document? This action cannot be undone.")) return;
    const next = removeDoc(docId);
    setStore(next);
  }

  function focusAddMedication() {
    setOverlay("add-med");
    setTimeout(() => medNameInputRef.current?.focus(), 60);
  }

  const lex = store.standardLexicon;
  const hba1c = useMemo(() => toChartPoints(store.labs, "HbA1c", lex), [store.labs, lex]);
  const ldl = useMemo(() => toChartPoints(store.labs, "LDL", lex), [store.labs, lex]);
  const trendMap: Record<string, Array<{ date: string; value: number | null }>> = useMemo(
    () => ({
      HbA1c: hba1c,
      LDL: ldl,
      HDL: toChartPoints(store.labs, "HDL", lex),
      Triglycerides: toChartPoints(store.labs, "Triglycerides", lex),
      Glucose: toChartPoints(store.labs, "Glucose", lex),
      RBC: toChartPoints(store.labs, "RBC", lex),
      WBC: toChartPoints(store.labs, "WBC", lex),
      Hemoglobin: toChartPoints(store.labs, "Hemoglobin", lex),
      Platelets: toChartPoints(store.labs, "Platelets", lex),
      Creatinine: toChartPoints(store.labs, "Creatinine", lex),
    }),
    [hba1c, ldl, store.labs, lex]
  );
  const selectedTrends = (store.profile.trends ?? ["HbA1c", "LDL"]).slice(0, 6);
  const trendCards = selectedTrends
    .map((name) => ({
      name,
      raw: trendMap[name] ?? [],
    }))
    .filter((x) => x.raw.length > 0)
    .map((x) => ({ ...x, data: generateDemoCurve(toSixMonthSeries(x.raw)) }));

  const recentLabs = useMemo(() => {
    return store.labs
      .slice()
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 30);
  }, [store.labs]);
  const recentDocs = useMemo(() => {
    return store.docs
      .slice()
      .sort((a, b) => (b.dateISO ?? "").localeCompare(a.dateISO ?? ""))
      .slice(0, 20);
  }, [store.docs]);
  const recentMeds = useMemo(() => store.meds.slice(0, 20), [store.meds]);

  const cycleSummary = useMemo(
    () => summarizeMenstrualCycle(store.profile.menstrualCycle),
    [store.profile.menstrualCycle]
  );

  const cycleBadgeTitle = useMemo(() => {
    const mc = store.profile.menstrualCycle;
    const s = cycleSummary;
    const flowDates = mc?.flowLogDates ?? [];
    const recentFlow =
      flowDates.length > 0
        ? ` Flow days logged (recent): ${flowDates
            .slice()
            .sort()
            .reverse()
            .slice(0, 6)
            .join(", ")}${flowDates.length > 6 ? "…" : ""}.`
        : "";
    const phase = s.phaseLabel ? ` Approximate phase (not clinical): ${s.phaseLabel}.` : "";
    const len = mc?.typicalCycleLengthDays
      ? ` Typical cycle length you entered: ${mc.typicalCycleLengthDays} days.`
      : "";
    const last = mc?.lastPeriodStartISO?.trim()
      ? ` Last period start you entered: ${mc.lastPeriodStartISO}.`
      : "";
    return `${s.headline}. ${s.detail}.${phase}${len}${last}${recentFlow} Estimates are approximate and not medical advice. Click to edit on Profile.`;
  }, [store.profile.menstrualCycle, cycleSummary]);

  const conditionBadgeTitle = useMemo(() => {
    const c = store.profile.conditions;
    if (!c.length) return "No conditions saved yet. Click to add or edit on Profile.";
    const shown = c.slice(0, 10).join(", ");
    return `${c.length} condition(s): ${shown}${c.length > 10 ? "…" : ""}. Click to edit on Profile.`;
  }, [store.profile.conditions]);

  const allergyBadgeTitle = useMemo(() => {
    const a = store.profile.allergies;
    if (!a.length) return "No allergies saved yet. Click to add or edit on Profile.";
    const shown = a.slice(0, 10).join(", ");
    return `${a.length} saved allerg${a.length === 1 ? "y" : "ies"}: ${shown}${a.length > 10 ? "…" : ""}. Click to edit on Profile.`;
  }, [store.profile.allergies]);

  const docBadgeTitle = useMemo(() => {
    const n = store.docs.length;
    return `${n} saved document${n === 1 ? "" : "s"}. Click to open Latest reports on the dashboard.`;
  }, [store.docs.length]);

  const dobBadgeTitle = useMemo(() => {
    const d = store.profile.dob?.trim();
    return d
      ? `Date of birth on file: ${d}. Click to edit on Profile.`
      : "Date of birth not set. Click to add on Profile.";
  }, [store.profile.dob]);

  const inlineDocs = recentDocs.slice(0, 4);
  const inlineMeds = recentMeds.slice(0, 4);
  const inlineLabs = recentLabs.slice(0, 9);
  const chartGridClass =
    trendCards.length <= 1
      ? "grid gap-4 grid-cols-1"
      : trendCards.length === 2
      ? "grid gap-4 grid-cols-1 lg:grid-cols-2"
      : "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className="min-h-screen pb-24">
      <style>{`
        @keyframes umaExtractBar {
          0% { transform: translateX(-100%); opacity: 0.85; }
          50% { transform: translateX(80%); opacity: 1; }
          100% { transform: translateX(280%); opacity: 0.85; }
        }
        .snapshot-badge {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .snapshot-badge:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
          border-color: color-mix(in srgb, var(--accent) 32%, var(--border));
        }
      `}</style>
      <AppTopNav
        rightSlot={
          <Button className="h-9 gap-2" onClick={() => setOverlay("upload-report")}>
            <FileUp className="h-4 w-4" /> Upload report
          </Button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6 no-print">
        <section className="mv-card rounded-3xl p-6 mv-surface">
          <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] mv-muted">Patient Snapshot</p>
              <h2 className="mt-2 text-3xl font-semibold mv-title">{store.profile.name || "Patient"}</h2>
              <p className="mt-2 text-sm mv-muted max-w-xl">
                See your latest reports, medications, and important lab trends in one easy view before your next doctor
                visit.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge
                  as="button"
                  type="button"
                  className="snapshot-badge"
                  title={dobBadgeTitle}
                  aria-label={dobBadgeTitle}
                  onClick={() => {
                    window.location.href = "/profile#profile-patient-details";
                  }}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  DOB: {store.profile.dob || "Not set"}
                </Badge>
                <Badge
                  as="button"
                  type="button"
                  className="snapshot-badge"
                  title={conditionBadgeTitle}
                  aria-label={conditionBadgeTitle}
                  onClick={() => {
                    window.location.href = "/profile#profile-conditions";
                  }}
                >
                  {store.profile.conditions.length} conditions
                </Badge>
                <Badge
                  as="button"
                  type="button"
                  className="snapshot-badge"
                  title={allergyBadgeTitle}
                  aria-label={allergyBadgeTitle}
                  onClick={() => {
                    window.location.href = "/profile#profile-allergies";
                  }}
                >
                  {store.profile.allergies.length} allergies
                </Badge>
                <Badge
                  as="button"
                  type="button"
                  className="snapshot-badge"
                  title={docBadgeTitle}
                  aria-label={docBadgeTitle}
                  onClick={() => {
                    window.location.href = "/dashboard#dashboard-latest-reports";
                  }}
                >
                  {store.docs.length} documents
                </Badge>
                {store.profile.menstrualCycle?.lastPeriodStartISO ||
                (store.profile.menstrualCycle?.flowLogDates?.length ?? 0) > 0 ? (
                  <span className="inline-block max-w-[min(100%,20rem)]">
                    <Badge
                      as="button"
                      type="button"
                      className="snapshot-badge max-w-full min-w-0 truncate"
                      title={cycleBadgeTitle}
                      aria-label={cycleBadgeTitle}
                      onClick={() => {
                        window.location.href = "/profile#profile-cycle-tracking";
                      }}
                    >
                      <Droplets className="mr-1 h-3 w-3 shrink-0" />
                      <span className="min-w-0 truncate">
                        {cycleSummary.headline} · {cycleSummary.detail}
                      </span>
                    </Badge>
                  </span>
                ) : null}
              </div>
            </div>
            <Card className="rounded-2xl">
              <CardContent className="space-y-3">
                <p className="text-xs uppercase tracking-[0.14em] mv-muted">Upcoming Care</p>
                <div className="flex items-start gap-2">
                  <HeartPulse className="h-4 w-4 mt-1 text-[var(--accent)]" />
                  <div>
                    <p className="text-sm font-medium">Primary care provider</p>
                    <p className="text-sm mv-muted">{store.profile.primaryCareProvider || "Not added yet"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-1 text-[var(--accent-2)]" />
                  <div>
                    <p className="text-sm font-medium">Next visit</p>
                    <p className="text-sm mv-muted">{store.profile.nextVisitDate || "No visit date set"}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full gap-2" onClick={() => (window.location.href = "/profile")}>
                  <User className="h-4 w-4" /> Update profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-[0.1em] mv-muted">Active meds</p>
              <p className="mt-2 text-2xl font-semibold">{store.meds.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-[0.1em] mv-muted">Lab records</p>
              <p className="mt-2 text-2xl font-semibold">{store.labs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-[0.1em] mv-muted">Latest update</p>
              <p className="mt-2 text-sm font-medium">{new Date(store.updatedAtISO).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <Button onClick={exportPdf} className="w-full gap-2" disabled={printing}>
                <ClipboardList className="h-4 w-4" />
                {printing ? "Preparing..." : "Visit summary PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card id="dashboard-latest-reports" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--accent-2)]" />
                  <h3 className="text-sm font-semibold">Latest reports</h3>
                </div>
                <Button variant="ghost" className="h-8 px-3" onClick={() => setOverlay("add-report")}>
                  Add new
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inlineDocs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm mv-muted">
                  No reports yet. Upload your first document to start building your timeline.
                </div>
              ) : (
                <div className="max-h-[340px] overflow-y-auto pr-1 space-y-3">
                  {inlineDocs.map((d) => (
                    <div key={d.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge>{d.type}</Badge>
                            <span className="text-xs mv-muted">{d.dateISO || "Date not available"}</span>
                          </div>
                          <a href={`/docs/${d.id}`} className="mt-2 block text-sm font-semibold hover:underline">
                            {d.title}
                          </a>
                          <p className="mt-1 text-xs mv-muted line-clamp-3">{displaySummaryForDoc(d)}</p>
                        </div>
                        <button
                          type="button"
                          className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--fg)] grid place-items-center"
                          onClick={() => deleteDoc(d.id)}
                          aria-label="Delete document"
                        >
                          <Trash2 className="h-4 w-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {recentDocs.length > inlineDocs.length && (
                <div className="mt-3">
                  <Button variant="ghost" className="w-full" onClick={() => setOverlay("reports")}>
                    Show more reports
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold">Medication tracker</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{store.meds.length}</Badge>
                  <Button variant="ghost" className="h-8 px-3" onClick={focusAddMedication}>
                    Add new
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inlineMeds.length === 0 ? (
                  <p className="text-sm mv-muted">No active medications added yet.</p>
                ) : (
                  inlineMeds.map((m, i) => {
                    const key = `${m.name}-${i}`;
                    const remaining = estimateRemainingStock(m);
                    const isOpen = activeMedInfo === key;
                    return (
                    <div key={key} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{m.name}</p>
                          <p className="text-xs mv-muted">
                            {[m.dose, m.frequency].filter(Boolean).join(" · ") || "Details not added"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--fg)] grid place-items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                            onClick={() => setActiveMedInfo(isOpen ? null : key)}
                            aria-label="Medication information"
                          >
                            <Info className="h-4 w-4 shrink-0" />
                          </button>
                          <button
                            type="button"
                            className="h-8 w-8 shrink-0 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--fg)] grid place-items-center"
                            onClick={() => removeMed(i)}
                            aria-label="Remove medication"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" />
                          </button>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs space-y-2">
                          <p><span className="font-semibold">Timing:</span> {nextDoseWindow(m.frequency)}</p>
                          <p>
                            <span className="font-semibold">Estimated remaining stock:</span> {remaining} doses
                          </p>
                          <p className="mv-muted">
                            Stock auto-estimate assumes regular use based on prescribed frequency.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="ghost" className="h-8 px-3" onClick={() => logMissedDose(i)}>
                              Log missed dose
                            </Button>
                            <Button variant="ghost" className="h-8 px-3 gap-1" onClick={() => refillMed(i)}>
                              <RotateCw className="h-3.5 w-3.5" /> Refill to 30
                            </Button>
                          </div>
                          {(m.missedDoses ?? 0) > 0 && (
                            <p className="mv-muted">
                              Missed doses logged: {m.missedDoses} {m.lastMissedISO ? `(last: ${m.lastMissedISO})` : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )})
                )}
                {recentMeds.length > inlineMeds.length && (
                  <Button variant="ghost" className="w-full" onClick={() => setOverlay("meds")}>
                    Show more medications
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={chartGridClass}>
          {trendCards.map(({ name, data }, idx) => {
            const accent = idx % 2 === 0 ? "var(--accent)" : "var(--accent-2)";
            const gradientId = `fill-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
            const chartConfig: ChartConfig = {
              value: {
                label: `${name} value`,
                color: accent,
              },
            };
            return (
              <Card key={name} className="min-w-0">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <h2 className="text-sm font-medium truncate">{name} trend</h2>
                    <Badge className="shrink-0">Lifetime</Badge>
                  </div>
                </CardHeader>
                <CardContent className="h-72 min-w-0 pl-2 pr-3 sm:pl-3 sm:pr-4">
                  {!chartsReady ? (
                    <div className="h-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel-2)] animate-pulse" />
                  ) : (
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                        <AreaChart data={data} margin={{ left: 4, right: 10, top: 10, bottom: 8 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                              <stop offset="85%" stopColor={accent} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--muted)" tickLine={false} axisLine={false} />
                          <YAxis
                            stroke="var(--muted)"
                            tickLine={false}
                            axisLine={false}
                            width={52}
                            tickMargin={6}
                            tick={{ fill: "var(--muted)", fontSize: 11 }}
                            tickFormatter={(v) => {
                              const n = Number(v);
                              if (!Number.isFinite(n)) return String(v);
                              return Math.abs(n) >= 100 ? String(Math.round(n)) : n.toFixed(1).replace(/\.0$/, "");
                            }}
                            domain={[(min: number) => min * 0.96, (max: number) => max * 1.04]}
                          />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Area
                            dataKey="value"
                            name={chartConfig.value.label}
                            type="natural"
                            stroke={accent}
                            strokeWidth={2.2}
                            fill={`url(#${gradientId})`}
                            dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
                            activeDot={{ r: 4 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {trendCards.length === 0 && (
          <Card>
            <CardContent className="text-sm mv-muted">
              Trend charts will appear after at least one lab value is uploaded.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold">Recent lab readings</h2>
              </div>
              <Badge>{recentLabs.length} shown</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {inlineLabs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm mv-muted">
                No lab entries yet. Upload a report to see your readings here.
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {inlineLabs.map((lab, idx) => (
                  <LabReadingTile key={`${lab.name}-${lab.date}-${idx}`} lab={lab} extensions={lex} />
                ))}
              </div>
            )}
            {recentLabs.length > inlineLabs.length && (
              <div className="mt-3">
                <Button variant="ghost" className="w-full" onClick={() => setOverlay("labs")}>
                  Show more lab readings
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs mv-muted">
          This dashboard helps you organize your records. It is not medical advice. Please discuss decisions with your
          doctor.
        </p>
      </main>

      <section className="print-only px-8 py-10">
        <h1 className="text-2xl font-semibold">Doctor Visit Summary</h1>
        <p className="mt-1">Prepared for: {store.profile.name}</p>
        <p className="text-sm mv-muted">Generated on {new Date().toLocaleDateString()}</p>

        <div className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Key details</h2>
            <p className="text-sm">
              DOB: {store.profile.dob ?? "—"} · Sex: {store.profile.sex ?? "—"} · Email: {store.profile.email ?? "—"}
            </p>
            {(store.profile.menstrualCycle?.lastPeriodStartISO ||
              (store.profile.menstrualCycle?.flowLogDates?.length ?? 0) > 0) && (
              <p className="text-sm mt-2">
                Cycle (beta): {cycleSummary.headline} · {cycleSummary.detail}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Allergies</h2>
            <p className="text-sm">{store.profile.allergies.join(", ") || "None reported"}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Conditions</h2>
            <p className="text-sm">{store.profile.conditions.join(", ") || "None reported"}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Current medications</h2>
            <ul className="text-sm list-disc pl-5">
              {store.meds.map((m, i) => (
                <li key={`${m.name}-${i}`}>
                  {m.name}
                  {m.dose ? `, ${m.dose}` : ""}
                  {m.frequency ? `, ${m.frequency}` : ""}
                  {m.startDate ? ` (Start: ${m.startDate})` : ""}
                  {m.endDate ? ` (Stop: ${m.endDate})` : ""}
                  {m.notes ? ` — Notes: ${m.notes}` : ""}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Recent lab values</h2>
            <ul className="text-sm list-disc pl-5">
              {recentLabs.map((l, i) => (
                <li key={`${l.name}-${i}`}>
                  {l.name}: {l.value}
                  {l.unit ? ` ${l.unit}` : ""} {l.date ? `(${l.date})` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {overlay && (
        <div className="fixed inset-0 z-50 no-print flex items-end justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-5">
          <div
            className={`absolute inset-0 bg-black/45 ${uploadLoading ? "cursor-wait" : ""}`}
            onClick={() => {
              if (!uploadLoading) setOverlay(null);
            }}
            aria-hidden={uploadLoading}
          />
          <div className="relative z-10 flex w-full max-w-4xl max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl sm:max-h-[min(90dvh,52rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-semibold">
                {overlay === "reports"
                  ? "All reports"
                  : overlay === "meds"
                  ? "All medications"
                  : overlay === "labs"
                  ? "All lab readings"
                  : overlay === "add-med"
                  ? "Add medication"
                  : overlay === "add-report"
                  ? "Add new report"
                  : "Upload report"}
              </h3>
              <button
                type="button"
                disabled={uploadLoading}
                onClick={() => {
                  if (!uploadLoading) setOverlay(null);
                }}
                className="h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--panel-2)] text-[var(--fg)] grid place-items-center disabled:opacity-40 disabled:pointer-events-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
              {overlay === "add-med" && (
                <div className="mx-auto max-w-md space-y-3">
                  <p className="text-sm mv-muted">
                    Add a medication manually. You can update adherence details later from the tracker.
                  </p>
                  <Input
                    ref={medNameInputRef}
                    placeholder="Medication name (required)"
                    value={newMed.name ?? ""}
                    onChange={(e) => setNewMed((m) => ({ ...m, name: e.target.value }))}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      placeholder="Dose"
                      value={newMed.dose ?? ""}
                      onChange={(e) => setNewMed((m) => ({ ...m, dose: e.target.value }))}
                    />
                    <Input
                      placeholder="Frequency"
                      value={newMed.frequency ?? ""}
                      onChange={(e) => setNewMed((m) => ({ ...m, frequency: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!newMed.name?.trim()) return;
                      addMed();
                      setOverlay(null);
                    }}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Save medication
                  </Button>
                </div>
              )}

              {(overlay === "add-report" || overlay === "upload-report") && (
                <div className="mx-auto max-w-2xl space-y-4">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 space-y-3">
                    <p className="text-sm font-medium">
                      {overlay === "add-report" ? "Add a new report" : "Upload and extract report"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {UPLOAD_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setUploadType(t)}
                          className={[
                            "rounded-full border px-3 py-1 text-xs transition",
                            t === uploadType
                              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                              : "border-[var(--border)] bg-[var(--panel)] text-[var(--fg)]",
                          ].join(" ")}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-[var(--fg)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--accent-contrast)] hover:file:brightness-110"
                    />
                    {overlay === "upload-report" && !store.profile.name?.trim() ? (
                      <div className="flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--muted)]">
                        <Info className="h-4 w-4 shrink-0 text-[var(--accent)] mt-0.5" aria-hidden />
                        <p>
                          Add your full name on the{" "}
                          <Link href="/profile" className="text-[var(--accent)] underline underline-offset-2 font-medium">
                            Profile
                          </Link>{" "}
                          page so UMA can check that uploaded reports match you. Without a name, that step is skipped.
                        </p>
                      </div>
                    ) : null}
                    {uploadError && (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700">
                        {uploadError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={extractUploadDoc} disabled={!uploadFile || uploadLoading} className="gap-2">
                        {uploadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                        {uploadLoading ? "Extracting..." : "Extract details"}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={uploadLoading}
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview(null);
                          setUploadLexiconPatches([]);
                          setUploadNameMismatch(null);
                          setUploadError(null);
                          setOverlay(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {uploadPreview && (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-4 space-y-3">
                      {uploadNameMismatch ? (
                        <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 p-3 text-sm text-[var(--fg)] space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                            <div className="space-y-1 min-w-0">
                              <p className="font-medium">Patient name does not match your profile</p>
                              <p className="text-xs mv-muted leading-relaxed">
                                UMA compares the name on your{" "}
                                <Link href="/profile" className="text-[var(--accent)] underline underline-offset-2">
                                  Profile
                                </Link>{" "}
                                to names the document shows. Here is what we read:
                              </p>
                              <ul className="text-xs list-disc pl-4 space-y-0.5">
                                <li>
                                  <span className="mv-muted">Your profile name:</span>{" "}
                                  <span className="font-medium text-[var(--fg)]">
                                    {uploadNameMismatch.profileDisplayName.trim()
                                      ? `"${uploadNameMismatch.profileDisplayName.trim()}"`
                                      : "(not set)"}
                                  </span>
                                </li>
                                <li>
                                  <span className="mv-muted">Name(s) read from this PDF:</span>{" "}
                                  <span className="font-medium text-[var(--fg)]">
                                    {uploadNameMismatch.namesOnDocument.length > 0
                                      ? uploadNameMismatch.namesOnDocument.map((n) => `"${n.trim()}"`).join(", ")
                                      : "(none detected — the scan may be unclear)"}
                                  </span>
                                </li>
                              </ul>
                              <p className="text-xs mv-muted leading-relaxed pt-1">
                                If this is still your report (nickname, maiden name, typo, or you are helping a family
                                member), you can add it anyway. If it is someone else&apos;s file by mistake, use{" "}
                                <span className="font-medium text-[var(--fg)]">Choose a different PDF</span> below.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold">{uploadPreview.title}</p>
                        <p className="text-xs mv-muted mt-1 line-clamp-3">{displaySummaryForDoc(uploadPreview)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{uploadPreview.type}</Badge>
                        {uploadPreview.dateISO ? <Badge>Date: {uploadPreview.dateISO}</Badge> : null}
                        {uploadPreview.provider ? <Badge>Provider: {uploadPreview.provider}</Badge> : null}
                        {uploadPreview.artifactSlug ? (
                          <Badge className="font-mono text-[10px]">{uploadPreview.artifactSlug}.md</Badge>
                        ) : null}
                      </div>
                      {uploadPreview.markdownArtifact ? (
                        <p className="text-xs mv-muted">
                          A structured markdown summary was generated for this upload. You can read it on the record
                          detail page after you confirm.
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void commitUploadDoc()}>
                          {uploadNameMismatch ? "Add to dashboard anyway" : "Confirm & add to dashboard"}
                        </Button>
                        {uploadNameMismatch ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setUploadFile(null);
                              setUploadPreview(null);
                              setUploadLexiconPatches([]);
                              setUploadNameMismatch(null);
                            }}
                          >
                            Choose a different PDF
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setUploadPreview(null);
                            setUploadLexiconPatches([]);
                            setUploadNameMismatch(null);
                          }}
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {overlay === "reports" &&
                recentDocs.map((d) => (
                  <div key={d.id} className="mb-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/docs/${d.id}`} className="font-semibold hover:underline">
                        {d.title}
                      </Link>
                      <span className="text-xs mv-muted">{d.dateISO || "-"}</span>
                    </div>
                    <p className="text-xs mv-muted mt-1 line-clamp-3">{displaySummaryForDoc(d)}</p>
                  </div>
                ))}
              {overlay === "meds" &&
                recentMeds.map((m, i) => (
                  <div key={`${m.name}-overlay-${i}`} className="mb-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs mv-muted mt-1">{[m.dose, m.frequency].filter(Boolean).join(" · ") || "Details not added"}</p>
                  </div>
                ))}
              {overlay === "labs" && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {recentLabs.map((l, i) => (
                    <LabReadingTile key={`${l.name}-overlay-${i}`} lab={l} extensions={lex} />
                  ))}
                </div>
              )}
            </div>

            {uploadLoading && (overlay === "upload-report" || overlay === "add-report") ? (
              <div
                className="absolute inset-0 z-[60] overflow-y-auto overscroll-contain rounded-3xl bg-[var(--bg)]/88 backdrop-blur-[3px]"
                role="progressbar"
                aria-valuetext="Extracting report"
                aria-busy="true"
              >
                <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-8 sm:gap-5 sm:px-6">
                  <Loader2 className="h-10 w-10 shrink-0 animate-spin text-[var(--accent)] sm:h-12 sm:w-12" aria-hidden />
                  <div className="max-w-sm text-center space-y-2">
                    <p className="text-sm font-semibold text-[var(--fg)]">Reading your PDF…</p>
                    <p className="text-xs mv-muted leading-relaxed">
                      UMA is sending your file to the AI to pull out labs, medications, and a summary. Scanned or long
                      reports can take up to a minute — please keep this tab open.
                    </p>
                  </div>
                  <div className="h-1.5 w-full max-w-xs shrink-0 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className="h-full w-2/5 rounded-full bg-[var(--accent)]"
                      style={{ animation: "umaExtractBar 1.8s ease-in-out infinite" }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <RecordNoticeToast message={recordNotice} onDismiss={dismissRecordNotice} />
    </div>
  );
}
