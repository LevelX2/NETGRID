import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { AiDecisionInput, VisibleCorpRezCostQuote } from "@netgrid/shared";
import type {
  GuaranteeLevel,
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import { planInstanceIdForProposal } from "./plan-instance";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import type { PlanStepCapability } from "./plan-route";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import { createCreditDemand } from "./credit-demand";
import {
  searchFundingRoutes,
  type FundingRouteSearchResult,
} from "./funding-route";
import {
  compareExactProbabilities,
  type ExactProbability,
} from "../runtime/corp-score-protection-assessment";
import {
  assessBestFundedCorpScoreProtection,
  type CorpFundedRemoteAccessRiskNeed,
  type KnownCorpFundedIceInstallRouteProjection,
} from "../runtime/corp-funded-score-protection";
import type {
  CorpCentralDefenseAllocation,
  CorpCentralDefenseHqHoldCadence,
} from "../runtime/corp-central-defense-allocation";
import type { CorpOpeningRushDecision } from "../runtime/corp-opening-rush";
import {
  exactCorpIceRezRoutesEqual,
  projectExactCorpIceRezRoute,
  type CorpExactIceRezRouteProjection,
} from "../runtime/corp-exact-ice-rez-route";
import { assessFundingOnlyIceStaging } from "../runtime/corp-defense-staging-policy";

export type CorpScorePhase =
  | "select_agenda"
  | "unlock_remote_creation"
  | "install_counter_bank"
  | "advance_counter_bank"
  | "install_agenda_from_counter_bank"
  | "rez_counter_bank_for_handoff"
  | "rez_counter_bank_for_liquidation"
  | "liquidate_counter_bank"
  | "install_agenda"
  | "convert_agenda"
  | "advance_agenda"
  | "score_agenda";

export type CorpScoreProjectSignal = {
  projectId: string;
  agendaDefinitionId?: string;
  agendaPoints: number;
  agendaInstanceId?: string;
  serverId?: string;
  actionIds?: string[];
  routeSemanticActionTypes?: string[];
  phase: CorpScorePhase;
  sameTurnCloseout: boolean;
  deadlinePressure?: boolean;
  protectionNeed?: CorpFundedRemoteAccessRiskNeed;
  uncertainty?: {
    kind: "later_score_route";
    knowledge: "unknown";
    reason: string;
    currentActionScope: "exact_install_only";
  };
  fundingGap?: number;
  conversion?: {
    remainingAdvancementClicks: number;
    remainingScoreCredits: number;
    existingRemoteIceCount: number;
    existingRemoteRezzedIceCount: number;
    residentParent: boolean;
    runnerStealPoints: number;
    runnerStealIsMatchpoint: boolean;
    realizedStrategySupportCount: number;
  };
  /** Exact route selected by corp.score_agenda for a move-counter choice. */
  advancementCounterChoiceBinding?: {
    kind: "move_advancement";
    sourceCardId: string;
    targetCardId: string;
    amount: number;
  };
  /**
   * Published only by corp.score_agenda from an Engine continuation quote.
   * corp.defend_servers may preserve this request but must never reconstruct it.
   */
  continuationReserve?: {
    agendaCardId: string;
    serverId: string;
    requiredCreditsBeforeNextCorpTurn: number;
    remainingAdvancementCounters: number;
    nextCorpTurnGuaranteedFlexibleClicks: number;
    certifiedCreditGainFromFreeClicks: number;
  };
  openingRush?: CorpOpeningRushDecision;
  setupNeed?: {
    needId: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
  };
  /**
   * Narrow, Engine-certified preparation state for an advanceable Corp asset
   * that can later move its own advancement counters to an agenda. This is a
   * score-plan concern, never a generic hand-development or economy route.
   */
  counterBank?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    serverId: string;
    advancementCounters: number;
    counterTarget: number;
    quoteStateVersion: number;
  };
  terminalScore: boolean;
  preventsTerminalSteal?: boolean;
  feasible: boolean;
  evidenceCode: string;
};

export type CorpRemoteProjectSignal = {
  projectId: string;
  sourceDefinitionId: string;
  serverId: string;
  purpose: "scoring_remote" | "economy_remote";
  phase: "install_project" | "protect_project";
  feasible: boolean;
  value: number;
  evidenceCode: string;
};

type CorpDefenseSignalBase = {
  defenseId: string;
  serverId: string;
  evidenceCode: string;
};

export type CorpGenericDefenseSignal = CorpDefenseSignalBase & {
  kind: "generic";
  phase:
    | "install_ice"
    | "install_defense_support"
    | "resolve_install_targets"
    | "resolve_run_redirect"
    | "resolve_post_pass_ice_lifecycle"
    | "draw_for_ice"
    | "fund_rez_reserve"
    | "rez_response"
    | "activate_run_defense"
    | "decline_rez";
  sourceDefinitionIds: string[];
  actionIds?: string[];
  targetIceInstanceId?: string;
  followupIceInstanceId?: string;
  urgent: boolean;
  centralPressure?: "material" | "acute" | "terminal";
  immediateInstallSupport?: boolean;
  rezWindowVerdict?: "productive" | "nonproductive" | "open";
  installRoute?: Readonly<{
    disposition: "productive" | "funding_only";
    progressKind?:
      | "engine_certified_access"
      | "funded_structured_central_defense"
      | "scoreline_central_tax_allocation"
      | "staged_central_defense"
      | "score_material_capacity_release"
      | "agenda_capacity_defense_conversion"
      | "funding_required";
    rezFundingGap?: number;
    projection: KnownCorpFundedIceInstallRouteProjection;
  }>;
  rezReserveNeed?: Readonly<{
    observedAtStateVersion: number;
    currentCredits: number;
    requiredCredits: number;
    fundingGap: number;
  }>;
  rezRoute?: CorpExactIceRezRouteProjection;
  value: number;
  choiceResolution?:
    | {
        kind: "agenda_purge_install_targets";
        choiceId: string;
        sourceAgendaId: string;
        sourceStateVersion: number;
        revealedCardIds: string[];
        targets: Array<{
          cardId: string;
          serverId: string;
          optionId: string;
        }>;
      }
    | {
        kind: "classic_deflector_redirect";
        choiceId: string;
        sourceStateVersion: number;
        runId: string;
        sourceIceInstanceId: string;
        sourceDefinitionId: string;
        subroutineIndex: number;
        subroutineId: string;
        targetProfile: "archives" | "any_data_fort" | "subsidiary_data_fort";
        creditCost: number;
        autoBreakIfNoTarget: boolean;
        selectedOptionId: string;
        disposition: "redirect" | "decline";
        selectedServerId?: string;
      };
  drawAttemptState?: {
    turnKey: string;
    remainingAttempts: 0 | 1;
    selectedAtStateVersion?: number;
  };
};

export type { CorpExactIceRezRouteProjection };

export type CorpScoreProtectionInstallSignal = CorpDefenseSignalBase & {
  kind: "score_protection_install";
  phase: "install_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  effect: "progress" | "satisfied";
  runnerAccessSuccessProbability: ExactProbability;
  totalInstallAndRezCredits: number;
  projection: KnownCorpFundedIceInstallRouteProjection & {
    effect: "progress" | "satisfied";
  };
};

export type CorpScoreProtectionDrawSignal = CorpDefenseSignalBase & {
  kind: "score_protection_draw";
  phase: "draw_for_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  cleanupReplacementDraw?: boolean;
  drawAttemptState: {
    turnKey: string;
    remainingAttempts: 1;
    selectedAtStateVersion?: number;
  };
};

export type CorpScoreProtectionStagingInstallSignal = CorpDefenseSignalBase & {
  kind: "score_protection_staging_install";
  phase: "install_ice";
  parentProjectId: string;
  parentNeedId: string;
  delegatedPriorityClass: CorpScorePriorityClass;
  actionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
};

export type CorpDefenseSignal =
  | CorpGenericDefenseSignal
  | CorpScoreProtectionInstallSignal
  | CorpScoreProtectionStagingInstallSignal
  | CorpScoreProtectionDrawSignal;

type CorpEconomySignalBase = {
  needId: string;
  urgentForScore: boolean;
  evidenceCode: string;
};

export type CorpEconomyFundingRouteAssessment = {
  routeId: string;
  status: FundingRouteSearchResult["bestRoute"]["status"];
  reliability: FundingRouteSearchResult["bestRoute"]["reliability"];
  headActionId?: string;
  evidence: string[];
};

export type CorpEconomyParentFundingSignal = CorpEconomySignalBase & {
  kind: "parent_funding";
  gap: number;
  actionIds: string[];
  delegatedPriorityClass?: CorpScorePriorityClass;
  parentPriorityClass?: PriorityClass;
  immediateDefenseConversion?: boolean;
  parentPlanInstanceId?: string;
  parentNeedId?: string;
  incrementalDefenseReserve?: {
    targetCredits: number;
    serverId: string;
    iceInstanceId: string;
  };
  fundingRouteAssessment?: CorpEconomyFundingRouteAssessment;
};

export type CorpEconomyReserveSignal = CorpEconomySignalBase & {
  kind: "reserve";
  targetCredits: number;
  gap: number;
  actionIds: string[];
  priorityClass?: "P5" | "P6";
  fundingRouteAssessment?: CorpEconomyFundingRouteAssessment;
};

export type CorpEconomyLiquidityDevelopmentSignal = CorpEconomySignalBase & {
  kind: "develop_liquidity";
  turnKey: string;
  targetCredits: number;
  currentCreditsAtRevalidation: number;
  gap: number;
  projectedCreditGain: 1;
  actionIds: [string];
  priorityClass: "P6";
  cadence: {
    kind: "remaining_turn_capacity";
    maximumConversions: number;
  };
  completion: {
    kind: "target_credits_or_no_clicks";
  };
  revalidation: {
    stateVersion: number;
    status: "turn_liquidity_open";
  };
};

export type CorpEconomyDevelopmentSignal = CorpEconomySignalBase & {
  kind: "develop_campaign";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  phase: "install" | "advance" | "rez";
  actionIds: string[];
  cadence: {
    kind:
      | "finite_pool"
      | "automatic_start_of_turn"
      | "immediate_on_rez"
      | "counter_cashout_development";
    maximumSetupExecutions: 1;
  };
  payback: {
    projectedCredits: number;
    setupCreditCost: number;
    projectedNetCredits: number;
    horizonTurns: number;
  };
  completion: {
    kind: "source_phase_reached";
    expectedState:
      | "installed_unrezzed"
      | "advancement_counter_added"
      | "installed_rezzed";
  };
  counterCashout?: {
    currentAdvancementCounters: number;
    targetAdvancementCounters: number;
    creditsPerCounter: number;
    projectedCashoutCredits: number;
  };
};

export type CorpEconomyImmediateOperationSignal = CorpEconomySignalBase & {
  kind: "convert_immediate_operation";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  actionIds: [string];
  conversion: {
    clickCost: number;
    creditCost: number;
    grossLiquidCreditGain: number;
    netLiquidCreditGain: number;
    cardsDrawn: number;
    cardsConsumed: 1;
    netHandDelta: number;
    payoutMode: "fixed";
    reliability: "guaranteed";
    source: "legal_action_payload";
  };
  cadence: {
    kind: "single_action";
    maximumConversions: 1;
  };
  completion: {
    kind: "source_consumed";
  };
};

export type CorpEconomyVisibleCardWithdrawalSignal = CorpEconomySignalBase & {
  kind: "convert_visible_card_payout";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  sourceZone: "installed_root" | "score_area";
  actionIds: [string];
  conversion: {
    clickCost: number;
    creditCost: number;
    grossLiquidCreditGain: number;
    netLiquidCreditGain: number;
    cardsDrawn: 0;
    cardsConsumed: 0;
    netHandDelta: 0;
    payoutMode: "fixed";
    reliability: "guaranteed";
    source: "legal_action_payload";
    payoutSource: "hosted_credit_pool" | "advancement_counter_cashout";
    hostedCreditTakeMode?: "up_to_amount_if_available" | "all";
  };
  cadence: {
    kind: "single_action_revalidate";
    maximumConversions: 1;
  };
  completion: {
    kind: "source_pool_revalidated";
  };
};

export type CorpEconomyOperationThresholdSignal = CorpEconomySignalBase & {
  kind: "prepare_immediate_operation";
  sourceInstanceId: string;
  sourceDefinitionId: string;
  actionIds: [string];
  threshold: {
    currentCredits: number;
    operationCreditCost: number;
    creditsAfterFunding: number;
    fundingGap: 1;
  };
  futureConversion: {
    strategicEconomyValue: number;
    classification: "reviewed_pure_burst_economy_operation";
    evidenceSource: "reviewed_strategic_hint";
  };
  cadence: {
    kind: "single_threshold_credit";
    maximumConversions: 1;
  };
  completion: {
    kind: "operation_becomes_legal";
  };
};

export type CorpEconomyNeedSignal =
  | CorpEconomyParentFundingSignal
  | CorpEconomyReserveSignal
  | CorpEconomyLiquidityDevelopmentSignal
  | CorpEconomyDevelopmentSignal
  | CorpEconomyImmediateOperationSignal
  | CorpEconomyVisibleCardWithdrawalSignal
  | CorpEconomyOperationThresholdSignal;

export type CorpCorePlanDomain = {
  scoreProjects: CorpScoreProjectSignal[];
  remoteProjects: CorpRemoteProjectSignal[];
  defenseNeeds: CorpDefenseSignal[];
  centralDefenseAllocation?: CorpCentralDefenseAllocation;
  centralDefenseHqHoldCadence?: CorpCentralDefenseHqHoldCadence;
  centralDefenseHqHoldSelection?: {
    selectedActionId: string;
    sourceCardInstanceId: string;
    selectedAtStateVersion: number;
    targetServerId: "rd";
  };
  economyNeeds: CorpEconomyNeedSignal[];
};

type ScoreState = { kind: "score"; signal: CorpScoreProjectSignal };
type RemoteState = { kind: "remote"; signal: CorpRemoteProjectSignal };
type DefenseState = {
  kind: "defense";
  signals: CorpDefenseSignal[];
  centralAllocation?: CorpCentralDefenseAllocation;
  hqHoldCadence?: CorpCentralDefenseHqHoldCadence;
  hqHoldSelection?: NonNullable<
    CorpCorePlanDomain["centralDefenseHqHoldSelection"]
  >;
};
type EconomyState = { kind: "economy"; signal: CorpEconomyNeedSignal };

export const CORP_CORE_ACTION_OWNERSHIP = {
  "install.agenda": "corp.score_agenda",
  "score.advance_card": "corp.score_agenda",
  "score.agenda": "corp.score_agenda",
  "install.remote_project": "corp.establish_scoring_remote",
  "install.ice": "corp.defend_servers",
  "economy.gain_credit": "corp.economy",
} as const;

export function createCorpCorePlanModules(): PlanModule[] {
  return [scoreModule(), remoteModule(), defenseModule(), economyModule()];
}

export function corpCoreActionOwner(
  semanticFamily: keyof typeof CORP_CORE_ACTION_OWNERSHIP,
): (typeof CORP_CORE_ACTION_OWNERSHIP)[typeof semanticFamily] {
  return CORP_CORE_ACTION_OWNERSHIP[semanticFamily];
}

export function corpAgendaPurgeDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  centralAllocation: CorpCentralDefenseAllocation | undefined,
): CorpGenericDefenseSignal | undefined {
  const choice = input.playerView.pendingChoice;
  if (
    input.side !== "corp" ||
    choice?.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "hidden_info_barrier" ||
    choice.stateVersion !== input.playerView.stateVersion
  ) {
    return undefined;
  }
  const sourceMatch =
    /^card_implementation\.agenda_purge_install_targets:([^:]+):([^:]+):([0-9]+)$/.exec(
      choice.source,
    );
  const sourceAgendaId = sourceMatch?.[1];
  const revealedCardIds =
    sourceMatch?.[2]?.split(",").filter((cardId) => cardId.length > 0) ?? [];
  const sourceStateVersion = Number(sourceMatch?.[3]);
  const sourceAgenda = sourceAgendaId
    ? input.playerView.own.scoreArea.find(
        (card) =>
          card.instanceId === sourceAgendaId &&
          card.known &&
          card.type === "agenda" &&
          nonEmptyString(card.definitionId),
      )
    : undefined;
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "corp" &&
      legalAction.type === "resolve_choice" &&
      legalAction.source === "game_rule" &&
      legalAction.timingPoint === input.playerView.timingPoint &&
      legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
      legalAction.choiceRequirements?.length === 1 &&
      legalAction.choiceRequirements[0]?.choiceId === choice.choiceId,
  );
  const candidate = action
    ? candidates.find(
        (entry) =>
          entry.actionId === action.actionId &&
          entry.semanticActionType === "choice.resolve",
      )
    : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const actionChoiceContractIsExact =
    requirement !== undefined &&
    requirement.minSelections === choice.minSelections &&
    requirement.maxSelections === choice.maxSelections &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  if (
    !sourceAgendaId ||
    !sourceAgenda?.definitionId ||
    !action ||
    !candidate ||
    !actionChoiceContractIsExact ||
    sourceStateVersion !== input.playerView.stateVersion ||
    revealedCardIds.length === 0 ||
    new Set(revealedCardIds).size !== revealedCardIds.length ||
    choice.minSelections <= 0 ||
    choice.minSelections !== choice.maxSelections
  ) {
    return undefined;
  }

  const targetServerIds = input.playerView.servers.map((server) => server.id);
  const completeTargetServerIds = [...targetServerIds, "new_remote"];
  const allowedTargetServerIds = new Set(completeTargetServerIds);
  const revealedCardIdSet = new Set(revealedCardIds);
  const optionsByCardId = new Map<
    string,
    Map<string, { optionId: string; serverId: string }>
  >();
  for (const option of choice.options.filter(
    (candidateOption) => candidateOption.selectable !== false,
  )) {
    const parts =
      typeof option.value === "string" ? option.value.split("|") : [];
    const [cardId, serverId] = parts;
    if (
      parts.length !== 2 ||
      !cardId ||
      !serverId ||
      !revealedCardIdSet.has(cardId) ||
      !allowedTargetServerIds.has(serverId) ||
      option.id !== `agenda_purge_${cardId}_${serverId}`
    ) {
      return undefined;
    }
    const byServer =
      optionsByCardId.get(cardId) ??
      new Map<string, { optionId: string; serverId: string }>();
    if (byServer.has(serverId)) return undefined;
    byServer.set(serverId, { optionId: option.id, serverId });
    optionsByCardId.set(cardId, byServer);
  }
  if (
    optionsByCardId.size !== choice.minSelections ||
    [...optionsByCardId.values()].some(
      (byServer) =>
        byServer.size !== completeTargetServerIds.length ||
        completeTargetServerIds.some((serverId) => !byServer.has(serverId)),
    )
  ) {
    return undefined;
  }

  const plannedLayers = new Map<string, number>();
  const targets = [...optionsByCardId.entries()].map(([cardId, byServer]) => {
    const serverId = [...byServer.keys()].sort((left, right) => {
      const difference =
        corpAgendaPurgeDefenseTargetValue(
          input,
          right,
          centralAllocation,
          plannedLayers,
        ) -
        corpAgendaPurgeDefenseTargetValue(
          input,
          left,
          centralAllocation,
          plannedLayers,
        );
      return difference || technicalCompare(left, right);
    })[0]!;
    plannedLayers.set(serverId, (plannedLayers.get(serverId) ?? 0) + 1);
    return {
      cardId,
      serverId,
      optionId: byServer.get(serverId)!.optionId,
    };
  });
  if (targets.length !== choice.minSelections || !targets[0]) return undefined;

  return {
    kind: "generic",
    defenseId: `agenda-purge-install-targets:${choice.choiceId}`,
    serverId: targets[0].serverId,
    phase: "resolve_install_targets",
    sourceDefinitionIds: [sourceAgenda.definitionId],
    actionIds: [action.actionId],
    urgent: true,
    value: 1_000,
    evidenceCode: "agenda_purge_ice_allocation_owned_by_corp_defend_servers",
    choiceResolution: {
      kind: "agenda_purge_install_targets",
      choiceId: choice.choiceId,
      sourceAgendaId,
      sourceStateVersion,
      revealedCardIds,
      targets,
    },
  };
}

type ClassicDeflectorChoiceContext = Readonly<{
  runId: string;
  sourceIceInstanceId: string;
  subroutineIndex: number;
  sourceDefinitionId: string;
  subroutineId: string;
  targetProfile: "archives" | "any_data_fort" | "subsidiary_data_fort";
  creditCost: number;
  autoBreakIfNoTarget: boolean;
}>;

