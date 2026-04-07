"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  /** Auto-hide delay in ms; set 0 to disable */
  autoHideMs?: number;
};

export function RecordNoticeToast({ message, onDismiss, autoHideMs = 7000 }: Props) {
  useEffect(() => {
    if (!message || autoHideMs <= 0) return;
    const t = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(t);
  }, [message, autoHideMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[80] w-[min(92vw,440px)] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-xl flex items-start gap-3 no-print"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" aria-hidden />
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
