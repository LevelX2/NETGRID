import { DEMO_CARDS_BY_ID, type PublicGameEvent, type VisibleCard } from "@netgrid/shared";

type IceCardLike = { definitionId?: string; rezzed?: boolean; known: boolean; subtypes?: string[]; strength?: number };
type BreakAssessment = { cost: number; breakerInstanceId: string; endingStrength: number };

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
  runnerCredits: number
): { blocked: boolean; visibleBreakCost?: number } {
  let visibleBreakCost = 0;
  const breakerStrengths = new Map(rigCards.map((card) => [card.instanceId, card.strength ?? 0]));
  for (const ice of iceCards.slice().reverse()) {
    if (!ice.definitionId || !ice.known || ice.rezzed !== true) continue;
    const endTheRunCount = endTheRunSubroutineCount(ice.definitionId);
    if (endTheRunCount === 0) continue;
    const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(ice, rigCards, endTheRunCount, breakerStrengths);
    if (!breakAssessment) return { blocked: true, ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}) };
    visibleBreakCost += breakAssessment.cost;
    breakerStrengths.set(breakAssessment.breakerInstanceId, breakAssessment.endingStrength);
  }
  return visibleBreakCost > 0 ? { blocked: visibleBreakCost > runnerCredits, visibleBreakCost } : { blocked: false };
}

export function minimumCreditsToBreakEndTheRunSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  endTheRunCount: number,
  breakerStrengths: Map<string, number>
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) => creditsToBreakEndTheRunSubroutinesWithBreaker(card, ice, endTheRunCount, breakerStrengths.get(card.instanceId)))
    .filter((cost): cost is BreakAssessment => cost !== undefined)
    .sort((left, right) => left.cost - right.cost || left.breakerInstanceId.localeCompare(right.breakerInstanceId));
  return costs[0];
}

export function creditsToBreakEndTheRunSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  endTheRunCount: number,
  currentBreakerStrength = breakerCard.strength ?? cardDefinitionStrength(breakerCard.definitionId)
): BreakAssessment | undefined {
  if (!breakerCard.known || !breakerCard.definitionId || !ice.definitionId) return undefined;
  const breakerDefinition = DEMO_CARDS_BY_ID[breakerCard.definitionId];
  const iceDefinition = DEMO_CARDS_BY_ID[ice.definitionId];
  if (!breakerDefinition || !iceDefinition || !breakerDefinition.subtypes.includes("icebreaker")) return undefined;
  const breakAbility = breakerDefinition.abilities?.find((ability) => ability.type === "break_subroutine" && (!ability.iceSubtype || (ice.subtypes ?? iceDefinition.subtypes).includes(ability.iceSubtype)));
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
    cost: pumpCost + breakUses * (breakAbility.cost.credits ?? 0),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength
  };
}

export function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return DEMO_CARDS_BY_ID[iceDefinitionId]?.subroutines?.filter((subroutine) => subroutine.type === "end_the_run").length ?? 0;
}

export function canBreakerDefinitionBreakIce(breakerDefinitionId: string, iceDefinitionId: string): boolean {
  const breakerDefinition = DEMO_CARDS_BY_ID[breakerDefinitionId];
  const iceDefinition = DEMO_CARDS_BY_ID[iceDefinitionId];
  if (!breakerDefinition || !iceDefinition) return false;
  return Boolean(breakerDefinition.abilities?.some((ability) => ability.type === "break_subroutine" && (!ability.iceSubtype || iceDefinition.subtypes.includes(ability.iceSubtype))));
}

export function iceHasEndTheRun(iceDefinitionId: string): boolean {
  return endTheRunSubroutineCount(iceDefinitionId) > 0;
}

export function cardDefinitionStrength(definitionId: string | undefined): number {
  return definitionId ? (DEMO_CARDS_BY_ID[definitionId]?.strength ?? 0) : 0;
}
