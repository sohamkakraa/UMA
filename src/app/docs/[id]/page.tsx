import { Suspense } from "react";
import DocDetailClient from "./DocDetailClient";

export default function DocDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-sm mv-muted">Loading…</div>}>
      <DocDetailClient />
    </Suspense>
  );
}
