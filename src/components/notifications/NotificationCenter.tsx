"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ExternalLink, List, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/Popover";
import {
  getStore,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  deleteNotifications,
  markNotificationsRead,
  markNotificationsUnread,
} from "@/lib/store";
import type { UmaNotification } from "@/lib/types";

/* ── helpers ─────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function kindIcon(kind: UmaNotification["kind"]) {
  switch (kind) {
    case "med_reminder":    return "💊";
    case "med_missed_auto": return "⚠️";
    case "lab_uploaded":    return "🧪";
    case "doc_uploaded":    return "📄";
    case "cycle_period_soon":
    case "cycle_fertile":   return "🌸";
    case "next_visit":      return "🏥";
    default:                return "🔔";
  }
}

/* ── component ───────────────────────────────────────────── */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UmaNotification[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasMore, setHasMore] = useState(false);

  function refresh() {
    setNotifications((getStore().notifications ?? []).slice(0, 50));
  }

  useEffect(() => {
    const on = () => refresh();
    const timer = setTimeout(() => refresh(), 0);
    window.addEventListener("mv-store-update", on);
    window.addEventListener("uma-notification-added", on);
    window.addEventListener("focus", on);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mv-store-update", on);
      window.removeEventListener("uma-notification-added", on);
      window.removeEventListener("focus", on);
    };
  }, []);

  // Auto-mark-read on open after 600ms delay
  useEffect(() => {
    if (!open || selectionMode) return;
    const timer = setTimeout(() => {
      markAllNotificationsRead();
      refresh();
    }, 600);
    return () => clearTimeout(timer);
  }, [open, selectionMode]);

  // Scroll indicator
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHasMore(!entry.isIntersecting),
      { root: list, threshold: 0.1 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [notifications]);

  const unread = notifications.filter((n) => !n.readAtISO).length;

  function handleRead(id: string) {
    markNotificationRead(id);
    refresh();
  }

  function handleDismiss(id: string) {
    dismissNotification(id);
    refresh();
  }

  function handleMarkAll() {
    markAllNotificationsRead();
    refresh();
  }

  function handleSelectToggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    if (selectedIds.size === notifications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(notifications.map((n) => n.id)));
  }

  function handleMarkSelectedRead() { markNotificationsRead(selectedIds); refresh(); }
  function handleMarkSelectedUnread() { markNotificationsUnread(selectedIds); refresh(); }
  function handleDeleteSelected() { deleteNotifications(selectedIds); setSelectedIds(new Set()); refresh(); }
  function exitSelectionMode() { setSelectionMode(false); setSelectedIds(new Set()); }

  function handleRowClick(id: string, e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;
    handleSelectToggle(id);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Bell button */}
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread > 0 ? ` — ${unread} unread` : ""}`}
          className="relative h-8 w-8 rounded-xl flex items-center justify-center border border-[var(--border)] bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--fg)] hover:border-[var(--fg)]/30 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] text-[9px] font-bold flex items-center justify-center leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* Panel */}
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[340px] max-w-[calc(100vw-1rem)] p-0 flex flex-col overflow-hidden"
        style={{ maxHeight: "min(520px, 80dvh)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
          <span className="text-sm font-semibold">
            {selectionMode ? `${selectedIds.size} selected` : "Notifications"}
          </span>
          <div className="flex items-center gap-1">
            {!selectionMode && unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                title="Mark all as read"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
            )}
            {!selectionMode && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                title="Select notifications"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] transition-colors"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            )}
            {selectionMode && (
              <>
                <button
                  type="button"
                  onClick={handleMarkSelectedRead}
                  disabled={selectedIds.size === 0}
                  title="Mark selected as read"
                  className="h-7 px-2 rounded-lg flex items-center justify-center text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Read
                </button>
                <button
                  type="button"
                  onClick={handleMarkSelectedUnread}
                  disabled={selectedIds.size === 0}
                  title="Mark selected as unread"
                  className="h-7 px-2 rounded-lg flex items-center justify-center text-xs font-medium text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="h-3 w-3 mr-1" />
                  Unread
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.size === 0}
                  title="Delete selected"
                  className="h-7 px-2 rounded-lg flex items-center justify-center text-xs font-medium text-[var(--muted)] hover:text-red-400 hover:bg-[var(--panel-2)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={exitSelectionMode}
                  title="Cancel selection"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {!selectionMode && (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Select-all toggle bar */}
        {selectionMode && notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--panel-2)]/40 shrink-0">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-[var(--accent)] hover:underline font-medium"
            >
              {selectedIds.size === notifications.length ? "Deselect all" : "Select all"}
            </button>
          </div>
        )}

        {/* List */}
        <div className="overflow-y-auto flex-1 relative" ref={listRef}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
              <Bell className="h-8 w-8 text-[var(--muted)] opacity-40" />
              <p className="text-sm text-[var(--muted)]">You&apos;re all caught up</p>
            </div>
          ) : (
            <>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={(e) => { if (selectionMode) handleRowClick(n.id, e); }}
                  className={[
                    "group relative flex gap-3 px-4 py-3 border-b border-[var(--border)] transition-colors cursor-pointer",
                    n.readAtISO ? "opacity-60" : "bg-[var(--accent)]/5",
                    selectionMode && selectedIds.has(n.id) ? "bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]" : "",
                  ].join(" ")}
                >
                  {selectionMode && (
                    <div className="flex items-start mt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(n.id)}
                        onChange={() => handleSelectToggle(n.id)}
                        className="h-4 w-4 rounded border border-[var(--border)] checked:bg-[var(--accent)] cursor-pointer"
                      />
                    </div>
                  )}

                  {!selectionMode && !n.readAtISO && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  )}

                  <span className="text-lg shrink-0 mt-0.5">{kindIcon(n.kind)}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--fg)] leading-snug">{n.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-1 opacity-60">{timeAgo(n.createdAtISO)}</p>
                    {n.actionHref && n.actionLabel && !selectionMode && (
                      <Link
                        href={n.actionHref}
                        onClick={() => { handleRead(n.id); setOpen(false); }}
                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium text-[var(--accent)] hover:underline"
                      >
                        {n.actionLabel} <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>

                  {!selectionMode && (
                    <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.readAtISO && (
                        <button
                          type="button"
                          onClick={() => handleRead(n.id)}
                          title="Mark as read"
                          className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)]"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      {n.readAtISO && (
                        <button
                          type="button"
                          onClick={() => handleRead(n.id)}
                          title="Mark as unread"
                          className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--fg)] hover:bg-[var(--panel-2)]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDismiss(n.id)}
                        title="Dismiss"
                        className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-red-400 hover:bg-[var(--panel-2)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={sentinelRef} style={{ height: 1 }} />
            </>
          )}

          {/* Scroll indicator */}
          {hasMore && (
            <div
              className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent, var(--panel))" }}
            >
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                <span className="h-1 w-1 rounded-full bg-[var(--muted)] opacity-60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1 w-1 rounded-full bg-[var(--muted)] opacity-60 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1 w-1 rounded-full bg-[var(--muted)] opacity-60 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
