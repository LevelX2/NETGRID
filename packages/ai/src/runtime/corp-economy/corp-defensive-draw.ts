import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type AiDecisionScoreComponent,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import { buildCorpIceDensityProfile } from "./corp-ice-density";
import { RUNTIME_CARDS } from "../../ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import type { CorpBoardTriage } from "../semantic-runtime-corp-board-triage";
import type { CorpFundedRemoteAccessRiskNeed } from "../corp-funded-score-protection";
import type { CorpCentralDefenseAllocation } from "../corp-central-defense-allocation";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type CorpScoreProtectionIceInput,
} from "../corp-score-protection-assessment";

const CORP_SAFE_DRAW_CAPACITY_VALUE = 100;
const CORP_LOW_HAND_VALUE = 450;
const CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE = 250;
const CORP_ADDITIONAL_DRAW_VALUE_PER_CARD = 400;
const CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD = 100;
const CORP_DRAW_OVERFLOW_PENALTY_PER_CARD = 100;

export type CorpOptionalDrawCapacity = {
  eligible: boolean;
  handCount: number;
  maxHandSize: number;
  projectedDrawCount: number;
  freeSlotsBefore: number;
  freeSlotsAfter: number;
};

export type CorpMissingConcreteDefenseDrawNeed = {
  serverId: "hq" | "rd";
  planValue: number;
  cleanupReplacementDraw?: boolean;
  evidence: string[];
};

export type CorpScoreDefenseDirectInstallRouteState =
  | Readonly<{
      knowledge: "known";
      disposition: "productive" | "effect_missing" | "funding_only";
    }>
  | Readonly<{
      knowledge: "unknown";
    }>;

export type CorpScoreDefenseDrawActionProjection =
  | Readonly<{
      knowledge: "known";
      actionId: string;
      observedAtStateVersion: number;
      clickCost: number;
      cardsDrawn: number;
      netHandDelta: number;
    }>
  | Readonly<{
      knowledge: "unknown";
    }>;

export type CorpScoreDefenseDrawAttemptState = Readonly<{
  residentAttemptedThisTurn: boolean;
  eventTailAttemptedThisTurn: boolean;
}>;

export type CorpScoreDefenseDrawNeed = Readonly<{
  needId: string;
  parentProjectId: string;
  serverId: string;
  cleanupReplacementDraw: boolean;
  evidence: readonly string[];
}>;

export type CorpMissingConcreteScoreDefenseDrawNeedInput = Readonly<{
  input: AiDecisionInput;
  action: LegalAction;
  protectionNeed: CorpFundedRemoteAccessRiskNeed;
  directInstallRouteState: CorpScoreDefenseDirectInstallRouteState;
  drawActionProjection: CorpScoreDefenseDrawActionProjection;
  attemptState: CorpScoreDefenseDrawAttemptState;
  agendaCapacityDefenseConversionAvailable?: boolean;
}>;

