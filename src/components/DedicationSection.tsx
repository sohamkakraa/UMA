"use client";

import { UmaCharacter } from "@/components/chat/UmaCharacter";

/**
 * Compact dedication section — Uma Kakra (1976–2026).
 * Character on the left, short tribute on the right.
 */
export function DedicationSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--panel)]/55 py-10 md:py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-6 md:gap-10 max-w-2xl mx-auto">
          {/* ─── Character ──────────────────────────── */}
          <div className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-5 py-4 md:px-6 md:py-5">
            <UmaCharacter mood="idle" compact fontPx={12} />
          </div>

          {/* ─── Tribute ────────────────────────────── */}
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest mv-muted">
              In loving memory
            </p>
            <p className="mt-1 text-base md:text-lg font-semibold mv-title">
              Uma Kakra
              <span className="ml-2 text-xs font-normal mv-muted tracking-wide">1976 – 2026</span>
            </p>
            <p className="mt-2 text-xs mv-muted leading-relaxed">
              Dedicated to her strength through hereditary chronic conditions — and
              to the scattered records and unexplained jargon that inspired UMA.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
