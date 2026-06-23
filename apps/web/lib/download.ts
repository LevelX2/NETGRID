export function downloadTextFile(fileName: string, text: string, mimeType: string): boolean {
  if (!text.trim() || typeof document === "undefined" || !document.body || typeof Blob === "undefined" || typeof URL === "undefined") return false;
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
