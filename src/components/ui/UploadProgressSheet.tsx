"use client";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useGlobalUpload } from "@/lib/uploadContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./Sheet";

export function UploadProgressSheet() {
  const { uploadSheetOpen, closeUploadSheet, fileName, stages, phase, error } = useGlobalUpload();

  return (
    <Sheet open={uploadSheetOpen} onOpenChange={(open) => { if (!open) closeUploadSheet(); }}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {phase === "extracting" && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" aria-hidden />
                <SheetTitle>Reading your PDF</SheetTitle>
              </>
            )}
            {phase === "ready" && (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden />
                <SheetTitle>PDF processed</SheetTitle>
              </>
            )}
            {phase === "error" && (
              <>
                <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden />
                <SheetTitle className="text-rose-500">Upload failed</SheetTitle>
              </>
            )}
            {phase === "idle" && <SheetTitle>Upload</SheetTitle>}
          </div>
          <SheetDescription>{fileName}</SheetDescription>
        </SheetHeader>

        <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-6">
          {/* Stages */}
          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="shrink-0">
                  {stage.status === "done" && (
                    <CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden />
                  )}
                  {stage.status === "running" && (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" aria-hidden />
                  )}
                  {stage.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-[var(--border)] opacity-40" aria-hidden />
                  )}
                  {stage.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden />
                  )}
                </div>
                <span
                  className={[
                    "text-sm font-medium",
                    stage.status === "done"
                      ? "text-[var(--muted)]"
                      : stage.status === "running"
                        ? "text-[var(--fg)]"
                        : stage.status === "error"
                          ? "text-rose-500"
                          : "text-[var(--muted)]",
                  ].join(" ")}
                >
                  {stage.label}
                </span>
              </div>
            ))}
          </div>

          {/* Error message */}
          {phase === "error" && error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
              <p className="text-xs text-rose-600 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Info note */}
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            You can navigate away and continue browsing. The upload will continue in the background, and you&apos;ll get a
            notification when it&apos;s ready.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
