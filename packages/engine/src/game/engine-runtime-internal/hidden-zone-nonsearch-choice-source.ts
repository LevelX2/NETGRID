import { parseCardDefinitionIdToken } from "../choices/card-definition-id-token";
import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";

export function parseTemporaryInstallChoiceSource(source: string): {
  sourceCardId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  value: string;
} {
  const [, sourceCardId = "", sourceDefinitionIdToken = "", value = ""] =
    source.split(":");
  const sourceDefinitionId = parseCardDefinitionIdToken(
    sourceDefinitionIdToken,
  );
  if (!sourceCardId || !sourceDefinitionId)
    throw new Error("Die Temporary-Install-Choice ist ungültig.");
  return {
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    value,
  };
}