export function corpClassicDeflectorDefenseChoiceSignal(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  centralAllocation: CorpCentralDefenseAllocation | undefined,
  requiredCreditFloor: number,
): CorpGenericDefenseSignal | undefined {
  const choice = input.playerView.pendingChoice;
  const context = choice
    ? parseClassicDeflectorChoiceContext(choice.source)
    : undefined;
  if (
    input.side !== "corp" ||
    choice?.side !== "corp" ||
    choice.kind !== "select_option" ||
    choice.visibility !== "public" ||
    choice.stateVersion !== input.playerView.stateVersion ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1 ||
    !context ||
    !knownNonNegativeInteger(requiredCreditFloor)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) =>
      legalAction.side === "corp" &&
      legalAction.type === "resolve_choice" &&
      legalAction.source === "game_rule" &&
      legalAction.timingPoint === input.playerView.timingPoint &&
      legalAction.expiresAtStateVersion === input.playerView.stateVersion &&
      legalAction.choiceRequirements?.length === 1 &&
      legalAction.choiceRequirements[0]?.choiceId === choice.choiceId,
  );
  const candidate = action
    ? candidates.find(
        (entry) =>
          entry.actionId === action.actionId &&
          entry.semanticActionType === "choice.resolve",
      )
    : undefined;
  const requirement = action?.choiceRequirements?.[0];
  const choiceOptionIds = choice.options.map((option) => option.id);
  const exactActionBinding =
    requirement !== undefined &&
    requirement.minSelections === 1 &&
    requirement.maxSelections === 1 &&
    requirement.optionIds.length === choiceOptionIds.length &&
    choiceOptionIds.every((optionId) =>
      requirement.optionIds.includes(optionId),
    );
  const run = input.playerView.run;
  const sourceServer = run
    ? input.playerView.servers.find(
        (server) =>
          server.id === run.position?.serverId &&
          run.position.kind === "ice" &&
          server.ice[run.position.iceIndex]?.instanceId ===
            context.sourceIceInstanceId,
      )
    : undefined;
  const sourceIce = sourceServer?.ice.find(
    (ice) => ice.instanceId === context.sourceIceInstanceId,
  );
  const quotedSubroutine =
    sourceIce?.effectiveRunQuote?.subroutines[context.subroutineIndex];
  if (
    !action ||
    !candidate ||
    !exactActionBinding ||
    !run ||
    run.phase !== "encounter_ice" ||
    run.encounteredIce?.instanceId !== context.sourceIceInstanceId ||
    sourceIce?.definitionId !== context.sourceDefinitionId ||
    sourceIce.rezzed !== true ||
    sourceIce.effectiveRunQuote?.iceInstanceId !==
      context.sourceIceInstanceId ||
    sourceIce.effectiveRunQuote.iceDefinitionId !==
      context.sourceDefinitionId ||
    quotedSubroutine?.id !== context.subroutineId ||
    quotedSubroutine.type !== "deflect_run" ||
    quotedSubroutine.deflectorTarget !== context.targetProfile ||
    (quotedSubroutine.deflectorCost ?? 0) !== context.creditCost ||
    (quotedSubroutine.deflectorAutoBreakIfNoTarget === true) !==
      context.autoBreakIfNoTarget
  ) {
    return undefined;
  }

  const eligibleServerIds = input.playerView.servers
    .filter((server) =>
      context.targetProfile === "archives"
        ? server.id === "archives"
        : context.targetProfile === "subsidiary_data_fort"
          ? server.id.startsWith("remote_")
          : true,
    )
    .map((server) => server.id);
  const eligibleServerIdSet = new Set<string>(eligibleServerIds);
  const optionsByServerId = new Map<string, string>();
  let declineOptionId: string | undefined;
  for (const option of choice.options) {
    if (option.selectable === false || typeof option.value !== "string") {
      return undefined;
    }
    if (option.value === "decline") {
      if (declineOptionId || option.id !== "decline") return undefined;
      declineOptionId = option.id;
      continue;
    }
    if (
      !eligibleServerIdSet.has(option.value) ||
      option.id !== `server_${option.value}` ||
      optionsByServerId.has(option.value)
    ) {
      return undefined;
    }
    optionsByServerId.set(option.value, option.id);
  }
  if (
    optionsByServerId.size !== eligibleServerIds.length ||
    eligibleServerIds.some((serverId) => !optionsByServerId.has(serverId)) ||
    context.creditCost > 0 !== (declineOptionId !== undefined)
  ) {
    return undefined;
  }

  const redirectTargets = eligibleServerIds
    .filter((serverId) => serverId !== run.attackedServerId)
    .sort((left, right) => {
      const difference =
        classicDeflectorServerExposure(input, left, centralAllocation) -
        classicDeflectorServerExposure(input, right, centralAllocation);
      return difference || technicalCompare(left, right);
    });
  const selectedServerId = redirectTargets[0];
  const sourceExposure =
    classicDeflectorServerExposure(
      input,
      run.attackedServerId,
      centralAllocation,
    ) + 1_000;
  const targetExposure = selectedServerId
    ? classicDeflectorServerExposure(input, selectedServerId, centralAllocation)
    : Number.POSITIVE_INFINITY;
  const canPay =
    input.playerView.own.credits - context.creditCost >= requiredCreditFloor;
  const redirectIsProductive =
    selectedServerId !== undefined &&
    (context.creditCost === 0 ||
      (canPay && sourceExposure - targetExposure > context.creditCost * 250));
  const selectedOptionId = redirectIsProductive
    ? optionsByServerId.get(selectedServerId!)
    : declineOptionId;
  if (!selectedOptionId) return undefined;

  return {
    kind: "generic",
    defenseId: `classic-deflector:${choice.choiceId}`,
    serverId: redirectIsProductive ? selectedServerId! : run.attackedServerId,
    phase: "resolve_run_redirect",
    sourceDefinitionIds: [context.sourceDefinitionId],
    actionIds: [action.actionId],
    urgent: true,
    value: 1_000 + Math.max(0, sourceExposure - targetExposure),
    evidenceCode: "classic_deflector_redirect_owned_by_corp_defend_servers",
    choiceResolution: {
      kind: "classic_deflector_redirect",
      choiceId: choice.choiceId,
      sourceStateVersion: input.playerView.stateVersion,
      runId: context.runId,
      sourceIceInstanceId: context.sourceIceInstanceId,
      sourceDefinitionId: context.sourceDefinitionId,
      subroutineIndex: context.subroutineIndex,
      subroutineId: context.subroutineId,
      targetProfile: context.targetProfile,
      creditCost: context.creditCost,
      autoBreakIfNoTarget: context.autoBreakIfNoTarget,
      selectedOptionId,
      disposition: redirectIsProductive ? "redirect" : "decline",
      ...(redirectIsProductive ? { selectedServerId } : {}),
    },
  };
}

function parseClassicDeflectorChoiceContext(
  source: string,
): ClassicDeflectorChoiceContext | undefined {
  const parts = source.split(":");
  if (
    parts.length !== 9 ||
    parts[0] !== "card_implementation.classic_deflector" ||
    !parts[1] ||
    !parts[2] ||
    !parts[4] ||
    !parts[5] ||
    (parts[6] !== "archives" &&
      parts[6] !== "any_data_fort" &&
      parts[6] !== "subsidiary_data_fort")
  ) {
    return undefined;
  }
  const subroutineIndex = Number(parts[3]);
  const creditCost = Number(parts[7]);
  if (
    !knownNonNegativeInteger(subroutineIndex) ||
    !knownNonNegativeInteger(creditCost) ||
    (parts[8] !== "0" && parts[8] !== "1")
  ) {
    return undefined;
  }
  try {
    return {
      runId: decodeURIComponent(parts[1]),
      sourceIceInstanceId: decodeURIComponent(parts[2]),
      subroutineIndex,
      sourceDefinitionId: decodeURIComponent(parts[4]),
      subroutineId: decodeURIComponent(parts[5]),
      targetProfile: parts[6],
      creditCost,
      autoBreakIfNoTarget: parts[8] === "1",
    };
  } catch {
    return undefined;
  }
}

function classicDeflectorServerExposure(
  input: AiDecisionInput,
  serverId: string,
  centralAllocation: CorpCentralDefenseAllocation | undefined,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return Number.POSITIVE_INFINITY;
  const ownAgendaCount =
    serverId === "hq"
      ? input.playerView.own.gripOrHq.filter((card) => card.type === "agenda")
          .length
      : serverId === "archives"
        ? input.playerView.own.heapOrArchives.filter(
            (card) => card.type === "agenda",
          ).length
        : server.root.filter((card) => card.known && card.type === "agenda")
            .length;
  const centralBase = serverId === "rd" ? 1_500 : serverId === "hq" ? 1_000 : 0;
  const allocationPressure =
    centralAllocation?.status === "known" &&
    centralAllocation.selectedServerId === serverId
      ? 2_000
      : 0;
  const visibleRootValue = server.root.length * 250;
  const outermostRezzedIce = [...server.ice]
    .reverse()
    .find((ice) => ice.rezzed === true);
  const rezzedIceProtection = outermostRezzedIce ? 1_000 : 0;
  return (
    ownAgendaCount * 5_000 +
    centralBase +
    allocationPressure +
    visibleRootValue -
    rezzedIceProtection
  );
}

function corpAgendaPurgeDefenseTargetValue(
  input: AiDecisionInput,
  serverId: string,
  centralAllocation: CorpCentralDefenseAllocation | undefined,
  plannedLayers: ReadonlyMap<string, number>,
): number {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const installedLayers = server?.ice.length ?? 0;
  const additionalLayers = plannedLayers.get(serverId) ?? 0;
  const layerPenalty = (installedLayers + additionalLayers) * 1_500;
  if (serverId === "new_remote") return -layerPenalty;
  const visibleAgendaCount =
    server?.root.filter((card) => card.known && card.type === "agenda")
      .length ?? 0;
  if (serverId.startsWith("remote_") && visibleAgendaCount > 0) {
    return 5_000 + visibleAgendaCount * 250 - layerPenalty;
  }
  if (
    centralAllocation?.status === "known" &&
    serverId === centralAllocation.selectedServerId
  ) {
    return 4_000 - layerPenalty;
  }
  if (serverId === "hq" || serverId === "rd") {
    return (
      (centralAllocation?.status === "known" ? 3_000 : 2_750) - layerPenalty
    );
  }
  if (serverId.startsWith("remote_") && (server?.root.length ?? 0) > 0) {
    return 2_500 - layerPenalty;
  }
  if (serverId === "archives") return 750 - layerPenalty;
  if (serverId.startsWith("remote_")) return 500 - layerPenalty;
  return 250 - layerPenalty;
}

export function corpEconomyActionIsOwned(
  candidate: ActionSemanticCandidate,
): boolean {
  return immediateCorpLiquidCreditGain(candidate) > 0;
}

