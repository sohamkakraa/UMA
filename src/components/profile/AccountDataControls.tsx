"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { triggerBlobDownload } from "@/lib/downloads";
import { clearLocalPatientStore } from "@/lib/store";

const CONFIRMATION = "DELETE MY UMA DATA";

export function AccountDataControls() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function exportData() {
    setExporting(true);
    setError(null);
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      if (!response.ok) throw new Error("UMA could not prepare your export.");
      triggerBlobDownload(await response.blob(), "uma-data-export.json");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "UMA could not prepare your export.");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (confirmation !== CONFIRMATION) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "UMA could not delete your account.");
      clearLocalPatientStore();
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "UMA could not delete your account.");
      setDeleting(false);
    }
  }

  return (
    <section
      aria-labelledby="account-data-heading"
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"
    >
      <h2 id="account-data-heading" className="text-lg font-semibold text-[var(--fg)]">
        Your beta data
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Download a copy of your account or permanently remove the account and its cloud records.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-[var(--danger,var(--accent-2))]">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="ghost"
          className="h-11 gap-2"
          onClick={exportData}
          disabled={exporting}
        >
          <Download className="h-4 w-4" aria-hidden />
          {exporting ? "Preparing export…" : "Download my data"}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="h-11 gap-2">
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your UMA account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your profile, structured records, messages, and beta activity.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <label htmlFor="delete-account-confirmation" className="text-sm font-medium text-[var(--fg)]">
              Type <strong>{CONFIRMATION}</strong> to confirm
            </label>
            <Input
              id="delete-account-confirmation"
              className="h-11"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <DialogFooter>
              <Button
                className="h-11"
                onClick={deleteAccount}
                disabled={deleting || confirmation !== CONFIRMATION}
              >
                {deleting ? "Deleting…" : "Permanently delete account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
