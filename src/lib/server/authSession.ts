import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionClaims } from "@/lib/auth/sessionToken";

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export async function requireUserId(): Promise<string | null> {
  const c = await getSessionClaims();
  return c?.sub ?? null;
}