export function corpMissingConcreteScoreDefenseDrawNeed(
  args: CorpMissingConcreteScoreDefenseDrawNeedInput,
): CorpScoreDefenseDrawNeed | undefined {
  const {
    input,
    action,
    protectionNeed,
    directInstallRouteState,
    drawActionProjection,
    attemptState,
  } = args;
  const stateVersion = input.playerView.stateVersion;
  if (
    input.side !== "corp" ||
    !input.legalActions.includes(action) ||
    protectionNeed.observedAtStateVersion !== stateVersion ||
    (protectionNeed.baseline.knowledge === "unknown" &&
      protectionNeed.baseline.unknownReason !== "subset_assessment_unknown") ||
    protectionNeed.baseline.fundedProtection ||
    (directInstallRouteState.knowledge === "known" &&
      directInstallRouteState.disposition !== "effect_missing") ||
    drawActionProjection.knowledge !== "known" ||
    drawActionProjection.actionId !== action.actionId ||
    drawActionProjection.observedAtStateVersion !== stateVersion ||
    action.expiresAtStateVersion !== stateVersion ||
    attemptState.residentAttemptedThisTurn ||
    attemptState.eventTailAttemptedThisTurn ||
    attemptState.eventTailAttemptedThisTurn !==
      corpOptionalDrawAttemptedInEventTailThisTurn(input)
  ) {
    return undefined;
  }
  const exactClickCost = exactLegalActionClickCost(action);
  const exactDrawCount = exactLegalActionDrawCount(action);
  if (
    exactClickCost === undefined ||
    exactClickCost <= 0 ||
    drawActionProjection.clickCost !== exactClickCost ||
    exactDrawCount === undefined ||
    drawActionProjection.cardsDrawn !== exactDrawCount ||
    !nonNegativeSafeInteger(drawActionProjection.netHandDelta) ||
    drawActionProjection.netHandDelta > drawActionProjection.cardsDrawn
  ) {
    return undefined;
  }
  const handCount = input.playerView.own.gripOrHq.length;
  const maxHandSize = input.playerView.own.maxHandSize;
  const clicks = input.playerView.own.clicks;
  const hardClickReserve = protectionNeed.scoreReserve.hardClickReserve;
  if (
    !nonNegativeSafeInteger(maxHandSize) ||
    maxHandSize <= 2 ||
    !nonNegativeSafeInteger(clicks) ||
    !nonNegativeSafeInteger(hardClickReserve) ||
    protectionNeed.baseline.availableCorpCredits !==
      input.playerView.own.credits ||
    protectionNeed.baseline.availableCorpClicks !== clicks
  ) {
    return undefined;
  }
  const projectedHandAfterDraw = handCount + drawActionProjection.netHandDelta;
  if (
    projectedHandAfterDraw > maxHandSize &&
    args.agendaCapacityDefenseConversionAvailable === true
  ) {
    return undefined;
  }
  const projectedHandAfterDrawAndInstall = projectedHandAfterDraw - 1;
  const sameTurnFollowupAvailable =
    clicks >= drawActionProjection.clickCost + 1 + hardClickReserve &&
    projectedHandAfterDrawAndInstall <= maxHandSize;
  const safeMultiTurnProgressAvailable =
    hardClickReserve === 0 &&
    clicks >= drawActionProjection.clickCost &&
    projectedHandAfterDraw <= maxHandSize;
  if (!sameTurnFollowupAvailable && !safeMultiTurnProgressAvailable) {
    return undefined;
  }
  const cleanupReplacementDraw =
    sameTurnFollowupAvailable && projectedHandAfterDraw > maxHandSize;
  const targetDensity = corpScoreDefenseEffectSuitableIceDensity(
    input,
    protectionNeed,
  );
  if (
    targetDensity.confidence !== "deck_snapshot" ||
    !positiveSafeInteger(targetDensity.remainingDeckCount) ||
    !positiveSafeInteger(targetDensity.remainingSuitableIceCount) ||
    typeof targetDensity.remainingSuitableIceDensity !== "number" ||
    !Number.isFinite(targetDensity.remainingSuitableIceDensity) ||
    targetDensity.remainingSuitableIceDensity <= 0
  ) {
    return undefined;
  }
  return {
    needId: `score-defense-draw:${protectionNeed.needId}:${action.actionId}`,
    parentProjectId: protectionNeed.parentProjectId,
    serverId: protectionNeed.targetServerId,
    cleanupReplacementDraw,
    evidence: [
      `protection_need:${protectionNeed.needId}`,
      `parent_project:${protectionNeed.parentProjectId}`,
      `target_server:${protectionNeed.targetServerId}`,
      protectionNeed.baseline.knowledge === "known"
        ? "funded_protection_baseline:known_unprotected"
        : "funded_protection_baseline:subset_unknown_deferred",
      directInstallRouteState.knowledge === "known"
        ? "direct_install_route_disposition:effect_missing"
        : "direct_install_route_disposition:unknown_deferred",
      `score_defense_cleanup_replacement_draw:${cleanupReplacementDraw}`,
      `score_defense_draw_followup_horizon:${
        sameTurnFollowupAvailable ? "same_turn" : "multi_turn_progress"
      }`,
      `score_defense_draw_action_click_cost:${drawActionProjection.clickCost}`,
      `score_defense_draw_cards_drawn:${drawActionProjection.cardsDrawn}`,
      `score_defense_draw_net_hand_delta:${drawActionProjection.netHandDelta}`,
      `score_defense_hard_click_reserve:${hardClickReserve}`,
      "score_defense_optional_draw_already_attempted:false",
      ...targetDensity.evidence,
      `hand_count:${handCount}`,
      `max_hand_size:${maxHandSize}`,
      `projected_hand_after_draw:${projectedHandAfterDraw}`,
      `projected_hand_after_draw_and_install:${projectedHandAfterDrawAndInstall}`,
    ],
  };
}

