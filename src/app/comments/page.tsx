/**
 * Demo page disabled — was unauthenticated write access, attack surface removed.
 * Redirects all visitors to the dashboard.
 */
import { redirect } from "next/navigation";

export default function CommentsPage() {
  redirect("/dashboard");
}
