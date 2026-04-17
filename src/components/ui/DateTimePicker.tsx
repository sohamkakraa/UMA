"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { cn } from "./cn";

/* ─── DateTimePicker ──────────────────────────────────────── */
interface DateTimePickerProps {
  /** Value in "YYYY-MM-DDTHH:mm" format (same as datetime-local) */
  value?: string;
  onChange: (isoLocal: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  className,
  disabled,
  min,
  max,
}: DateTimePickerProps) {
  // Split "YYYY-MM-DDTHH:mm" into date and time parts
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value ? value.slice(11, 16) : "";

  function handleDateChange(d: string) {
    const t = timePart || "12:00";
    onChange(`${d}T${t}`);
  }

  function handleTimeChange(t: string) {
    const d = datePart || new Date().toISOString().slice(0, 10);
    onChange(`${d}T${t}`);
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <DatePicker
        value={datePart}
        onChange={handleDateChange}
        placeholder="Date"
        disabled={disabled}
        min={min?.slice(0, 10)}
        max={max?.slice(0, 10)}
        className="flex-1 min-w-[140px]"
      />
      <TimePicker
        value={timePart}
        onChange={handleTimeChange}
        placeholder="Time"
        disabled={disabled}
        className="flex-1 min-w-[120px]"
      />
    </div>
  );
}