function scoreModule(): PlanModule {
  return {
    moduleId: "corp.score_agenda",
    side: "corp",
    discover: (context) =>
      domain(context).scoreProjects.map((signal) => {
        const resourceGaps = scoreResourceGaps(context, signal);
        const routeExists =
          resourceGaps.length === 0 &&
          signal.feasible &&
          scoreCandidates(context, signal).length > 0;
        return proposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.projectId,
          moduleState: { kind: "score", signal } satisfies ScoreState,
          priorityClass: corpScorePriorityClass(signal),
          target: corpScorePlanTarget(signal),
          routeExists,
          supportable: resourceGaps.length > 0,
          evidenceCode: signal.evidenceCode,
          ...(!routeExists &&
          resourceGaps.length === 0 &&
          scoreBlockerCode(signal)
            ? { blockerCode: scoreBlockerCode(signal)! }
            : {}),
          abandonWhenTargetMissing: false,
          persistencePolicy:
            signal.sameTurnCloseout || signal.deadlinePressure
              ? "locked_sequence"
              : "sticky_goal",
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = state<ScoreState>(instance);
      const resourceGaps = scoreResourceGaps(context, current.signal);
      const currentAssessment = assessment(
        instance,
        corpScorePriorityClass(current.signal),
        resourceGaps.length === 0 &&
          current.signal.feasible &&
          scoreCandidates(context, current.signal).length > 0,
        scoreAssessmentValue(current.signal),
        portfolio.executorInstanceId,
        resourceGaps,
      );
      return current.signal.phase === "select_agenda"
        ? {
            ...currentAssessment,
            intentFit: genericScoreMaterialIntentFit(context, current.signal),
          }
        : currentAssessment;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<ScoreState>(instance);
      const nextCapability = nextScoreCapability(current.signal.phase);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: scoreCapability(current.signal),
          ...(current.signal.actionIds
            ? {}
            : { target: corpScorePlanTarget(current.signal) }),
          purpose: current.signal.uncertainty
            ? `Execute the exact current score phase ${current.signal.phase}, then observe and revalidate the uncertain later score route.`
            : `Execute score phase ${current.signal.phase}.`,
        },
        candidates: scoreCandidates(context, current.signal),
        ...(current.signal.sameTurnCloseout &&
        !current.signal.actionIds &&
        nextCapability
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:same-turn-score`,
                trigger: "action_applied" as const,
                nextCapability,
                ...(current.signal.agendaInstanceId
                  ? {
                      target: {
                        kind: "card" as const,
                        id: current.signal.agendaInstanceId,
                      },
                    }
                  : {}),
                purpose:
                  "Continue the protected same-turn score line after observing the new state.",
              },
            }
          : {}),
      };
    },
  };
}

export type CorpScorePriorityClass = "P1" | "P2" | "P3" | "P4";

export function corpScorePriorityClass(
  signal: CorpScoreProjectSignal,
): CorpScorePriorityClass {
  if (signal.terminalScore && signal.sameTurnCloseout) return "P1";
  if (signal.preventsTerminalSteal) return "P2";
  if (signal.sameTurnCloseout || signal.deadlinePressure) return "P3";
  return "P4";
}

function scoreAssessmentValue(signal: CorpScoreProjectSignal): number {
  const agendaPointValue = Math.max(1, signal.agendaPoints) * 20;
  const conversionValue = signal.conversion
    ? signal.conversion.existingRemoteRezzedIceCount * 12 +
      signal.conversion.existingRemoteIceCount * 4 +
      signal.conversion.realizedStrategySupportCount * 4 -
      signal.conversion.remainingAdvancementClicks * 8 -
      signal.conversion.remainingScoreCredits * 2 +
      (signal.conversion.residentParent ? 40 : 0)
    : 0;
  if (signal.terminalScore) return 1_000 + agendaPointValue + conversionValue;
  if (signal.preventsTerminalSteal)
    return 2_000 + agendaPointValue + conversionValue;
  if (signal.deadlinePressure) return 700 + agendaPointValue + conversionValue;
  if (signal.sameTurnCloseout) return 500 + agendaPointValue + conversionValue;
  return 100 + agendaPointValue + conversionValue;
}

function scoreBlockerCode(signal: CorpScoreProjectSignal): string | undefined {
  if (signal.feasible) return undefined;
  if ((signal.fundingGap ?? 0) > 0) return "corp_score_funding_route_required";
  if (
    signal.evidenceCode.startsWith("corp_current_turn_scoreline_unreachable:")
  )
    return "corp_score_deadline_route_unavailable";
  if (signal.evidenceCode.startsWith("corp_last_click_score_install_deferred:"))
    return "corp_score_development_click_unavailable";
  return "corp_score_route_unavailable";
}

function remoteModule(): PlanModule {
  return {
    moduleId: "corp.establish_scoring_remote",
    side: "corp",
    discover: (context) =>
      domain(context)
        .remoteProjects.filter((signal) => signal.purpose === "scoring_remote")
        .map((signal) =>
          proposal({
            moduleId: "corp.establish_scoring_remote",
            dedupeKey: signal.projectId,
            moduleState: { kind: "remote", signal } satisfies RemoteState,
            priorityClass: "P4",
            target: { kind: "server", id: signal.serverId },
            routeExists:
              signal.feasible && remoteCandidates(context, signal).length > 0,
            evidenceCode: signal.evidenceCode,
          }),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      return assessment(
        instance,
        "P4",
        current.signal.feasible &&
          remoteCandidates(context, current.signal).length > 0,
        current.signal.value,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes:
              current.signal.phase === "install_project"
                ? ["install.card"]
                : ["install.card", "corp_window.rez"],
            requiredSourceDefinitionIds: [current.signal.sourceDefinitionId],
          },
          target: { kind: "server", id: current.signal.serverId },
          purpose: `Establish scoring remote ${current.signal.serverId}.`,
        },
        candidates: remoteCandidates(context, current.signal),
      };
    },
  };
}

function defenseModule(): PlanModule {
  return {
    moduleId: "corp.defend_servers",
    side: "corp",
    discover: (context) => {
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      if (signals.length === 0) return [];
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const candidates = selectedBand.candidates;
      const priorityClass = selectedBand.priorityClass;
      const scoreProtectionRoute =
        selectedBand.kind === "score" ? selectedBand.route : undefined;
      const ownPriorityClass: PriorityClass = scoreProtectionRoute
        ? "P5"
        : priorityClass;
      const parentNeedId = scoreProtectionRoute
        ? exactScoreProtectionParentNeedId(context, scoreProtectionRoute.signal)
        : undefined;
      const resourceGaps = defenseResourceGaps(selectedBand);
      return [
        proposal({
          moduleId: "corp.defend_servers",
          dedupeKey: "server-defense-portfolio",
          moduleState: {
            kind: "defense",
            signals,
            ...(currentDomain.centralDefenseAllocation
              ? {
                  centralAllocation: currentDomain.centralDefenseAllocation,
                }
              : {}),
            ...(currentDomain.centralDefenseHqHoldCadence
              ? {
                  hqHoldCadence: currentDomain.centralDefenseHqHoldCadence,
                }
              : {}),
            ...(currentDomain.centralDefenseHqHoldSelection
              ? {
                  hqHoldSelection: currentDomain.centralDefenseHqHoldSelection,
                }
              : {}),
          } satisfies DefenseState,
          priorityClass: ownPriorityClass,
          target: { kind: "capability", id: "allocate_server_defense" },
          routeExists: candidates.length > 0,
          supportable: resourceGaps.length > 0,
          evidenceCode: defensePortfolioEvidenceCode(
            context,
            signals,
            currentDomain.centralDefenseAllocation,
          ),
          ...(scoreProtectionRoute
            ? {
                parentInstanceId: planInstanceIdForProposal({
                  moduleId: "corp.score_agenda",
                  dedupeKey: scoreProtectionRoute.signal.parentProjectId,
                }),
                parentNeedId: parentNeedId!,
              }
            : {}),
          persistencePolicy:
            priorityClass === "P2" || priorityClass === "P3"
              ? "locked_sequence"
              : scoreProtectionRoute
                ? "flexible_support"
                : "sticky_goal",
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      state<DefenseState>(instance);
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const priorityClass: PriorityClass =
        selectedBand.kind === "score" ? "P5" : selectedBand.priorityClass;
      const candidates = defensePortfolioCandidates(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const resourceGaps = defenseResourceGaps(selectedBand);
      return {
        ...assessment(
          instance,
          priorityClass,
          resourceGaps.length === 0 && candidates.length > 0,
          defensePortfolioAssessmentValue(
            context,
            signals,
            priorityClass,
            currentDomain.centralDefenseAllocation,
          ),
          portfolio.executorInstanceId,
          resourceGaps,
        ),
        evidenceCodes: [
          defensePortfolioEvidenceCode(
            context,
            signals,
            currentDomain.centralDefenseAllocation,
          ),
        ],
      };
    },
    materialize: (instance, _assessment, context) => {
      state<DefenseState>(instance);
      const currentDomain = domain(context);
      const signals = validDefenseSignals(currentDomain.defenseNeeds, context);
      const selectedBand = selectedDefensePortfolioBand(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const scoreProtectionRoute =
        selectedBand.kind === "score" ? selectedBand.route : undefined;
      const candidates = defensePortfolioCandidates(
        context,
        signals,
        currentDomain.centralDefenseAllocation,
      );
      const engineRandomizedIceInstallNearTie =
        engineRandomizedCentralIceInstallNearTie(
          context,
          candidates,
          currentDomain.centralDefenseAllocation,
        );
      const semanticActionTypes = [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ];
      return {
        step: {
          stepId: `${instance.instanceId}:${
            scoreProtectionRoute ? "develop_score_protection" : "allocate"
          }`,
          capability: {
            capabilityId: scoreProtectionRoute
              ? "develop_score_protection"
              : "allocate_server_defense",
            semanticActionTypes,
          },
          ...(scoreProtectionRoute?.signal.kind ===
            "score_protection_install" ||
          scoreProtectionRoute?.signal.kind ===
            "score_protection_staging_install"
            ? {
                target: {
                  kind: "server" as const,
                  id: scoreProtectionRoute.signal.serverId,
                },
              }
            : {}),
          purpose: scoreProtectionRoute
            ? `Develop exact current protection for resident score project ${scoreProtectionRoute.signal.parentProjectId}, then observe and revalidate its next route.`
            : "Allocate the best currently available defense resource across all visible server needs.",
        },
        candidates,
        ...(engineRandomizedIceInstallNearTie
          ? { engineRandomizedIceInstallNearTie }
          : {}),
      };
    },
  };
}

function engineRandomizedCentralIceInstallNearTie(
  context: PlanSchedulerContext,
  candidates: PlanMaterialization["candidates"],
  allocation: CorpCentralDefenseAllocation | undefined,
): PlanMaterialization["engineRandomizedIceInstallNearTie"] | undefined {
  if (
    allocation?.status !== "known" ||
    allocation.canonicalNearTieCandidateServerIds.length !== 2 ||
    allocation.canonicalNearTieCandidateServerIds[0] !== "hq" ||
    allocation.canonicalNearTieCandidateServerIds[1] !== "rd"
  ) {
    return undefined;
  }
  const candidateForServer = (
    serverId: "hq" | "rd",
  ): PlanMaterialization["candidates"][number] | undefined =>
    candidates
      .filter(({ candidate }) => {
        if (
          candidate.semanticActionType !== "install.card" ||
          !candidateTargetIds(candidate).includes(serverId)
        ) {
          return false;
        }
        const action = context.input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return (
          action?.type === "install_card" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.placement === "ice" &&
          action.payload.serverId === serverId &&
          (action.choiceRequirements?.length ?? 0) === 0 &&
          action.targetRequirements.length === 0
        );
      })
      .sort((left, right) =>
        left.candidate.actionId.localeCompare(right.candidate.actionId),
      )[0];
  const hq = candidateForServer("hq");
  const rd = candidateForServer("rd");
  if (!hq || !rd || hq.candidate.actionId === rd.candidate.actionId) {
    return undefined;
  }
  return {
    kind: "engine_randomized_ice_install_selection",
    candidates: [
      { actionId: hq.candidate.actionId, targetServerId: "hq" },
      { actionId: rd.candidate.actionId, targetServerId: "rd" },
    ],
  };
}

function defensePortfolioEvidenceCode(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): string {
  const selectedBand = selectedDefensePortfolioBand(
    context,
    signals,
    centralAllocation,
  );
  if (selectedBand.kind === "score") {
    return selectedBand.route.signal.evidenceCode;
  }
  const selectedActionId = selectedBand.candidates[0]?.candidate.actionId;
  if (!selectedActionId) return "visible_server_defense_portfolio";
  return (
    [...selectedBand.eligibleSignals]
      .filter((signal) =>
        defenseCandidates(context, signal).some(
          (route) => route.candidate.actionId === selectedActionId,
        ),
      )
      .sort(
        (left, right) =>
          right.value - left.value ||
          left.defenseId.localeCompare(right.defenseId),
      )[0]?.evidenceCode ?? "visible_server_defense_portfolio"
  );
}

function defensePriority(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PriorityClass {
  return selectedDefensePortfolioBand(context, signals, centralAllocation)
    .priorityClass;
}

export function corpGenericDefensePriorityClass(
  genericSignals: readonly CorpGenericDefenseSignal[],
): "P2" | "P3" | "P5" | "P6" {
  if (
    genericSignals.some(
      (signal) =>
        signal.urgent &&
        (signal.phase === "install_ice" ||
          signal.phase === "install_defense_support" ||
          signal.phase === "fund_rez_reserve" ||
          signal.phase === "resolve_install_targets" ||
          signal.phase === "resolve_run_redirect" ||
          signal.phase === "resolve_post_pass_ice_lifecycle" ||
          (signal.phase === "draw_for_ice" &&
            signal.centralPressure === "terminal") ||
          signal.phase === "activate_run_defense" ||
          (signal.phase === "rez_response" &&
            signal.rezWindowVerdict === "productive")),
    )
  )
    return "P2";
  if (
    genericSignals.some(
      (signal) =>
        signal.immediateInstallSupport ||
        (signal.phase === "install_ice" &&
          (signal.installRoute?.progressKind ===
            "scoreline_central_tax_allocation" ||
            signal.centralPressure === "material" ||
            signal.centralPressure === "acute")),
    )
  ) {
    return "P3";
  }
  if (
    genericSignals.some(
      (signal) =>
        signal.phase === "rez_response" &&
        signal.rezWindowVerdict === "productive",
    )
  )
    return "P5";
  if (
    genericSignals.some(
      (signal) =>
        (signal.serverId === "hq" || signal.serverId === "rd") &&
        signal.value > 8,
    )
  )
    return "P5";
  return "P6";
}

function defensePriorityRank(priorityClass: PriorityClass): number {
  switch (priorityClass) {
    case "P1":
      return 1;
    case "P2":
      return 2;
    case "P3":
      return 3;
    case "P4":
      return 4;
    case "P5":
      return 5;
    case "P6":
      return 6;
  }
}

function economyModule(): PlanModule {
  return {
    moduleId: "corp.economy",
    side: "corp",
    discover: (context) =>
      validatedEconomyNeeds(context)
        .economyNeeds.filter(
          (signal) =>
            signal.kind === "develop_campaign" ||
            signal.kind === "convert_immediate_operation" ||
            signal.kind === "convert_visible_card_payout" ||
            signal.kind === "prepare_immediate_operation" ||
            signal.kind === "develop_liquidity" ||
            signal.gap > 0,
        )
        .map((signal) =>
          proposal({
            moduleId: "corp.economy",
            dedupeKey: signal.needId,
            moduleState: { kind: "economy", signal } satisfies EconomyState,
            priorityClass: corpEconomyPriorityClass(signal),
            target:
              signal.kind === "develop_campaign" ||
              signal.kind === "convert_immediate_operation" ||
              signal.kind === "convert_visible_card_payout" ||
              signal.kind === "prepare_immediate_operation"
                ? { kind: "card", id: signal.sourceInstanceId }
                : { kind: "capability", id: signal.needId },
            routeExists: economyCandidates(context, signal).length > 0,
            evidenceCode: signal.evidenceCode,
            ...(signal.kind === "parent_funding" && signal.parentPlanInstanceId
              ? {
                  parentInstanceId: signal.parentPlanInstanceId,
                  parentNeedId: signal.parentNeedId ?? signal.needId,
                  persistencePolicy: "flexible_support" as const,
                }
              : {}),
          }),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<EconomyState>(instance);
      const currentSignal = validatedEconomyNeeds(context).economyNeeds.find(
        (signal) =>
          signal.needId === current.signal.needId &&
          signal.kind === current.signal.kind,
      );
      return assessment(
        instance,
        corpEconomyPriorityClass(currentSignal ?? current.signal),
        currentSignal !== undefined &&
          economyCandidates(context, currentSignal).length > 0,
        economyAssessmentValue(currentSignal ?? current.signal),
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => ({
      ...economyMaterialization(
        instance,
        context,
        state<EconomyState>(instance).signal,
      ),
    }),
  };
}

function validatedEconomyNeeds(
  context: PlanSchedulerContext,
): CorpCorePlanDomain {
  const currentDomain = domain(context);
  const invalidScoreParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const scoreFundingNeed = signal.needId.startsWith("score-support:");
    const scoreParentBound =
      signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true;
    const scorePriorityDelegated = signal.delegatedPriorityClass !== undefined;
    if (!scoreFundingNeed && !scoreParentBound && !scorePriorityDelegated)
      return false;
    const projectId = signal.needId.slice("score-support:".length);
    const parentProject = currentDomain.scoreProjects.find(
      (project) => project.projectId === projectId,
    );
    const expectedParent = parentProject
      ? planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: parentProject.projectId,
        })
      : undefined;
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const validFundingRouteBinding =
      signal.actionIds.length > 0
        ? signal.actionIds.every((actionId) =>
            validFundingActions.has(actionId),
          )
        : signal.fundingRouteAssessment?.status === "uncovered" &&
          signal.fundingRouteAssessment.headActionId === undefined;
    return (
      !parentProject ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      !scorePriorityDelegated ||
      signal.delegatedPriorityClass !== corpScorePriorityClass(parentProject) ||
      signal.evidenceCode !== parentProject.evidenceCode ||
      !validFundingRouteBinding
    );
  });
  if (invalidScoreParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidScoreParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind score funding need ${invalidScoreParent.needId} to its exact score parent, inherited P1-P4 priority class, matching evidence and current liquid-credit actions.`,
    });
  }
  const invalidAmbushParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const ambushFundingShape =
      signal.needId.startsWith("ambush-funding:") ||
      signal.parentPlanInstanceId?.startsWith("plan:corp.ambush_and_bluff:") ===
        true;
    if (!ambushFundingShape) return false;
    const sourceInstanceId = signal.needId.slice("ambush-funding:".length);
    const ambushes = (
      context.domain as
        | (CorpCorePlanDomain & {
            ambushes?: readonly {
              ambushId: string;
              sourceInstanceId: string;
              phase: string;
              evidenceCode: string;
              installRoute?: { fundingGap: number };
            }[];
          })
        | undefined
    )?.ambushes;
    const ambush = ambushes?.find(
      (candidate) =>
        candidate.phase === "install" &&
        candidate.sourceInstanceId === sourceInstanceId,
    );
    const expectedParent = ambush
      ? planInstanceIdForProposal({
          moduleId: "corp.ambush_and_bluff",
          dedupeKey: ambush.ambushId,
        })
      : undefined;
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const validFundingRouteBinding =
      signal.actionIds.length > 0
        ? signal.actionIds.every((actionId) =>
            validFundingActions.has(actionId),
          )
        : signal.fundingRouteAssessment?.status === "uncovered" &&
          signal.fundingRouteAssessment.headActionId === undefined;
    return (
      !ambush ||
      ambush.installRoute?.fundingGap !== signal.gap ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      signal.delegatedPriorityClass !== undefined ||
      signal.parentPriorityClass !== "P5" ||
      signal.evidenceCode !== ambush.evidenceCode ||
      !validFundingRouteBinding
    );
  });
  if (invalidAmbushParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidAmbushParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind Ambush funding need ${invalidAmbushParent.needId} to its exact visible Ambush root, inherited P5 priority, exact LegalAction-derived credit gap and current liquid-credit actions.`,
    });
  }
  const punishCampaigns = (
    context.domain as
      | (CorpCorePlanDomain & {
          punishCampaigns?: readonly {
            campaignId: string;
            evidenceCode: string;
            guarantee: GuaranteeLevel;
            terminalCondition?: "runner_flatline" | "runner_deckout";
            visibleTerminalProjection: boolean;
            priorityClass?: "P4" | "P5";
            routeContract?: {
              quoteStatus: "complete" | "unknown";
              routeId: string;
              fundingNeedId: string;
              fundingGap: number;
              fundingActionIds: string[];
              horizon: "execute" | "fund" | "wait";
            };
          }[];
        })
      | undefined
  )?.punishCampaigns;
  const invalidPunishParent = currentDomain.economyNeeds.find((signal) => {
    if (
      signal.kind !== "parent_funding" ||
      !signal.needId.startsWith("punish-funding:")
    ) {
      return false;
    }
    const campaign = punishCampaigns?.find(
      (candidate) =>
        candidate.routeContract?.quoteStatus === "complete" &&
        candidate.routeContract.horizon === "fund" &&
        candidate.routeContract.fundingNeedId === signal.needId,
    );
    const expectedParent = campaign
      ? planInstanceIdForProposal({
          moduleId: "corp.punish_campaign",
          dedupeKey: campaign.campaignId,
        })
      : undefined;
    const expectedPriority =
      campaign &&
      campaign.terminalCondition === "runner_flatline" &&
      campaign.visibleTerminalProjection &&
      (campaign.guarantee === "visible_state_forced" ||
        campaign.guarantee === "robust_but_reactive")
        ? "P1"
        : (campaign?.priorityClass ?? "P4");
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    return (
      !campaign ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      signal.gap !== campaign.routeContract?.fundingGap ||
      signal.evidenceCode !== campaign.evidenceCode ||
      signal.delegatedPriorityClass !== undefined ||
      signal.parentPriorityClass !== expectedPriority ||
      signal.actionIds.length === 0 ||
      signal.actionIds.some(
        (actionId) =>
          !campaign.routeContract?.fundingActionIds.includes(actionId) ||
          !validFundingActions.has(actionId),
      )
    );
  });
  if (invalidPunishParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidPunishParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind punish funding need ${invalidPunishParent.needId} to the exact complete current quoted campaign route, inherited parent priority, same-turn funding horizon and current liquid-credit action.`,
    });
  }
  const expectedDefenseParent = planInstanceIdForProposal({
    moduleId: "corp.defend_servers",
    dedupeKey: "server-defense-portfolio",
  });
  const invalidDefenseParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const isDefenseFundingShape =
      signal.needId.startsWith("defense-reserve:") ||
      signal.immediateDefenseConversion === true ||
      signal.incrementalDefenseReserve !== undefined ||
      signal.parentPlanInstanceId?.startsWith("plan:corp.defend_servers:") ===
        true;
    if (!isDefenseFundingShape) return false;
    const parentNeed = currentDomain.defenseNeeds.find(
      (need): need is CorpGenericDefenseSignal =>
        need.kind === "generic" && need.defenseId === signal.parentNeedId,
    );
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const requirement = parentNeed
      ? genericDefenseFundingRequirement(
          parentNeed,
          context.input.playerView.own.credits,
        )
      : undefined;
    const exactNeedId = requirement
      ? `defense-reserve:${parentNeed!.serverId}:${requirement.iceInstanceId}`
      : undefined;
    return (
      signal.needId !== exactNeedId ||
      signal.immediateDefenseConversion !== true ||
      signal.parentPlanInstanceId !== expectedDefenseParent ||
      !parentNeed ||
      !requirement ||
      !genericDefenseFundingRequirementIsCurrent(
        context,
        parentNeed,
        requirement,
      ) ||
      signal.gap !== requirement.gap ||
      signal.parentPriorityClass !==
        corpGenericDefensePriorityClass([parentNeed]) ||
      signal.evidenceCode !== parentNeed.evidenceCode ||
      signal.incrementalDefenseReserve?.targetCredits !==
        requirement.targetCredits ||
      signal.incrementalDefenseReserve?.serverId !== parentNeed.serverId ||
      signal.incrementalDefenseReserve?.iceInstanceId !==
        requirement.iceInstanceId ||
      signal.actionIds.length === 0 ||
      signal.actionIds.some((actionId) => !validFundingActions.has(actionId))
    );
  });
  if (invalidDefenseParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidDefenseParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind defense funding need ${invalidDefenseParent.needId} to the exact corp.defend_servers parent, its funding-only child route, inherited priority, matching evidence and current liquid-credit actions.`,
    });
  }
  return currentDomain;
}

export function corpEconomyPriorityClass(
  signal: CorpEconomyNeedSignal,
): PriorityClass {
  if (signal.kind === "parent_funding")
    return signal.delegatedPriorityClass ?? signal.parentPriorityClass ?? "P5";
  if (signal.kind === "convert_immediate_operation") return "P4";
  if (signal.kind === "convert_visible_card_payout") return "P4";
  if (signal.kind === "prepare_immediate_operation") return "P4";
  if (signal.kind === "develop_liquidity") return "P6";
  if (signal.kind === "reserve" && signal.priorityClass)
    return signal.priorityClass;
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    signal.cadence.kind === "immediate_on_rez"
  )
    return "P3";
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    (signal.cadence.kind === "finite_pool" ||
      signal.cadence.kind === "automatic_start_of_turn")
  )
    return "P4";
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    signal.cadence.kind === "counter_cashout_development"
  )
    return "P4";
  return "P5";
}

function economyAssessmentValue(signal: CorpEconomyNeedSignal): number {
  if (signal.kind === "develop_liquidity") return -9_999;
  if (signal.kind === "convert_immediate_operation") {
    return (
      signal.conversion.netLiquidCreditGain * 20 +
      signal.conversion.cardsDrawn * 20
    );
  }
  if (signal.kind === "convert_visible_card_payout") {
    return signal.conversion.netLiquidCreditGain * 20;
  }
  if (signal.kind === "prepare_immediate_operation") {
    return 50 + signal.futureConversion.strategicEconomyValue * 10;
  }
  if (signal.kind === "develop_campaign") {
    return Math.max(1, signal.payback.projectedNetCredits * 20);
  }
  if (signal.kind === "reserve") return 100 + signal.gap * 20;
  if (signal.needId.startsWith("punish-funding:")) {
    return 1_000 + signal.gap * 20;
  }
  const readinessValue =
    signal.delegatedPriorityClass || signal.parentPriorityClass
      ? 300
      : signal.immediateDefenseConversion
        ? 180
        : 100;
  return Math.max(1, readinessValue - signal.gap * 20);
}

function proposal(params: {
  moduleId: PlanProposal["moduleId"];
  dedupeKey: string;
  moduleState: unknown;
  priorityClass: PriorityClass;
  target: NonNullable<PlanProposal["target"]>;
  routeExists: boolean;
  evidenceCode: string;
  persistencePolicy?: PlanProposal["persistencePolicy"];
  parentInstanceId?: string;
  parentNeedId?: string;
  supportable?: boolean;
  blockerCode?: string;
  abandonWhenTargetMissing?: boolean;
}): PlanProposal {
  return {
    moduleId: params.moduleId,
    moduleVersion: "1",
    dedupeKey: params.dedupeKey,
    side: "corp",
    strategyLineIds: [],
    executionClass:
      params.priorityClass === "P1" || params.priorityClass === "P2"
        ? "urgent_response"
        : params.priorityClass === "P3"
          ? "bounded_sequence"
          : "development_project",
    initialViability:
      params.routeExists || params.supportable ? "ready" : "blocked",
    persistencePolicy: params.persistencePolicy ?? "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: params.abandonWhenTargetMissing ?? true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target: params.target,
    ...(params.parentInstanceId
      ? { parentInstanceId: params.parentInstanceId }
      : {}),
    ...(params.parentNeedId !== undefined
      ? { parentNeedId: params.parentNeedId }
      : {}),
    phase: modulePhase(params.moduleState),
    milestone: "admitted",
    moduleState: structuredClone(params.moduleState),
    blockers:
      params.routeExists || params.supportable
        ? []
        : [
            {
              code: params.blockerCode ?? "no_current_corp_route",
              owner: "plan_module",
              removable: true,
              resumeCondition: { code: "route_becomes_available" },
            },
          ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "domain_goal_satisfied" }],
    abandonmentConditions: [{ code: "target_invalidated" }],
    evidenceRefs: [{ code: params.evidenceCode, source: "visible_state" }],
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode: instance.evidenceRefs[0]?.code ?? "terminal_score",
            guarantee: "visible_state_forced",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind: "irreversible_threat",
              evidenceCode:
                instance.evidenceRefs[0]?.code ?? "visible_server_threat",
              guarantee: "visible_state_forced",
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_turn",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : priorityClass === "P5"
              ? {
                  requestedClass: "P5",
                  reasonCode: "required_parent_support",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "corp",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:${instance.phase}`,
            capability: instance.phase,
            purpose: "Execute current Corp domain phase.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: true,
      confidence: "visible_state_forced",
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "corp_plan_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: priorityClass === "P1",
      guarantee: "visible_state_forced",
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 3 : 0,
      progressAtRisk: executorId === instance.instanceId ? 3 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function scoreCapability(signal: CorpScoreProjectSignal): PlanStepCapability {
  if (signal.phase === "select_agenda")
    return {
      capabilityId: "select_score_agenda_material",
      semanticActionTypes: [],
    };
  if (signal.phase === "unlock_remote_creation")
    return {
      capabilityId: "unlock_score_remote_creation",
      semanticActionTypes: ["card_ability.trigger"],
    };
  if (
    signal.phase === "install_counter_bank" ||
    signal.phase === "install_agenda_from_counter_bank"
  )
    return {
      capabilityId:
        signal.phase === "install_counter_bank"
          ? "install_score_counter_bank"
          : "install_counter_bank_score_agenda",
      semanticActionTypes: ["install.card"],
      ...(signal.phase === "install_counter_bank" && signal.counterBank
        ? {
            requiredSourceDefinitionIds: [
              signal.counterBank.sourceDefinitionId,
            ],
          }
        : signal.agendaDefinitionId
          ? { requiredSourceDefinitionIds: [signal.agendaDefinitionId] }
          : {}),
    };
  if (signal.phase === "advance_counter_bank")
    return {
      capabilityId: "advance_score_counter_bank",
      semanticActionTypes: ["score.advance_card"],
    };
  if (
    signal.phase === "rez_counter_bank_for_handoff" ||
    signal.phase === "rez_counter_bank_for_liquidation"
  )
    return {
      capabilityId:
        signal.phase === "rez_counter_bank_for_handoff"
          ? "rez_counter_bank_for_score_handoff"
          : "rez_counter_bank_for_liquidation",
      semanticActionTypes: ["corp_window.rez"],
    };
  if (signal.phase === "liquidate_counter_bank")
    return {
      capabilityId: "liquidate_score_counter_bank",
      semanticActionTypes: ["economy.gain_credit"],
    };
  if (signal.phase === "convert_agenda")
    return {
      capabilityId: "convert_score_agenda",
      semanticActionTypes: signal.routeSemanticActionTypes ?? [
        "play.corp_operation",
      ],
    };
  if (signal.phase === "install_agenda")
    return {
      capabilityId: "install_score_agenda",
      semanticActionTypes: ["install.card"],
      ...(signal.agendaDefinitionId
        ? { requiredSourceDefinitionIds: [signal.agendaDefinitionId] }
        : {}),
    };
  if (signal.phase === "advance_agenda")
    return {
      capabilityId: "advance_score_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  return {
    capabilityId: "score_agenda",
    semanticActionTypes: ["score.agenda"],
  };
}

function nextScoreCapability(
  phase: CorpScorePhase,
): PlanStepCapability | undefined {
  if (phase === "unlock_remote_creation")
    return {
      capabilityId: "install_unlocked_score_agenda",
      semanticActionTypes: ["install.card"],
    };
  if (phase === "install_agenda")
    return {
      capabilityId: "advance_installed_agenda",
      semanticActionTypes: ["score.advance_card"],
    };
  if (phase === "install_agenda_from_counter_bank")
    return {
      capabilityId: "rez_or_transfer_counter_bank_to_installed_agenda",
      semanticActionTypes: [
        "corp_window.rez",
        "score_conversion.move_advancement",
      ],
    };
  if (phase === "advance_agenda")
    return {
      capabilityId: "score_advanced_agenda",
      semanticActionTypes: ["score.agenda"],
    };
  return undefined;
}

export function corpScorePlanTarget(signal: CorpScoreProjectSignal) {
  if (signal.phase === "select_agenda")
    return {
      kind: "capability" as const,
      id: `score-material:${signal.projectId}`,
    };
  if (signal.actionIds)
    return {
      kind: "capability" as const,
      id: "rules_legal_score_action",
    };
  return signal.phase === "install_agenda" ||
    signal.phase === "install_agenda_from_counter_bank"
    ? {
        kind: "card" as const,
        id: signal.agendaDefinitionId ?? signal.projectId,
      }
    : {
        kind: "card" as const,
        id:
          signal.agendaInstanceId ??
          signal.agendaDefinitionId ??
          signal.projectId,
      };
}

function scoreCandidates(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): PlanMaterialization["candidates"] {
  if (signal.phase === "select_agenda") return [];
  const semantic = scoreCapability(signal).semanticActionTypes;
  return context.actionCandidates
    .filter((candidate) => {
      if (
        signal.actionIds !== undefined &&
        !signal.actionIds.includes(candidate.actionId)
      )
        return false;
      if (!semantic.includes(candidate.semanticActionType)) return false;
      if (
        signal.phase === "convert_agenda" &&
        signal.actionIds?.includes(candidate.actionId) === true
      ) {
        return true;
      }
      if (signal.phase === "unlock_remote_creation") return true;
      if (
        signal.phase === "install_counter_bank" &&
        signal.counterBank !== undefined
      )
        return (
          candidate.sourceCardInstanceId ===
            signal.counterBank.sourceCardInstanceId &&
          candidate.sourceDefinitionId ===
            signal.counterBank.sourceDefinitionId &&
          candidateTargetIds(candidate).includes(signal.counterBank.serverId)
        );
      if (
        signal.phase === "install_agenda" ||
        signal.phase === "install_agenda_from_counter_bank"
      )
        return (
          signal.agendaDefinitionId !== undefined &&
          candidate.sourceDefinitionId === signal.agendaDefinitionId &&
          (!signal.serverId ||
            candidateTargetIds(candidate).includes(signal.serverId))
        );
      if (
        (signal.phase === "advance_counter_bank" ||
          signal.phase === "rez_counter_bank_for_handoff" ||
          signal.phase === "rez_counter_bank_for_liquidation" ||
          signal.phase === "liquidate_counter_bank") &&
        signal.counterBank !== undefined
      ) {
        return (
          candidate.sourceCardInstanceId ===
            signal.counterBank.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.counterBank.sourceDefinitionId
        );
      }
      const agendaId = signal.agendaInstanceId ?? signal.agendaDefinitionId;
      if (!agendaId) return false;
      return (
        candidate.sourceCardInstanceId === agendaId ||
        candidateTargetIds(candidate).includes(agendaId)
      );
    })
    .map((candidate) => ({ candidate, stepValue: 100 }));
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: CorpRemoteProjectSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        candidate.sourceDefinitionId === signal.sourceDefinitionId &&
        candidate.semanticActionType === "install.card" &&
        candidateTargetIds(candidate).includes(signal.serverId),
    )
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function defenseCandidates(
  context: PlanSchedulerContext,
  signal: CorpDefenseSignal,
): PlanMaterialization["candidates"] {
  if (!isValidDefenseSignal(signal)) return [];
  if (signal.kind === "score_protection_staging_install") {
    return context.actionCandidates
      .filter((candidate) => {
        if (
          candidate.actionId !== signal.actionId ||
          candidate.semanticActionType !== "install.card" ||
          candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
          candidate.sourceDefinitionId !== signal.sourceDefinitionId ||
          !candidateTargetIds(candidate).includes(signal.serverId)
        ) {
          return false;
        }
        const action = context.input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        const totalClicks = action?.costs.reduce(
          (sum, cost) => sum + (cost.clicks ?? 0),
          0,
        );
        const totalCredits = action?.costs.reduce(
          (sum, cost) => sum + (cost.credits ?? 0),
          0,
        );
        return (
          action?.type === "install_card" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.placement === "ice" &&
          action.payload.serverId === signal.serverId &&
          action.targetRequirements.length === 0 &&
          (action.choiceRequirements?.length ?? 0) === 0 &&
          totalClicks === 1 &&
          typeof totalCredits === "number" &&
          Number.isSafeInteger(totalCredits) &&
          totalCredits >= 0 &&
          totalCredits <= context.input.playerView.own.credits
        );
      })
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.kind === "score_protection_install") {
    if (
      signal.projection.actionId !== signal.actionId ||
      signal.projection.sourceCardInstanceId !== signal.sourceCardInstanceId ||
      signal.projection.sourceDefinitionId !== signal.sourceDefinitionId ||
      signal.projection.targetServerId !== signal.serverId ||
      signal.projection.effect !== signal.effect ||
      !exactInstallProjectionIsCurrent(context, signal.projection)
    ) {
      return [];
    }
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.actionId &&
          candidate.semanticActionType === "install.card" &&
          candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.sourceDefinitionId &&
          candidateTargetIds(candidate).includes(signal.serverId) &&
          scoreProtectionInstallActionMatches(context, candidate, signal),
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.kind === "score_protection_draw") {
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.actionId &&
          context.input.legalActions.some(
            (action) => action.actionId === candidate.actionId,
          ) &&
          corpCandidateProjectsCardDraw(candidate),
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.phase === "fund_rez_reserve") return [];
  if (signal.phase === "install_ice") {
    const route = signal.installRoute;
    const exactCandidates = exactGenericDefenseInstallCandidates(
      context,
      signal,
    );
    const stagingAssessment = assessFundingOnlyIceStaging({
      input: context.input,
      signal,
      productiveAlternativeExists: genericDefenseProductiveAlternativeExists(
        context,
        signal,
      ),
      fundingAlternativeExists: genericDefenseFundingAlternativeExists(
        context,
        signal,
      ),
    });
    if (
      !route ||
      (route.disposition !== "productive" && !stagingAssessment.admissible) ||
      !exactInstallProjectionMatchesSignal(context, signal, route.projection)
    ) {
      return [];
    }
    return exactCandidates.map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (signal.phase === "rez_response" && signal.rezRoute) {
    if (!exactIceRezRouteIsCurrent(context, signal, signal.rezRoute)) {
      return [];
    }
    return context.actionCandidates
      .filter(
        (candidate) =>
          candidate.actionId === signal.rezRoute!.actionId &&
          candidate.semanticActionType === "corp_window.rez" &&
          candidate.sourceCardInstanceId ===
            signal.rezRoute!.sourceCardInstanceId &&
          candidate.sourceDefinitionId === signal.rezRoute!.sourceDefinitionId,
      )
      .map((candidate) => ({ candidate, stepValue: 1 }));
  }
  if (
    (signal.phase === "resolve_install_targets" ||
      signal.phase === "resolve_run_redirect") &&
    signal.choiceResolution
  ) {
    const resolution = signal.choiceResolution;
    return context.actionCandidates
      .filter(
        (candidate) =>
          signal.actionIds?.includes(candidate.actionId) === true &&
          candidate.semanticActionType === "choice.resolve" &&
          context.input.legalActions.some(
            (action) =>
              action.actionId === candidate.actionId &&
              action.side === "corp" &&
              action.type === "resolve_choice" &&
              action.timingPoint === context.input.playerView.timingPoint &&
              action.expiresAtStateVersion ===
                context.input.playerView.stateVersion &&
              action.choiceRequirements?.length === 1 &&
              action.choiceRequirements[0]?.choiceId === resolution.choiceId,
          ),
      )
      .map((candidate) => ({ candidate, stepValue: signal.value }));
  }
  if (signal.phase === "resolve_post_pass_ice_lifecycle") {
    const routes = context.actionCandidates
      .filter((candidate) => {
        if (signal.actionIds?.includes(candidate.actionId) !== true) {
          return false;
        }
        const action = context.input.legalActions.find(
          (entry) => entry.actionId === candidate.actionId,
        );
        const sourceDefinitionId = signal.sourceDefinitionIds[0];
        const creditCost = action
          ? legalActionResourceCost(action, "credits")
          : undefined;
        const decision = action?.payload?.decision;
        const paymentAmount = action?.payload?.paymentAmount;
        return (
          signal.sourceDefinitionIds.length === 1 &&
          signal.targetIceInstanceId !== undefined &&
          candidate.actionType === "continue_run" &&
          candidate.semanticActionType === "run.continue" &&
          action?.type === "continue_run" &&
          action.side === "corp" &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.source === signal.targetIceInstanceId &&
          action.payload?.corpPostPassIceAbility ===
            "return_passed_ice_to_hq" &&
          action.payload.sourceDefinitionId === sourceDefinitionId &&
          action.payload.serverId === signal.serverId &&
          ((decision === "pay" &&
            knownNonNegativeInteger(paymentAmount) &&
            paymentAmount > 0 &&
            creditCost === paymentAmount) ||
            (decision === "return_to_hq" &&
              paymentAmount === undefined &&
              creditCost === 0) ||
            (decision === "decline" &&
              paymentAmount === undefined &&
              creditCost === 0))
        );
      })
      .map((candidate) => ({ candidate, stepValue: signal.value }));
    return routes;
  }
  return context.actionCandidates
    .filter((candidate) => {
      if (
        signal.actionIds !== undefined &&
        !signal.actionIds.includes(candidate.actionId)
      ) {
        return false;
      }
      if (
        signal.sourceDefinitionIds.length > 0 &&
        !signal.sourceDefinitionIds.includes(candidate.sourceDefinitionId ?? "")
      )
        return false;
      if (signal.phase === "install_defense_support")
        return (
          candidate.semanticActionType === "install.card" &&
          candidateTargetIds(candidate).includes(signal.serverId)
        );
      if (signal.phase === "draw_for_ice")
        return corpCandidateProjectsCardDraw(candidate);
      if (signal.phase === "activate_run_defense")
        return (
          candidate.semanticActionType === "card_ability.trigger" ||
          candidate.semanticActionType === "play.corp_operation"
        );
      return (
        candidate.semanticActionType ===
          (signal.phase === "decline_rez"
            ? "corp_window.decline_rez"
            : "corp_window.rez") &&
        (!signal.targetIceInstanceId ||
          candidate.sourceCardInstanceId === signal.targetIceInstanceId ||
          candidateTargetIds(candidate).includes(signal.targetIceInstanceId))
      );
    })
    .map((candidate) => ({ candidate, stepValue: signal.value }));
}

function exactGenericDefenseInstallCandidates(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
): ActionSemanticCandidate[] {
  const route = signal.installRoute;
  if (
    signal.phase !== "install_ice" ||
    !route ||
    !exactInstallProjectionMatchesSignal(context, signal, route.projection)
  ) {
    return [];
  }
  return context.actionCandidates.filter(
    (candidate) =>
      candidate.actionId === route.projection.actionId &&
      candidate.semanticActionType === "install.card" &&
      candidate.sourceCardInstanceId ===
        route.projection.sourceCardInstanceId &&
      candidate.sourceDefinitionId === route.projection.sourceDefinitionId &&
      candidateTargetIds(candidate).includes(route.projection.targetServerId) &&
      scoreProtectionInstallActionMatches(context, candidate, route.projection),
  );
}

function genericDefenseProductiveAlternativeExists(
  context: PlanSchedulerContext,
  fundingOnlySignal: CorpGenericDefenseSignal,
): boolean {
  const currentDomain = corpDomainIfAvailable(context);
  return (
    currentDomain?.defenseNeeds.some(
      (signal) =>
        signal !== fundingOnlySignal &&
        signal.kind === "generic" &&
        signal.phase === "install_ice" &&
        signal.installRoute?.disposition === "productive" &&
        exactGenericDefenseInstallCandidates(context, signal).length > 0,
    ) === true
  );
}

function genericDefenseFundingAlternativeExists(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
): boolean {
  const requirement = genericDefenseFundingRequirement(
    signal,
    context.input.playerView.own.credits,
  );
  if (
    !requirement ||
    !genericDefenseFundingRequirementIsCurrent(context, signal, requirement)
  )
    return false;
  const expectedNeedId = `defense-reserve:${signal.serverId}:${requirement.iceInstanceId}`;
  const need = corpDomainIfAvailable(context)?.economyNeeds.find(
    (candidate) =>
      candidate.kind === "parent_funding" &&
      candidate.needId === expectedNeedId &&
      candidate.parentNeedId === signal.defenseId &&
      candidate.immediateDefenseConversion === true &&
      candidate.gap === requirement.gap &&
      candidate.incrementalDefenseReserve?.targetCredits ===
        requirement.targetCredits &&
      candidate.incrementalDefenseReserve?.serverId === signal.serverId &&
      candidate.incrementalDefenseReserve?.iceInstanceId ===
        requirement.iceInstanceId,
  );
  return (
    need?.actionIds.some((actionId) =>
      context.actionCandidates.some(
        (candidate) =>
          candidate.actionId === actionId &&
          immediateCorpLiquidCreditGain(candidate) > 0 &&
          corpEconomyCandidateHasExecutablePayload(context.input, candidate),
      ),
    ) === true
  );
}

function genericDefenseFundingRequirement(
  signal: CorpGenericDefenseSignal,
  currentCredits?: number,
):
  | Readonly<{
      gap: number;
      targetCredits?: number;
      iceInstanceId: string;
    }>
  | undefined {
  if (
    signal.phase === "install_ice" &&
    signal.installRoute?.disposition === "funding_only"
  ) {
    const projection = signal.installRoute.projection;
    const gap = projection.after.minimumAdditionalCreditsToSatisfy;
    if (typeof gap !== "number" || !Number.isSafeInteger(gap) || gap <= 0) {
      return undefined;
    }
    return {
      gap,
      ...(typeof currentCredits === "number" &&
      Number.isSafeInteger(currentCredits) &&
      currentCredits >= 0
        ? { targetCredits: currentCredits + gap }
        : {}),
      iceInstanceId: projection.sourceCardInstanceId,
    };
  }
  const reserve = signal.rezReserveNeed;
  if (
    signal.phase !== "fund_rez_reserve" ||
    !signal.targetIceInstanceId ||
    !reserve ||
    !Number.isSafeInteger(reserve.currentCredits) ||
    !Number.isSafeInteger(reserve.requiredCredits) ||
    !Number.isSafeInteger(reserve.fundingGap) ||
    reserve.currentCredits < 0 ||
    reserve.requiredCredits <= reserve.currentCredits ||
    reserve.fundingGap !== reserve.requiredCredits - reserve.currentCredits
  ) {
    return undefined;
  }
  return {
    gap: reserve.fundingGap,
    targetCredits: reserve.requiredCredits,
    iceInstanceId: signal.targetIceInstanceId,
  };
}

function genericDefenseFundingRequirementIsCurrent(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  requirement: Readonly<{
    gap: number;
    targetCredits?: number;
    iceInstanceId: string;
  }>,
): boolean {
  if (signal.phase === "install_ice") {
    return (
      signal.installRoute?.disposition === "funding_only" &&
      signal.installRoute.projection.targetServerId === signal.serverId &&
      signal.installRoute.projection.sourceCardInstanceId ===
        requirement.iceInstanceId
    );
  }
  const reserve = signal.rezReserveNeed;
  const ice = context.input.playerView.servers
    .find((server) => server.id === signal.serverId)
    ?.ice.find(
      (candidate) => candidate.instanceId === requirement.iceInstanceId,
    );
  const quote = ice?.effectiveRezCostQuote;
  return (
    signal.phase === "fund_rez_reserve" &&
    reserve?.observedAtStateVersion === context.input.playerView.stateVersion &&
    reserve.currentCredits === context.input.playerView.own.credits &&
    reserve.requiredCredits === requirement.targetCredits &&
    ice?.rezzed !== true &&
    quote?.context === "installed" &&
    quote.cardId === requirement.iceInstanceId &&
    quote.targetServerId === signal.serverId &&
    quote.projectedServerId === signal.serverId &&
    quote.expiresAtStateVersion === context.input.playerView.stateVersion &&
    quote.complete === true &&
    quote.mandatoryAdditionalCosts.agendaPoints === 0 &&
    quote.finalCredits === requirement.targetCredits
  );
}

function corpDomainIfAvailable(
  context: PlanSchedulerContext,
): CorpCorePlanDomain | undefined {
  const value = context.domain as CorpCorePlanDomain | undefined;
  return value?.scoreProjects &&
    value.remoteProjects &&
    value.defenseNeeds &&
    value.economyNeeds
    ? value
    : undefined;
}

function exactIceRezRouteIsCurrent(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  route: CorpExactIceRezRouteProjection,
): boolean {
  if (
    route.targetServerId !== signal.serverId ||
    route.actionId !== signal.actionIds?.[0] ||
    signal.actionIds?.length !== 1 ||
    route.sourceCardInstanceId !== signal.targetIceInstanceId
  ) {
    return false;
  }
  const candidate = context.actionCandidates.find(
    (candidate) => candidate.actionId === route.actionId,
  );
  const sourceCard = context.input.playerView.servers
    .flatMap((server) => server.ice)
    .find((card) => card.instanceId === route.sourceCardInstanceId);
  if (!candidate || !sourceCard) return false;
  const expected = projectExactCorpIceRezRoute({
    input: context.input,
    candidate,
    sourceCard,
    targetServerId: signal.serverId,
  });
  return expected !== undefined && exactCorpIceRezRoutesEqual(route, expected);
}

function scoreProtectionInstallActionMatches(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal:
    | CorpScoreProtectionInstallSignal
    | KnownCorpFundedIceInstallRouteProjection,
): boolean {
  const source = authoritativeDefensePlacementSource(context, candidate);
  if (!source) return false;
  const payload = source.action.payload;
  const targetServerId =
    "serverId" in signal ? signal.serverId : signal.targetServerId;
  return (
    payload?.placement === "ice" &&
    payload.cardId === signal.sourceCardInstanceId &&
    (payload.sourceDefinitionId === undefined ||
      payload.sourceDefinitionId === signal.sourceDefinitionId) &&
    payload.serverId === targetServerId
  );
}

function exactInstallProjectionMatchesSignal(
  context: PlanSchedulerContext,
  signal: CorpGenericDefenseSignal,
  projection: KnownCorpFundedIceInstallRouteProjection,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.actionId !== signal.actionIds?.[0] ||
    signal.actionIds.length !== 1 ||
    projection.targetServerId !== signal.serverId ||
    signal.sourceDefinitionIds.length !== 1 ||
    signal.sourceDefinitionIds[0] !== projection.sourceDefinitionId ||
    !exactInstallProjectionIsCurrent(
      context,
      projection,
      signal.installRoute?.progressKind === "staged_central_defense",
      signal.installRoute?.progressKind ===
        "scoreline_central_tax_allocation" ||
        signal.installRoute?.progressKind ===
          "score_material_capacity_release" ||
        signal.installRoute?.progressKind ===
          "agenda_capacity_defense_conversion" ||
        signal.installRoute?.progressKind ===
          "funded_structured_central_defense",
    )
  ) {
    return false;
  }
  return true;
}

function exactInstallProjectionIsCurrent(
  context: PlanSchedulerContext,
  projection: KnownCorpFundedIceInstallRouteProjection,
  useMinimumSatisfyingRoute = false,
  useExactPostInstallSourceQuote = false,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.before.knowledge !== "known" ||
    projection.after.knowledge !== "known" ||
    !knownNonNegativeInteger(context.input.playerView.own.credits) ||
    !knownNonNegativeInteger(context.input.playerView.own.clicks) ||
    projection.before.availableCorpCredits !==
      context.input.playerView.own.credits ||
    projection.before.availableCorpClicks !==
      context.input.playerView.own.clicks
  ) {
    return false;
  }
  const action = context.input.legalActions.find(
    (candidate) => candidate.actionId === projection.actionId,
  );
  const routeRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.selectedRezCosts;
  const afterRouteRezCosts =
    useMinimumSatisfyingRoute && projection.selectedRezCosts.length === 0
      ? (projection.after.minimumSatisfyingRezCosts ?? [])
      : projection.after.selectedRezCosts;
  const projectedRezCost = routeRezCosts.find(
    (selected) =>
      selected.iceInstanceId === projection.sourceCardInstanceId &&
      selected.iceDefinitionId === projection.sourceDefinitionId &&
      selected.source === "engine_rez_cost_quote",
  );
  const projectedServerId =
    action?.payload?.postInstallRezQuoteProjectedServerId;
  const selectedPostInstallRezChoiceIsCurrent = useExactPostInstallSourceQuote
    ? action?.payload?.postInstallRezQuoteComplete === true
    : action?.payload && projectedRezCost
      ? postInstallRezSelectionMatchesCurrentQuote(
          action.payload,
          projectedRezCost,
        )
      : false;
  const selectedRezCostsAreCurrent =
    useExactPostInstallSourceQuote ||
    (selectedRezCostSetsEqual(routeRezCosts, afterRouteRezCosts) &&
      selectedRezCostsAreUnique(routeRezCosts) &&
      routeRezCosts.every((selected) =>
        selected.iceInstanceId === projection.sourceCardInstanceId
          ? selected === projectedRezCost
          : currentInstalledRezQuoteMatchesSelection(
              context,
              selected,
              projectedServerId,
            ),
      ));
  return (
    action?.expiresAtStateVersion === context.input.playerView.stateVersion &&
    action.side === "corp" &&
    action.type === "install_card" &&
    action.source === projection.sourceCardInstanceId &&
    action.payload?.placement === "ice" &&
    action.payload.cardId === projection.sourceCardInstanceId &&
    action.payload.serverId === projection.targetServerId &&
    action.payload.postInstallRezQuoteComplete === true &&
    action.payload.postInstallRezQuoteCardId ===
      projection.sourceCardInstanceId &&
    action.payload.postInstallRezQuoteTargetServerId ===
      projection.targetServerId &&
    action.payload.postInstallRezQuoteExpiresAtStateVersion ===
      context.input.playerView.stateVersion &&
    validPostInstallProjectedServerBinding(
      projection.targetServerId,
      action.payload.postInstallRezQuoteProjectedServerId,
    ) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteBaseCredits) &&
    knownNonNegativeInteger(action.payload.postInstallRezQuoteFinalCredits) &&
    knownNonNegativeInteger(
      action.payload.postInstallRezQuoteMandatoryAgendaPointCost,
    ) &&
    action.payload.postInstallRezQuoteMandatoryAgendaPointCost === 0 &&
    action.payload.postInstallRezQuoteMandatoryAdditionalCostKind ===
      undefined &&
    validPostInstallRezQuoteModifiers(action.payload) &&
    selectedPostInstallRezChoiceIsCurrent &&
    selectedRezCostsAreCurrent &&
    legalActionResourceCost(action, "credits") === projection.installCredits &&
    legalActionResourceCost(action, "clicks") === projection.installClicks
  );
}

