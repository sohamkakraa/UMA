"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  /** Visual style — "success" (default) or "error". */
  kind?: "success" | "error";
  /** Auto-hide delay in ms; set 0 to disable. Errors default to 0 (no auto-hide). */
  autoHideMs?: number;
};

export function RecordNoticeToast({ message, onDismiss, kind = "success", autoHideMs }: Props) {
  // Default auto-hide: 7 s for success, no auto-hide for errors
  const delay = autoHideMs !== undefined ? autoHideMs : kind === "error" ? 0 : 7000;

  useEffect(() => {
    if (!message || delay <= 0) return;
    const t = window.setTimeout(onDismiss, delay);
    return () => window.clearTimeout(t);
  }, [message, delay, onDismiss]);

  if (!message) return null;

  const isError = kind === "error";

  return (
    <div
      className={[
        "fixed bottom-6 left-1/2 z-[80] w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-xl flex items-start gap-3 no-print",
        isError
          ? "border-rose-500/40 bg-[var(--panel)]"
          : "border-[var(--border)] bg-[var(--panel)]",
      ].join(" ")}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      {isError ? (
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" aria-hidden />
      ) : (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" aria-hidden />
      )}
      <p className="text-sm text-[var(--fg)] flex-1 leading-snug">{message}</p>
      <button
        type="button"
        className="rounded-lg p-1 text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)]"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
