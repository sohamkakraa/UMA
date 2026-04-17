/**
 * Account registry: a shared localStorage registry of all profiles (primary + sub-profiles)
 * registered on this device. Enables "email lookup" for cross-account features.
 * In production, this would be a real API; for now, localStorage simulates it.
 */

export type AccountRegistryEntry = {
  internalId: string;
  email: string;
  displayName: string;
  relation?: string;
  isPrimary: boolean;
  registeredAtISO: string;
};

const REGISTRY_KEY = "mv_account_registry_v1";

function genId(): string {
  return `uid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getRegistry(): AccountRegistryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AccountRegistryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveRegistry(entries: AccountRegistryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

export function registerEntry(
  entry: Omit<AccountRegistryEntry, "registeredAtISO"> & { registeredAtISO?: string }
): AccountRegistryEntry {
  if (typeof window === "undefined") {
    const now = new Date().toISOString();
    return { ...entry, registeredAtISO: entry.registeredAtISO ?? now };
  }

  const now = new Date().toISOString();
  const fullEntry: AccountRegistryEntry = {
    ...entry,
    registeredAtISO: entry.registeredAtISO ?? now,
  };

  const registry = getRegistry();
  const existing = registry.findIndex((e) => e.internalId === entry.internalId);

  if (existing >= 0) {
    registry[existing] = fullEntry;
  } else {
    registry.push(fullEntry);
  }

  saveRegistry(registry);
  return fullEntry;
}

export function lookupByEmail(email: string): AccountRegistryEntry[] {
  if (typeof window === "undefined") return [];
  const registry = getRegistry();
  return registry.filter((e) => e.email.toLowerCase() === email.toLowerCase());
}

export function isEmailOnPlatform(email: string): boolean {
  if (typeof window === "undefined") return false;
  return lookupByEmail(email).length > 0;
}

export function generateInternalId(): string {
  return genId();
}

export function registerPrimaryAccount(
  internalId: string,
  email: string,
  displayName: string
): void {
  if (typeof window === "undefined") return;
  if (!internalId || !email) return;
  registerEntry({
    internalId,
    email,
    displayName,
    isPrimary: true,
    registeredAtISO: new Date().toISOString(),
  });
}

export function registerSubProfile(
  internalId: string,
  email: string,
  displayName: string,
  relation: string
): void {
  if (typeof window === "undefined") return;
  if (!internalId || !email) return;
  registerEntry({
    internalId,
    email,
    displayName,
    relation,
    isPrimary: false,
    registeredAtISO: new Date().toISOString(),
  });
}

export function deregisterEntry(internalId: string): void {
  if (typeof window === "undefined") return;
  const registry = getRegistry();
  const filtered = registry.filter((e) => e.internalId !== internalId);
  saveRegistry(filtered);
}
