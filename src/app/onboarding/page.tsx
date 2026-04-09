"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { getStore, saveStore } from "@/lib/store";
import { buildPhoneDialOptions } from "@/lib/phoneDialOptions";

const sexOptions = ["Male", "Female", "Prefer not to say"];

export default function OnboardingPage() {
  const router = useRouter();
  const dialOptions = useMemo(() => buildPhoneDialOptions(), []);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");

  useEffect(() => {
    const s = getStore();
    if (s.preferences.onboarding?.completedAtISO) {
      router.replace("/dashboard");
      return;
    }
    const step = s.preferences.onboarding?.lastStepReached ?? 1;
    setPhase(step >= 2 ? 2 : 1);
    setFirstName(s.profile.firstName ?? "");
    setLastName(s.profile.lastName ?? "");
    setDob(s.profile.dob ?? "");
    setSex(s.profile.sex ?? "");
    setEmail(s.profile.email ?? "");
    setPhone(s.profile.phone ?? "");
    setCountryCode(s.profile.countryCode ?? "");
  }, [router]);

  function persist(next: ReturnType<typeof getStore>) {
    saveStore(next);
  }

  async function completePhase1(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln || !dob) {
      setErr("Please add your name and date of birth.");
      return;
    }
    if (!sex.trim()) {
      setErr("Please select sex.");
      return;
    }
    const em = email.trim().toLowerCase();
    const digits = phone.replace(/\D/g, "");
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setErr("Please enter a valid email.");
      return;
    }
    if (!countryCode.trim()) {
      setErr("Choose your country calling code, then enter your mobile number.");
      return;
    }
    if (digits.length < 6) {
      setErr("Please enter a valid mobile number (digits only, no country code in this box).");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: em,
          phoneCountryCode: countryCode,
          phoneNational: digits,
        }),
      });
      const j = (await r.json()) as { ok?: boolean; error?: string };
      if (!r.ok || !j.ok) throw new Error(j.error ?? "Could not link email and phone");

      const full = [fn, ln].join(" ").trim();
      const cur = getStore();
      const next = {
        ...cur,
        profile: {
          ...cur.profile,
          firstName: fn,
          lastName: ln,
          name: full,
          dob,
          sex: sex || undefined,
          email: em,
          countryCode,
          phone: digits,
        },
        preferences: {
          ...cur.preferences,
          onboarding: {
            ...cur.preferences.onboarding,
            lastStepReached: 2 as const,
          },
        },
      };
      persist(next);
      setPhase(2);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function finishOnboarding() {
    const cur = getStore();
    const next = {
      ...cur,
      preferences: {
        ...cur.preferences,
        onboarding: {
          ...cur.preferences.onboarding,
          lastStepReached: 2 as const,
          completedAtISO: new Date().toISOString(),
        },
      },
    };
    persist(next);
    router.push("/dashboard");
    router.refresh();
  }

  const steps = [
    { n: 1, label: "About you" },
    { n: 2, label: "Records" },
  ];

  return (
    <div className="min-h-screen pb-24">
      <AppTopNav />
      <main className="mx-auto max-w-lg px-4 py-10 space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mv-muted">Welcome</p>
          <h1 className="mt-1 text-2xl font-semibold mv-title">Let&apos;s set things up</h1>
          <p className="mt-2 text-sm mv-muted leading-relaxed">
            Two quick steps. You can skip the optional upload—your dashboard stays available.
          </p>
        </div>

        <div className="flex gap-2">
          {steps.map((s) => (
            <div
              key={s.n}
              className={`flex-1 rounded-2xl border px-3 py-2 text-center text-xs font-medium ${
                phase === s.n
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--fg)]"
                  : "border-[var(--border)] mv-muted"
              }`}
            >
              {s.n}. {s.label}
            </div>
          ))}
        </div>

        {phase === 1 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Personal details</h2>
              <p className="text-xs mv-muted mt-1">
                We link your email and phone so you can sign in with either next time.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={completePhase1} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs mv-muted">
                    First name(s)
                    <Input className="mt-1" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </label>
                  <label className="text-xs mv-muted">
                    Last name
                    <Input className="mt-1" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </label>
                  <label className="text-xs mv-muted">
                    Date of birth
                    <Input className="mt-1" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </label>
                  <label className="text-xs mv-muted">
                    Sex
                    <Select
                      required
                      className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] py-2 text-sm text-[var(--fg)]"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                    >
                      <option value="" disabled>
                        Select sex
                      </option>
                      {sexOptions.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-xs mv-muted sm:col-span-2">
                    Email
                    <Input
                      className="mt-1"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </label>
                  <div className="text-xs mv-muted sm:col-span-2">
                    Mobile number
                    <p className="text-[11px] mv-muted mt-0.5 font-normal">
                      Pick your country code first, then type your number without the leading zero.
                    </p>
                    <div className="mt-1 flex rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] overflow-hidden focus-within:ring-2 focus-within:ring-[var(--accent)]/30">
                      <Select
                        className="shrink-0 w-[4.75rem] sm:w-[5.25rem] rounded-none border-0 border-r border-[var(--border)] bg-transparent py-2.5 pl-2 pr-1 text-sm text-[var(--fg)]"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        aria-label="Country calling code"
                        required
                      >
                        <option value="" disabled>
                          Code
                        </option>
                        {dialOptions.map((o) => (
                          <option key={o.value} value={o.value} title={o.countryName}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                      <Input
                        className="flex-1 min-w-0 rounded-none border-0 bg-transparent py-2.5 px-3 text-sm"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 6 12345678"
                        autoComplete="tel-national"
                        aria-label="National mobile number"
                      />
                    </div>
                  </div>
                </div>
                {err && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                    {err}
                  </div>
                )}
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving…" : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {phase === 2 && (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Add a medical file</h2>
              <p className="text-xs mv-muted mt-1">
                Optional—upload a lab report or prescription so UMA can chart trends and explain results in plain
                language.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/upload" className="block">
                <Button className="w-full">Go to upload</Button>
              </Link>
              <Button type="button" className="w-full" onClick={finishOnboarding}>
                Continue to dashboard
              </Button>
              <p className="text-[11px] mv-muted leading-relaxed">
                Not medical advice. You can upload documents anytime from the app menu.
              </p>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
