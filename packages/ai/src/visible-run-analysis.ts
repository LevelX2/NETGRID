import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type PublicGameEvent,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "./ai-hints";

type IceCardLike = { definitionId?: string; rezzed?: boolean; known: boolean; subtypes?: string[]; strength?: number };
type RootCardLike = { definitionId?: string; rezzed?: boolean; known: boolean };
type BreakAssessment = { cost: number; breakerInstanceId: string; endingStrength: number; carriesStrengthAcrossIce: boolean };

const RUN_REMAINDER_STRENGTH_BREAKER_IDS = new Set([
  "onr_v1_030_grubb",
  "onr_v1_039_krash",
]);
const CRYSTAL_PALACE_STATION_GRID_ID = "onr_v1_355_crystal-palace-station-grid";
const TESSERACT_FORT_CONSTRUCTION_ID = "onr_v1_370_tesseract-fort-construction";

export function serverIdFromEvent(event: PublicGameEvent): string | undefined {
  const candidate = event.publicPayload.serverId ?? event.publicPayload.attackedServerId ?? event.publicPayload.server ?? event.publicPayload.targetServerId;
  if (typeof candidate === "string") return candidate;
  const label = typeof event.publicPayload.serverLabel === "string" ? event.publicPayload.serverLabel : undefined;
  if (!label) return undefined;
  if (label === "HQ") return "hq";
  if (label === "R&D" || label === "F&E (R&D)" || label === "F&E") return "rd";
  if (label === "Archives" || label === "Archive") return "archives";
  const remoteMatch = /^Remote\s+(\d+)$/i.exec(label);
  if (!remoteMatch) return undefined;
  return `remote_${remoteMatch[1]}`;
}

export function assessKnownRezzedIcePath(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: number,
  rootCards: RootCardLike[] = []
): { blocked: boolean; visibleBreakCost?: number } {
  let visibleBreakCost = 0;
  const breakerStrengths = new Map(rigCards.map((card) => [card.instanceId, card.strength ?? 0]));
  const crystalPalaceBreakCost = hasKnownRezzedRoot(rootCards, CRYSTAL_PALACE_STATION_GRID_ID) ? 1 : 0;
  const hasTesseract = hasKnownRezzedRoot(rootCards, TESSERACT_FORT_CONSTRUCTION_ID);
  for (const ice of iceCards.slice().reverse()) {
    if (!ice.definitionId || !ice.known || ice.rezzed !== true) continue;
    const endTheRunCount = endTheRunSubroutineCount(ice.definitionId);
    if (endTheRunCount > 0) {
      const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(ice, rigCards, endTheRunCount, breakerStrengths, crystalPalaceBreakCost);
      if (!breakAssessment) return { blocked: true, ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}) };
      visibleBreakCost += breakAssessment.cost;
      if (breakAssessment.carriesStrengthAcrossIce) {
        breakerStrengths.set(breakAssessment.breakerInstanceId, breakAssessment.endingStrength);
      }
    }
    if (!hasTesseract) continue;
    const tesseractBreakAssessment = minimumCreditsToBreakEndTheRunSubroutines(ice, rigCards, 1, breakerStrengths, crystalPalaceBreakCost);
    const tesseractCost = Math.min(1, tesseractBreakAssessment?.cost ?? 1);
    visibleBreakCost += tesseractCost;
    if (tesseractBreakAssessment && tesseractCost === tesseractBreakAssessment.cost && tesseractBreakAssessment.carriesStrengthAcrossIce) {
      breakerStrengths.set(tesseractBreakAssessment.breakerInstanceId, tesseractBreakAssessment.endingStrength);
    }
  }
  return visibleBreakCost > 0 ? { blocked: visibleBreakCost > runnerCredits, visibleBreakCost } : { blocked: false };
}

export function minimumCreditsToBreakEndTheRunSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  endTheRunCount: number,
  breakerStrengths: Map<string, number>,
  additionalBreakCostPerSubroutine = 0
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) => creditsToBreakEndTheRunSubroutinesWithBreaker(card, ice, endTheRunCount, breakerStrengths.get(card.instanceId), additionalBreakCostPerSubroutine))
    .filter((cost): cost is BreakAssessment => cost !== undefined)
    .sort((left, right) => left.cost - right.cost || left.breakerInstanceId.localeCompare(right.breakerInstanceId));
  return costs[0];
}

export function creditsToBreakEndTheRunSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  endTheRunCount: number,
  currentBreakerStrength = breakerCard.strength ?? cardDefinitionStrength(breakerCard.definitionId),
  additionalBreakCostPerSubroutine = 0
): BreakAssessment | undefined {
  if (!breakerCard.known || !breakerCard.definitionId || !ice.definitionId) return undefined;
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (!breakerDefinition || !iceDefinition || !breakerDefinition.subtypes.includes("icebreaker")) return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const breakAbility = breakerDefinition.abilities?.find(
    (ability) =>
      ability.type === "break_subroutine" &&
      (!ability.iceSubtype || hasSubtype(iceSubtypes, ability.iceSubtype))
  );
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility = breakerDefinition.abilities?.find((ability) => ability.type === "pump_strength");
  let pumpCost = 0;
  let endingStrength = currentBreakerStrength;
  if (endingStrength < iceStrength) {
    if (!pumpAbility || (pumpAbility.amount ?? 0) <= 0) return undefined;
    const requiredPumps = Math.ceil((iceStrength - endingStrength) / Math.max(1, pumpAbility.amount ?? 1));
    pumpCost = requiredPumps * (pumpAbility.cost.credits ?? 0);
    endingStrength += requiredPumps * Math.max(1, pumpAbility.amount ?? 1);
  }
  const breakCount = Math.max(1, breakAbility.count ?? 1);
  const breakUses = Math.ceil(endTheRunCount / breakCount);
  return {
    cost: pumpCost + breakUses * (breakAbility.cost.credits ?? 0) + endTheRunCount * Math.max(0, additionalBreakCostPerSubroutine),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength,
    carriesStrengthAcrossIce: breakerCarriesStrengthAcrossIce(breakerDefinition),
  };
}

function hasKnownRezzedRoot(rootCards: RootCardLike[], definitionId: string): boolean {
  return rootCards.some(
    (card) =>
      card.known &&
      card.rezzed === true &&
      card.definitionId === definitionId,
  );
}

export function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return visibleRunCardDefinition(iceDefinitionId)?.subroutines?.filter((subroutine) => subroutine.type === "end_the_run").length ?? 0;
}

export function canBreakerDefinitionBreakIce(breakerDefinitionId: string, iceDefinitionId: string): boolean {
  const breakerDefinition = visibleRunCardDefinition(breakerDefinitionId);
  const iceDefinition = visibleRunCardDefinition(iceDefinitionId);
  if (!breakerDefinition || !iceDefinition) return false;
  return Boolean(
    breakerDefinition.abilities?.some(
      (ability) =>
        ability.type === "break_subroutine" &&
        (!ability.iceSubtype || hasSubtype(iceDefinition.subtypes, ability.iceSubtype))
    )
  );
}

export function iceHasEndTheRun(iceDefinitionId: string): boolean {
  return endTheRunSubroutineCount(iceDefinitionId) > 0;
}

export function cardDefinitionStrength(definitionId: string | undefined): number {
  if (!definitionId) return 0;
  return (
    visibleRunCardDefinition(definitionId)?.strength ??
    RUNTIME_CARDS[definitionId]?.numeric.strength ??
    0
  );
}

function visibleRunCardDefinition(definitionId: string | undefined): CardDefinition | undefined {
  if (!definitionId) return undefined;
  const directDefinition = DEMO_CARDS_BY_ID[definitionId];
  if (directDefinition) return directDefinition;
  const runtimeEngineId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return runtimeEngineId ? DEMO_CARDS_BY_ID[runtimeEngineId] : undefined;
}

export function breakerCarriesStrengthAcrossIce(definition: CardDefinition): boolean {
  return (
    RUN_REMAINDER_STRENGTH_BREAKER_IDS.has(definition.id) ||
    (definition.mechanics ?? []).includes("run_remainder_strength_bonus")
  );
}

function hasSubtype(subtypes: string[], expectedSubtype: string): boolean {
  const expected = subtypeKey(expectedSubtype);
  return subtypes.some((subtype) => subtypeKey(subtype) === expected);
}

function subtypeKey(subtype: string): string {
  return subtype.trim().toLowerCase().replace(/[\s-]+/g, "_");
}
