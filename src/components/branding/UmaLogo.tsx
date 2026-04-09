"use client";

import Image from "next/image";
import { cn } from "@/components/ui/cn";

const LOGO_SRC = "/logo.svg";

export function UmaLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={LOGO_SRC}
        alt="UMA"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
        priority={false}
      />
      {!compact && (
        <div className="leading-tight">
          <p className="text-[11px] uppercase tracking-[0.18em] mv-muted">UMA</p>
          <p className="text-sm font-semibold text-[var(--fg)]">Ur Medical Assistant</p>
        </div>
      )}
    </div>
  );
}
