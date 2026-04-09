"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { buildPhoneDialOptions } from "@/lib/phoneDialOptions";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { clearLocalPatientStore, getHydrationSafeStore, getStore, saveStore } from "@/lib/store";
import { AppTopNav } from "@/components/nav/AppTopNav";
import { Droplets, Plus, LogOut, Ruler } from "lucide-react";

export default function ProfilePage() {
  const [store, setStore] = useState(() => getHydrationSafeStore());
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");
  const [trendOpen, setTrendOpen] = useState(false);
  const [flowDateInput, setFlowDateInput] = useState("");
  const providers = ["Dr. A. Kumar", "Dr. Avery Torres", "Dr. Melina Shah", "Dr. Daniel Kim", "Dr. Priya Iyer"];
  const dialOptions = useMemo(() => buildPhoneDialOptions(), []);
  const sexOptions = ["Male", "Female", "Prefer not to say"];
  const trendOptions = [
    "HbA1c",
    "LDL",
    "HDL",
    "Triglycerides",
    "Glucose",
    "RBC",
    "WBC",
    "Hemoglobin",
    "Platelets",
    "Creatinine",
  ];

  useEffect(() => {
    queueMicrotask(() => setStore(getStore()));
    const onFocus = () => setStore(getStore());
    const onStoreUpdate = () => setStore(getStore());
    window.addEventListener("focus", onFocus);
    window.addEventListener("mv-store-update", onStoreUpdate as EventListener);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("mv-store-update", onStoreUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    clearLocalPatientStore();
    window.location.href = "/login";
  }

  function updateProfile(patch: Partial<typeof store.profile>) {
    const next = { ...store, profile: { ...store.profile, ...patch } };
    setStore(next);
    saveStore(next);
  }

  function updateBodyMetrics(patch: Partial<NonNullable<typeof store.profile.bodyMetrics>>) {
    updateProfile({
      bodyMetrics: { ...(store.profile.bodyMetrics ?? {}), ...patch },
    });
  }

  function updateMenstrualCycle(patch: Partial<NonNullable<typeof store.profile.menstrualCycle>>) {
    const cur = store.profile.menstrualCycle ?? { flowLogDates: [] };
    updateProfile({
      menstrualCycle: {
        ...cur,
        ...patch,
        flowLogDates: patch.flowLogDates ?? cur.flowLogDates ?? [],
      },
    });
  }

  function addFlowDay() {
    const d = flowDateInput.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const cur = store.profile.menstrualCycle?.flowLogDates ?? [];
    if (cur.includes(d)) return setFlowDateInput("");
    updateMenstrualCycle({ flowLogDates: [...cur, d].sort() });
    setFlowDateInput("");
  }

  function removeFlowDay(d: string) {
    const cur = store.profile.menstrualCycle?.flowLogDates ?? [];
    updateMenstrualCycle({ flowLogDates: cur.filter((x) => x !== d) });
  }

  function saveIdentity(first?: string, last?: string) {
    const firstTrimmed = (first ?? "").trim();
    const lastTrimmed = (last ?? "").trim();
    const full = [firstTrimmed, lastTrimmed].filter(Boolean).join(" ").trim();
    // Always persist strings (never undefined) so JSON/localStorage keeps keys and getStore() does not fall back to seed defaults.
    updateProfile({
      firstName: firstTrimmed,
      lastName: lastTrimmed,
      name: full,
    });
  }

  function addAllergy() {
    const value = allergyInput.trim();
    if (!value) return;
    if (store.profile.allergies.includes(value)) return setAllergyInput("");
    updateProfile({ allergies: [...store.profile.allergies, value] });
    setAllergyInput("");
  }

  function addCondition() {
    const value = conditionInput.trim();
    if (!value) return;
    if (store.profile.conditions.includes(value)) return setConditionInput("");
    updateProfile({ conditions: [...store.profile.conditions, value] });
    setConditionInput("");
  }

  function removeAllergy(value: string) {
    updateProfile({ allergies: store.profile.allergies.filter((a) => a !== value) });
  }

  function removeCondition(value: string) {
    updateProfile({ conditions: store.profile.conditions.filter((c) => c !== value) });
  }

  function toggleTrend(name: string) {
    const current = new Set(store.profile.trends ?? []);
    if (current.has(name)) current.delete(name);
    else current.add(name);
    updateProfile({ trends: Array.from(current) });
  }

  return (
    <div className="min-h-screen pb-24">
      <AppTopNav
        rightSlot={
          <Button variant="ghost" className="gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card id="profile-patient-details" className="scroll-mt-24 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Patient details</h2>
                <Badge>{[store.profile.firstName, store.profile.lastName].filter(Boolean).join(" ") || store.profile.name}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs mv-muted">
                  First name(s)
                  <Input
                    value={store.profile.firstName ?? ""}
                    onChange={(e) => saveIdentity(e.target.value, store.profile.lastName)}
                  />
                </label>
                <label className="text-xs mv-muted">
                  Last name
                  <Input
                    value={store.profile.lastName ?? ""}
                    onChange={(e) => saveIdentity(store.profile.firstName, e.target.value)}
                  />
                </label>
                <label className="text-xs mv-muted">
                  Date of birth
                  <Input
                    type="date"
                    value={store.profile.dob ?? ""}
                    onChange={(e) => updateProfile({ dob: e.target.value })}
                  />
                </label>
                <label className="text-xs mv-muted">
                  Sex
                  <Select
                    className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] py-2 text-sm text-[var(--fg)]"
                    value={store.profile.sex ?? ""}
                    onChange={(e) => updateProfile({ sex: e.target.value || undefined })}
                  >
                    <option value="">Select</option>
                    {sexOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs mv-muted">
                  Email
                  <Input
                    type="email"
                    value={store.profile.email ?? ""}
                    onChange={(e) => updateProfile({ email: e.target.value })}
                  />
                </label>
                <div className="text-xs mv-muted">
                  Phone
                  <div className="mt-1 grid grid-cols-[110px_1fr] gap-2">
                    <Select
                      className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] py-2 text-sm text-[var(--fg)] min-w-0 truncate"
                      value={store.profile.countryCode ?? "+1"}
                      onChange={(e) => updateProfile({ countryCode: e.target.value })}
                      aria-label="Country calling code"
                    >
                      {dialOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      value={store.profile.phone ?? ""}
                      onChange={(e) => updateProfile({ phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <label className="text-xs mv-muted md:col-span-2">
                  Primary care provider
                  <Select
                    className="mt-1 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] py-2 text-sm text-[var(--fg)]"
                    value={store.profile.primaryCareProvider ?? ""}
                    onChange={(e) =>
                      updateProfile({ primaryCareProvider: e.target.value ? e.target.value : undefined })
                    }
                  >
                    <option value="">None</option>
                    {providers.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs mv-muted">
                  Next visit date
                  <Input
                    type="date"
                    value={store.profile.nextVisitDate ?? ""}
                    onChange={(e) => updateProfile({ nextVisitDate: e.target.value || undefined })}
                  />
                </label>
                <div className="text-xs mv-muted md:col-span-2">
                  Trends to show
                  <div className="relative mt-2">
                    <button
                      type="button"
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-left text-sm"
                      onClick={() => setTrendOpen((v) => !v)}
                    >
                      {(store.profile.trends ?? []).length
                        ? `${(store.profile.trends ?? []).length} selected`
                        : "Select trends"}
                    </button>
                    {trendOpen ? (
                      <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 shadow-lg">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {trendOptions.map((t) => (
                            <label key={t} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={(store.profile.trends ?? []).includes(t)}
                                onChange={() => toggleTrend(t)}
                              />
                              <span>{t}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <label className="text-xs mv-muted md:col-span-2">
                  Care notes
                  <Input
                    value={store.profile.notes ?? ""}
                    onChange={(e) => updateProfile({ notes: e.target.value })}
                    placeholder="Appointment preferences, reminders, etc."
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-medium">Preferences</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="mv-card-muted rounded-2xl p-4">
                  <p className="text-xs mv-muted">Theme</p>
                  <p className="mt-1 text-sm">Switch between light and dark mode.</p>
                  <div className="mt-3">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="text-xs mv-muted">
                  Your theme preference is saved locally on this device.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-sm font-medium">Body metrics</h2>
              </div>
              <p className="text-xs mv-muted mt-1">
                Optional numbers for your own tracking. Use centimetres and kilograms for BMI, or leave blank.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs mv-muted">
                  Height (cm)
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 165"
                    value={store.profile.bodyMetrics?.heightCm ?? ""}
                    onChange={(e) => updateBodyMetrics({ heightCm: e.target.value || undefined })}
                  />
                </label>
                <label className="text-xs mv-muted">
                  Weight (kg)
                  <Input
                    inputMode="decimal"
                    placeholder="e.g. 62"
                    value={store.profile.bodyMetrics?.weightKg ?? ""}
                    onChange={(e) => updateBodyMetrics({ weightKg: e.target.value || undefined })}
                  />
                </label>
                <label className="text-xs mv-muted">
                  Waist (cm)
                  <Input
                    inputMode="decimal"
                    placeholder="Optional"
                    value={store.profile.bodyMetrics?.waistCm ?? ""}
                    onChange={(e) => updateBodyMetrics({ waistCm: e.target.value || undefined })}
                  />
                </label>
                <div className="text-xs mv-muted sm:col-span-2">
                  Blood pressure (mmHg)
                  <div className="mt-1 grid grid-cols-2 gap-2 max-w-xs">
                    <Input
                      inputMode="numeric"
                      placeholder="Systolic"
                      value={store.profile.bodyMetrics?.bloodPressureSys ?? ""}
                      onChange={(e) => updateBodyMetrics({ bloodPressureSys: e.target.value || undefined })}
                    />
                    <Input
                      inputMode="numeric"
                      placeholder="Diastolic"
                      value={store.profile.bodyMetrics?.bloodPressureDia ?? ""}
                      onChange={(e) => updateBodyMetrics({ bloodPressureDia: e.target.value || undefined })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="profile-cycle-tracking" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[var(--accent-2)]" />
                <h2 className="text-sm font-medium">Cycle tracking (beta)</h2>
              </div>
              <p className="text-xs mv-muted mt-1">
                For beta testing this appears for everyone. Estimates are approximate and not medical advice. Your
                clinician can help interpret symptoms and timing.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-xs mv-muted block">
                Typical cycle length (days)
                <Input
                  type="number"
                  min={21}
                  max={45}
                  className="mt-1 max-w-[120px]"
                  value={store.profile.menstrualCycle?.typicalCycleLengthDays ?? 28}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isFinite(n)) return;
                    updateMenstrualCycle({ typicalCycleLengthDays: Math.min(45, Math.max(21, n)) });
                  }}
                />
              </label>
              <label className="text-xs mv-muted block">
                First day of last period
                <Input
                  type="date"
                  className="mt-1 max-w-[220px]"
                  value={store.profile.menstrualCycle?.lastPeriodStartISO ?? ""}
                  onChange={(e) =>
                    updateMenstrualCycle({ lastPeriodStartISO: e.target.value || undefined })
                  }
                />
              </label>
              <div>
                <p className="text-xs mv-muted">Log flow days</p>
                <p className="text-[11px] mv-muted mt-0.5">
                  Add a date when you had bleeding so your dashboard can reflect it.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Input
                    type="date"
                    className="max-w-[180px]"
                    value={flowDateInput}
                    onChange={(e) => setFlowDateInput(e.target.value)}
                  />
                  <Button type="button" className="gap-2" onClick={addFlowDay}>
                    <Plus className="h-4 w-4" /> Log day
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(store.profile.menstrualCycle?.flowLogDates ?? [])
                    .slice()
                    .sort()
                    .reverse()
                    .map((d) => (
                      <button
                        key={d}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs"
                        onClick={() => removeFlowDay(d)}
                      >
                        {d} <span className="text-[10px] mv-muted">remove</span>
                      </button>
                    ))}
                  {!store.profile.menstrualCycle?.flowLogDates?.length && (
                    <span className="text-sm mv-muted">No flow days logged yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card id="profile-allergies" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Allergies</h2>
                <Badge>{store.profile.allergies.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {store.profile.allergies.map((a) => (
                  <button
                    key={a}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs"
                    onClick={() => removeAllergy(a)}
                  >
                    {a} <span className="text-[10px] mv-muted">remove</span>
                  </button>
                ))}
                {!store.profile.allergies.length && <p className="text-sm mv-muted">No allergies on record.</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Add allergy"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                />
                <Button onClick={addAllergy} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card id="profile-conditions" className="scroll-mt-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Conditions</h2>
                <Badge>{store.profile.conditions.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {store.profile.conditions.map((c) => (
                  <button
                    key={c}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs"
                    onClick={() => removeCondition(c)}
                  >
                    {c} <span className="text-[10px] mv-muted">remove</span>
                  </button>
                ))}
                {!store.profile.conditions.length && <p className="text-sm mv-muted">No conditions on record.</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Add condition"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                />
                <Button onClick={addCondition} className="gap-2">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
