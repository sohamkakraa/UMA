"use client";

/**
 * Global upload context — the fetch and its state live in a MODULE-LEVEL
 * singleton (outside React) so no navigation, remount, or React Compiler
 * optimisation can ever cancel or reset it.
 *
 * Flow:
 *   1. Dashboard calls startExtract() → fetch runs in the singleton
 *   2. User navigates freely; the fetch is never cancelled
 *   3. Listeners (React components) subscribe via the context to receive updates
 *   4. GlobalUploadBadge shows progress on every page
 *   5. When done, commitAndClear() saves the result and resets the singleton
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ExtractionCost, ExtractedDoc, StandardLexiconEntry } from "@/lib/types";
import { appendUsageLogEntry } from "@/lib/store";

/* ─── Types ──────────────────────────────────────────────── */
export type UploadPhase = "idle" | "extracting" | "ready" | "error";

export type UploadStageStatus = "pending" | "running" | "done" | "error";

export interface UploadStage {
  label: string;
  status: UploadStageStatus;
}

export interface ExtractionResult {
  doc: ExtractedDoc;
  lexiconPatches: StandardLexiconEntry[];
  extractionCost?: ExtractionCost | null;
  nameMismatch?: {
    namesOnDocument: string[];
    profileDisplayName: string;
  } | null;
}

export interface GlobalUploadState {
  phase: UploadPhase;
  fileName: string;
  error: string | null;
  result: ExtractionResult | null;
  /** The original File object — kept so commitUploadDoc can read it after navigation */
  currentFile: File | null;
  /** All queued files for multi-upload */
  queuedFiles: File[];
  /** Index of the currently-extracting file in queuedFiles */
  queueIndex: number;
  /** Whether the floating badge is visible; false = user dismissed it but fetch still runs */
  badgeVisible: boolean;
  /** Stages of the extraction process */
  stages: UploadStage[];
  /** Whether the upload progress sheet is open */
  uploadSheetOpen: boolean;
}

interface GlobalUploadContextValue extends GlobalUploadState {
  startExtract: (params: {
    file: File;
    typeHint: string;
    patientName: string;
    existingContentHashes: string[];
    standardLexicon: StandardLexiconEntry[];
    allFiles?: File[];
    allFilesIndex?: number;
  }) => void;
  cancelExtract: () => void;
  clear: () => void;
  /** Hide the badge without stopping the fetch. Badge re-appears when phase changes. */
  dismissBadge: () => void;
  openUploadSheet: () => void;
  closeUploadSheet: () => void;
}

/* ─── Module-level singleton — lives for the entire browser session ── */
const DEFAULT_STATE_WITH_STAGES: GlobalUploadState = {
  phase: "idle",
  fileName: "",
  error: null,
  result: null,
  currentFile: null,
  queuedFiles: [],
  queueIndex: 0,
  badgeVisible: true,
  stages: [],
  uploadSheetOpen: false,
};

// Mutable state object — never replaced, only mutated so the reference
// is stable and listeners always point at the same object.
let _state: GlobalUploadState = { ...DEFAULT_STATE_WITH_STAGES };
let _abortController: AbortController | null = null;
let _stageTimerRef: ReturnType<typeof setTimeout> | null = null;

// Subscriber set — React components register here to receive updates.
type Listener = (state: GlobalUploadState) => void;
const _listeners = new Set<Listener>();

function _notify() {
  // Snapshot so each listener gets the same frozen copy.
  const snap = { ..._state };
  _listeners.forEach((fn) => fn(snap));
}

function _setState(patch: Partial<GlobalUploadState>) {
  // If phase is changing, always make the badge visible again so the user
  // sees the "ready" or "error" notification even if they dismissed the
  // "extracting" badge earlier.
  const phaseChanging = patch.phase !== undefined && patch.phase !== _state.phase;
  _state = {
    ..._state,
    ...patch,
    badgeVisible: phaseChanging ? true : (patch.badgeVisible ?? _state.badgeVisible),
  };
  _notify();
}

