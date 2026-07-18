import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";

export function parseTemporaryInstallChoiceSource(source: string): {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  value: string;
} {
  const [, sourceCardId = "", sourceDefinitionId = "", value = ""] =
    source.split(":");
  if (!sourceCardId || !sourceDefinitionId)
    throw new Error("Die Temporary-Install-Choice ist ungültig.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    value,
  };
}
