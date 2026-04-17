"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Pencil, Trash2, X } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "./Popover";
import { cn } from "./cn";
import { normPickKey } from "@/lib/providerQuickPick";

/* ─── Combobox ────────────────────────────────────────────── */
interface ComboboxProps {
  /** Current value (free text or selected suggestion). */
  value: string;
  onChange: (value: string) => void;
  /** Suggestion list. The user can still type a custom value not in this list. */
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Remove this name from the list (hide file-derived names or delete saved quick-pick entries). */
  onRemoveSuggestion?: (suggestion: string) => void;
  /** Rename a list entry; parent updates stored quick-pick / field value. */
  onRenameSuggestion?: (from: string, to: string) => void;
  /** Save the current input as a personal quick-pick entry (shown even if not on a file). */
  onAppendCustom?: (value: string) => void;
}

export function Combobox({
  value,
  onChange,
  suggestions = [],
  placeholder = "Type or select…",
  className,
  disabled,
  onRemoveSuggestion,
  onRenameSuggestion,
  onAppendCustom,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [editingSuggestion, setEditingSuggestion] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query) return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(q));
  }, [suggestions, query]);

  const valueNormInSuggestions = React.useMemo(
    () => suggestions.some((s) => normPickKey(s) === normPickKey(value)),
    [suggestions, value],
  );

  const canAppend =
    Boolean(onAppendCustom && value.trim() && !valueNormInSuggestions);

  function handleSelect(s: string) {
    onChange(s);
    setQuery("");
    setOpen(false);
    setEditingSuggestion(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    const appendNow = Boolean(
      onAppendCustom &&
        v.trim() &&
        !suggestions.some((s) => normPickKey(s) === normPickKey(v)),
    );
    const hasList = suggestions.length > 0 || appendNow;
    if (!open && hasList) setOpen(true);
  }

  const hasSuggestions = suggestions.length > 0;
  const allowPopover = hasSuggestions || canAppend;
  const showPopover = open && allowPopover;

  /** Keep Radix controlled `open` in sync when the list becomes empty while `open` was true. */
  React.useEffect(() => {
    if (!allowPopover && open) setOpen(false);
  }, [allowPopover, open]);

  function commitRename() {
    if (!editingSuggestion || !onRenameSuggestion) return;
    const t = renameDraft.trim();
    if (t && t !== editingSuggestion) onRenameSuggestion(editingSuggestion, t);
    setEditingSuggestion(null);
    setRenameDraft("");
  }

  function cancelRename() {
    setEditingSuggestion(null);
    setRenameDraft("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setEditingSuggestion(null);
      setRenameDraft("");
    }
  }

  return (
    <Popover modal={false} open={showPopover} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "flex h-10 w-full min-w-0 items-stretch rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] transition-colors",
            "focus-within:ring-2 focus-within:ring-[var(--ring)]",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              if (hasSuggestions || canAppend) setOpen(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)] outline-none"
            style={{ color: "var(--fg)" }}
            autoComplete="off"
          />
          {(hasSuggestions || canAppend) && (
            <button
              type="button"
              tabIndex={-1}
              aria-expanded={showPopover}
              aria-haspopup="listbox"
              aria-label="Show suggestions"
              onMouseDown={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
              }}
              onClick={() => {
                handleOpenChange(!open);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="shrink-0 px-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors"
              disabled={disabled}
            >
              <ChevronsUpDown className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="max-h-64 w-[max(14rem,var(--radix-popover-trigger-width,14rem))] max-w-[calc(100vw-2rem)] overflow-y-auto overflow-x-hidden p-1.5"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
          {hasSuggestions && (
            <>
              {filtered.length === 0 ? (
                <p className="text-xs text-[var(--muted)] px-2 py-2">No matches</p>
              ) : (
                filtered.map((s) =>
                  editingSuggestion === s && onRenameSuggestion ? (
                    <div key={s} className="flex flex-col gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-2">
                      <input
                        type="text"
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--accent)]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitRename();
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-[var(--muted)] hover:bg-[var(--panel)]"
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={commitRename}
                          className="rounded-lg bg-[var(--accent)] px-2 py-1 text-[11px] font-medium text-[var(--accent-contrast)]"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={s}
                      className="flex items-stretch gap-0.5 rounded-xl hover:bg-[var(--panel-2)]"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(s)}
                        className={cn(
                          "flex min-w-0 flex-1 items-center gap-2 rounded-l-xl px-2 py-2 text-left text-sm text-[var(--fg)] transition-colors",
                          value === s && "font-medium",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            value === s ? "text-[var(--accent)] opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="truncate">{s}</span>
                      </button>
                      {(onRemoveSuggestion || onRenameSuggestion) && (
                        <div className="flex shrink-0 items-center gap-0.5 border-l border-[var(--border)] pl-0.5 pr-0.5">
                          {onRenameSuggestion && (
                            <button
                              type="button"
                              aria-label={`Rename ${s}`}
                              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--fg)]"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingSuggestion(s);
                                setRenameDraft(s);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onRemoveSuggestion && (
                            <button
                              type="button"
                              aria-label={`Remove ${s} from list`}
                              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--panel)] hover:text-rose-500"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRemoveSuggestion(s);
                                if (editingSuggestion === s) cancelRename();
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                )
              )}
            </>
          )}
          {canAppend && (
            <button
              type="button"
              onClick={() => {
                onAppendCustom?.(value.trim());
                setOpen(false);
              }}
              className={cn(
                "mt-1 w-full rounded-xl border border-dashed border-[var(--border)] px-2 py-2 text-left text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10",
                hasSuggestions && "border-t border-solid pt-2",
              )}
            >
              Save &ldquo;{value.trim()}&rdquo; to my list
            </button>
          )}
        </PopoverContent>
    </Popover>
  );
}
