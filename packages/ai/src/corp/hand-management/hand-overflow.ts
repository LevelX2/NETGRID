import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";

import { isQuotedCorpCounterBankInHq } from "../score/corp-counter-bank-score-plan";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type PlanSchedulerResult } from "../../plans/plan-scheduler";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { corpReservedScoreServerIds } from "../../runtime/corp-scoreline/score-hand-support";
import { technicalIdCompare, turnKey } from "../../runtime/runtime-identifiers";
import { candidateTargetIds } from "../../runtime/visible-action-facts";

export function bindSelectedCorpHqOverflowConversion(
  input: AiDecisionInput,
  result: PlanSchedulerResult,
): void {
  if (
    result.lane !== "plan" ||
    result.portfolio.executorInstanceId === undefined
  ) {
    return;
  }
  const executor = result.portfolio.instances.find(
    (instance) =>
      instance.instanceId === result.portfolio.executorInstanceId &&
      instance.moduleId === "corp.hand_and_agenda_management",
  );
  const moduleState = executor?.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  const state = signal?.overflowResolutionState;
  if (
    !executor ||
    moduleState?.kind !== "hand" ||
    signal?.handPlanId !== `resolve-hq-overflow:${turnKey(input)}` ||
    signal.phase !== "resolve_hq_overflow" ||
    !state ||
    signal.actionIds?.includes(result.route.head.actionId) !== true
  ) {
    return;
  }
  const validState =
    state.turnKey === turnKey(input) &&
    Number.isSafeInteger(state.initialOverflowCount) &&
    state.initialOverflowCount > 0 &&
    Number.isSafeInteger(state.maximumConversions) &&
    state.maximumConversions > 0 &&
    state.maximumConversions <= state.initialOverflowCount &&
    Number.isSafeInteger(state.remainingConversions) &&
    state.remainingConversions > 0 &&
    state.remainingConversions <= state.maximumConversions &&
    (state.selectedAtStateVersion === undefined ||
      state.selectedAtStateVersion < input.playerView.stateVersion);
  if (!validState) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: executor.instanceId,
      stepId: result.route.head.stepId,
      removalCondition:
        "Bind HQ-overflow conversion only from a finite positive receipt whose remaining count does not exceed its admitted maximum.",
    });
  }
  signal.overflowResolutionState = {
    ...state,
    remainingConversions: state.remainingConversions - 1,
    selectedAtStateVersion: input.playerView.stateVersion,
    expectedOverflowAfterSelectedConversion: Math.max(
      0,
      signal.handSize - signal.maximumHandSize - 1,
    ),
  };
}

export function corpHandSignalMatchesCandidate(
  signal: CorpPlanDomain["handManagement"][number],
  candidate: ActionSemanticCandidate,
): boolean {
  if (signal.actionIds !== undefined) {
    return signal.actionIds.includes(candidate.actionId);
  }
  return (
    signal.sourceDefinitionIds?.includes(candidate.sourceDefinitionId ?? "") ===
      true &&
    (!signal.sourceInstanceId ||
      signal.sourceInstanceId === candidate.sourceCardInstanceId)
  );
}

export function corpDrawCandidatePreservesHandCapacity(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    candidate.semanticActionType === "draw.card" &&
    candidate.sourceKind === "basic_action"
  ) {
    return (
      input.playerView.own.gripOrHq.length + 1 <=
      input.playerView.own.maxHandSize
    );
  }
  const netHandDelta = candidate.economyProjection?.netHandDelta;
  return (
    typeof netHandDelta === "number" &&
    Number.isFinite(netHandDelta) &&
    input.playerView.own.gripOrHq.length + netHandDelta <=
      input.playerView.own.maxHandSize
  );
}

export function corpExactOverflowHandConversionPlanOwnsCandidate(
  domain: CorpPlanDomain,
  candidate: ActionSemanticCandidate,
): boolean {
  return domain.handManagement.some(
    (signal) =>
      signal.routeAllowed !== false &&
      signal.exactActionRoute === true &&
      signal.phase === "resolve_hq_overflow" &&
      signal.overflowResolutionState !== undefined &&
      signal.overflowResolutionState.remainingConversions > 0 &&
      signal.actionIds?.includes(candidate.actionId) === true,
  );
}

export function corpHqOverflowResolutionSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
  previous: ResidentPlanPortfolio | undefined,
  developmentSignals: readonly CorpPlanDomain["handManagement"][number][],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpPlanDomain["handManagement"][number] | undefined {
  const handSize = input.playerView.own.gripOrHq.length;
  const maximumHandSize = input.playerView.own.maxHandSize;
  const remainingClicks = input.playerView.own.clicks;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    !Number.isSafeInteger(handSize) ||
    !Number.isSafeInteger(maximumHandSize) ||
    maximumHandSize < 0 ||
    !Number.isSafeInteger(remainingClicks) ||
    remainingClicks <= 0
  ) {
    return undefined;
  }
  const overflowCount = handSize - maximumHandSize;
  if (!Number.isSafeInteger(overflowCount) || overflowCount <= 0) {
    return undefined;
  }
  const reservedScoreServerIds = corpReservedScoreServerIds(
    input,
    scoreProjects,
  );
  const admissible = developmentSignals
    .filter(
      (signal) =>
        signal.phase === "develop_card" && signal.routeAllowed !== false,
    )
    .flatMap((signal) =>
      candidates
        .filter(
          (candidate) =>
            corpHandSignalMatchesCandidate(signal, candidate) &&
            corpHqOverflowCandidateIsExactCurrentConversion(
              input,
              candidate,
              reservedScoreServerIds,
            ),
        )
        .map((candidate) => ({
          candidate,
          priority: signal.value,
        })),
    )
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        technicalIdCompare(left.candidate.actionId, right.candidate.actionId),
    );
  if (admissible.length === 0) return undefined;
  const actionIds = [
    ...new Set(admissible.map(({ candidate }) => candidate.actionId)),
  ];
  const eligibleSourceCount = new Set(
    admissible.map(({ candidate }) => candidate.sourceCardInstanceId),
  ).size;
  const receipt = corpResidentHqOverflowResolution(previous, input);
  const reactivatedOverflowCount =
    receipt?.remainingConversions === 0 &&
    receipt.selectedAtStateVersion !== undefined &&
    receipt.selectedAtStateVersion < input.playerView.stateVersion &&
    receipt.expectedOverflowAfterSelectedConversion !== undefined &&
    overflowCount > receipt.expectedOverflowAfterSelectedConversion
      ? overflowCount - receipt.expectedOverflowAfterSelectedConversion
      : undefined;
  const initialOverflowCount =
    reactivatedOverflowCount ?? receipt?.initialOverflowCount ?? overflowCount;
  const maximumConversions =
    reactivatedOverflowCount !== undefined
      ? Math.min(
          reactivatedOverflowCount,
          input.playerView.own.clicks,
          eligibleSourceCount,
        )
      : (receipt?.maximumConversions ??
        Math.min(
          initialOverflowCount,
          input.playerView.own.clicks,
          eligibleSourceCount,
        ));
  // The receipt records this owner's unspent conversion budget. An unrelated
  // score/economy action can reduce current hand overflow or remaining clicks,
  // but cannot consume an HQ-overflow head that was never selected.
  const remainingConversions =
    reactivatedOverflowCount !== undefined
      ? maximumConversions
      : (receipt?.remainingConversions ?? maximumConversions);
  const currentlyAvailableConversions = Math.min(
    overflowCount,
    input.playerView.own.clicks,
    eligibleSourceCount,
    remainingConversions,
  );
  if (maximumConversions <= 0 || currentlyAvailableConversions <= 0)
    return undefined;
  return {
    handPlanId: `resolve-hq-overflow:${turnKey(input)}`,
    phase: "resolve_hq_overflow",
    agendaCount,
    handSize: input.playerView.own.gripOrHq.length,
    maximumHandSize: input.playerView.own.maxHandSize,
    actionIds,
    actionPriorityOrder: actionIds,
    exactActionRoute: true,
    concretePurposeCode:
      "Reduce the known Corp HQ overflow through one exact current non-agenda hand conversion, then observe and revalidate.",
    priorityClass: "P5",
    overflowResolutionState: {
      turnKey: turnKey(input),
      initialOverflowCount,
      maximumConversions,
      remainingConversions,
      ...(reactivatedOverflowCount === undefined &&
      receipt?.selectedAtStateVersion !== undefined &&
      receipt.selectedAtStateVersion < input.playerView.stateVersion
        ? {
            selectedAtStateVersion: receipt.selectedAtStateVersion,
            expectedOverflowAfterSelectedConversion:
              receipt.expectedOverflowAfterSelectedConversion,
          }
        : {}),
    },
    value: 120,
    evidenceCode: `corp_hq_overflow_exact_conversion:${overflowCount}`,
  };
}

