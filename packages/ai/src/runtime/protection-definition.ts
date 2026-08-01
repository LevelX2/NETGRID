import { AI_HINTS_BY_CARD } from "../ai-hints";

export function isProtectionDefinitionId(
  definitionId: string | undefined,
): boolean {
  if (!definitionId) return false;
  return (
    AI_HINTS_BY_CARD.get(definitionId)?.effects?.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        (effect.scope === "fort" ||
          effect.scope === "server" ||
          effect.scope === "remote"),
    ) === true
  );
}
