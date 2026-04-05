"use client";

import { cn } from "@/components/ui/cn";

export function UmaLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 48"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="UMA logo"
      >
        <defs>
          <linearGradient id="umaLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
          <filter id="umaContrast" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.6" stdDeviation="0.6" floodOpacity="0.55" />
          </filter>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#umaLogoGradient)" />
        <rect x="2.7" y="2.7" width="42.6" height="42.6" rx="13.3" fill="none" stroke="rgba(0,0,0,0.25)" />
        <path
          d="M14 17 v9 c0 5 3.2 8 8 8 s8-3 8-8 v-9"
          fill="none"
          stroke="rgba(12,16,22,0.75)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#umaContrast)"
        />
        <path
          d="M14 17 v9 c0 5 3.2 8 8 8 s8-3 8-8 v-9"
          fill="none"
          stroke="white"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M31.5 33 v-9 c0-4.3 2.7-7 6.5-7 3.8 0 6 2.6 6 7 v9"
          transform="translate(-4.5 0)"
          fill="none"
          stroke="rgba(12,16,22,0.75)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#umaContrast)"
        />
        <path
          d="M31.5 33 v-9 c0-4.3 2.7-7 6.5-7 3.8 0 6 2.6 6 7 v9"
          transform="translate(-4.5 0)"
          fill="none"
          stroke="white"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className="text-[11px] uppercase tracking-[0.18em] mv-muted">UMA</p>
          <p className="text-sm font-semibold text-[var(--fg)]">Ur Medical Assistant</p>
        </div>
      )}
    </div>
  );
}
