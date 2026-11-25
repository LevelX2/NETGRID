import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { buildCorpIceDensityProfile } from "./corp-ice-density";
import { corpScoreDefenseEffectSuitableIceDensity } from "./corp-score-defense-draw-density";
import type { CorpFundedRemoteAccessRiskNeed } from "../corp-funded-score-protection";
import type { CorpCentralDefenseAllocation } from "../../corp/defense/corp-central-defense-allocation";
import type { CorpRestrictedRezPreparation } from "../corp-restricted-credit-reserve";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
} from "../corp-score-protection-assessment";

const CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE = 250;
const CORP_FULL_ACCESS_PROBABILITY = { numerator: 1, denominator: 1 } as const;

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
  urgent: boolean;
  centralPressure: "material" | "acute" | "terminal";
  cleanupReplacementDraw?: boolean;
  evidence: string[];
};

export type CorpCentralDefenseDirectInstallRouteState =
  | Readonly<{
      knowledge: "known";
      disposition: "effect_capable" | "effect_missing";
    }>
  | Readonly<{
      knowledge: "unknown";
    }>;

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
  deterministicParentContinuationActionId?: string;
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
    protectionNeed.baseline.knowledge !== "known" ||
    protectionNeed.baseline.fundedProtection ||
    directInstallRouteState.knowledge !== "known" ||
    directInstallRouteState.disposition !== "effect_missing" ||
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
  const deterministicParentContinuation =
    args.deterministicParentContinuationActionId === undefined
      ? undefined
      : input.legalActions.find(
          (candidate) =>
            candidate.actionId ===
              args.deterministicParentContinuationActionId &&
            candidate.side === "corp" &&
            candidate.type === "advance_card" &&
            candidate.expiresAtStateVersion === stateVersion,
        );
  if (
    deterministicParentContinuation &&
    clicks <= drawActionProjection.clickCost + hardClickReserve
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
  const targetServer = input.playerView.servers.find(
    (server) => server.id === protectionNeed.targetServerId,
  );
  const exposedAgendaParent =
    targetServer?.root.some(
      (card) => card.known === true && card.type === "agenda",
    ) === true;
  const safeMultiTurnProgressAvailable =
    !exposedAgendaParent &&
    hardClickReserve === 0 &&
    clicks >= drawActionProjection.clickCost &&
    input.playerView.own.credits >=
      protectionNeed.baseline.totalScoreReserveCredits &&
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
      "funded_protection_baseline:known_unprotected",
      "direct_install_route_disposition:effect_missing",
      `score_defense_exposed_agenda_parent:${exposedAgendaParent}`,
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

function latestCorpMandatoryDrawIndex(input: AiDecisionInput): number {
  const eventTail = input.eventTail ?? [];
  for (let index = eventTail.length - 1; index >= 0; index -= 1) {
    const event = eventTail[index]!;
    if (event.type === "mandatory_draw" && event.publicPayload?.actor === "corp")
      return index;
  }
  return -1;
}

export function corpOptionalStartDrawTakenInEventTailThisTurn(
  input: AiDecisionInput,
): boolean {
  const mandatoryDraw = input.eventTail?.[latestCorpMandatoryDrawIndex(input)];
  return positiveSafeInteger(
    mandatoryDraw?.publicPayload?.corpMandatoryOptionalAgendaCardCount,
  );
}

export function corpOptionalDrawAttemptedInEventTailThisTurn(
  input: AiDecisionInput,
): boolean {
  const eventTail = input.eventTail ?? [];
  const latestMandatoryDrawIndex = latestCorpMandatoryDrawIndex(input);
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
  const maxHandSize = input.playerView.own.maxHandSize;
  const projectedDrawCount = corpProjectedDrawCount(action);
  const freeSlotsBefore = Math.max(0, maxHandSize - handCount);
  const netHandDelta =
    projectedDrawCount > 0 ? projectedDrawHandDelta(action) : undefined;
  const freeSlotsAfter = maxHandSize - handCount - (netHandDelta ?? 0);
  return {
    eligible:
      nonNegativeSafeInteger(maxHandSize) &&
      maxHandSize > 2 &&
      netHandDelta !== undefined &&
      freeSlotsAfter >= 0,
    handCount,
    maxHandSize,
    projectedDrawCount,
    freeSlotsBefore,
    freeSlotsAfter,
  };
}

export function corpMissingConcreteDefenseDrawNeed(
  input: AiDecisionInput,
  action: LegalAction,
  capacity = corpOptionalDrawCapacity(input, action),
  centralAllocation?: CorpCentralDefenseAllocation,
  directInstallRouteState?: CorpCentralDefenseDirectInstallRouteState,
  installedRezPreparations: readonly CorpRestrictedRezPreparation[] = [],
): CorpMissingConcreteDefenseDrawNeed | undefined {
  const boundedOverflowSearch =
    capacity.maxHandSize > 2 &&
    capacity.projectedDrawCount > 0 &&
    projectedDrawHandDelta(action) === 1 &&
    capacity.handCount <= capacity.maxHandSize + 1;
  if (!capacity.eligible && !boundedOverflowSearch) return undefined;
  const followupCapacity = corpPostDrawDefenseFollowupCapacity(input, action);
  if (!followupCapacity) return undefined;
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
    directInstallRouteState,
  );
  if (!target) return undefined;
  // Missing current liquidity does not imply missing ICE. A current, exactly
  // bound preparation for an already installed blocker needs no speculative
  // draw. Unknown or ineffective projected protection does not suppress draw.
  const server = input.playerView.servers.find(
    (entry) => entry.id === target.serverId,
  )!;
  const basicFunding = input.legalActions.find(
    (head) =>
      head.side === "corp" &&
      head.type === "gain_credit" &&
      head.source === "basic_action" &&
      head.expiresAtStateVersion === input.playerView.stateVersion &&
      head.payload?.effectKind === "gain_credits" &&
      positiveSafeInteger(head.payload.gainCreditsAmount) &&
      exactLegalActionClickCost(head) !== undefined &&
      exactLegalActionClickCost(head)! > 0 &&
      head.costs.every((cost) =>
        Object.entries(cost).every(
          ([key, value]) => key === "clicks" || value === 0,
        ),
      ),
  );
  if (basicFunding) {
    const availableAfterFunding =
      input.playerView.own.credits +
      Math.floor(
        input.playerView.own.clicks / exactLegalActionClickCost(basicFunding)!,
      ) *
        (basicFunding.payload!.gainCreditsAmount as number);
    for (const ice of server.ice) {
      const quote = ice.effectiveRezCostQuote;
      if (
        ice.rezzed ||
        !quote?.complete ||
        quote.context !== "installed" ||
        quote.cardId !== ice.instanceId ||
        quote.targetServerId !== server.id ||
        quote.projectedServerId !== server.id ||
        quote.expiresAtStateVersion !== input.playerView.stateVersion ||
        quote.mandatoryAdditionalCosts.agendaPoints !== 0 ||
        !nonNegativeSafeInteger(quote.finalCredits) ||
        quote.finalCredits > availableAfterFunding
      )
        continue;
      const projectedProtection = assessCorpScoreProtection({
        serverIce: server.ice.map((card) =>
          card.instanceId === ice.instanceId ? { ...card, rezzed: true } : card,
        ),
        runnerRig: input.playerView.opponent.rig!,
        runnerCredits: input.playerView.opponent.credits,
        maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
      });
      if (
        projectedProtection.knowledge === "known" &&
        projectedProtection.protectsScore
      )
        return undefined;
    }
  }
  for (const preparation of installedRezPreparations) {
    if (
      preparation.targetServerId !== target.serverId ||
      preparation.bank.expiresAtStateVersion !==
        input.playerView.stateVersion ||
      !input.legalActions.some(
        (head) =>
          head.actionId === preparation.actionId &&
          head.source === preparation.bank.sourceCardInstanceId,
      ) ||
      !server.ice.some(
        (ice) => ice.instanceId === preparation.targetIceInstanceId,
      )
    )
      continue;
    const projectedProtection = assessCorpScoreProtection({
      serverIce: server.ice.map((ice) =>
        ice.instanceId === preparation.targetIceInstanceId
          ? { ...ice, rezzed: true }
          : ice,
      ),
      runnerRig: input.playerView.opponent.rig!,
      runnerCredits: input.playerView.opponent.credits,
      maximumRunnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
    });
    if (
      projectedProtection.knowledge === "known" &&
      projectedProtection.protectsScore
    )
      return undefined;
  }
  return {
    serverId: target.serverId,
    planValue: 1_000 + CORP_MISSING_CONCRETE_DEFENSE_DRAW_VALUE,
    urgent: target.centralPressure === "terminal",
    centralPressure: target.centralPressure,
    evidence: [
      `target_server:${target.serverId}`,
      `target_ice_count:${target.iceCount}`,
      "current_central_protection_effect:access_probability_unchanged",
      "effect_capable_concrete_install_available:false",
      ...target.evidence,
      ...deckDensity.evidence,
      ...corpOptionalDrawCapacityEvidence(capacity),
      `central_defense_draw_click_cost:${followupCapacity.drawClickCost}`,
      `central_defense_post_draw_action_capacity:${followupCapacity.remainingActionCapacity}`,
      "central_defense_required_followup_action_capacity:1",
      `central_defense_bounded_overflow_search:${boundedOverflowSearch}`,
    ],
  };
}

