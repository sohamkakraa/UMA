function baseStore(profile: Record<string, unknown>) {
  return {
    docs: [],
    meds: [],
    labs: [],
    profile: {
      name: "",
      allergies: [],
      conditions: [],
      trends: [],
      ...profile,
    },
    healthLogs: {
      bloodPressure: [],
      sideEffects: [],
      medicationIntake: [],
      medicationReminders: [],
    },
    preferences: { theme: "system" },
    updatedAtISO: new Date().toISOString(),
  };
}

export const PERSONAS = [
  {
    id: "arjun-low-vision",
    viewport: { width: 393, height: 852 },
    store: {
      ...baseStore({
        name: "Arjun Mehta",
        dob: "1955-04-12",
        sex: "Male",
        allergies: ["Penicillin"],
        conditions: ["Type 2 diabetes", "High blood pressure"],
        trends: ["HbA1c", "LDL"],
        bodyMetrics: { heightCm: 175, weightKg: 76 },
      }),
      meds: [{ id: "m1", name: "Metformin", dose: "500 mg", frequency: "Twice daily" }],
      labs: [{
        id: "l1",
        name: "LDL",
        value: "145",
        unit: "mg/dL",
        date: "2026-03-15",
        refRange: "0-100",
      }],
    },
  },
  {
    id: "evelyn-keyboard",
    viewport: { width: 1280, height: 900 },
    store: baseStore({ name: "Evelyn Brooks", dob: "1944-09-08", sex: "Prefer not to say" }),
  },
  {
    id: "priya-caregiver",
    viewport: { width: 375, height: 812 },
    store: baseStore({
      name: "Priya Ramanathan",
      dob: "1960-02-19",
      sex: "Female",
      allergies: ["Latex"],
      conditions: ["Migraine"],
    }),
  },
  {
    id: "aisha-privacy",
    viewport: { width: 393, height: 852 },
    store: {
      ...baseStore({
        name: "Aisha Noor",
        dob: "1990-11-23",
        sex: "Female",
        menstrualCycle: {
          typicalCycleLengthDays: 29,
          lastPeriodStartISO: "2026-07-01",
          flowLogDates: ["2026-07-01"],
        },
      }),
      preferences: { theme: "dark" },
    },
  },
  {
    id: "miguel-tablet",
    viewport: { width: 768, height: 1024 },
    store: {
      ...baseStore({
        name: "Miguel Hernández García",
        dob: "1968-06-30",
        sex: "Male",
        conditions: ["Asthma"],
      }),
      insurancePlans: [{
        id: "plan-demo",
        insurerName: "Demo Mutual",
        policyNumber: "SYNTHETIC-001",
        currency: "EUR",
        active: true,
        createdAtISO: "2026-01-01T00:00:00.000Z",
        updatedAtISO: "2026-01-01T00:00:00.000Z",
      }],
    },
  },
  {
    id: "sam-dense-record",
    viewport: { width: 1280, height: 900 },
    store: {
      ...baseStore({
        name: "Sam Okafor",
        dob: "1981-01-17",
        sex: "Prefer not to say",
        conditions: ["Synthetic condition for layout testing"],
      }),
      meds: Array.from({ length: 20 }, (_, index) => ({
        id: `sam-med-${index}`,
        name: `Demo medicine ${index + 1}`,
        dose: `${index + 1} mg`,
        frequency: "Once daily",
      })),
      labs: Array.from({ length: 50 }, (_, index) => ({
        id: `sam-lab-${index}`,
        name: index % 2 ? "HbA1c" : "LDL",
        value: String(80 + index),
        unit: index % 2 ? "%" : "mg/dL",
        date: `2026-${String((index % 6) + 1).padStart(2, "0")}-15`,
        refRange: index % 2 ? "4-6" : "0-100",
      })),
    },
  },
] as const;
