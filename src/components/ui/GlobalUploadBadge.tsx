"use client";

import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { useGlobalUpload } from "@/lib/uploadContext";

/**
 * Floating badge pinned to the bottom-right corner.
 *
 * During extraction the X button hides the badge but does NOT cancel the fetch —
 * the badge reappears automatically when the phase changes to "ready" or "error".
 * Only when extraction is done does the X fully clear the state.
 */
export function GlobalUploadBadge() {
  const { phase, fileName, error, badgeVisible, clear, dismissBadge, openUploadSheet } = useGlobalUpload();
  const router = useRouter();

  // Don't render when idle or when the user has dismissed the in-progress badge.
  if (phase === "idle" || !badgeVisible) return null;

  const short = fileName.length > 26 ? `${fileName.slice(0, 23)}…` : fileName;

  // During extraction: X hides badge but fetch keeps running.
  // After extraction: X fully clears state.
  const handleDismiss = phase === "extracting" ? dismissBadge : clear;
  const dismissLabel =
    phase === "extracting"
      ? "Hide — extraction continues in background"
      : "Dismiss";

  // A duplicate-file error should show "Review" (not "Retry") since the file
  // is already in the records — the user should review it on the dashboard.
  const isDuplicateError =
    phase === "error" &&
    typeof error === "string" &&
    error.includes("matches one already in your records");

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1.25rem",
        right: "1rem",
        zIndex: 9999,
        maxWidth: "calc(100vw - 2rem)",
        animation: "umaBubbleFade 0.25s ease-out",
      }}
    >
      {/* Single wrapper — always a div to avoid nested-button HTML violation.
          During extraction it acts as a click target for the progress sheet. */}
      <div
        role={phase === "extracting" ? "button" : undefined}
        tabIndex={phase === "extracting" ? 0 : undefined}
        onClick={phase === "extracting" ? () => openUploadSheet() : undefined}
        onKeyDown={
          phase === "extracting"
            ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openUploadSheet(); } }
            : undefined
        }
        className={[
          "flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow)]",
          phase === "extracting" ? "cursor-pointer hover:bg-[var(--panel-2)] transition-colors" : "",
        ].join(" ")}
        style={{ minWidth: 240, maxWidth: 360 }}
      >
        {/* Icon */}
        {phase === "extracting" && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent)]" />
        )}
        {phase === "ready" && (
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
        )}
        {phase === "error" && (
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          {phase === "extracting" && (
            <>
              <p className="text-xs font-medium text-[var(--fg)]">Reading PDF…</p>
              <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                {short} · you can browse around
              </p>
            </>
          )}
          {phase === "ready" && (
            <>
              <p className="text-xs font-medium text-[var(--fg)]">PDF ready to add</p>
              <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">{short}</p>
            </>
          )}
          {phase === "error" && (
            <>
              <p className="text-xs font-medium text-rose-500">
                {isDuplicateError ? "Already in records" : "Upload failed"}
              </p>
              <p className="text-[10px] text-[var(--muted)] truncate mt-0.5" title={error ?? undefined}>
                {error ? (error.length > 48 ? `${error.slice(0, 45)}…` : error) : short}
              </p>
            </>
          )}
        </div>

        {/* Action button */}
        {phase === "ready" && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="shrink-0 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-contrast)] hover:opacity-90 transition-opacity"
          >
            Review
          </button>
        )}
        {phase === "error" && (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="shrink-0 rounded-lg border border-rose-500/40 px-2.5 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            {isDuplicateError ? "Review" : "Retry"}
          </button>
        )}

        {/* Dismiss / hide */}
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="shrink-0 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
