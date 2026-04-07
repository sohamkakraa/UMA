import { describe, expect, it } from "vitest";
import type { PatientStore } from "@/lib/types";
import { UMA_TRACKER_LAB_SOURCE } from "@/lib/types";
import { rebuildLabsAndMedsFromDocuments } from "@/lib/store";

function minimalStore(overrides: Partial<PatientStore>): PatientStore {
  return {
    docs: [],
    meds: [],
    labs: [],
    profile: {
      name: "T",
      allergies: [],
      conditions: [],
    },
    preferences: { theme: "light" },
    updatedAtISO: new Date().toISOString(),
    ...overrides,
  } as PatientStore;
}

describe("rebuildLabsAndMedsFromDocuments", () => {
  it("drops labs when their document is removed", () => {
    const store = minimalStore({
      docs: [
        {
          id: "d1",
          type: "Lab report",
          title: "A",
          summary: "s",
          labs: [{ name: "LDL", value: "100", unit: "mg/dL", date: "2026-01-01" }],
        },
        {
          id: "d2",
          type: "Lab report",
          title: "B",
          summary: "s",
          labs: [{ name: "HbA1c", value: "5.5", unit: "%", date: "2026-02-01" }],
        },
      ],
      labs: [],
      meds: [],
    });
    rebuildLabsAndMedsFromDocuments(store);
    expect(store.labs.map((l) => l.name).sort()).toEqual(["HbA1c", "LDL"]);

    store.docs = store.docs.filter((d) => d.id !== "d1");
    rebuildLabsAndMedsFromDocuments(store);
    expect(store.labs.map((l) => l.name)).toEqual(["HbA1c"]);
  });

  it("keeps tracker labs after rebuild", () => {
    const store = minimalStore({
      docs: [],
      labs: [
        {
          name: "Glucose",
          value: "99",
          unit: "mg/dL",
          date: "2026-03-01",
          sourceDocId: UMA_TRACKER_LAB_SOURCE,
        },
      ],
      meds: [],
    });
    rebuildLabsAndMedsFromDocuments(store);
    expect(store.labs.some((l) => l.sourceDocId === UMA_TRACKER_LAB_SOURCE)).toBe(true);
  });
});
