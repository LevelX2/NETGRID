const PROTECTION_DEFINITION_IDS = new Set([
  "onr_v1_361_namatoki-plaza",
  "onr_v1_366_red-herrings",
  "onr_v1_370_tesseract-fort-construction",
]);

export function isProtectionDefinitionId(
  definitionId: string | undefined,
): boolean {
  return (
    definitionId !== undefined && PROTECTION_DEFINITION_IDS.has(definitionId)
  );
}
