import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function isLowValueKnownAccessCard(
  definitionId: string,
  runnerCredits: number,
): boolean {
  const runtimeDefinition = RUNTIME_CARDS[definitionId];
  const demoDefinition = DEMO_CARDS_BY_ID[definitionId];
  const type = runtimeDefinition?.type ?? demoDefinition?.type;
  if (!type) return false;
  if (type === "agenda") return false;
  const trashCost =
    runtimeDefinition?.numeric.trashCost ?? demoDefinition?.trashCost ?? 0;
  if ((type === "asset" || type === "upgrade") && runnerCredits >= trashCost)
    return false;
  return true;
}
