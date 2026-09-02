// Cross-feature UI utility (same role as time-range.ts / chart-colors.ts): triggers a
// browser "Save As" for in-memory content with no server round-trip, so any feature that needs
// to export something (XML, CSV, JSON, …) can share this instead of re-implementing the
// Blob + anchor dance per feature.

/** Builds a Blob from `content` and clicks a throwaway <a download> to save it as `filename`. `content` is
 * anything `Blob` accepts — a string for text formats (XML, CSV, JSON), an ArrayBuffer/Uint8Array
 * for binary ones (e.g. an xlsx workbook from `XLSX.write(..., { type: 'array' })`). */
export function downloadFile(content: BlobPart, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoke on a tick so the click has actually started the download first.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