type CorpScoreDefenseEffectSuitableIceDensity = Readonly<{
  confidence: "deck_snapshot" | "unknown";
  remainingDeckCount: number;
  remainingSuitableIceCount?: number;
  remainingSuitableIceDensity?: number;
  suitableDefinitionIds: readonly string[];
  evidence: readonly string[];
}>;

type DecisionInputWithOptionalDeckSnapshot = AiDecisionInput & {
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

function corpScoreDefenseEffectSuitableIceDensity(
  input: AiDecisionInput,
  need: CorpFundedRemoteAccessRiskNeed,
): CorpScoreDefenseEffectSuitableIceDensity {
  const remainingDeckCount = input.playerView.own.stackOrRdCount;
  const snapshot = (input as DecisionInputWithOptionalDeckSnapshot)
    .ownDeckSnapshot;
  if (
    snapshot?.side !== "corp" ||
    !positiveSafeInteger(remainingDeckCount) ||
    (need.baseline.knowledge === "unknown" &&
      need.baseline.unknownReason !== "subset_assessment_unknown") ||
    !Array.isArray(input.playerView.opponent.rig)
  ) {
    return unknownScoreDefenseDensity(
      remainingDeckCount,
      "missing_or_invalid_deck_snapshot",
    );
  }
  const selectedIceInstanceIds = new Set(
    need.baseline.knowledge === "known"
      ? need.baseline.selectedRezCosts.map((cost) => cost.iceInstanceId)
      : [],
  );
  const currentServer = input.playerView.servers.find(
    (server) => server.id === need.targetServerId,
  );
  const currentFundedIce: CorpScoreProtectionIceInput[] = (
    currentServer?.ice ?? []
  ).map((card) => ({
    instanceId: card.instanceId,
    known: card.known,
    ...(card.definitionId ? { definitionId: card.definitionId } : {}),
    rezzed: card.rezzed === true || selectedIceInstanceIds.has(card.instanceId),
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    ...(card.subtypes !== undefined ? { subtypes: card.subtypes } : {}),
    ...(card.effectiveRunQuote
      ? { effectiveRunQuote: card.effectiveRunQuote }
      : {}),
  }));
  const outsideByDefinitionId = visibleCorpCardsOutsideRdByDefinition(input);
  let remainingSuitableIceCount = 0;
  const suitableDefinitionIds: string[] = [];
  for (const entry of snapshot.cards) {
    if (!nonNegativeSafeInteger(entry.quantity)) {
      return unknownScoreDefenseDensity(
        remainingDeckCount,
        "invalid_deck_snapshot_quantity",
      );
    }
    const remainingCopies = Math.max(
      0,
      entry.quantity - (outsideByDefinitionId.get(entry.cardId) ?? 0),
    );
    if (remainingCopies === 0) continue;
    const resolvedDefinitionId = resolvedEngineDefinitionId(entry.cardId);
    if (!resolvedDefinitionId) continue;
    const definition = CARD_DEFINITIONS_BY_ID[resolvedDefinitionId];
    if (definition?.type !== "ice") continue;
    if (need.baseline.knowledge === "unknown") {
      if (!definition.mechanics?.includes("end_the_run")) continue;
      remainingSuitableIceCount += remainingCopies;
      suitableDefinitionIds.push(entry.cardId);
      continue;
    }
    const after = assessCorpScoreProtection({
      serverIce: [
        ...currentFundedIce,
        {
          instanceId: `deck-effect-projection:${entry.cardId}`,
          known: true,
          definitionId: resolvedDefinitionId,
          rezzed: true,
          ...(definition.strength !== undefined
            ? { strength: definition.strength }
            : {}),
          ...(definition.subtypes !== undefined
            ? { subtypes: definition.subtypes }
            : {}),
        },
      ],
      runnerRig: input.playerView.opponent.rig,
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability:
        need.objective.maximumRunnerAccessSuccessProbability,
    });
    if (
      after.knowledge !== "known" ||
      compareExactProbabilities(
        after.runnerAccessSuccessProbability,
        need.baseline.protection.runnerAccessSuccessProbability,
      ) !== -1
    ) {
      continue;
    }
    remainingSuitableIceCount += remainingCopies;
    suitableDefinitionIds.push(entry.cardId);
  }
  const boundedSuitableIceCount = Math.min(
    remainingDeckCount,
    remainingSuitableIceCount,
  );
  const density = boundedSuitableIceCount / remainingDeckCount;
  const uniqueSuitableDefinitionIds = [
    ...new Set(suitableDefinitionIds),
  ].sort();
  return {
    confidence: "deck_snapshot",
    remainingDeckCount,
    remainingSuitableIceCount: boundedSuitableIceCount,
    remainingSuitableIceDensity: density,
    suitableDefinitionIds: uniqueSuitableDefinitionIds,
    evidence: [
      "score_defense_effect_density_confidence:deck_snapshot",
      `score_defense_effect_density_basis:${
        need.baseline.knowledge === "known"
          ? "exact_access_probability_reduction"
          : "known_end_the_run_ice_under_subset_unknown"
      }`,
      `remaining_deck_count:${remainingDeckCount}`,
      `remaining_score_defense_effect_suitable_ice_count:${boundedSuitableIceCount}`,
      `remaining_score_defense_effect_suitable_ice_density:${density.toFixed(4)}`,
      `remaining_score_defense_effect_suitable_ice_definitions:${uniqueSuitableDefinitionIds.join(",") || "none"}`,
      "score_defense_effect_density_uses_printed_rez_cost:false",
    ],
  };
}

function unknownScoreDefenseDensity(
  remainingDeckCount: number,
  reason: string,
): CorpScoreDefenseEffectSuitableIceDensity {
  return {
    confidence: "unknown",
    remainingDeckCount,
    suitableDefinitionIds: [],
    evidence: [
      "score_defense_effect_density_confidence:unknown",
      `score_defense_effect_density_unknown_reason:${reason}`,
    ],
  };
}

function resolvedEngineDefinitionId(definitionId: string): string | undefined {
  if (CARD_DEFINITIONS_BY_ID[definitionId]) return definitionId;
  const engineCardId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return engineCardId && CARD_DEFINITIONS_BY_ID[engineCardId]
    ? engineCardId
    : undefined;
}

function visibleCorpCardsOutsideRdByDefinition(
  input: AiDecisionInput,
): Map<string, number> {
  const visibleCards: VisibleCard[] = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ].filter((card) => card.known !== false);
  const uniqueCards = new Map(
    visibleCards.map((card) => [card.instanceId, card]),
  );
  const counts = new Map<string, number>();
  for (const card of uniqueCards.values()) {
    if (!card.definitionId) continue;
    counts.set(card.definitionId, (counts.get(card.definitionId) ?? 0) + 1);
  }
  return counts;
}