/* ─── Internal helper — advance to the next file in the queue ─────────── */
function _tryAdvanceQueue({
  typeHint,
  patientName,
  existingContentHashes,
  standardLexicon,
}: {
  typeHint: string;
  patientName: string;
  existingContentHashes: string[];
  standardLexicon: StandardLexiconEntry[];
}) {
  const nextIndex = _state.queueIndex + 1;
  if (nextIndex < _state.queuedFiles.length) {
    const nextFile = _state.queuedFiles[nextIndex];
    // Small delay so the error flash is visible before moving on
    setTimeout(() => {
      singletonStartExtract({
        file: nextFile,
        typeHint,
        patientName,
        existingContentHashes,
        standardLexicon,
        allFiles: _state.queuedFiles,
        allFilesIndex: nextIndex,
      });
    }, 1200);
  }
}

/* ─── Singleton actions (stable references, safe to call from anywhere) ─ */
export function singletonStartExtract({
  file,
  typeHint,
  patientName,
  existingContentHashes,
  standardLexicon,
  allFiles,
  allFilesIndex,
}: {
  file: File;
  typeHint: string;
  patientName: string;
  existingContentHashes: string[];
  standardLexicon: StandardLexiconEntry[];
  allFiles?: File[];
  allFilesIndex?: number;
}) {
  // Cancel any previous in-flight extraction.
  if (_stageTimerRef) clearTimeout(_stageTimerRef);
  _abortController?.abort();
  const controller = new AbortController();
  _abortController = controller;

  const initialStages: UploadStage[] = [
    { label: "Uploading file", status: "pending" },
    { label: "OCR & text extraction", status: "pending" },
    { label: "Structuring medical data", status: "pending" },
    { label: "Finalising document", status: "pending" },
  ];

  _setState({
    phase: "extracting",
    fileName: file.name,
    error: null,
    result: null,
    currentFile: file,
    queuedFiles: allFiles ?? (_state.queuedFiles.length > 0 ? _state.queuedFiles : [file]),
    queueIndex: allFilesIndex ?? (allFiles ? 0 : _state.queueIndex),
    stages: initialStages,
  });

  // Simulate stage progress on the client side.
  // Each call marks the PREVIOUS stage as "done" and the CURRENT stage as "running".
  let stageIndex = 0;
  const updateStage = () => {
    const newStages = [..._state.stages];
    // Mark all previous stages as done
    for (let i = 0; i < stageIndex; i++) {
      newStages[i] = { ...newStages[i], status: "done" };
    }
    // Mark the current stage as running
    if (stageIndex < newStages.length) {
      newStages[stageIndex] = { ...newStages[stageIndex], status: "running" };
    }
    _setState({ stages: newStages });
    stageIndex += 1;
    if (stageIndex < newStages.length) {
      // Stage 0→1 (uploading file): 1.5s
      // Stage 1→2 (OCR): 25s
      // Stage 2→3 (structuring): 25s
      // Stage 3 (finalising) stays "running" until fetch completes
      const delays = [1500, 25000, 25000];
      _stageTimerRef = setTimeout(updateStage, delays[stageIndex - 1] ?? 0);
    }
  };

  // Start the first stage immediately as "running"
  updateStage();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("typeHint", typeHint);
  fd.append("patientName", patientName);
  fd.append("existingContentHashes", JSON.stringify(existingContentHashes));
  fd.append("standardLexicon", JSON.stringify(standardLexicon));

  fetch("/api/extract", { method: "POST", body: fd, signal: controller.signal })
    .then(async (r) => {
      if (_stageTimerRef) clearTimeout(_stageTimerRef);

      const j = await r.json();
      const newStages = _state.stages.map((s, i) => ({
        ...s,
        status: (i < 3 ? "done" : "running") as UploadStageStatus,
      }));

      if (r.ok) {
        const cost = j.extractionCost as ExtractionCost | null | undefined;
        if (cost) {
          appendUsageLogEntry({
            kind: "pdf_extraction",
            model: cost.model,
            inputTokens: cost.inputTokens,
            outputTokens: cost.outputTokens,
            totalUSD: cost.totalUSD,
            label: (j.doc as ExtractedDoc)?.title ?? file.name,
          });
        }
        _setState({
          phase: "ready",
          fileName: file.name,
          error: null,
          result: {
            doc: j.doc as ExtractedDoc,
            lexiconPatches: (j.lexiconPatches as StandardLexiconEntry[]) ?? [],
            extractionCost: cost ?? null,
            nameMismatch: null,
          },
          stages: newStages.map((s, i) => ({ ...s, status: (i < 4 ? "done" : "done") as UploadStageStatus })),
        });
        return;
      }
      if (j.code === "patient_name_mismatch" && j.doc) {
        const cost = j.extractionCost as ExtractionCost | null | undefined;
        _setState({
          phase: "ready",
          fileName: file.name,
          error: null,
          result: {
            doc: j.doc as ExtractedDoc,
            lexiconPatches: (j.lexiconPatches as StandardLexiconEntry[]) ?? [],
            extractionCost: cost ?? null,
            nameMismatch: {
              namesOnDocument: Array.isArray(j.namesOnDocument) ? j.namesOnDocument : [],
              profileDisplayName: String(j.profileDisplayName ?? ""),
            },
          },
          stages: newStages.map((s, i) => ({ ...s, status: (i < 4 ? "done" : "done") as UploadStageStatus })),
        });
        return;
      }

      // Mark current running stage as error
      const errorStages = newStages.map((s) => ({
        ...s,
        status: (s.status === "running" ? "error" : s.status) as UploadStageStatus,
      }));
      const errorMsg = j?.error ?? "Could not read this file";
      const isDuplicate = typeof errorMsg === "string" && errorMsg.includes("matches one already in your records");

      _setState({
        phase: "error",
        error: errorMsg,
        stages: errorStages,
      });

      // Auto-advance to the next queued file if this was a duplicate
      if (isDuplicate) {
        _tryAdvanceQueue({ typeHint, patientName, existingContentHashes, standardLexicon });
      }
    })
    .catch((err) => {
      if ((err as Error).name === "AbortError") return;
      if (_stageTimerRef) clearTimeout(_stageTimerRef);

      // Mark current running stage as error
      const errorStages = _state.stages.map((s) => ({
        ...s,
        status: (s.status === "running" ? "error" : s.status) as UploadStageStatus,
      }));
      _setState({
        phase: "error",
        error: (err as Error).message ?? "Could not read this file",
        stages: errorStages,
      });
    });
}

