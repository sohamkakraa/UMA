"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getStore } from "@/lib/store";
import { Bot, MessageCircle, Send, X } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I can help you understand your saved reports, medications, and lab trends in plain language.",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const suggestions = [
    "What are my latest lab values?",
    "Summarize my active medications",
    "What should I discuss at my next visit?",
    "Show trends in my HbA1c and LDL",
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  async function send() {
    const q = text.trim();
    if (!q || loading) return;

    const store = getStore(); // local store (docs/meds/labs)
    setMessages((m) => [...m, { role: "user", content: q }]);
    setText("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, store }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Chat failed");
      setMessages((m) => [...m, { role: "assistant", content: j.answer as string }]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "unknown error";
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `I ran into an error: ${message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function sendSuggestion(prompt: string) {
    setText(prompt);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-5 right-5 z-50 no-print">
        <Button
          onClick={() => setOpen((v) => !v)}
          className="rounded-2xl shadow-lg gap-2"
          variant={open ? "danger" : "primary"}
        >
          {open ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
          {open ? "Close chat" : "Ask UMA"}
        </Button>
      </div>

      {/* Full chat panel */}
      {open && (
        <div className="fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

          <div className="absolute inset-x-2 top-2 bottom-2 md:inset-x-8 md:top-6 md:bottom-6 rounded-3xl border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden flex flex-col">
            <div className="border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-[var(--accent)] text-[var(--accent-contrast)] flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">UMA Assistant</p>
                  <p className="text-xs mv-muted">Answers based on your saved records</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Private</Badge>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--panel-2)]"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[var(--panel-2)]/45">
              <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={[
                        "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 border",
                        m.role === "user"
                          ? "bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]"
                          : "bg-[var(--panel)] text-[var(--fg)] border-[var(--border)]",
                      ].join(" ")}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {messages.length <= 1 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs hover:bg-[var(--panel-2)]"
                        onClick={() => sendSuggestion(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={endRef} />
              </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--panel)] p-4">
              <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-2">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Ask about your reports, meds, or trends..."
                    rows={2}
                    className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-[var(--muted)]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <p className="text-[11px] mv-muted">Press Enter to send, Shift+Enter for a new line.</p>
                    <Button onClick={send} disabled={loading} className="h-9 gap-2 px-3">
                      <Send className="h-4 w-4" />
                      {loading ? "Thinking..." : "Send"}
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-[11px] mv-muted">
                  Not medical advice. This assistant summarizes your saved records and cannot diagnose conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
