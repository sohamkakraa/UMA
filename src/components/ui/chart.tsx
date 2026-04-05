"use client";

import * as React from "react";
import { cn } from "./cn";

export type ChartConfig = {
  [k: string]: {
    label: string;
    color: string;
  };
};

export function ChartContainer({
  id,
  className,
  config,
  children,
}: {
  id?: string;
  className?: string;
  config: ChartConfig;
  children: React.ReactNode;
}) {
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, item] of Object.entries(config)) {
      vars[`--color-${key}`] = item.color;
    }
    return vars as React.CSSProperties;
  }, [config]);

  return (
    <div id={id} className={cn("h-full w-full min-w-0", className)} style={style}>
      {children}
    </div>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: string | number | null;
  }>;
  label?: string | number;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-[var(--fg)]">{String(label)}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center justify-between gap-2">
            <span className="mv-muted">{entry.name}</span>
            <span className="font-semibold text-[var(--fg)]">{entry.value ?? "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