export function singletonCancelExtract() {
  if (_stageTimerRef) clearTimeout(_stageTimerRef);
  _abortController?.abort();
  _setState({ ...DEFAULT_STATE_WITH_STAGES });
}

export function singletonClear() {
  if (_stageTimerRef) clearTimeout(_stageTimerRef);
  _abortController?.abort();
  _setState({ ...DEFAULT_STATE_WITH_STAGES });
}

/** Hide the badge without aborting the in-progress fetch. */
export function singletonDismissBadge() {
  _setState({ badgeVisible: false });
}

export function singletonOpenUploadSheet() {
  _setState({ uploadSheetOpen: true });
}

export function singletonCloseUploadSheet() {
  _setState({ uploadSheetOpen: false });
}

/* ─── React context — thin bridge from the singleton to components ─── */
const GlobalUploadContext = createContext<GlobalUploadContextValue>({
  ...DEFAULT_STATE_WITH_STAGES,
  startExtract: singletonStartExtract,
  cancelExtract: singletonCancelExtract,
  clear: singletonClear,
  dismissBadge: singletonDismissBadge,
  openUploadSheet: singletonOpenUploadSheet,
  closeUploadSheet: singletonCloseUploadSheet,
});

export function useGlobalUpload() {
  return useContext(GlobalUploadContext);
}

/**
 * Provider — mounts once in the root layout. Its only job is to subscribe
 * to the singleton and propagate state snapshots into React.
 * Even if React remounts this provider (e.g. HMR), the singleton fetch
 * keeps running uninterrupted.
 */
export function GlobalUploadProvider({ children }: { children: ReactNode }) {
  const [state, setStateLocal] = useState<GlobalUploadState>(() => ({ ..._state }));

  useEffect(() => {
    // Sync immediately in case the singleton changed while we were unmounted.
    setStateLocal({ ..._state });

    const listener: Listener = (snap) => setStateLocal(snap);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const startExtract = useCallback(singletonStartExtract, []);
  const cancelExtract = useCallback(singletonCancelExtract, []);
  const clear = useCallback(singletonClear, []);
  const dismissBadge = useCallback(singletonDismissBadge, []);
  const openUploadSheet = useCallback(singletonOpenUploadSheet, []);
  const closeUploadSheet = useCallback(singletonCloseUploadSheet, []);

  return (
    <GlobalUploadContext.Provider value={{ ...state, startExtract, cancelExtract, clear, dismissBadge, openUploadSheet, closeUploadSheet }}>
      {children}
    </GlobalUploadContext.Provider>
  );
}