function selectedRezCostsAreUnique(
  costs: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  return (
    costs.length > 0 &&
    new Set(costs.map((cost) => cost.iceInstanceId)).size === costs.length
  );
}

function selectedRezCostSetsEqual(
  left: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
  right: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  if (left.length !== right.length) return false;
  const rightByInstanceId = new Map(
    right.map((cost) => [cost.iceInstanceId, cost] as const),
  );
  return (
    rightByInstanceId.size === right.length &&
    left.every((cost) => {
      const matching = rightByInstanceId.get(cost.iceInstanceId);
      return (
        matching?.iceDefinitionId === cost.iceDefinitionId &&
        matching.credits === cost.credits &&
        matching.source === cost.source
      );
    })
  );
}

function currentInstalledRezQuoteMatchesSelection(
  context: PlanSchedulerContext,
  selected: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
  projectedServerId: unknown,
): boolean {
  if (
    typeof projectedServerId !== "string" ||
    selected.source !== "engine_rez_cost_quote"
  ) {
    return false;
  }
  const matches = context.input.playerView.servers.flatMap((server) =>
    server.ice
      .filter((ice) => ice.instanceId === selected.iceInstanceId)
      .map((ice) => ({ ice, serverId: server.id })),
  );
  if (matches.length !== 1) return false;
  const match = matches[0]!;
  const quote = match.ice.effectiveRezCostQuote;
  const selectedInstalledRezCredits =
    quote?.complete === true
      ? selectedInstalledRezCreditsFromCurrentQuote(quote)
      : undefined;
  if (
    match.serverId !== projectedServerId ||
    match.ice.known !== true ||
    match.ice.type !== "ice" ||
    match.ice.definitionId !== selected.iceDefinitionId ||
    match.ice.rezzed !== false ||
    quote?.context !== "installed" ||
    quote.complete !== true ||
    quote.cardId !== selected.iceInstanceId ||
    quote.targetServerId !== projectedServerId ||
    quote.projectedServerId !== projectedServerId ||
    quote.expiresAtStateVersion !== context.input.playerView.stateVersion ||
    !knownNonNegativeInteger(quote.baseCredits) ||
    !knownNonNegativeInteger(quote.finalCredits) ||
    selectedInstalledRezCredits === undefined ||
    selectedInstalledRezCredits !== selected.credits ||
    !validMandatoryInstalledRezCosts(quote.mandatoryAdditionalCosts) ||
    !validDefinitionIdArray(quote.reductionSourceDefinitionIds) ||
    !validDefinitionIdArray(quote.increaseSourceDefinitionIds)
  ) {
    return false;
  }
  const reductions = quote.reductionSourceDefinitionIds ?? [];
  const increases = quote.increaseSourceDefinitionIds ?? [];
  return (
    definitionIdListsAreDisjoint(reductions, increases) &&
    (quote.baseCredits === quote.finalCredits ||
      reductions.length + increases.length > 0)
  );
}

