/**
 * UMA Mobile — Supabase Client
 *
 * Initialises the Supabase client with:
 *  - OS keychain/keystore-backed async storage
 *  - Auto-refresh auth tokens
 *  - Typed database client
 *
 * All patient data goes through the encryption layer before
 * reaching Supabase. Row-Level Security (RLS) provides an
 * additional access control boundary on the server side.
 */

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

/* ─── Configuration ──────────────────────────────────────────── */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[UMA] Supabase credentials not set. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env"
  );
}

/* ─── OS-backed secure auth storage ───────────────────────────── */

const secureStorageAdapter = {
  getItem: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
};

/* ─── Supabase Client ────────────────────────────────────────── */

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Not needed in React Native
  },
});

/* ─── Auth Helpers ───────────────────────────────────────────── */

/**
 * Sign in with email OTP (matches web app's email-based auth).
 * Sends a one-time code to the user's email.
 */
export async function signInWithOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/**
 * Verify the OTP code sent to the user's email.
 */
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

/**
 * Sign out and clear local auth state.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current authenticated user, or null if not signed in.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session's access token (for encryption key derivation).
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