function exactLegalActionDrawCount(action: LegalAction): number | undefined {
  for (const key of ["drawCardsAmount", "drawAmount", "drawCount"] as const) {
    const value = action.payload?.[key];
    if (positiveSafeInteger(value)) return value;
    if (value !== undefined) return undefined;
  }
  return action.type === "draw_card" && action.source === "basic_action"
    ? 1
    : undefined;
}

function positiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function exactLegalActionClickCost(action: LegalAction): number | undefined {
  let clickCost = 0;
  for (const cost of action.costs) {
    const value = cost.clicks ?? 0;
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      return undefined;
    }
    clickCost += value;
  }
  return Number.isSafeInteger(clickCost) ? clickCost : undefined;
}

export function corpOptionalDrawAttemptedInEventTailThisTurn(
  input: AiDecisionInput,
): boolean {
  const eventTail = input.eventTail ?? [];
  let latestMandatoryDrawIndex = -1;
  for (let index = eventTail.length - 1; index >= 0; index -= 1) {
    const event = eventTail[index]!;
    if (
      event.type === "mandatory_draw" &&
      event.publicPayload?.actor === "corp"
    ) {
      latestMandatoryDrawIndex = index;
      break;
    }
  }
  if (latestMandatoryDrawIndex < 0) return false;
  return eventTail
    .slice(latestMandatoryDrawIndex + 1)
    .some(
      (event) =>
        event.type === "draw_card" && event.publicPayload?.actor === "corp",
    );
}

