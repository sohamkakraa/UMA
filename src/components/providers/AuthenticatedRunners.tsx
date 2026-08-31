"use client";

import { usePathname } from "next/navigation";
import { FamilyRiskRunner } from "@/components/family/FamilyRiskRunner";
import { MedicationReminderRunner } from "@/components/health/MedicationReminderRunner";
import { AutoModeRunner } from "@/components/notifications/AutoModeRunner";
import { PatientStoreBootstrap } from "@/components/providers/PatientStoreBootstrap";

const PUBLIC_ROUTES = new Set(["/", "/login", "/privacy", "/terms"]);

/** Mount health-data side effects only inside the authenticated application. */
export function AuthenticatedRunners() {
  const pathname = usePathname();
  if (PUBLIC_ROUTES.has(pathname)) return null;

  return (
    <>
      <PatientStoreBootstrap />
      <MedicationReminderRunner />
      <AutoModeRunner />
      <FamilyRiskRunner />
    </>
  );
}
