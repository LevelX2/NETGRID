import type {
  CardDefinition,
  PlayCostDefinition,
} from "@netgrid/shared";

export function playCostForDefinition(
  definition: CardDefinition,
): PlayCostDefinition {
  if (definition.type !== "event" && definition.type !== "operation") {
    throw new Error(`${definition.id}: Karte hat keine Play-Kosten.`);
  }
  const playCost = definition.playCost;
  if (!playCost) {
    throw new Error(`${definition.id}: Play-Kostenvertrag fehlt.`);
  }
  if (playCost.kind === "fixed") {
    if (
      !Number.isInteger(playCost.credits) ||
      playCost.credits < 0 ||
      (definition.cost !== undefined && definition.cost !== playCost.credits)
    ) {
      throw new Error(`${definition.id}: Fester Play-Kostenvertrag ist ungültig.`);
    }
    return playCost;
  }
  if (
    definition.cost !== undefined ||
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 1 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX <= 0 ||
    playCost.maximumX.kind !== "context"
  ) {
    throw new Error(`${definition.id}: Variabler Play-Kostenvertrag ist ungültig.`);
  }
  return playCost;
}

export function fixedPlayCostCredits(definition: CardDefinition): number {
  const playCost = playCostForDefinition(definition);
  if (playCost.kind !== "fixed") {
    throw new Error(`${definition.id}: Play-Kosten sind nicht fest.`);
  }
  return playCost.credits;
}

export function minimumPlayCostCredits(definition: CardDefinition): number {
  const playCost = playCostForDefinition(definition);
  return playCost.kind === "fixed"
    ? playCost.credits
    : playCost.minimumX * playCost.creditsPerX;
}
