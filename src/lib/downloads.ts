/** Browser-only helpers for saving blobs. */

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadMarkdownFile(content: string, filename: string) {
  triggerBlobDownload(new Blob([content], { type: "text/markdown;charset=utf-8" }), filename);
}

export function downloadPdfFromBase64(base64: string, filename: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  triggerBlobDownload(new Blob([bytes], { type: "application/pdf" }), filename);
}