export function corpOptionalDrawCapacity(
  input: AiDecisionInput,
  action: LegalAction,
): CorpOptionalDrawCapacity {
  const handCount = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(
    0,
    Math.floor(input.playerView.own.maxHandSize ?? 5),
  );
  const projectedDrawCount = corpProjectedDrawCount(action);
  const freeSlotsBefore = Math.max(0, maxHandSize - handCount);
  const freeSlotsAfter = freeSlotsBefore - projectedDrawCount;
  return {
    eligible: maxHandSize > 2 && projectedDrawCount > 0 && freeSlotsAfter >= 0,
    handCount,
    maxHandSize,
    projectedDrawCount,
    freeSlotsBefore,
    freeSlotsAfter,
  };
}

export function corpQuantitativeDrawScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent[] {
  const projectedDrawCount = corpProjectedDrawCount(action);
  if (projectedDrawCount <= 0) return [];
  const handCount = input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(
    0,
    Math.floor(input.playerView.own.maxHandSize ?? 5),
  );
  const overflowCount = Math.max(
    0,
    handCount + projectedDrawCount - maxHandSize,
  );
  const evidence = [
    `projected_draw_count:${projectedDrawCount}`,
    `hand_count:${handCount}`,
    `max_hand_size:${maxHandSize}`,
    `projected_overflow_count:${overflowCount}`,
    `rd_count:${input.playerView.own.stackOrRdCount}`,
  ].join("|");
  return [
    {
      key: "corp_quantitative_draw_yield",
      label: "Quantitativer Kartenziehertrag",
      value:
        Math.max(0, projectedDrawCount - 1) *
          CORP_ADDITIONAL_DRAW_VALUE_PER_CARD +
        Math.max(0, projectedDrawCount - 1) *
          CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD,
      reason: [
        evidence,
        "single_draw_value_owned_by_contextual_draw_components:true",
        `multi_draw_action_efficiency:${Math.max(0, projectedDrawCount - 1) * CORP_MULTI_DRAW_ACTION_EFFICIENCY_PER_EXTRA_CARD}`,
      ].join("|"),
    },
    ...(overflowCount > 0
      ? [
          {
            key: "corp_draw_overflow_penalty",
            label: "Projizierter Handüberlauf",
            value:
              -Math.min(6, overflowCount) * CORP_DRAW_OVERFLOW_PENALTY_PER_CARD,
            reason: evidence,
          },
        ]
      : []),
  ];
}

export function corpOptionalDrawScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  boardTriage?: CorpBoardTriage,
): AiDecisionScoreComponent[] {
  const capacity = corpOptionalDrawCapacity(input, action);
  if (
    !capacity.eligible ||
    corpOptionalDrawWouldDelayProtectedScoreRemote(boardTriage)
  ) {
    return [];
  }
  const evidence = corpOptionalDrawCapacityEvidence(capacity);
  const components: AiDecisionScoreComponent[] = [
    {
      key: "corp_safe_draw_capacity",
      label: "Sichere Draw-Kapazität",
      value: CORP_SAFE_DRAW_CAPACITY_VALUE,
      reason: evidence.join("|"),
    },
  ];
  if (capacity.freeSlotsAfter >= 1) {
    components.push({
      key: "corp_low_hand",
      label: "Handkarten-Bedarf",
      value: CORP_LOW_HAND_VALUE,
      reason: evidence.join("|"),
    });
  }
  const defensiveDraw = corpMissingConcreteDefenseDrawComponent(
    input,
    action,
    capacity,
  );
  if (defensiveDraw) components.push(defensiveDraw);
  return components;
}

function corpOptionalDrawWouldDelayProtectedScoreRemote(
  boardTriage: CorpBoardTriage | undefined,
): boolean {
  if (boardTriage?.primary !== "protect_score_remote") return false;
  if (boardTriage.severity !== "high" && boardTriage.severity !== "critical") {
    return false;
  }
  return boardTriage.scoreRemoteServerId?.startsWith("remote_") === true;
}

export function corpMissingConcreteDefenseDrawComponent(
  input: AiDecisionInput,
  action: LegalAction,
  capacity = corpOptionalDrawCapacity(input, action),
  centralAllocation?: CorpCentralDefenseAllocation,
): AiDecisionScoreComponent | undefined {
  const need = corpMissingConcreteDefenseDrawNeed(
    input,
    action,
    capacity,
    centralAllocation,
  );
  if (!need) return undefined;
  return {
    key: "corp_missing_concrete_defense_draw",
    label: "Fehlende zentrale ICE-Verteidigung",
    value: CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE,
    reason: need.evidence.join("|"),
  };
}