export function corpHqOverflowCandidateIsExactCurrentConversion(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  reservedScoreServerIds: ReadonlySet<string> = new Set(),
): boolean {
  if (
    candidate.sourceKind !== "card" ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId ||
    (candidate.actionCapacityProjection !== undefined &&
      candidate.actionCapacityProjection.kind !== "non_action_capacity") ||
    candidate.semanticActionType === "score_conversion.place_advancement" ||
    candidate.semanticActionType === "score_conversion.move_advancement"
  ) {
    return false;
  }
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === candidate.sourceCardInstanceId,
  );
  if (isQuotedCorpCounterBankInHq(input, source)) return false;
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    !source?.known ||
    source.definitionId !== candidate.sourceDefinitionId ||
    !definition ||
    definition.type === "agenda" ||
    action?.side !== "corp" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0
  ) {
    return false;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    totalClicks !== 1 ||
    !Number.isSafeInteger(totalCredits) ||
    totalCredits < 0 ||
    totalCredits > input.playerView.own.credits ||
    candidate.costProfile.clickCost !== totalClicks ||
    (candidate.costProfile.creditCost !== undefined &&
      candidate.costProfile.creditCost !== totalCredits)
  ) {
    return false;
  }
  if (action.type === "play_operation") {
    const projection = candidate.economyProjection;
    return (
      projection?.cardsConsumed === 1 &&
      typeof projection.netHandDelta === "number" &&
      projection.netHandDelta <= -1 &&
      candidate.functionalEffects?.some(
        (effect) =>
          effect.kind === "card_recovery" &&
          effect.timing === "action" &&
          effect.resource === "cards",
      ) !== true
    );
  }
  // Converting an ICE out of HQ may relieve hand pressure, but choosing a
  // server for that ICE is exclusively corp.defend_servers' responsibility.
  // The hand-management plan must never turn a legal install into an
  // unassessed "discard route" for an arbitrary server.
  if (action.type === "install_card" && action.payload?.placement === "ice")
    return false;
  if (
    action.type !== "install_card" ||
    candidate.semanticActionType !== "install.card" ||
    action.payload?.cardId !== candidate.sourceCardInstanceId ||
    typeof action.payload.serverId !== "string" ||
    action.payload.serverId === "new_remote" ||
    reservedScoreServerIds.has(action.payload.serverId) ||
    !input.playerView.servers.some(
      (server) => server.id === action.payload!.serverId,
    ) ||
    (action.payload.placement !== "root" &&
      action.payload.placement !== "ice") ||
    !candidateTargetIds(candidate).includes(action.payload.serverId)
  ) {
    return false;
  }
  return true;
}

export function corpHqOverflowReservedScoreServerDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
): string | undefined {
  if (
    input.playerView.own.gripOrHq.length <= input.playerView.own.maxHandSize ||
    !corpHqOverflowCandidateIsExactCurrentConversion(input, candidate)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const serverId = action?.payload?.serverId;
  return typeof serverId === "string" &&
    corpReservedScoreServerIds(input, scoreProjects).has(serverId)
    ? `corp_hq_overflow_install_rejected_reserved_score_server:${serverId}`
    : undefined;
}

function corpResidentHqOverflowResolution(
  previous: ResidentPlanPortfolio | undefined,
  input: AiDecisionInput,
):
  | {
      initialOverflowCount: number;
      maximumConversions: number;
      remainingConversions: number;
      selectedAtStateVersion?: number;
      expectedOverflowAfterSelectedConversion?: number;
    }
  | undefined {
  const instance = previous?.instances.find(
    (candidate) =>
      candidate.moduleId === "corp.hand_and_agenda_management" &&
      candidate.dedupeKey === `resolve-hq-overflow:${turnKey(input)}`,
  );
  if (!instance) return undefined;
  const moduleState = instance.moduleState as
    | {
        kind?: unknown;
        signal?: CorpPlanDomain["handManagement"][number];
      }
    | undefined;
  const signal = moduleState?.signal;
  const state = signal?.overflowResolutionState;
  const selectedAtStateVersion = state?.selectedAtStateVersion;
  const expectedOverflowAfterSelectedConversion =
    state?.expectedOverflowAfterSelectedConversion;
  const valid =
    moduleState?.kind === "hand" &&
    signal?.phase === "resolve_hq_overflow" &&
    signal.handPlanId === `resolve-hq-overflow:${turnKey(input)}` &&
    state?.turnKey === turnKey(input) &&
    Number.isSafeInteger(state.initialOverflowCount) &&
    state.initialOverflowCount > 0 &&
    Number.isSafeInteger(state.maximumConversions) &&
    state.maximumConversions > 0 &&
    state.maximumConversions <= state.initialOverflowCount &&
    Number.isSafeInteger(state.remainingConversions) &&
    state.remainingConversions >= 0 &&
    state.remainingConversions <= state.maximumConversions &&
    (selectedAtStateVersion === undefined
      ? state.remainingConversions === state.maximumConversions &&
        expectedOverflowAfterSelectedConversion === undefined
      : Number.isSafeInteger(selectedAtStateVersion) &&
        selectedAtStateVersion >= 0 &&
        selectedAtStateVersion <= previous!.stateVersion &&
        state.remainingConversions < state.maximumConversions &&
        Number.isSafeInteger(expectedOverflowAfterSelectedConversion) &&
        expectedOverflowAfterSelectedConversion! >= 0);
  if (!valid) {
    throw new PlanResolutionFailure("invalid_plan_identity", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_registry",
      planInstanceId: instance.instanceId,
      removalCondition:
        "The HQ-overflow plan receipt must preserve its exact Corp turn, initial overflow bound, remaining finite conversions, and selected state after each consumed head.",
    });
  }
  const sameStateRetry =
    selectedAtStateVersion === input.playerView.stateVersion;
  return {
    initialOverflowCount: state!.initialOverflowCount,
    maximumConversions: state!.maximumConversions,
    remainingConversions: sameStateRetry
      ? Math.min(state!.maximumConversions, state!.remainingConversions + 1)
      : state!.remainingConversions,
    ...(selectedAtStateVersion !== undefined ? { selectedAtStateVersion } : {}),
    ...(expectedOverflowAfterSelectedConversion !== undefined
      ? { expectedOverflowAfterSelectedConversion }
      : {}),
  };
}
