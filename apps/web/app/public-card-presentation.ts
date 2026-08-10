export type PublicCardPresentation = {
  title: string;
  type?: string;
};

export type PublicCardPresentationsById = Readonly<
  Record<string, PublicCardPresentation>
>;

/**
 * Browser-safe presentation lookup. Values must come from the sanitized
 * catalog DTO; missing presentation data stays missing instead of consulting
 * a full card-definition registry.
 */
export function publicCardTitle(
  definitionId: string | undefined,
  presentationsById?: PublicCardPresentationsById,
): string | undefined {
  return definitionId === undefined
    ? undefined
    : presentationsById?.[definitionId]?.title;
}

export function publicCardPresentation(
  definitionId: string | undefined,
  presentationsById?: PublicCardPresentationsById,
): PublicCardPresentation | undefined {
  return definitionId === undefined
    ? undefined
    : presentationsById?.[definitionId];
}
