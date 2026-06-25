export function isProtectionDefinitionId(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  const normalized = definitionId.toLocaleLowerCase("en-US");
  return (
    normalized.includes("red-herrings") ||
    normalized.includes("tesseract") ||
    normalized.includes("namatoki")
  );
}
