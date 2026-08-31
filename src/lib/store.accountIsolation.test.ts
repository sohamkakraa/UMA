// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  activatePatientStoreOwner,
  clearLocalPatientStore,
  createBlankPatientStore,
  getStore,
  saveStore,
} from "@/lib/store";

describe("patient store account isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("quarantines an unowned legacy store instead of attaching it to a login", () => {
    const legacy = createBlankPatientStore({ name: "Previous person" });
    localStorage.setItem("mv_patient_store_v1", JSON.stringify(legacy));

    activatePatientStoreOwner("test-user-a");

    expect(getStore().profile.name).toBe("");
    expect(localStorage.getItem("mv_patient_store_v1")).toBeNull();
    expect(localStorage.getItem("mv_patient_store_legacy_quarantine_v1")).toBeTruthy();
  });

  it("removes the previous local account copy when identities switch", () => {
    activatePatientStoreOwner("test-user-a");
    saveStore(createBlankPatientStore({ name: "Account A" }), { silent: true });
    expect(getStore().profile.name).toBe("Account A");

    activatePatientStoreOwner("test-user-b");

    expect(getStore().profile.name).toBe("");
    expect(localStorage.getItem("mv_patient_store_v1:test-user-a")).toBeNull();
  });

  it("removes all UMA browser data on sign out", () => {
    activatePatientStoreOwner("test-user-a");
    saveStore(createBlankPatientStore({ name: "Account A" }), { silent: true });
    localStorage.setItem("mv_usage_log_v1", "sensitive");

    clearLocalPatientStore();

    expect(Object.keys(localStorage).filter((key) => key.startsWith("mv_"))).toEqual([]);
  });
});