const POST_INSTALL_VARIABLE_REZ_FIELDS = [
  "postInstallRezQuoteVariableRezKind",
  "postInstallRezQuoteVariableAdditionalCreditsPerValue",
  "postInstallRezQuoteVariableMinValue",
  "postInstallRezQuoteVariableMaxValue",
  "postInstallRezQuoteVariableMinValueFinalCredits",
  "postInstallRezQuoteVariableMaxValueFinalCredits",
  "postInstallRezQuoteVariableEffectiveStrengthFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
  "postInstallRezQuoteVariableMinSubroutines",
  "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
  "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
  "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
  "postInstallRezQuoteVariableBaseSubtypes",
  "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
  "postInstallRezQuoteVariableAlternateSubtypes",
  "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
  "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
] as const;

function selectedPostInstallRezCreditsFromCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): number | undefined {
  const finalBaseCredits = payload.postInstallRezQuoteFinalCredits;
  if (!knownNonNegativeInteger(finalBaseCredits)) return undefined;
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return postInstallVariableRezFieldsAreAbsent(payload)
      ? finalBaseCredits
      : undefined;
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return undefined;
  const kind = payload.postInstallRezQuoteVariableRezKind;
  if (kind === "x_strength") return undefined;
  if (kind === "paid_end_the_run_subroutines") {
    if (
      !postInstallVariableRezFieldsMatchFamily(payload, [
        "postInstallRezQuoteVariableRezKind",
        "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
        "postInstallRezQuoteVariableMinSubroutines",
        "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
        "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
        "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
      ])
    ) {
      return undefined;
    }
    return selectedVariableRezCredits(
      {
        kind,
        additionalCreditsPerSubroutine:
          payload.postInstallRezQuoteVariableAdditionalCreditsPerSubroutine,
        minSubroutines: payload.postInstallRezQuoteVariableMinSubroutines,
        minSubroutinesFinalCredits:
          payload.postInstallRezQuoteVariableMinSubroutinesFinalCredits,
        firstEndTheRunSubroutineCount:
          payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount,
        firstEndTheRunFinalCredits:
          payload.postInstallRezQuoteVariableFirstEndTheRunFinalCredits,
      },
      finalBaseCredits,
    );
  }
  if (kind !== "alternate_subtype") return undefined;
  if (
    !postInstallVariableRezFieldsMatchFamily(payload, [
      "postInstallRezQuoteVariableRezKind",
      "postInstallRezQuoteVariableBaseSubtypes",
      "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
      "postInstallRezQuoteVariableAlternateSubtypes",
      "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
      "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
    ])
  ) {
    return undefined;
  }
  return selectedVariableRezCredits(
    {
      kind,
      baseSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableBaseSubtypes,
      ),
      baseSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits,
      alternateSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableAlternateSubtypes,
      ),
      alternateSubtypesAdditionalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits,
      alternateSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits,
    },
    finalBaseCredits,
  );
}

function postInstallRezSelectionMatchesCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  selection: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"][number],
): boolean {
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return (
      selection.variableRezChoice === undefined &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return false;
  const choice = selection.variableRezChoice;
  if (!choice) {
    return (
      selection.credits ===
      selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (choice.kind === "paid_end_the_run_subroutines") {
    return (
      choice.subroutineCount ===
        payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount &&
      selection.credits ===
        selectedPostInstallRezCreditsFromCurrentQuote(payload)
    );
  }
  if (
    choice.kind !== "alternate_subtype" ||
    payload.postInstallRezQuoteVariableRezKind !== "alternate_subtype"
  ) {
    return false;
  }
  const selectedSubtypes = canonicalSubtypeArray(choice.selectedSubtypes);
  const baseSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableBaseSubtypes,
  );
  const alternateSubtypes = canonicalSubtypeCsv(
    payload.postInstallRezQuoteVariableAlternateSubtypes,
  );
  if (!selectedSubtypes || !baseSubtypes || !alternateSubtypes) return false;
  const selectedKey = selectedSubtypes.join(",");
  if (selectedKey === baseSubtypes.join(",")) {
    return (
      selection.credits ===
      payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits
    );
  }
  return (
    selectedKey === alternateSubtypes.join(",") &&
    selection.credits ===
      payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits
  );
}

function selectedInstalledRezCreditsFromCurrentQuote(
  quote: VisibleCorpRezCostQuote,
): number | undefined {
  if (quote.complete !== true || !knownNonNegativeInteger(quote.finalCredits)) {
    return undefined;
  }
  if (quote.costKind === "fixed") return quote.finalCredits;
  return selectedVariableRezCredits(
    quote.variableParameter,
    quote.finalCredits,
  );
}

function selectedVariableRezCredits(
  value: unknown,
  finalBaseCredits: number,
): number | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !knownNonNegativeInteger(finalBaseCredits)
  ) {
    return undefined;
  }
  const parameter = value as Record<string, unknown>;
  if (parameter.kind === "x_strength") return undefined;
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const additionalCreditsPerSubroutine =
      parameter.additionalCreditsPerSubroutine;
    const minSubroutines = parameter.minSubroutines;
    const minSubroutinesFinalCredits = parameter.minSubroutinesFinalCredits;
    const firstEndTheRunSubroutineCount =
      parameter.firstEndTheRunSubroutineCount;
    const firstEndTheRunFinalCredits = parameter.firstEndTheRunFinalCredits;
    return knownPositiveInteger(additionalCreditsPerSubroutine) &&
      knownNonNegativeInteger(minSubroutines) &&
      knownNonNegativeInteger(minSubroutinesFinalCredits) &&
      minSubroutinesFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          minSubroutines,
          additionalCreditsPerSubroutine,
        ) &&
      knownPositiveInteger(firstEndTheRunSubroutineCount) &&
      firstEndTheRunSubroutineCount === Math.max(1, minSubroutines) &&
      knownNonNegativeInteger(firstEndTheRunFinalCredits) &&
      firstEndTheRunFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          firstEndTheRunSubroutineCount,
          additionalCreditsPerSubroutine,
        )
      ? firstEndTheRunFinalCredits
      : undefined;
  }
  if (parameter.kind !== "alternate_subtype") return undefined;
  const baseSubtypes = canonicalSubtypeArray(parameter.baseSubtypes);
  const alternateSubtypes = canonicalSubtypeArray(parameter.alternateSubtypes);
  const baseSubtypesFinalCredits = parameter.baseSubtypesFinalCredits;
  const alternateSubtypesAdditionalCredits =
    parameter.alternateSubtypesAdditionalCredits;
  const alternateSubtypesFinalCredits = parameter.alternateSubtypesFinalCredits;
  return baseSubtypes &&
    alternateSubtypes &&
    baseSubtypes.join(",") !== alternateSubtypes.join(",") &&
    knownNonNegativeInteger(baseSubtypesFinalCredits) &&
    baseSubtypesFinalCredits === finalBaseCredits &&
    knownPositiveInteger(alternateSubtypesAdditionalCredits) &&
    knownNonNegativeInteger(alternateSubtypesFinalCredits) &&
    alternateSubtypesFinalCredits ===
      safeRezCreditTotal(
        finalBaseCredits,
        1,
        alternateSubtypesAdditionalCredits,
      )
    ? alternateSubtypesFinalCredits
    : undefined;
}

function postInstallVariableRezFieldsAreAbsent(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined,
  );
}

function postInstallVariableRezFieldsMatchFamily(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  allowedFields: readonly (typeof POST_INSTALL_VARIABLE_REZ_FIELDS)[number][],
): boolean {
  const allowed = new Set(allowedFields);
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined || allowed.has(field),
  );
}

function canonicalSubtypeCsv(value: unknown): string[] | undefined {
  return typeof value === "string"
    ? canonicalSubtypeArray(value.split(","))
    : undefined;
}

function canonicalSubtypeArray(value: unknown): string[] | undefined {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (subtype, index) =>
        typeof subtype !== "string" ||
        !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype) ||
        (index > 0 && value[index - 1]! >= subtype),
    )
  ) {
    return undefined;
  }
  return value as string[];
}

function safeRezCreditTotal(
  baseCredits: number,
  quantity: number,
  creditsPerUnit: number,
): number | undefined {
  const additionalCredits = quantity * creditsPerUnit;
  const totalCredits = baseCredits + additionalCredits;
  return knownNonNegativeInteger(additionalCredits) &&
    knownNonNegativeInteger(totalCredits)
    ? totalCredits
    : undefined;
}

function knownPositiveInteger(value: unknown): value is number {
  return knownNonNegativeInteger(value) && value > 0;
}

function validMandatoryInstalledRezCosts(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const costs = value as Record<string, unknown>;
  return (
    Object.keys(costs).length === 1 &&
    knownNonNegativeInteger(costs.agendaPoints) &&
    costs.agendaPoints === 0
  );
}

function validDefinitionIdArray(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    Array.isArray(value) &&
    value.every(
      (id, index) =>
        typeof id === "string" &&
        id.length > 0 &&
        (index === 0 || value[index - 1]! < id),
    )
  );
}

function definitionIdListsAreDisjoint(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const leftIds = new Set(left);
  return right.every((id) => !leftIds.has(id));
}

function validPostInstallRezQuoteModifiers(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  const reductionIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (reductionIds === undefined || increaseIds === undefined) return false;
  return (
    definitionIdListsAreDisjoint(reductionIds, increaseIds) &&
    (payload.postInstallRezQuoteBaseCredits ===
      payload.postInstallRezQuoteFinalCredits ||
      reductionIds.length + increaseIds.length > 0)
  );
}

function validPostInstallProjectedServerBinding(
  targetServerId: string,
  projectedServerId: unknown,
): boolean {
  return targetServerId === "new_remote"
    ? typeof projectedServerId === "string" &&
        /^remote_[1-9]\d*$/.test(projectedServerId)
    : projectedServerId === targetServerId;
}

function validCommaSeparatedDefinitionIds(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "string" || value.length === 0) return false;
  const ids = value.split(",");
  return ids.every(
    (id, index) => id.length > 0 && (index === 0 || ids[index - 1]! < id),
  );
}

function commaSeparatedDefinitionIds(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (!validCommaSeparatedDefinitionIds(value)) return undefined;
  return (value as string).split(",");
}

function legalActionResourceCost(
  action: AiDecisionInput["legalActions"][number],
  resource: "credits" | "clicks",
): number | undefined {
  let total = 0;
  for (const cost of action.costs) {
    const amount = cost[resource] ?? 0;
    if (!knownNonNegativeInteger(amount)) return undefined;
    total += amount;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function defensePortfolioCandidates(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PlanMaterialization["candidates"] {
  return selectedDefensePortfolioBand(context, signals, centralAllocation)
    .candidates;
}

type SelectedDefensePortfolioBand =
  | Readonly<{
      kind: "score";
      route: SelectedScoreProtectionRoute;
      priorityClass: CorpScorePriorityClass;
      candidates: PlanMaterialization["candidates"];
    }>
  | Readonly<{
      kind: "generic";
      eligibleSignals: readonly CorpGenericDefenseSignal[];
      priorityClass: "P2" | "P3" | "P5" | "P6";
      candidates: PlanMaterialization["candidates"];
    }>;

function scoreResourceGaps(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): ResourceGap[] {
  const resourceGaps: ResourceGap[] = [];
  if (signal.phase === "select_agenda") {
    resourceGaps.push({
      needId: `score-material:${signal.projectId}`,
      capability: "draw_score_agenda_material",
      minimum: 1,
      available: 0,
      deadline: "multi_turn",
    });
  }
  if (signal.setupNeed) {
    const expectedNeedId = `score-setup:${signal.projectId}:${signal.setupNeed.sourceCardInstanceId}`;
    if (
      signal.phase === "select_agenda" ||
      signal.setupNeed.needId !== expectedNeedId ||
      !signal.setupNeed.actionId.trim() ||
      !signal.setupNeed.sourceDefinitionId.trim()
    ) {
      throw new PlanResolutionFailure("invalid_support_graph", {
        side: context.input.side,
        stateVersion: context.input.playerView.stateVersion,
        timingPoint: context.input.playerView.timingPoint,
        legalActionTypes: context.input.legalActions.map(
          (action) => action.type,
        ),
        unresolvedActionIds: signal.setupNeed.actionId
          ? [signal.setupNeed.actionId]
          : [],
        owner: "support_graph",
        planInstanceId: planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: signal.projectId,
        }),
        removalCondition:
          "Bind score-acceleration setup only to the exact concrete score parent, exact current setup action, and stable source-scoped need.",
      });
    }
    resourceGaps.push({
      needId: signal.setupNeed.needId,
      capability: "install_score_acceleration_support",
      minimum: 1,
      available: 0,
      deadline: "multi_turn",
    });
  }
  const fundingGap = signal.fundingGap;
  const knownProtectionFundingGap =
    signal.protectionNeed?.baseline.knowledge === "known"
      ? (signal.protectionNeed.baseline.minimumAdditionalCreditsToSatisfy ?? 0)
      : 0;
  const hasExactCurrentAdvanceHead =
    signal.phase === "advance_agenda" &&
    signal.feasible &&
    knownProtectionFundingGap === 0 &&
    scoreCandidates(context, signal).length > 0;
  const hasExactCurrentScopedInstallHead =
    signal.phase === "install_agenda" &&
    signal.feasible &&
    signal.uncertainty?.currentActionScope === "exact_install_only" &&
    scoreCandidates(context, signal).length > 0;
  if (
    !hasExactCurrentAdvanceHead &&
    !hasExactCurrentScopedInstallHead &&
    typeof fundingGap === "number" &&
    Number.isSafeInteger(fundingGap) &&
    fundingGap > 0
  ) {
    resourceGaps.push({
      needId: `score-support:${signal.projectId}`,
      capability: "credits",
      minimum: fundingGap,
      available: 0,
      deadline: signal.sameTurnCloseout ? "current_turn" : "multi_turn",
    });
  }
  const protectionProvider = domain(context).defenseNeeds.find(
    (
      defense,
    ): defense is Exclude<CorpDefenseSignal, CorpGenericDefenseSignal> =>
      defense.kind !== "generic" &&
      defense.parentProjectId === signal.projectId,
  );
  if (!protectionProvider) return resourceGaps;
  const protectionNeed = signal.protectionNeed;
  if (
    !protectionNeed ||
    protectionNeed.parentProjectId !== signal.projectId ||
    protectionNeed.targetServerId !== protectionProvider.serverId ||
    protectionNeed.observedAtStateVersion !==
      context.input.playerView.stateVersion
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: [protectionProvider.actionId],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.score_agenda",
        dedupeKey: signal.projectId,
      }),
      removalCondition:
        "Bind score-protection support only to the exact current Engine-assessed protection need of its resident score parent.",
    });
  }
  resourceGaps.push({
    needId: protectionNeed.needId,
    capability: "protect_parent_target",
    minimum: 1,
    available: 0,
    deadline: signal.sameTurnCloseout ? "current_turn" : "multi_turn",
  });
  return resourceGaps;
}

function genericScoreMaterialIntentFit(
  context: PlanSchedulerContext,
  signal: CorpScoreProjectSignal,
): PlanAssessment["intentFit"] {
  const strategicIntent = (
    context.input as AiDecisionInput & {
      ownStrategicIntentState?: {
        side?: unknown;
        primaryStrategy?: { family?: unknown };
      };
    }
  ).ownStrategicIntentState;
  if (
    strategicIntent?.side === "corp" &&
    (strategicIntent.primaryStrategy?.family === "corp_scoreline" ||
      strategicIntent.primaryStrategy?.family === "corp_fast_advance")
  ) {
    return "aligned";
  }
  const exactTarget = corpScorePlanTarget(signal);
  const exactTacticalEvidence = context.transientSignals?.some(
    (transientSignal) =>
      transientSignal.signalId === `corp-score-material:${signal.projectId}` &&
      transientSignal.side === "corp" &&
      transientSignal.observedAtStateVersion ===
        context.input.playerView.stateVersion &&
      transientSignal.planModuleId === "corp.score_agenda" &&
      transientSignal.planDedupeKey === signal.projectId &&
      transientSignal.kind === "goal" &&
      transientSignal.scope === "tactical" &&
      transientSignal.evidenceCode ===
        "corp_score_campaign_missing_agenda_material" &&
      transientSignal.target?.kind === exactTarget.kind &&
      transientSignal.target.id === exactTarget.id,
  );
  return exactTacticalEvidence ? "tactical_override" : "none";
}

function exactScoreProtectionParentNeedId(
  context: PlanSchedulerContext,
  signal: Exclude<CorpDefenseSignal, CorpGenericDefenseSignal>,
): string {
  const project = domain(context).scoreProjects.find(
    (candidate) => candidate.projectId === signal.parentProjectId,
  );
  const protectionNeed = project?.protectionNeed;
  if (
    !signal.parentNeedId.trim() ||
    (project !== undefined &&
      (!protectionNeed ||
        protectionNeed.needId !== signal.parentNeedId ||
        protectionNeed.parentProjectId !== project.projectId ||
        protectionNeed.targetServerId !== signal.serverId ||
        signal.delegatedPriorityClass !== corpScorePriorityClass(project) ||
        protectionNeed.observedAtStateVersion !==
          context.input.playerView.stateVersion))
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: [signal.actionId],
      owner: "support_graph",
      planInstanceId: planInstanceIdForProposal({
        moduleId: "corp.defend_servers",
        dedupeKey: "server-defense-portfolio",
      }),
      removalCondition:
        "Bind the global defense provider to the exact current protection need of its score parent.",
    });
  }
  return signal.parentNeedId;
}

function defenseResourceGaps(
  selectedBand: SelectedDefensePortfolioBand,
): ResourceGap[] {
  if (selectedBand.kind !== "generic" || selectedBand.candidates.length > 0)
    return [];
  return selectedBand.eligibleSignals.flatMap((signal) => {
    const requirement = genericDefenseFundingRequirement(signal);
    if (!requirement) return [];
    return [
      {
        needId: signal.defenseId,
        capability: "credits",
        minimum: requirement.gap,
        available: 0,
        deadline: signal.urgent ? "current_turn" : "multi_turn",
      } satisfies ResourceGap,
    ];
  });
}

function selectedDefensePortfolioBand(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): SelectedDefensePortfolioBand {
  const validSignals = validDefenseSignals(signals, context);
  const genericSignals = validSignals.filter(isGenericDefenseSignal);
  const selectedGenericBand = selectedGenericDefensePortfolioBand(
    context,
    genericSignals,
    centralAllocation,
  );
  const scoreProtectionRoute = selectedScoreProtectionRoute(
    context,
    validSignals,
  );
  const scorelineCentralTaxSignals = genericSignals.filter(
    (signal) =>
      signal.phase === "install_ice" &&
      signal.installRoute?.progressKind === "scoreline_central_tax_allocation",
  );
  const scorelineCentralTaxCandidates = genericDefensePortfolioCandidates(
    context,
    scorelineCentralTaxSignals,
    centralAllocation,
  );
  if (
    scoreProtectionRoute?.signal.kind === "score_protection_draw" &&
    scorelineCentralTaxCandidates.length > 0
  ) {
    return {
      kind: "generic",
      eligibleSignals: scorelineCentralTaxSignals,
      priorityClass: "P3",
      candidates: scorelineCentralTaxCandidates,
    };
  }
  const genericPriority = selectedGenericBand.priorityClass;
  const genericCandidates = selectedGenericBand.candidates;
  const genericBandAvailable =
    genericCandidates.length > 0 || selectedGenericBand.supportable;
  const scoreCandidates = scoreProtectionRoute
    ? [
        {
          candidate: scoreProtectionRoute.candidate,
          stepValue:
            scoreProtectionRoute.signal.kind === "score_protection_install" &&
            scoreProtectionRoute.signal.effect === "satisfied"
              ? 2
              : 1,
        },
      ]
    : [];
  if (
    scoreProtectionRoute &&
    (!genericBandAvailable ||
      defensePriorityRank(scoreProtectionRoute.signal.delegatedPriorityClass) <
        defensePriorityRank(genericPriority) ||
      (scoreProtectionRoute.signal.kind === "score_protection_install" &&
        defensePriorityRank(
          scoreProtectionRoute.signal.delegatedPriorityClass,
        ) === defensePriorityRank(genericPriority)))
  ) {
    return {
      kind: "score",
      route: scoreProtectionRoute,
      priorityClass: scoreProtectionRoute.signal.delegatedPriorityClass,
      candidates: scoreCandidates,
    };
  }
  if (genericBandAvailable || !scoreProtectionRoute) {
    return {
      kind: "generic",
      eligibleSignals: selectedGenericBand.eligibleSignals,
      priorityClass: genericPriority,
      candidates: genericCandidates,
    };
  }
  return {
    kind: "score",
    route: scoreProtectionRoute,
    priorityClass: scoreProtectionRoute.signal.delegatedPriorityClass,
    candidates: scoreCandidates,
  };
}