function corpPostDrawDefenseFollowupCapacity(
  input: AiDecisionInput,
  action: LegalAction,
):
  | {
      drawClickCost: number;
      remainingActionCapacity: number;
    }
  | undefined {
  const currentClicks = input.playerView.own.clicks;
  const drawClickCost = exactLegalActionClickCost(action);
  if (
    !nonNegativeSafeInteger(currentClicks) ||
    drawClickCost === undefined ||
    drawClickCost > currentClicks
  ) {
    return undefined;
  }
  const remainingActionCapacity = currentClicks - drawClickCost;
  return remainingActionCapacity >= 1
    ? { drawClickCost, remainingActionCapacity }
    : undefined;
}

function corpMissingConcreteCentralDefenseTarget(
  input: AiDecisionInput,
  allocation: CorpCentralDefenseAllocation | undefined,
  directInstallRouteState:
    | CorpCentralDefenseDirectInstallRouteState
    | undefined,
):
  | {
      serverId: "hq" | "rd";
      iceCount: number;
      centralPressure: "material" | "acute" | "terminal";
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
    !Array.isArray(input.playerView.opponent.rig) ||
    directInstallRouteState?.knowledge !== "known" ||
    directInstallRouteState.disposition !== "effect_missing"
  ) {
    return undefined;
  }
  const currentProtection = assessCorpScoreProtection({
    serverIce: server.ice,
    runnerRig: input.playerView.opponent.rig,
    runnerCredits: input.playerView.opponent.credits,
    maximumRunnerAccessSuccessProbability: CORP_FULL_ACCESS_PROBABILITY,
  });
  if (
    currentProtection.knowledge !== "known" ||
    compareExactProbabilities(
      currentProtection.runnerAccessSuccessProbability,
      CORP_FULL_ACCESS_PROBABILITY,
    ) !== 0
  ) {
    return undefined;
  }
  return {
    serverId,
    iceCount: server.ice.length,
    centralPressure: facts.threat === "none" ? "material" : facts.threat,
    evidence: [
      "central_defense_allocation_known:true",
      `central_defense_selected_server:${serverId}`,
      `central_defense_threat:${facts.threat}`,
      `central_defense_expected_agenda_loss:${facts.expectedAgendaLoss.numerator}/${facts.expectedAgendaLoss.denominator}`,
      `central_defense_expected_trashable_loss:${facts.expectedTrashableLoss.numerator}/${facts.expectedTrashableLoss.denominator}`,
      `central_defense_multiaccess:${facts.isMultiaccess}`,
      `central_defense_recent_pressure:${facts.recentRunOrAccessEvents}`,
      `central_defense_current_access_probability:${currentProtection.runnerAccessSuccessProbability.numerator}/${currentProtection.runnerAccessSuccessProbability.denominator}`,
      `central_defense_direct_install_disposition:${directInstallRouteState.disposition}`,
      ...facts.serverBoundEffectIds.map(
        (effectId) => `central_defense_server_effect:${effectId}`,
      ),
    ],
  };
}

export function corpProjectedDrawCount(action: LegalAction): number {
  return exactLegalActionDrawCount(action) ?? 0;
}

function projectedDrawHandDelta(action: LegalAction): number | undefined {
  // Reuse the action projection's source consumption and zone-transition facts.
  // Gross draws still govern deck consumption; only net hand growth needs slots.
  const [candidate] = buildActionSemanticCandidates({ legalActions: [action] });
  return candidate?.economyProjection?.netHandDelta;
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
