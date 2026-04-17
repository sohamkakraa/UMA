"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "./cn";

/* ─── Helpers ─────────────────────────────────────────────── */
function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Convert "HH:mm" → "h:mm AM/PM" for display. */
function to12h(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

/** Try to parse a flexible user string into "HH:mm" 24-hour format.
 *  Accepts: "9:30 AM", "9:30am", "09:30", "930", "13:00", "1pm", "1:00 PM", etc. */
function parseTimeString(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  // Match patterns like "9:30 am", "13:00", "9:30", "930am", "1pm"
  const match = s.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] as "am" | "pm" | undefined;

  if (period === "pm" && h < 12) h += 12;
  if (period === "am" && h === 12) h = 0;

  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/* ─── TimePicker ──────────────────────────────────────────── */
interface TimePickerProps {
  value?: string; // HH:mm
  onChange: (hhmm: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "e.g. 9:30 AM",
  className,
  disabled,
}: TimePickerProps) {
  // Display value: show 12h format when we have a valid value, otherwise show raw input
  const [rawInput, setRawInput] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  // When value prop changes externally, update display
  const displayValue = focused ? rawInput : (value ? to12h(value) : "");

  function handleFocus() {
    setRawInput(value ? to12h(value) : "");
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    const parsed = parseTimeString(rawInput);
    if (parsed) {
      onChange(parsed);
    } else if (!rawInput.trim()) {
      onChange("");
    }
    // If invalid non-empty input, just revert to previous value display
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-3 transition-colors",
        "focus-within:ring-2 focus-within:ring-[var(--ring)]",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <Clock className="h-4 w-4 shrink-0 text-[var(--muted)]" />
      <input
        type="text"
        value={displayValue}
        onChange={(e) => setRawInput(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] outline-none"
      />
    </div>
  );
}