function selectedGenericDefensePortfolioBand(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): Readonly<{
  eligibleSignals: readonly CorpGenericDefenseSignal[];
  priorityClass: "P2" | "P3" | "P5" | "P6";
  candidates: PlanMaterialization["candidates"];
  supportable: boolean;
}> {
  const windowEligibleSignals = urgentDefenseBand(context, signals);
  const priorityClasses = ["P2", "P3", "P5", "P6"] as const;
  for (const priorityClass of priorityClasses) {
    const prioritySignals = windowEligibleSignals.filter(
      (signal) => corpGenericDefensePriorityClass([signal]) === priorityClass,
    );
    if (prioritySignals.length === 0) continue;
    const candidates = genericDefensePortfolioCandidates(
      context,
      prioritySignals,
      centralAllocation,
    );
    const supportable = genericDefenseBandHasExactFundingSupport(
      context,
      prioritySignals,
    );
    if (candidates.length > 0 || supportable) {
      return {
        eligibleSignals: prioritySignals,
        priorityClass,
        candidates,
        supportable,
      };
    }
  }
  const priorityClass = corpGenericDefensePriorityClass(windowEligibleSignals);
  return {
    eligibleSignals: windowEligibleSignals.filter(
      (signal) => corpGenericDefensePriorityClass([signal]) === priorityClass,
    ),
    priorityClass,
    candidates: [],
    supportable: false,
  };
}

function genericDefenseBandHasExactFundingSupport(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): boolean {
  return signals.some((signal) =>
    genericDefenseFundingAlternativeExists(context, signal),
  );
}

function genericDefensePortfolioCandidates(
  context: PlanSchedulerContext,
  eligibleSignals: readonly CorpGenericDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): PlanMaterialization["candidates"] {
  const targetChoiceSignals = eligibleSignals.filter(
    (signal) => signal.phase === "resolve_install_targets",
  );
  if (targetChoiceSignals.length > 0) {
    return selectedDirectDefenseRoute(context, targetChoiceSignals);
  }
  const urgentRezSignals = eligibleSignals.filter(
    (signal) => signal.urgent && !isDefensePlacementPhase(signal.phase),
  );
  if (urgentRezSignals.length > 0) {
    return selectedDirectDefenseRoute(context, urgentRezSignals);
  }
  if (eligibleSignals.some((signal) => signal.urgent)) {
    return selectedExactGenericDefenseRoutes(
      context,
      eligibleSignals,
      centralAllocation,
    );
  }
  const lockedInstallSequenceSignals = eligibleSignals.filter(
    (signal) => signal.immediateInstallSupport === true,
  );
  if (lockedInstallSequenceSignals.length > 0) {
    const rezHeads = lockedInstallSequenceSignals.filter(
      (signal) => signal.phase === "rez_response",
    );
    if (rezHeads.length > 0) {
      return selectedDirectDefenseRoute(context, rezHeads);
    }
    return selectedExactGenericDefenseRoutes(
      context,
      lockedInstallSequenceSignals,
      centralAllocation,
    );
  }

  const allocatedPlacements = selectedExactGenericDefenseRoutes(
    context,
    eligibleSignals.filter((signal) => isDefensePlacementPhase(signal.phase)),
    centralAllocation,
  );
  const rezCandidates = selectedDirectDefenseRoute(
    context,
    eligibleSignals.filter((signal) => !isDefensePlacementPhase(signal.phase)),
  );
  return rezCandidates.length > 0 ? rezCandidates : allocatedPlacements;
}

function selectedDirectDefenseRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): PlanMaterialization["candidates"] {
  const exactRezRoutes = signals
    .filter(
      (
        signal,
      ): signal is CorpGenericDefenseSignal & {
        rezRoute: CorpExactIceRezRouteProjection;
      } => signal.phase === "rez_response" && signal.rezRoute !== undefined,
    )
    .flatMap((signal) =>
      defenseCandidates(context, signal).map((route) => ({
        ...route,
        projection: signal.rezRoute,
      })),
    )
    .sort(compareExactIceRezRoutes);
  if (exactRezRoutes[0]) {
    return [
      {
        candidate: exactRezRoutes[0].candidate,
        stepValue: exactRezRoutes[0].stepValue,
      },
    ];
  }
  return dedupeDefenseCandidates(context, signals)
    .sort(
      (left, right) =>
        right.stepValue - left.stepValue ||
        technicalCompare(left.candidate.actionId, right.candidate.actionId),
    )
    .slice(0, 1);
}

function compareExactIceRezRoutes(
  left: {
    candidate: ActionSemanticCandidate;
    projection: CorpExactIceRezRouteProjection;
  },
  right: {
    candidate: ActionSemanticCandidate;
    projection: CorpExactIceRezRouteProjection;
  },
): number {
  if (left.projection.effect !== right.projection.effect) {
    return left.projection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison =
    left.projection.after && right.projection.after
      ? compareExactProbabilities(
          left.projection.after.runnerAccessSuccessProbability,
          right.projection.after.runnerAccessSuccessProbability,
        )
      : undefined;
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  return (
    left.projection.totalRezCredits - right.projection.totalRezCredits ||
    technicalCompare(left.candidate.actionId, right.candidate.actionId)
  );
}

function selectedExactGenericDefenseRoutes(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
  allocation: CorpCentralDefenseAllocation | undefined,
): PlanMaterialization["candidates"] {
  const exactIceRoutes = signals
    .filter(
      (
        signal,
      ): signal is CorpGenericDefenseSignal & {
        phase: "install_ice";
        installRoute: {
          disposition: "productive" | "funding_only";
          projection: KnownCorpFundedIceInstallRouteProjection;
        };
      } =>
        signal.phase === "install_ice" &&
        (signal.installRoute?.disposition === "productive" ||
          signal.installRoute?.disposition === "funding_only"),
    )
    .flatMap((signal) =>
      defenseCandidates(context, signal).map((route) => ({
        ...route,
        signal,
        projection: signal.installRoute.projection,
      })),
    );
  const supportRoutes = dedupeDefenseCandidates(
    context,
    signals.filter((signal) => signal.phase === "install_defense_support"),
  );
  if (exactIceRoutes.length === 0) return supportRoutes;
  const centralServerForRoute = (
    route: (typeof exactIceRoutes)[number],
  ): "hq" | "rd" | undefined =>
    route.projection.targetServerId === "hq" ||
    route.projection.targetServerId === "rd"
      ? route.projection.targetServerId
      : undefined;
  const hqRoutes = exactIceRoutes.filter(
    (route) => centralServerForRoute(route) === "hq",
  );
  const rdRoutes = exactIceRoutes.filter(
    (route) => centralServerForRoute(route) === "rd",
  );
  const boundedUnknownAllocationCentralRoutes = exactIceRoutes.filter(
    (route) =>
      centralServerForRoute(route) !== undefined &&
      (route.signal.installRoute?.progressKind ===
        "score_material_capacity_release" ||
        route.signal.installRoute?.progressKind ===
          "agenda_capacity_defense_conversion" ||
        route.signal.installRoute?.progressKind ===
          "funded_structured_central_defense"),
  );
  let eligibleRoutes = exactIceRoutes;
  if (hqRoutes.length > 0 || rdRoutes.length > 0) {
    if (
      allocation?.status !== "known" &&
      hqRoutes.length > 0 &&
      rdRoutes.length > 0
    ) {
      eligibleRoutes = [
        ...exactIceRoutes.filter(
          (route) => centralServerForRoute(route) === undefined,
        ),
        ...boundedUnknownAllocationCentralRoutes,
      ];
    } else if (
      allocation?.status === "known" &&
      allocation.canonicalNearTieCandidateServerIds.length === 2 &&
      hqRoutes.length > 0 &&
      rdRoutes.length > 0
    ) {
      eligibleRoutes = [
        [...hqRoutes].sort(compareGenericExactInstallRoutes)[0]!,
        [...rdRoutes].sort(compareGenericExactInstallRoutes)[0]!,
      ];
    } else if (allocation?.status === "known") {
      const selectedCentralRoutes =
        allocation.selectedServerId === "hq" ? hqRoutes : rdRoutes;
      const fallbackCentralRoutes =
        allocation.selectedServerId === "hq" ? rdRoutes : hqRoutes;
      const fallbackServerId =
        allocation.selectedServerId === "hq" ? "rd" : "hq";
      const selectedPressure =
        allocation.evidence[allocation.selectedServerId].threat;
      const allocationLocked =
        (selectedPressure === "acute" || selectedPressure === "terminal") &&
        selectedCentralAccessRiskRemains(context, allocation);
      const fallbackServer = context.input.playerView.servers.find(
        (server) => server.id === fallbackServerId,
      );
      const knownCorpHandOverflow =
        Number.isSafeInteger(context.input.playerView.own.gripOrHq.length) &&
        Number.isSafeInteger(context.input.playerView.own.maxHandSize) &&
        context.input.playerView.own.gripOrHq.length >
          context.input.playerView.own.maxHandSize;
      const fallbackHasIndependentValue =
        fallbackServer?.ice.length === 0 ||
        allocation.evidence[fallbackServerId].threat !== "none" ||
        knownCorpHandOverflow;
      const allocatedCentralRoutes =
        selectedCentralRoutes.length > 0
          ? selectedCentralRoutes
          : fallbackCentralRoutes.length > 0 &&
              !allocationLocked &&
              fallbackHasIndependentValue
            ? fallbackCentralRoutes
            : [];
      // The allocation orders HQ against R&D. It must not remove an exact
      // route for Archives or another independently assessed server.
      eligibleRoutes = [
        ...exactIceRoutes.filter(
          (route) =>
            centralServerForRoute(route) === undefined &&
            (!allocationLocked ||
              route.signal.urgent ||
              isVisibleAgendaExposureDefense(route.signal)),
        ),
        ...allocatedCentralRoutes,
      ];
    }
  }
  if (
    allocation?.status === "known" &&
    allocation.canonicalNearTieCandidateServerIds.length === 2
  ) {
    return eligibleRoutes.map(({ candidate, stepValue }) => ({
      candidate,
      stepValue,
    }));
  }
  const selected = [...eligibleRoutes].sort(
    compareGenericExactInstallRoutes,
  )[0];
  return selected
    ? [{ candidate: selected.candidate, stepValue: selected.stepValue }]
    : supportRoutes;
}

function selectedCentralAccessRiskRemains(
  context: PlanSchedulerContext,
  allocation: Extract<CorpCentralDefenseAllocation, { status: "known" }>,
): boolean {
  const server = context.input.playerView.servers.find(
    (candidate) => candidate.id === allocation.selectedServerId,
  );
  if (!server) return true;
  const assessment = assessBestFundedCorpScoreProtection({
    serverIce: server.ice,
    runnerRig: context.input.playerView.opponent.rig ?? [],
    runnerSetAside: context.input.playerView.specialZones?.setAside ?? [],
    ...(context.input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: context.input.playerView.opponent.memoryUsed }
      : {}),
    ...(context.input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: context.input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: context.input.playerView.opponent.credits,
    targetServerId: allocation.selectedServerId,
    observedAtStateVersion: context.input.playerView.stateVersion,
    availableCorpCredits: context.input.playerView.own.credits,
    availableCorpClicks: context.input.playerView.own.clicks,
    scoreReserve: { creditBreakdown: [], hardClickReserve: 0 },
    maximumRunnerAccessSuccessProbability: {
      numerator: 0,
      denominator: 1,
    },
  });
  if (assessment.knowledge === "unknown") return true;
  return (
    compareExactProbabilities(
      assessment.protection.runnerAccessSuccessProbability,
      { numerator: 0, denominator: 1 },
    ) !== 0
  );
}

function compareGenericExactInstallRoutes(
  left: {
    candidate: ActionSemanticCandidate;
    signal: CorpGenericDefenseSignal;
    projection: KnownCorpFundedIceInstallRouteProjection;
  },
  right: {
    candidate: ActionSemanticCandidate;
    signal: CorpGenericDefenseSignal;
    projection: KnownCorpFundedIceInstallRouteProjection;
  },
): number {
  const urgencyComparison =
    genericDefenseRouteUrgencyRank(right.signal) -
    genericDefenseRouteUrgencyRank(left.signal);
  if (urgencyComparison !== 0) return urgencyComparison;
  if (
    left.signal.installRoute?.disposition !==
    right.signal.installRoute?.disposition
  ) {
    return left.signal.installRoute?.disposition === "productive" ? -1 : 1;
  }
  if (left.projection.effect !== right.projection.effect) {
    return left.projection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison = compareExactProbabilities(
    left.projection.after.protection.runnerAccessSuccessProbability,
    right.projection.after.protection.runnerAccessSuccessProbability,
  );
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  const runnerCreditTaxComparison =
    left.projection.after.protection.runnerCreditsRemainingOnBestAccessPath -
    right.projection.after.protection.runnerCreditsRemainingOnBestAccessPath;
  if (runnerCreditTaxComparison !== 0) return runnerCreditTaxComparison;
  const costComparison =
    knownExactInstallRouteCreditCost(left.projection) -
    knownExactInstallRouteCreditCost(right.projection);
  return (
    costComparison ||
    technicalCompare(left.candidate.actionId, right.candidate.actionId)
  );
}

function genericDefenseRouteUrgencyRank(
  signal: CorpGenericDefenseSignal,
): number {
  if (isVisibleAgendaExposureDefense(signal)) return 600;
  if (signal.centralPressure === "terminal") return 500;
  if (signal.centralPressure === "acute") return 400;
  if (signal.urgent) return 300;
  if (signal.centralPressure === "material") return 200;
  return 0;
}

function isVisibleAgendaExposureDefense(
  signal: CorpGenericDefenseSignal,
): boolean {
  return signal.evidenceCode.includes("visible_agenda_exposure_defense");
}

export function corpDefensePortfolioHasExecutableRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): boolean {
  return (
    defensePortfolioCandidates(context, signals, centralAllocation).length > 0
  );
}

type SelectedScoreProtectionRoute = {
  signal:
    | CorpScoreProtectionInstallSignal
    | CorpScoreProtectionStagingInstallSignal
    | CorpScoreProtectionDrawSignal;
  candidate: ActionSemanticCandidate;
};

function selectedScoreProtectionRoute(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
): SelectedScoreProtectionRoute | undefined {
  const scoreSignals = signals.filter(
    (
      signal,
    ): signal is
      | CorpScoreProtectionInstallSignal
      | CorpScoreProtectionStagingInstallSignal
      | CorpScoreProtectionDrawSignal =>
      isScoreProtectionInstallSignal(signal) ||
      isScoreProtectionStagingInstallSignal(signal) ||
      isScoreProtectionDrawSignal(signal),
  );
  const parentIds = [
    ...new Set(scoreSignals.map((signal) => signal.parentProjectId)),
  ].sort(technicalCompare);
  const parentRoutes: SelectedScoreProtectionRoute[] = [];
  for (const parentProjectId of parentIds) {
    const parentSignals = scoreSignals.filter(
      (signal) => signal.parentProjectId === parentProjectId,
    );
    const directInstallRoute = parentSignals
      .filter(isScoreProtectionInstallSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort(compareScoreProtectionInstallRoutes)[0];
    if (directInstallRoute) {
      parentRoutes.push(directInstallRoute);
      continue;
    }
    const stagingInstallRoute = parentSignals
      .filter(isScoreProtectionStagingInstallSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort((left, right) =>
        technicalCompare(left.candidate.actionId, right.candidate.actionId),
      )[0];
    if (stagingInstallRoute) {
      parentRoutes.push(stagingInstallRoute);
      continue;
    }
    const drawRoute = parentSignals
      .filter(isScoreProtectionDrawSignal)
      .flatMap((signal) =>
        defenseCandidates(context, signal).map(({ candidate }) => ({
          signal,
          candidate,
        })),
      )
      .sort(compareScoreProtectionDrawRoutes)[0];
    if (drawRoute) parentRoutes.push(drawRoute);
  }
  return parentRoutes.sort(
    (left, right) =>
      defensePriorityRank(left.signal.delegatedPriorityClass) -
        defensePriorityRank(right.signal.delegatedPriorityClass) ||
      technicalCompare(
        left.signal.parentProjectId,
        right.signal.parentProjectId,
      ),
  )[0];
}

function compareScoreProtectionDrawRoutes(
  left: SelectedScoreProtectionRoute,
  right: SelectedScoreProtectionRoute,
): number {
  const leftProjection = exactScoreProtectionDrawProjection(left.candidate);
  const rightProjection = exactScoreProtectionDrawProjection(right.candidate);
  if (leftProjection && rightProjection) {
    const densityComparison =
      rightProjection.cardsDrawn * leftProjection.clickCost -
      leftProjection.cardsDrawn * rightProjection.clickCost;
    if (densityComparison !== 0) return densityComparison;
    const cardsDrawnComparison =
      rightProjection.cardsDrawn - leftProjection.cardsDrawn;
    if (cardsDrawnComparison !== 0) return cardsDrawnComparison;
    const creditCostComparison =
      leftProjection.creditCost - rightProjection.creditCost;
    if (creditCostComparison !== 0) return creditCostComparison;
    const handDeltaComparison =
      leftProjection.netHandDelta - rightProjection.netHandDelta;
    if (handDeltaComparison !== 0) return handDeltaComparison;
  } else if (leftProjection || rightProjection) {
    return leftProjection ? -1 : 1;
  }
  return technicalCompare(left.candidate.actionId, right.candidate.actionId);
}

function exactScoreProtectionDrawProjection(
  candidate: ActionSemanticCandidate,
):
  | {
      cardsDrawn: number;
      clickCost: number;
      creditCost: number;
      netHandDelta: number;
    }
  | undefined {
  if (candidate.semanticActionType === "draw.card") {
    return { cardsDrawn: 1, clickCost: 1, creditCost: 0, netHandDelta: 1 };
  }
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  const clickCost = candidate.costProfile.clickCost;
  const creditCost = candidate.costProfile.creditCost;
  const netHandDelta = candidate.economyProjection?.netHandDelta;
  return Number.isSafeInteger(cardsDrawn) &&
    (cardsDrawn ?? 0) > 0 &&
    Number.isSafeInteger(clickCost) &&
    (clickCost ?? 0) > 0 &&
    Number.isSafeInteger(creditCost) &&
    (creditCost ?? -1) >= 0 &&
    Number.isSafeInteger(netHandDelta) &&
    (netHandDelta ?? -1) >= 0
    ? {
        cardsDrawn: cardsDrawn!,
        clickCost: clickCost!,
        creditCost: creditCost!,
        netHandDelta: netHandDelta!,
      }
    : undefined;
}

function compareScoreProtectionInstallRoutes(
  left: SelectedScoreProtectionRoute & {
    signal: CorpScoreProtectionInstallSignal;
  },
  right: SelectedScoreProtectionRoute & {
    signal: CorpScoreProtectionInstallSignal;
  },
): number {
  const leftProjection = left.signal.projection;
  const rightProjection = right.signal.projection;
  if (leftProjection.effect !== rightProjection.effect) {
    return leftProjection.effect === "satisfied" ? -1 : 1;
  }
  const probabilityComparison = compareExactProbabilities(
    leftProjection.after.protection.runnerAccessSuccessProbability,
    rightProjection.after.protection.runnerAccessSuccessProbability,
  );
  if (probabilityComparison !== undefined && probabilityComparison !== 0) {
    return probabilityComparison;
  }
  const runnerCreditTaxComparison =
    leftProjection.after.protection.runnerCreditsRemainingOnBestAccessPath -
    rightProjection.after.protection.runnerCreditsRemainingOnBestAccessPath;
  if (runnerCreditTaxComparison !== 0) return runnerCreditTaxComparison;
  if (
    knownExactInstallRouteCreditCost(leftProjection) !==
    knownExactInstallRouteCreditCost(rightProjection)
  ) {
    return (
      knownExactInstallRouteCreditCost(leftProjection) -
      knownExactInstallRouteCreditCost(rightProjection)
    );
  }
  return technicalCompare(left.candidate.actionId, right.candidate.actionId);
}

function exactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number | undefined {
  let total = projection.installCredits;
  if (!knownNonNegativeInteger(total)) return undefined;
  for (const selected of projection.selectedRezCosts) {
    if (!knownNonNegativeInteger(selected.credits)) return undefined;
    total += selected.credits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

function knownExactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number {
  return exactInstallRouteCreditCost(projection) ?? Number.MAX_SAFE_INTEGER;
}

export type CorpDefenseActionDisposition = {
  actionId: string;
  evidenceCode: string;
};

export type CorpDefensePlacementDisposition = CorpDefenseActionDisposition;

export function corpDefenseMaterializedActionIds(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): ReadonlySet<string> {
  const validSignals = validDefenseSignals(signals, context);
  return new Set(
    defensePortfolioCandidates(context, validSignals, centralAllocation).map(
      (route) => route.candidate.actionId,
    ),
  );
}

export function corpDefenseActionDispositions(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefenseActionDisposition[] {
  const validSignals = validDefenseSignals(signals, context);
  const materializedRoutes = defensePortfolioCandidates(
    context,
    validSignals,
    centralAllocation,
  );
  const materializedActionIds = new Set(
    materializedRoutes.map((route) => route.candidate.actionId),
  );
  const selectedBand = selectedDefensePortfolioBand(
    context,
    validSignals,
    centralAllocation,
  );
  const eligibleSignals =
    selectedBand.kind === "generic" ? selectedBand.eligibleSignals : [];
  const scoreProtectionSignals = validSignals.filter(
    (
      signal,
    ): signal is
      | CorpScoreProtectionInstallSignal
      | CorpScoreProtectionStagingInstallSignal
      | CorpScoreProtectionDrawSignal => signal.kind !== "generic",
  );
  const selectedAllocation = materializedRoutes
    .flatMap((route) =>
      validSignals
        .filter((signal) =>
          defenseCandidates(context, signal).some(
            (candidate) =>
              candidate.candidate.actionId === route.candidate.actionId,
          ),
        )
        .map((signal) => ({ route, signal })),
    )
    .sort(
      (left, right) =>
        right.route.stepValue - left.route.stepValue ||
        defenseSignalOrderingValue(right.signal) -
          defenseSignalOrderingValue(left.signal) ||
        technicalCompare(left.signal.defenseId, right.signal.defenseId) ||
        technicalCompare(
          left.route.candidate.actionId,
          right.route.candidate.actionId,
        ),
    )[0];
  const placementSignals = validSignals
    .filter(isGenericDefenseSignal)
    .filter((signal) => isDefensePlacementPhase(signal.phase));
  const byActionId = new Map<string, CorpDefenseActionDisposition>();
  for (const candidate of context.actionCandidates) {
    if (materializedActionIds.has(candidate.actionId)) {
      continue;
    }
    if (isSharedCorpSupportBasicAction(candidate)) {
      continue;
    }
    const rejectedScoreProtectionSignal = scoreProtectionSignals.find(
      (signal) =>
        defenseCandidates(context, signal).some(
          (route) => route.candidate.actionId === candidate.actionId,
        ),
    );
    if (rejectedScoreProtectionSignal && selectedAllocation) {
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `corp_score_protection_route_rejected:${rejectedScoreProtectionSignal.parentProjectId}:selected:${selectedAllocation.route.candidate.actionId}`,
      });
      continue;
    }
    if (candidate.semanticActionType !== "install.card") {
      const matchingSignals = validSignals
        .filter(isGenericDefenseSignal)
        .filter((signal) =>
          defenseCandidates(context, signal).some(
            (route) => route.candidate.actionId === candidate.actionId,
          ),
        )
        .sort(
          (left, right) =>
            Number(right.urgent) - Number(left.urgent) ||
            right.value - left.value ||
            technicalCompare(left.defenseId, right.defenseId),
        );
      if (matchingSignals.length === 0 || !selectedAllocation) continue;
      const rejectedSignal = matchingSignals[0]!;
      const remainsInPriorityBand = matchingSignals.some((signal) =>
        eligibleSignals.includes(signal),
      );
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `${
          remainsInPriorityBand
            ? "corp_defense_global_allocation_rejected"
            : "corp_defense_global_priority_band_rejected"
        }:${rejectedSignal.serverId}:${rejectedSignal.defenseId}:selected:${selectedAllocation.signal.serverId}:${selectedAllocation.signal.defenseId}:${selectedAllocation.route.candidate.actionId}`,
      });
      continue;
    }
    const fundingOnlyInstall = placementSignals.find(
      (signal) =>
        signal.phase === "install_ice" &&
        signal.installRoute?.disposition === "funding_only" &&
        signal.installRoute.projection.actionId === candidate.actionId,
    );
    if (fundingOnlyInstall) {
      byActionId.set(candidate.actionId, {
        actionId: candidate.actionId,
        evidenceCode: `corp_defense_exact_route_requires_parent_funding:${fundingOnlyInstall.serverId}:${fundingOnlyInstall.defenseId}`,
      });
      continue;
    }
    const matchingPlacements = placementSignals
      .filter(
        (signal) =>
          (signal.phase === "install_ice" &&
            signal.installRoute?.projection.actionId === candidate.actionId) ||
          (signal.phase !== "install_ice" &&
            defenseCandidates(context, signal).some(
              (route) => route.candidate.actionId === candidate.actionId,
            )),
      )
      .sort(
        (left, right) =>
          defenseSignalOrderingValue(right) -
            defenseSignalOrderingValue(left) ||
          technicalCompare(left.serverId, right.serverId),
      );
    if (matchingPlacements.length === 0) continue;
    const selected = matchingPlacements[0]!;
    byActionId.set(candidate.actionId, {
      actionId: candidate.actionId,
      evidenceCode: `corp_defense_global_allocation_rejected:${selected.serverId}:${candidate.actionId}`,
    });
  }
  return [...byActionId.values()];
}

export function corpDefensePlacementDispositions(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefensePlacementDisposition[] {
  return corpDefenseActionDispositions(context, signals, centralAllocation);
}

function isSharedCorpSupportBasicAction(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    candidate.sourceKind === "basic_action" &&
    (candidate.semanticActionType === "draw.card" ||
      candidate.semanticActionType === "economy.gain_credit")
  );
}

function dedupeDefenseCandidates(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
): PlanMaterialization["candidates"] {
  const byActionId = new Map<
    string,
    PlanMaterialization["candidates"][number]
  >();
  for (const signal of signals) {
    for (const candidate of defenseCandidates(context, signal)) {
      const previous = byActionId.get(candidate.candidate.actionId);
      if (!previous || candidate.stepValue > previous.stepValue) {
        byActionId.set(candidate.candidate.actionId, candidate);
      }
    }
  }
  return [...byActionId.values()];
}

function authoritativeDefensePlacementSource(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
):
  | {
      action: AiDecisionInput["legalActions"][number];
      sourceCardInstanceId: string;
    }
  | undefined {
  const sourceCardInstanceId = candidate.sourceCardInstanceId;
  if (!sourceCardInstanceId || candidate.sourceKind !== "card") {
    return undefined;
  }
  const action = context.input.legalActions.find(
    (candidateAction) => candidateAction.actionId === candidate.actionId,
  );
  if (!action || action.source !== sourceCardInstanceId) {
    return undefined;
  }
  if (
    typeof action.payload?.cardId === "string" &&
    action.payload.cardId !== sourceCardInstanceId
  ) {
    return undefined;
  }
  if (
    candidate.sourceDefinitionId !== undefined &&
    typeof action.payload?.sourceDefinitionId === "string" &&
    action.payload.sourceDefinitionId !== candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  return { action, sourceCardInstanceId };
}

function knownNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function validDefenseSignals(
  signals: readonly CorpDefenseSignal[],
  context: PlanSchedulerContext,
): CorpDefenseSignal[] {
  const invalid = signals.find((signal) => !isValidDefenseSignal(signal));
  if (!invalid) return [...signals];
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: defenseSignalActionIds(invalid),
    owner: "plan_module",
    removalCondition: `Replace incomplete or legacy Corp defense signal ${String(
      (invalid as { defenseId?: unknown }).defenseId ?? "unknown",
    )} with a complete discriminated defense contract.`,
  });
}

function defenseSignalActionIds(signal: CorpDefenseSignal): string[] {
  const value = signal as unknown as Record<string, unknown>;
  if (
    (value.kind === "score_protection_install" ||
      value.kind === "score_protection_staging_install" ||
      value.kind === "score_protection_draw") &&
    nonEmptyString(value.actionId)
  ) {
    return [value.actionId];
  }
  return Array.isArray(value.actionIds)
    ? value.actionIds.filter(nonEmptyString)
    : [];
}

function isValidDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpDefenseSignal {
  const value = signal as unknown as Record<string, unknown>;
  if (
    !nonEmptyString(value.defenseId) ||
    !nonEmptyString(value.serverId) ||
    !nonEmptyString(value.evidenceCode)
  ) {
    return false;
  }
  if (value.kind === "generic") {
    const installRoute = value.installRoute as
      | Record<string, unknown>
      | undefined;
    return (
      hasOnlyKeys(value, GENERIC_DEFENSE_SIGNAL_KEYS) &&
      genericDefensePhase(value.phase) &&
      Array.isArray(value.sourceDefinitionIds) &&
      value.sourceDefinitionIds.every(nonEmptyString) &&
      (value.actionIds === undefined ||
        (Array.isArray(value.actionIds) &&
          value.actionIds.every(nonEmptyString))) &&
      typeof value.urgent === "boolean" &&
      (value.centralPressure === undefined ||
        value.centralPressure === "material" ||
        value.centralPressure === "acute" ||
        value.centralPressure === "terminal") &&
      typeof value.value === "number" &&
      Number.isFinite(value.value) &&
      (value.phase === "install_ice"
        ? installRoute !== undefined &&
          hasOnlyKeys(
            installRoute,
            new Set([
              "disposition",
              "progressKind",
              "rezFundingGap",
              "projection",
            ]),
          ) &&
          (installRoute.disposition === "productive" ||
            installRoute.disposition === "funding_only") &&
          (installRoute.progressKind === undefined ||
            installRoute.progressKind === "engine_certified_access" ||
            installRoute.progressKind === "funded_structured_central_defense" ||
            installRoute.progressKind === "scoreline_central_tax_allocation" ||
            installRoute.progressKind === "staged_central_defense" ||
            installRoute.progressKind === "score_material_capacity_release" ||
            installRoute.progressKind ===
              "agenda_capacity_defense_conversion" ||
            installRoute.progressKind === "funding_required") &&
          (installRoute.rezFundingGap === undefined ||
            knownNonNegativeInteger(installRoute.rezFundingGap)) &&
          validKnownInstallProjection(installRoute.projection)
        : installRoute === undefined) &&
      (value.phase === "fund_rez_reserve"
        ? validCorpRezReserveNeed(value.rezReserveNeed) &&
          nonEmptyString(value.targetIceInstanceId) &&
          value.centralPressure === "terminal" &&
          value.urgent === true
        : value.rezReserveNeed === undefined) &&
      (value.choiceResolution === undefined ||
        (value.phase === "resolve_install_targets" &&
          validAgendaPurgeDefenseChoiceResolution(
            value.choiceResolution,
            value,
          )) ||
        (value.phase === "resolve_run_redirect" &&
          validClassicDeflectorDefenseChoiceResolution(
            value.choiceResolution,
            value,
          ))) &&
      (value.phase !== "resolve_post_pass_ice_lifecycle" ||
        (value.sourceDefinitionIds.length === 1 &&
          Array.isArray(value.actionIds) &&
          value.actionIds.length > 0 &&
          nonEmptyString(value.targetIceInstanceId))) &&
      (value.rezRoute === undefined ||
        (value.phase === "rez_response" &&
          validExactIceRezRoute(value.rezRoute))) &&
      validGenericDrawAttemptState(value.drawAttemptState)
    );
  }
  if (value.kind === "score_protection_install") {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_INSTALL_SIGNAL_KEYS) &&
      value.phase === "install_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId) &&
      (value.effect === "progress" || value.effect === "satisfied") &&
      validExactProbability(value.runnerAccessSuccessProbability) &&
      knownNonNegativeInteger(value.totalInstallAndRezCredits) &&
      validKnownInstallProjection(value.projection) &&
      exactInstallRouteCreditCost(
        value.projection as KnownCorpFundedIceInstallRouteProjection,
      ) === value.totalInstallAndRezCredits &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .actionId === value.actionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceCardInstanceId === value.sourceCardInstanceId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceDefinitionId === value.sourceDefinitionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .targetServerId === value.serverId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection).effect ===
        value.effect &&
      exactProbabilityValuesEqual(
        value.runnerAccessSuccessProbability,
        (value.projection as KnownCorpFundedIceInstallRouteProjection).after
          .protection.runnerAccessSuccessProbability,
      )
    );
  }
  if (value.kind === "score_protection_staging_install") {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS) &&
      value.phase === "install_ice" &&
      nonEmptyString(value.serverId) &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId)
    );
  }
  if (value.kind === "score_protection_draw") {
    const attempt = value.drawAttemptState as
      | Record<string, unknown>
      | undefined;
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_DRAW_SIGNAL_KEYS) &&
      value.phase === "draw_for_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      (value.cleanupReplacementDraw === undefined ||
        typeof value.cleanupReplacementDraw === "boolean") &&
      attempt !== undefined &&
      hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
      nonEmptyString(attempt.turnKey) &&
      attempt.remainingAttempts === 1 &&
      (attempt.selectedAtStateVersion === undefined ||
        knownNonNegativeInteger(attempt.selectedAtStateVersion))
    );
  }
  return false;
}

function validAgendaPurgeDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const revealedCardIds = resolution.revealedCardIds;
  const targets = resolution.targets;
  const actionIds = signalValue.actionIds;
  if (
    !hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceAgendaId",
        "sourceStateVersion",
        "revealedCardIds",
        "targets",
      ]),
    ) ||
    resolution.kind !== "agenda_purge_install_targets" ||
    !nonEmptyString(resolution.choiceId) ||
    !nonEmptyString(resolution.sourceAgendaId) ||
    !knownNonNegativeInteger(resolution.sourceStateVersion) ||
    !Array.isArray(revealedCardIds) ||
    revealedCardIds.length === 0 ||
    !revealedCardIds.every(nonEmptyString) ||
    new Set(revealedCardIds).size !== revealedCardIds.length ||
    !Array.isArray(targets) ||
    targets.length === 0 ||
    !Array.isArray(actionIds) ||
    actionIds.length !== 1 ||
    !nonEmptyString(actionIds[0])
  ) {
    return false;
  }
  const targetRecords = targets as Array<Record<string, unknown>>;
  return (
    targetRecords.every(
      (target) =>
        target !== null &&
        typeof target === "object" &&
        hasOnlyKeys(target, new Set(["cardId", "serverId", "optionId"])) &&
        nonEmptyString(target.cardId) &&
        revealedCardIds.includes(target.cardId) &&
        nonEmptyString(target.serverId) &&
        nonEmptyString(target.optionId),
    ) &&
    new Set(targetRecords.map((target) => target.cardId)).size ===
      targetRecords.length &&
    new Set(targetRecords.map((target) => target.optionId)).size ===
      targetRecords.length &&
    signalValue.serverId === targetRecords[0]?.serverId
  );
}

function validClassicDeflectorDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const actionIds = signalValue.actionIds;
  const disposition = resolution.disposition;
  const selectedServerId = resolution.selectedServerId;
  return (
    hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceStateVersion",
        "runId",
        "sourceIceInstanceId",
        "sourceDefinitionId",
        "subroutineIndex",
        "subroutineId",
        "targetProfile",
        "creditCost",
        "autoBreakIfNoTarget",
        "selectedOptionId",
        "disposition",
        "selectedServerId",
      ]),
    ) &&
    resolution.kind === "classic_deflector_redirect" &&
    nonEmptyString(resolution.choiceId) &&
    knownNonNegativeInteger(resolution.sourceStateVersion) &&
    nonEmptyString(resolution.runId) &&
    nonEmptyString(resolution.sourceIceInstanceId) &&
    nonEmptyString(resolution.sourceDefinitionId) &&
    knownNonNegativeInteger(resolution.subroutineIndex) &&
    nonEmptyString(resolution.subroutineId) &&
    (resolution.targetProfile === "archives" ||
      resolution.targetProfile === "any_data_fort" ||
      resolution.targetProfile === "subsidiary_data_fort") &&
    knownNonNegativeInteger(resolution.creditCost) &&
    typeof resolution.autoBreakIfNoTarget === "boolean" &&
    nonEmptyString(resolution.selectedOptionId) &&
    (disposition === "redirect" || disposition === "decline") &&
    (disposition === "redirect"
      ? nonEmptyString(selectedServerId) &&
        resolution.selectedOptionId === `server_${selectedServerId}` &&
        signalValue.serverId === selectedServerId
      : selectedServerId === undefined &&
        resolution.selectedOptionId === "decline") &&
    Array.isArray(actionIds) &&
    actionIds.length === 1 &&
    nonEmptyString(actionIds[0])
  );
}

function isGenericDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpGenericDefenseSignal {
  return signal.kind === "generic";
}

function isScoreProtectionInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionInstallSignal {
  return signal.kind === "score_protection_install";
}

function isScoreProtectionStagingInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionStagingInstallSignal {
  return signal.kind === "score_protection_staging_install";
}

function isScoreProtectionDrawSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionDrawSignal {
  return signal.kind === "score_protection_draw";
}

function genericDefensePhase(
  value: unknown,
): value is CorpGenericDefenseSignal["phase"] {
  return (
    value === "install_ice" ||
    value === "install_defense_support" ||
    value === "resolve_install_targets" ||
    value === "resolve_run_redirect" ||
    value === "resolve_post_pass_ice_lifecycle" ||
    value === "draw_for_ice" ||
    value === "fund_rez_reserve" ||
    value === "rez_response" ||
    value === "activate_run_defense" ||
    value === "decline_rez"
  );
}

function validCorpRezReserveNeed(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const reserve = value as Record<string, unknown>;
  return (
    hasOnlyKeys(
      reserve,
      new Set([
        "observedAtStateVersion",
        "currentCredits",
        "requiredCredits",
        "fundingGap",
      ]),
    ) &&
    knownNonNegativeInteger(reserve.observedAtStateVersion) &&
    knownNonNegativeInteger(reserve.currentCredits) &&
    knownNonNegativeInteger(reserve.requiredCredits) &&
    knownNonNegativeInteger(reserve.fundingGap) &&
    (reserve.fundingGap as number) > 0 &&
    (reserve.requiredCredits as number) - (reserve.currentCredits as number) ===
      reserve.fundingGap
  );
}

function scorePriorityClass(value: unknown): value is CorpScorePriorityClass {
  return value === "P1" || value === "P2" || value === "P3" || value === "P4";
}

function validExactProbability(value: unknown): value is ExactProbability {
  if (!value || typeof value !== "object") return false;
  const probability = value as Record<string, unknown>;
  return (
    knownNonNegativeInteger(probability.numerator) &&
    knownNonNegativeInteger(probability.denominator) &&
    probability.denominator > 0 &&
    probability.numerator <= probability.denominator
  );
}

function validKnownInstallProjection(
  value: unknown,
): value is KnownCorpFundedIceInstallRouteProjection {
  if (!value || typeof value !== "object") return false;
  const projection = value as Record<string, unknown>;
  const before = projection.before as Record<string, unknown> | undefined;
  const after = projection.after as Record<string, unknown> | undefined;
  const afterProtection = after?.protection as
    | Record<string, unknown>
    | undefined;
  return (
    projection.knowledge === "known" &&
    (projection.effect === "no_progress" ||
      projection.effect === "progress" ||
      projection.effect === "satisfied") &&
    nonEmptyString(projection.actionId) &&
    nonEmptyString(projection.sourceCardInstanceId) &&
    nonEmptyString(projection.sourceDefinitionId) &&
    nonEmptyString(projection.targetServerId) &&
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    afterProtection?.knowledge === "known" &&
    validExactProbability(afterProtection.runnerAccessSuccessProbability) &&
    knownNonNegativeInteger(projection.installCredits) &&
    knownNonNegativeInteger(projection.installClicks) &&
    projection.installCostSource === "legal_action_agreed_projection" &&
    Array.isArray(projection.selectedRezCosts) &&
    projection.selectedRezCosts.every((selected) => {
      if (!selected || typeof selected !== "object") return false;
      const rezCost = selected as Record<string, unknown>;
      return (
        nonEmptyString(rezCost.iceInstanceId) &&
        nonEmptyString(rezCost.iceDefinitionId) &&
        knownNonNegativeInteger(rezCost.credits) &&
        rezCost.source === "engine_rez_cost_quote"
      );
    }) &&
    knownNonNegativeInteger(projection.creditsAfterDefense) &&
    knownNonNegativeInteger(projection.clicksAfterDefense) &&
    typeof projection.preservesScoreCreditReserve === "boolean" &&
    typeof projection.preservesHardClickReserve === "boolean" &&
    typeof projection.preservesReserves === "boolean" &&
    typeof projection.funded === "boolean" &&
    exactInstallRouteCreditCost(
      value as KnownCorpFundedIceInstallRouteProjection,
    ) !== undefined
  );
}

function validExactIceRezRoute(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const route = value as Record<string, unknown>;
  const quote = route.quote as Record<string, unknown> | undefined;
  const before = route.before as Record<string, unknown> | undefined;
  const after = route.after as Record<string, unknown> | undefined;
  const resourceExchange = route.resourceExchange as
    | Record<string, unknown>
    | undefined;
  const hasKnownHolisticAssessment =
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    validExactProbability(before.runnerAccessSuccessProbability) &&
    validExactProbability(after.runnerAccessSuccessProbability);
  const hasExactResourceExchange =
    route.routeKind === "exact_resource_exchange" &&
    resourceExchange !== undefined &&
    knownNonNegativeInteger(resourceExchange.runnerRequiredCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerPumpCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakUses) &&
    nonEmptyString(resourceExchange.runnerBreakerInstanceId) &&
    nonEmptyString(resourceExchange.runnerBreakerDefinitionId) &&
    Array.isArray(resourceExchange.runnerConsumedCardInstanceIds) &&
    resourceExchange.runnerConsumedCardInstanceIds.every(nonEmptyString) &&
    (resourceExchange.layeredCentralPathTax === undefined ||
      (resourceExchange.layeredCentralPathTax === true &&
        knownNonNegativeInteger(resourceExchange.otherRezzedIceCount) &&
        (resourceExchange.otherRezzedIceCount as number) > 0)) &&
    (resourceExchange.runnerRandomConsequences === undefined ||
      (Array.isArray(resourceExchange.runnerRandomConsequences) &&
        resourceExchange.runnerRandomConsequences.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const consequence = entry as Record<string, unknown>;
          return (
            consequence.kind === "post_encounter_self_trash_check" &&
            nonEmptyString(consequence.cardId) &&
            nonEmptyString(consequence.definitionId) &&
            knownNonNegativeInteger(consequence.numerator) &&
            (consequence.numerator as number) > 0 &&
            knownNonNegativeInteger(consequence.denominator) &&
            (consequence.denominator as number) >=
              (consequence.numerator as number)
          );
        })));
  const hasExactMarginalDefenseThreat =
    route.routeKind === "qualitative_encounter_defense" &&
    (route.marginalDefenseThreat === "visible_agenda_remote" ||
      route.marginalDefenseThreat === "terminal_central_access");
  return (
    nonEmptyString(route.actionId) &&
    nonEmptyString(route.sourceCardInstanceId) &&
    nonEmptyString(route.sourceDefinitionId) &&
    nonEmptyString(route.targetServerId) &&
    quote?.context === "installed" &&
    quote.complete === true &&
    quote.cardId === route.sourceCardInstanceId &&
    quote.targetServerId === route.targetServerId &&
    knownNonNegativeInteger(quote.expiresAtStateVersion) &&
    knownNonNegativeInteger(quote.finalCredits) &&
    (hasKnownHolisticAssessment ||
      hasExactResourceExchange ||
      hasExactMarginalDefenseThreat) &&
    (route.effect === "progress" || route.effect === "satisfied") &&
    knownNonNegativeInteger(route.totalRezCredits) &&
    quote.finalCredits === route.totalRezCredits
  );
}

