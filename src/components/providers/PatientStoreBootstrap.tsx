"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncPatientStoreWithServer } from "@/lib/store";

/** Pulls cloud patient data when the user may have a session (no-op on 401). */
export function PatientStoreBootstrap() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") return;
    void syncPatientStoreWithServer();
  }, [pathname]);

  return null;
}