export function corpMissingConcreteDefenseDrawNeed(
  input: AiDecisionInput,
  action: LegalAction,
  capacity = corpOptionalDrawCapacity(input, action),
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpMissingConcreteDefenseDrawNeed | undefined {
  const boundedOverflowSearch =
    capacity.maxHandSize > 2 &&
    capacity.projectedDrawCount === 1 &&
    capacity.handCount <= capacity.maxHandSize + 1;
  if (!capacity.eligible && !boundedOverflowSearch) return undefined;
  if (input.playerView.own.stackOrRdCount <= 1) return undefined;
  const deckDensity = buildCorpIceDensityProfile(input);
  if (
    deckDensity.confidence !== "deck_snapshot" ||
    deckDensity.remainingIceCount === undefined ||
    deckDensity.remainingIceCount === 0
  ) {
    return undefined;
  }
  const target = corpMissingConcreteCentralDefenseTarget(
    input,
    centralAllocation,
  );
  if (!target) return undefined;
  return {
    serverId: target.serverId,
    planValue: 1_000 + CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE,
    evidence: [
      `target_server:${target.serverId}`,
      "target_ice_count:0",
      "concrete_install_available:false",
      ...target.evidence,
      ...deckDensity.evidence,
      ...corpOptionalDrawCapacityEvidence(capacity),
      `central_defense_bounded_overflow_search:${boundedOverflowSearch}`,
    ],
  };
}

function corpMissingConcreteCentralDefenseTarget(
  input: AiDecisionInput,
  allocation: CorpCentralDefenseAllocation | undefined,
):
  | {
      serverId: "hq" | "rd";
      evidence: string[];
    }
  | undefined {
  if (allocation?.status !== "known") return undefined;
  const serverId = allocation.selectedServerId;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const facts = allocation.evidence[serverId];
  const pressureActive =
    facts.threat !== "none" ||
    facts.expectedAgendaLoss.numerator > 0 ||
    facts.expectedTrashableLoss.numerator > 0 ||
    facts.isMultiaccess ||
    facts.recentRunOrAccessEvents > 0 ||
    facts.recentSuccessfulAccessRunnerTurns > 0 ||
    facts.serverBoundEffectIds.length > 0;
  if (
    !pressureActive ||
    !server ||
    server.ice.length !== 0 ||
    corpConcreteCentralIceInstallAvailable(input, serverId)
  ) {
    return undefined;
  }
  return {
    serverId,
    evidence: [
      "central_defense_allocation_known:true",
      `central_defense_selected_server:${serverId}`,
      `central_defense_threat:${facts.threat}`,
      `central_defense_expected_agenda_loss:${facts.expectedAgendaLoss.numerator}/${facts.expectedAgendaLoss.denominator}`,
      `central_defense_expected_trashable_loss:${facts.expectedTrashableLoss.numerator}/${facts.expectedTrashableLoss.denominator}`,
      `central_defense_multiaccess:${facts.isMultiaccess}`,
      `central_defense_recent_pressure:${facts.recentRunOrAccessEvents}`,
      ...facts.serverBoundEffectIds.map(
        (effectId) => `central_defense_server_effect:${effectId}`,
      ),
    ],
  };
}

function corpConcreteCentralIceInstallAvailable(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
): boolean {
  return input.legalActions.some(
    (action) =>
      action.type === "install_card" &&
      action.payload?.placement === "ice" &&
      corpActionServerId(action) === serverId,
  );
}

function corpActionServerId(action: LegalAction): string | undefined {
  const value =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof value === "string" ? value : undefined;
}

export function corpProjectedDrawCount(action: LegalAction): number {
  for (const key of ["drawCardsAmount", "drawAmount", "drawCount"] as const) {
    const value = action.payload?.[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.max(1, Math.floor(value));
    }
  }
  return action.type === "draw_card" ? 1 : 0;
}

function corpOptionalDrawCapacityEvidence(
  capacity: CorpOptionalDrawCapacity,
): string[] {
  return [
    `hand_count:${capacity.handCount}`,
    `max_hand_size:${capacity.maxHandSize}`,
    `projected_draw_count:${capacity.projectedDrawCount}`,
    `free_slots_before:${capacity.freeSlotsBefore}`,
    `free_slots_after:${capacity.freeSlotsAfter}`,
  ];
}
