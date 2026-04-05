"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, SendHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { getStore } from "@/lib/store";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I am Uma, your care companion. I can help explain your reports, medications, and labs in simple language. What would you like to check first?",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [petMood, setPetMood] = useState<"idle" | "happy" | "thinking">("idle");
  const [petName] = useState("Uma");
  const [celebrate, setCelebrate] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function send() {
    const q = text.trim();
    if (!q || loading) return;

    const store = getStore();
    setMessages((m) => [...m, { role: "user", content: q }]);
    setText("");
    setLoading(true);
    setPetMood("thinking");

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q, store }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Chat failed");
      setMessages((m) => [...m, { role: "assistant", content: String(j.answer ?? "") }]);
      setPetMood("happy");
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 900);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((m) => [...m, { role: "assistant", content: `I ran into an error: ${msg}` }]);
      setPetMood("idle");
    } finally {
      setLoading(false);
      setTimeout(() => setPetMood("idle"), 1200);
    }
  }

  const companionLabel = useMemo(() => {
    if (petMood === "thinking") return `${petName} is thinking...`;
    if (petMood === "happy") return `${petName} is cheering you on`;
    return `${petName}, your care buddy`;
  }, [petMood, petName]);

  return (
    <div className="min-h-screen no-print">
      <style>{`
        @keyframes umaBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1px) scale(1.03); }
        }
        @keyframes umaPop {
          0% { transform: scale(0.7); opacity: 0; }
          30% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <AppTopNav rightSlot={<Badge>Private</Badge>} />

      <main className="w-full px-0 sm:px-4 py-0 sm:py-6 min-h-[calc(100vh-56px)] flex flex-col">
        <section className="flex-1 min-h-0 rounded-none sm:rounded-3xl border-y border-[var(--border)] sm:border bg-[var(--panel)] sm:shadow-[var(--shadow)] flex flex-col overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-11 w-11 shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] grid place-items-center">
                <svg
                  viewBox="0 0 64 64"
                  className={`h-8 w-8 transition-transform duration-300 ${
                    petMood === "happy" ? "scale-110" : ""
                  }`}
                  style={{ animation: "umaBreath 2.4s ease-in-out infinite" }}
                  aria-hidden
                >
                  <circle cx="32" cy="32" r="26" fill="var(--panel)" stroke="var(--border)" strokeWidth="3" />
                  <circle cx="23" cy="28" r="3" fill="var(--fg)" />
                  <circle cx="41" cy="28" r="3" fill="var(--fg)" />
                  <path
                    d={petMood === "thinking" ? "M22 41 Q32 34 42 41" : "M22 39 Q32 46 42 39"}
                    fill="none"
                    stroke="var(--fg)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path d="M18 16 Q22 10 28 14" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
                  <path d="M46 16 Q42 10 36 14" fill="none" stroke="var(--accent-2)" strokeWidth="3" strokeLinecap="round" />
                </svg>
                {celebrate && (
                  <>
                    <span
                      className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]"
                      style={{ animation: "umaPop 900ms ease-out" }}
                    />
                    <span
                      className="absolute -top-1 left-1 h-2.5 w-2.5 rounded-full bg-[var(--accent-2)]"
                      style={{ animation: "umaPop 900ms ease-out 120ms" }}
                    />
                  </>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{companionLabel}</p>
                <p className="text-xs mv-muted truncate">A living companion for supportive health conversations</p>
              </div>
            </div>
            <Badge className="shrink-0 inline-flex items-center gap-1">
              <Heart className="h-3 w-3" /> Companion
            </Badge>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--panel-2)]/35">
            <div className="mx-auto max-w-4xl px-3 sm:px-4 py-5 sm:py-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "max-w-[96%] sm:max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 border whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]"
                        : "bg-[var(--panel)] border-[var(--border)] text-[var(--fg)]",
                    ].join(" ")}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {messages.length <= 1 && (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-3 text-xs mv-muted flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                  Try: &quot;What changed in my latest report compared to my previous one?&quot;
                </div>
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]" style={{ animation: "typingBounce 1s infinite" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]" style={{ animation: "typingBounce 1s infinite 140ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]" style={{ animation: "typingBounce 1s infinite 280ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--panel)] p-3 sm:p-4">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] p-2">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ask about your reports, medications, trends, or next visit..."
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-[var(--muted)]"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-2 pt-2">
                  <p className="text-[11px] mv-muted">Enter to send, Shift+Enter for newline.</p>
                  <Button onClick={send} disabled={loading} className="h-9 gap-2 px-3">
                    <SendHorizontal className="h-4 w-4" />
                    {loading ? "Thinking..." : "Send"}
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-[11px] mv-muted">
                Not medical advice. This chat summarizes your records and cannot diagnose conditions.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
