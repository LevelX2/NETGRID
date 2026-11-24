function escapeCell(value: string | number): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n?|\n/g, " ");
}

export function formatMarkdownTableRow(
  cells: readonly (string | number)[],
): string {
  return "| " + cells.map(escapeCell).join(" | ") + " |";
}
