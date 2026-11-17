import { isCardDefinitionId, type CardDefinitionId } from "@netgrid/shared";

export function parseCardDefinitionIdToken(
  token: string | undefined,
): CardDefinitionId | undefined {
  if (!token || !/^[1-9]\d*$/.test(token)) return undefined;
  const id = Number(token);
  return isCardDefinitionId(id) ? id : undefined;
}