function exactProbabilityValuesEqual(
  left: unknown,
  right: ExactProbability,
): boolean {
  if (!left || typeof left !== "object") return false;
  const probability = left as Record<string, unknown>;
  return (
    probability.numerator === right.numerator &&
    probability.denominator === right.denominator
  );
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

const GENERIC_DEFENSE_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "sourceDefinitionIds",
  "actionIds",
  "targetIceInstanceId",
  "followupIceInstanceId",
  "urgent",
  "centralPressure",
  "immediateInstallSupport",
  "rezWindowVerdict",
  "installRoute",
  "rezReserveNeed",
  "rezRoute",
  "value",
  "evidenceCode",
  "choiceResolution",
  "drawAttemptState",
]);

const SCORE_PROTECTION_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "effect",
  "runnerAccessSuccessProbability",
  "totalInstallAndRezCredits",
  "projection",
  "evidenceCode",
]);

const SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "evidenceCode",
]);

const SCORE_PROTECTION_DRAW_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "cleanupReplacementDraw",
  "drawAttemptState",
  "evidenceCode",
]);

const SCORE_PROTECTION_DRAW_ATTEMPT_KEYS = new Set([
  "turnKey",
  "remainingAttempts",
  "selectedAtStateVersion",
]);

function validGenericDrawAttemptState(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  return (
    hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
    nonEmptyString(attempt.turnKey) &&
    (attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1) &&
    (attempt.selectedAtStateVersion === undefined ||
      knownNonNegativeInteger(attempt.selectedAtStateVersion))
  );
}

function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function defenseSignalOrderingValue(signal: CorpDefenseSignal): number {
  if (signal.kind === "generic") return signal.value;
  if (signal.kind === "score_protection_install") {
    return signal.effect === "satisfied" ? 2 : 1;
  }
  if (signal.kind === "score_protection_staging_install") return 1;
  return 0;
}

function technicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function defensePortfolioAssessmentValue(
  context: PlanSchedulerContext,
  signals: readonly CorpDefenseSignal[],
  _priorityClass: PriorityClass,
  centralAllocation?: CorpCentralDefenseAllocation,
): number {
  const selectedBand = selectedDefensePortfolioBand(
    context,
    signals,
    centralAllocation,
  );
  if (selectedBand.kind === "score") {
    return selectedBand.route.signal.kind === "score_protection_install" &&
      selectedBand.route.signal.effect === "satisfied"
      ? 2
      : 1;
  }
  const selectedCandidate = selectedBand.candidates[0];
  if (!selectedCandidate) return 0;
  const selectedSignal = selectedBand.eligibleSignals.find((signal) =>
    defenseCandidates(context, signal).some(
      ({ candidate }) =>
        candidate.actionId === selectedCandidate.candidate.actionId,
    ),
  );
  if (selectedSignal?.phase === "install_ice") {
    return selectedSignal.installRoute?.projection.effect === "satisfied"
      ? 2
      : 1;
  }
  return Math.max(1, selectedCandidate.stepValue);
}

function isDefensePlacementPhase(phase: CorpDefenseSignal["phase"]): boolean {
  return (
    phase === "install_ice" ||
    phase === "install_defense_support" ||
    phase === "resolve_install_targets"
  );
}

function dedupeRouteCandidates(
  candidates: PlanMaterialization["candidates"],
): PlanMaterialization["candidates"] {
  const byActionId = new Map<
    string,
    PlanMaterialization["candidates"][number]
  >();
  for (const candidate of candidates) {
    const previous = byActionId.get(candidate.candidate.actionId);
    if (!previous || candidate.stepValue > previous.stepValue) {
      byActionId.set(candidate.candidate.actionId, candidate);
    }
  }
  return [...byActionId.values()];
}

function urgentDefenseBand(
  context: PlanSchedulerContext,
  signals: readonly CorpGenericDefenseSignal[],
): readonly CorpGenericDefenseSignal[] {
  const exactWindowSignals = exactRezWindowAlternatives(signals);
  const urgentWindowSignals = exactWindowSignals.filter(
    (signal) =>
      signal.urgent &&
      (signal.phase === "rez_response" ||
        signal.phase === "decline_rez" ||
        signal.phase === "activate_run_defense" ||
        signal.phase === "resolve_post_pass_ice_lifecycle") &&
      defenseCandidates(context, signal).length > 0,
  );
  if (urgentWindowSignals.length > 0) return urgentWindowSignals;
  return exactWindowSignals;
}

function exactRezWindowAlternatives(
  signals: readonly CorpGenericDefenseSignal[],
): readonly CorpGenericDefenseSignal[] {
  const productiveRezExists = signals.some(
    (signal) =>
      signal.phase === "rez_response" &&
      signal.rezWindowVerdict === "productive",
  );
  return signals.filter((signal) => {
    if (
      signal.phase === "rez_response" &&
      signal.rezWindowVerdict === "nonproductive"
    ) {
      return false;
    }
    if (signal.phase === "decline_rez" && productiveRezExists) {
      return false;
    }
    return true;
  });
}

function corpCandidateProjectsCardDraw(
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType === "draw.card") return true;
  const cardsDrawn = candidate.economyProjection?.cardsDrawn;
  return (
    typeof cardsDrawn === "number" &&
    Number.isFinite(cardsDrawn) &&
    cardsDrawn > 0
  );
}

function economyCandidates(
  context: PlanSchedulerContext,
  signal: CorpEconomyNeedSignal,
): PlanMaterialization["candidates"] {
  const exactFundingHead =
    signal.kind === "develop_campaign" ||
    signal.kind === "convert_immediate_operation" ||
    signal.kind === "convert_visible_card_payout" ||
    signal.kind === "prepare_immediate_operation" ||
    signal.kind === "develop_liquidity"
      ? undefined
      : (
          signal.fundingRouteAssessment ??
          assessCorpEconomyFundingRoute(context, signal)
        ).headActionId;
  const campaignActionIds =
    signal.kind === "develop_campaign" ? new Set(signal.actionIds) : undefined;
  const immediateOperationActionId =
    signal.kind === "convert_immediate_operation"
      ? signal.actionIds[0]
      : undefined;
  const visibleCardPayoutActionId =
    signal.kind === "convert_visible_card_payout"
      ? signal.actionIds[0]
      : undefined;
  const operationThresholdActionId =
    signal.kind === "prepare_immediate_operation"
      ? signal.actionIds[0]
      : undefined;
  const liquidityActionId =
    signal.kind === "develop_liquidity" ? signal.actionIds[0] : undefined;
  return context.actionCandidates
    .filter(
      (candidate) =>
        (signal.kind === "develop_campaign"
          ? campaignActionIds!.has(candidate.actionId) &&
            candidate.sourceCardInstanceId === signal.sourceInstanceId &&
            candidate.sourceDefinitionId === signal.sourceDefinitionId &&
            candidate.semanticActionType ===
              (signal.phase === "install"
                ? "install.card"
                : signal.phase === "advance"
                  ? "score.advance_card"
                  : "corp_window.rez") &&
            (signal.cadence.kind !== "immediate_on_rez" ||
              certifiedImmediateRootRezCampaignCandidate(candidate, signal))
          : signal.kind === "convert_immediate_operation"
            ? candidate.actionId === immediateOperationActionId &&
              immediateOperationCandidateMatchesSignal(candidate, signal)
            : signal.kind === "convert_visible_card_payout"
              ? candidate.actionId === visibleCardPayoutActionId &&
                visibleCardPayoutCandidateMatchesSignal(candidate, signal)
              : signal.kind === "prepare_immediate_operation"
                ? candidate.actionId === operationThresholdActionId &&
                  corpExactBasicLiquidCreditCandidate(candidate)
                : signal.kind === "develop_liquidity"
                  ? candidate.actionId === liquidityActionId &&
                    corpExactBasicLiquidCreditCandidate(candidate)
                  : candidate.actionId === exactFundingHead &&
                    immediateCorpLiquidCreditGain(candidate) > 0) &&
        corpEconomyCandidateHasExecutablePayload(context.input, candidate),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.kind === "develop_campaign"
          ? economyDevelopmentStepValue(context, candidate, signal)
          : signal.kind === "convert_immediate_operation"
            ? economyImmediateOperationStepValue(signal)
            : signal.kind === "convert_visible_card_payout"
              ? economyVisibleCardPayoutStepValue(signal)
              : signal.kind === "prepare_immediate_operation"
                ? economyOperationThresholdStepValue(signal)
                : signal.kind === "develop_liquidity"
                  ? -9_999
                  : immediateCorpLiquidCreditGain(candidate) * 10,
    }));
}

export function corpExactBasicLiquidCreditCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "basic_action" &&
    candidate.actionType === "gain_credit" &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.grossLiquidCreditGain === 1 &&
    projection.netLiquidCreditGain === 1 &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}

function certifiedImmediateRootRezCampaignCandidate(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyDevelopmentSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    signal.phase === "rez" &&
    signal.cadence.kind === "immediate_on_rez" &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.reliability === "guaranteed" &&
    projection.source === "legal_action_payload" &&
    projection.confidence === "high" &&
    Number.isSafeInteger(projection.grossLiquidCreditGain) &&
    projection.grossLiquidCreditGain === signal.payback.projectedCredits &&
    Number.isSafeInteger(projection.creditCost) &&
    projection.creditCost === signal.payback.setupCreditCost &&
    Number.isSafeInteger(projection.netLiquidCreditGain) &&
    projection.netLiquidCreditGain === signal.payback.projectedNetCredits &&
    projection.netLiquidCreditGain > 0 &&
    signal.payback.horizonTurns === 0
  );
}

export function assessCorpEconomyFundingRoute(
  context: PlanSchedulerContext,
  signal: CorpEconomyParentFundingSignal | CorpEconomyReserveSignal,
): CorpEconomyFundingRouteAssessment {
  const candidates = context.actionCandidates.filter(
    (candidate) =>
      signal.actionIds.includes(candidate.actionId) &&
      immediateCorpLiquidCreditGain(candidate) > 0 &&
      candidate.economyProjection?.reliability === "guaranteed" &&
      corpEconomyCandidateHasExecutablePayload(context.input, candidate),
  );
  const currentCredits = context.input.playerView.own.credits;
  const demandForTarget = (
    targetCredits: number,
    evidence: readonly string[],
  ) =>
    createCreditDemand({
      demandId: signal.needId,
      side: "corp",
      ...(signal.kind === "parent_funding" && signal.parentPlanInstanceId
        ? { sourcePlanId: signal.parentPlanInstanceId }
        : {}),
      purpose: signal.urgentForScore
        ? "current_score_window"
        : "tactical_reserve",
      priority: signal.urgentForScore
        ? "current_foreground_plan"
        : "tactical_reserve",
      hardness: signal.kind === "parent_funding" ? "hard" : "soft",
      deadline: "end_of_current_turn",
      currentCredits,
      targetCredits,
      acceptedCreditRestrictions: ["general"],
      evidence,
    });
  const fullTargetCredits =
    signal.kind === "reserve"
      ? signal.targetCredits
      : (signal.incrementalDefenseReserve?.targetCredits ??
        currentCredits + signal.gap);
  const fullTargetDemand = demandForTarget(fullTargetCredits, [
    signal.evidenceCode,
  ]);
  const fullTargetResult = searchFundingRoutes({
    demand: fullTargetDemand,
    candidates,
    remainingClicks: context.input.playerView.own.clicks,
  });
  let result = fullTargetResult;
  const progressEvidence: string[] = [];
  const exactIncrementalDefenseReserve =
    signal.kind === "parent_funding" &&
    signal.immediateDefenseConversion === true &&
    signal.incrementalDefenseReserve !== undefined &&
    typeof signal.parentPlanInstanceId === "string" &&
    signal.parentPlanInstanceId.length > 0 &&
    typeof signal.parentNeedId === "string" &&
    signal.parentNeedId.length > 0 &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0 &&
    Number.isFinite(signal.incrementalDefenseReserve.targetCredits) &&
    signal.incrementalDefenseReserve.targetCredits > currentCredits &&
    signal.incrementalDefenseReserve.targetCredits - currentCredits ===
      signal.gap &&
    signal.incrementalDefenseReserve.serverId.length > 0 &&
    signal.incrementalDefenseReserve.iceInstanceId.length > 0;
  const exactIncrementalScoreFunding =
    signal.kind === "parent_funding" &&
    signal.needId.startsWith("score-support:") &&
    signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true &&
    signal.delegatedPriorityClass !== undefined &&
    signal.urgentForScore === true &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0;
  const exactIncrementalAmbushFunding =
    signal.kind === "parent_funding" &&
    signal.needId.startsWith("ambush-funding:") &&
    signal.parentPlanInstanceId?.startsWith("plan:corp.ambush_and_bluff:") ===
      true &&
    signal.parentNeedId === signal.needId &&
    signal.delegatedPriorityClass === undefined &&
    signal.parentPriorityClass === "P5" &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0;
  const incrementalProgressAllowed =
    (signal.kind === "reserve" &&
      Number.isFinite(signal.targetCredits) &&
      currentCredits < signal.targetCredits) ||
    exactIncrementalDefenseReserve ||
    exactIncrementalScoreFunding ||
    exactIncrementalAmbushFunding;
  if (
    incrementalProgressAllowed &&
    fullTargetResult.bestRoute.status === "uncovered"
  ) {
    const maximumSingleActionGain = Math.max(
      0,
      ...candidates.map((candidate) =>
        Math.floor(immediateCorpLiquidCreditGain(candidate)),
      ),
    );
    const incrementalGap = Math.min(
      fullTargetCredits - currentCredits,
      maximumSingleActionGain,
    );
    if (incrementalGap > 0) {
      const incrementalTarget = currentCredits + incrementalGap;
      const incrementalResult = searchFundingRoutes({
        demand: demandForTarget(incrementalTarget, [
          signal.evidenceCode,
          "corp_reserve_incremental_progress_contract",
          `corp_reserve_final_target:${fullTargetCredits}`,
          `corp_reserve_incremental_target:${incrementalTarget}`,
        ]),
        candidates,
        remainingClicks: context.input.playerView.own.clicks,
      });
      if (
        incrementalResult.bestRoute.status === "covered_guaranteed" &&
        incrementalResult.bestRoute.reliability === "guaranteed"
      ) {
        result = incrementalResult;
        const evidencePrefix =
          signal.kind === "reserve"
            ? "corp_reserve"
            : exactIncrementalScoreFunding
              ? "corp_incremental_score_funding"
              : exactIncrementalAmbushFunding
                ? "corp_incremental_ambush_funding"
                : "corp_incremental_defense_reserve";
        progressEvidence.push(
          `${evidencePrefix}_incremental_route:true`,
          `${evidencePrefix}_final_target:${fullTargetCredits}`,
          `${evidencePrefix}_incremental_target:${incrementalTarget}`,
        );
      }
    }
  }
  const route = result.bestRoute;
  const head =
    route.status === "covered_guaranteed" && route.reliability === "guaranteed"
      ? route.steps.find(
          (step) =>
            step.kind === "legal_action" &&
            step.ownTurnOffset === 0 &&
            typeof step.actionId === "string",
        )
      : undefined;
  return {
    routeId: route.routeId,
    status: route.status,
    reliability: route.reliability,
    ...(head?.actionId ? { headActionId: head.actionId } : {}),
    evidence: [...result.evidence, ...route.evidence, ...progressEvidence],
  };
}

export function immediateCorpLiquidCreditGain(
  candidate: ActionSemanticCandidate,
): number {
  const projection = candidate.economyProjection;
  if (
    !projection ||
    projection.kind !== "immediate_liquid" ||
    projection.timing !== "immediate" ||
    projection.creditRestriction !== "general"
  ) {
    return 0;
  }
  const projectedGain = projection.netLiquidCreditGain;
  return typeof projectedGain === "number" &&
    Number.isFinite(projectedGain) &&
    projectedGain > 0
    ? projectedGain
    : 0;
}

export function corpEconomyCandidateHasExecutablePayload(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const drawCardsAmount = Number(action?.payload?.drawCardsAmount ?? 0);
  return !(drawCardsAmount > 0 && input.playerView.own.stackOrRdCount <= 0);
}

function economyDevelopmentStepValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyDevelopmentSignal,
): number {
  if (signal.cadence.kind === "counter_cashout_development")
    return Math.max(1, signal.payback.projectedNetCredits * 10);
  if (signal.phase === "rez")
    return Math.max(1, signal.payback.projectedNetCredits * 10);

  const targetServerId = candidateTargetIds(candidate).find(
    (targetId) => targetId === "new_remote" || targetId.startsWith("remote_"),
  );
  if (!targetServerId) return 10;
  if (targetServerId === "new_remote") {
    const installedScoreProjectExists = domain(context).scoreProjects.some(
      (project) => project.phase !== "install_agenda",
    );
    return installedScoreProjectExists ? 5 : 25;
  }
  const server = context.input.playerView.servers.find(
    (candidateServer) => candidateServer.id === targetServerId,
  );
  if (!server) return 10;
  if (server.root.length > 0) return 10;
  return 60 + Math.min(3, server.ice.length) * 10;
}

function economyMaterialization(
  instance: PlanInstance,
  context: PlanSchedulerContext,
  signal: CorpEconomyNeedSignal,
): PlanMaterialization {
  const candidates = economyCandidates(context, signal);
  return {
    step: {
      stepId: `${instance.instanceId}:fund`,
      capability: {
        capabilityId: "develop_or_convert_corp_economy",
        semanticActionTypes: [
          ...new Set(
            candidates.map((entry) => entry.candidate.semanticActionType),
          ),
        ],
      },
      purpose:
        signal.kind === "develop_campaign"
          ? `Advance the admitted ${signal.sourceDefinitionId} economy campaign from ${signal.phase} to ${signal.completion.expectedState}.`
          : signal.kind === "convert_immediate_operation"
            ? `Convert the Engine-certified immediate ${signal.sourceDefinitionId} operation once, consuming its exact HQ source.`
            : signal.kind === "convert_visible_card_payout"
              ? `Take the exact currently quoted visible-card payout from ${signal.sourceDefinitionId}, then revalidate the source.`
              : signal.kind === "prepare_immediate_operation"
                ? `Take the exact Engine-certified Basic Credit once to make the reviewed ${signal.sourceDefinitionId} operation legal, then revalidate its new LegalAction.`
                : signal.kind === "develop_liquidity"
                  ? `Convert the exact Engine-certified Basic Credit action toward the finite ${signal.turnKey} target of ${signal.targetCredits} credits.`
                  : "Convert an immediate positive liquid-credit route for the bound Corp funding need.",
    },
    candidates,
  };
}

function immediateOperationCandidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyImmediateOperationSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "card" &&
    candidate.sourceCardInstanceId === signal.sourceInstanceId &&
    candidate.sourceDefinitionId === signal.sourceDefinitionId &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.actionType === "play_operation" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === signal.conversion.clickCost &&
    projection.creditCost === signal.conversion.creditCost &&
    projection.grossLiquidCreditGain ===
      signal.conversion.grossLiquidCreditGain &&
    projection.netLiquidCreditGain === signal.conversion.netLiquidCreditGain &&
    projection.cardsDrawn === signal.conversion.cardsDrawn &&
    projection.cardsConsumed === signal.conversion.cardsConsumed &&
    projection.netHandDelta === signal.conversion.netHandDelta &&
    projection.payoutMode === signal.conversion.payoutMode &&
    projection.reliability === signal.conversion.reliability &&
    projection.source === signal.conversion.source &&
    projection.confidence === "high"
  );
}

function visibleCardPayoutCandidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyVisibleCardWithdrawalSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "card" &&
    candidate.sourceCardInstanceId === signal.sourceInstanceId &&
    (candidate.sourceDefinitionId === undefined ||
      candidate.sourceDefinitionId === signal.sourceDefinitionId) &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.actionType === "activated_card_ability" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === signal.conversion.clickCost &&
    projection.creditCost === signal.conversion.creditCost &&
    projection.grossLiquidCreditGain ===
      signal.conversion.grossLiquidCreditGain &&
    projection.netLiquidCreditGain === signal.conversion.netLiquidCreditGain &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    projection.source === "legal_action_payload" &&
    projection.confidence === "high"
  );
}

function economyImmediateOperationStepValue(
  signal: CorpEconomyImmediateOperationSignal,
): number {
  return (
    signal.conversion.netLiquidCreditGain * 20 +
    signal.conversion.cardsDrawn * 20
  );
}

function economyVisibleCardPayoutStepValue(
  signal: CorpEconomyVisibleCardWithdrawalSignal,
): number {
  return signal.conversion.netLiquidCreditGain * 20;
}

function economyOperationThresholdStepValue(
  signal: CorpEconomyOperationThresholdSignal,
): number {
  return 50 + signal.futureConversion.strategicEconomyValue * 10;
}

function candidateTargetIds(candidate: ActionSemanticCandidate): string[] {
  const selectedTargets =
    candidate.targetContext?.selectedTargets.map((target) => target.targetId) ??
    [];
  return [
    ...(selectedTargets.length > 0
      ? selectedTargets
      : (candidate.targetContext?.availableTargets?.map(
          (target) => target.targetId,
        ) ?? [])),
    ...(candidate.runProjectionSummary?.serverId
      ? [candidate.runProjectionSummary.serverId]
      : []),
  ];
}

function domain(context: PlanSchedulerContext): CorpCorePlanDomain {
  const value = corpDomainIfAvailable(context);
  if (value) return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Corp core domain before discovering Corp plans.",
  });
}

function modulePhase(moduleState: unknown): string {
  const value = moduleState as Partial<
    ScoreState | RemoteState | DefenseState | EconomyState
  >;
  if ("signal" in value && value.signal && "phase" in value.signal)
    return String(value.signal.phase);
  return value.kind ?? "execute";
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
