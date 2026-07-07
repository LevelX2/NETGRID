import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { actionProvidesCredits } from "../actions/action-effect-classification";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
} from "./semantic-runtime-corp-board-triage";
import {
  corpIcePlacementCandidateForAction,
  corpIcePlacementScoreComponent,
} from "./corp-ice-placement/corp-ice-placement";
import { corpUpgradeInstallPlacementComponent } from "./corp-upgrade-placement";
import { visibleCardDefinition } from "./card-definition-lookup";
import { rolesMatch } from "./role-match";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";

type SemanticRuntimeCorpSafetyGate = {
  allowed: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpRezFloorAssessment = {
  blockedByFloor: boolean;
  evidence: string[];
};

type SemanticRuntimeCorpAdvancementPlacementAssessment = {
  dominatedByBasicAdvance: boolean;
  scoreValue: number;
  evidence: string[];
};

type SemanticRuntimeCorpContestabilityAssessment = {
  contestable: boolean;
  evidence: string[];
};

type CorpBurstEconomyOperation = {
  actionKind: "operation" | "activated_ability";
  cost: number;
  gain: number;
  drawCards: number;
  netGain: number;
  actionValue: number;
  evidence: string[];
};

const CORP_IMMEDIATE_ECONOMY_MIN_ACTION_VALUE = 2;
const CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE = 3;
const CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR = 50;
const CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE = 1500;

export type SemanticRuntimeCorpScoreDependencies<TConsumer extends string> = {
  actionCreditCost: (action: LegalAction) => number;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  corpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpSafetyGate;
  corpAdvanceRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number;
  corpRemoteRezFloorAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpCentralRezReserveAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpRezFloorAssessment | undefined;
  corpRemoteScoreContestabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpContestabilityAssessment | undefined;
  corpActionIsScoreLine: (
    input: AiDecisionInput,
    action: LegalAction,
    roles?: string[],
  ) => boolean;
  corpAdvanceCompletesScore?: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  corpInstallRemoteScore: (
    input: AiDecisionInput,
    action: LegalAction,
    roles: string[],
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => number;
  corpScoringWindowAssessment?:
    | ((
        input: AiDecisionInput,
        action: LegalAction,
        roles?: string[],
      ) => CorpScoringWindowAssessment | undefined)
    | undefined;
  corpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpAdvancementPlacementAssessment | undefined;
  corpHasRemoteInstability: (input: AiDecisionInput) => boolean;
  corpHasRemoteRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpHasCentralRezFloorFundingNeed: (input: AiDecisionInput) => boolean;
  corpTaggedRunnerPayoffPressure: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpTaggedPayoffWindowPassiveActionPenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
  corpPassiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function semanticRuntimeCorpScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  const boardTriageState = semanticRuntimeCorpBoardTriage(
    input,
    dependencies,
  );
  const tacticalGoalFit = corpTacticalGoalFitScoreComponent(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (tacticalGoalFit) components.push(tacticalGoalFit);
  const boardTriage = semanticRuntimeCorpBoardTriageActionComponent(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  if (boardTriage) components.push(boardTriage);
  const activeScorelineAdvance =
    corpActiveRemoteAgendaAdvanceClockComponent(
      input,
      action,
      dependencies,
      boardTriageState,
    );
  if (activeScorelineAdvance) components.push(activeScorelineAdvance);
  const activeScoreRemoteFunding =
    corpActiveScoreRemoteReserveFundingComponent(input, action);
  if (activeScoreRemoteFunding) components.push(activeScoreRemoteFunding);
  const activeScorelineOffPath =
    corpActiveScorelineOffPathPenaltyComponent(
      input,
      action,
      dependencies,
      boardTriageState,
      actionSemanticCandidate,
    );
  if (activeScorelineOffPath) components.push(activeScorelineOffPath);
  const gameEndingExposure =
    corpGameEndingScorelineExposurePenaltyComponent(
      input,
      action,
      dependencies,
    );
  if (gameEndingExposure) components.push(gameEndingExposure);
  if (action.type === "score_agenda") {
    components.push({
      key: "corp_score_available_agenda",
      label: "Agenda punkten",
      value: 1200,
      reason: "score_agenda",
    });
    const safetyGate = dependencies.corpScoreNowSafetyGate(input, action);
    if (!safetyGate.allowed) {
      components.push({
        key: "corp_scoreline_safety_gate_blocks_doctrine",
        label: "Scoreline-Safety",
        value: -900,
        reason: safetyGate.evidence.join("|"),
      });
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
  }
  if (action.type === "advance_card") {
    components.push({
      key: "corp_advance_score_line",
      label: "Advance-Linie",
      value: 600,
      reason: "advance_card",
    });
    const remoteScore = dependencies.corpAdvanceRemoteScore(input, action);
    if (remoteScore !== 0) {
      components.push({
        key: "corp_advance_remote_context",
        label: "Remote-Kontext",
        value: remoteScore,
        reason: scopeId,
      });
    }
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_penalty",
          "Remote-Rez-Floor",
          -2400,
          rezFloor.evidence,
        ),
      );
    }
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action),
    );
    const sameTurnCloseout = corpSameTurnScoreCloseoutComponent(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
    );
    if (sameTurnCloseout) components.push(sameTurnCloseout);
    const scoreableAdvancePenalty = corpScoreableAgendaAdvancePenaltyComponent(
      input,
      action,
    );
    if (scoreableAdvancePenalty) components.push(scoreableAdvancePenalty);
  }
  if (action.type === "rez_ice") {
    const rezCost = semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    );
    components.push({
      key: "corp_rez_affordability",
      label: "Rez-Kosten zahlbar",
      value: credits >= rezCost ? 750 : -1200,
      reason: `credits:${credits};cost:${rezCost}`,
    });
    const effectiveDefense = semanticRuntimeCorpEffectiveDefenseContext(
      input,
      action,
      actionSemanticCandidate,
      { actionCreditCost: dependencies.actionCreditCost },
    );
    if (
      effectiveDefense?.hasImmediateStopPotential ||
      effectiveDefense?.hasMeaningfulTaxOrDamage
    ) {
      components.push({
        key: "corp_effective_defense_rez_value",
        label: "Wirksame Rez-Verteidigung",
        value: effectiveDefense.hasImmediateStopPotential ? 900 : 450,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.postRezAbilityAffordable === true) {
      components.push({
        key: "corp_effective_defense_post_rez_budget",
        label: "Post-Rez-Fähigkeitsbudget",
        value: effectiveDefense.requiresPostRezPaidAbility ? 350 : 0,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    if (effectiveDefense?.zeroEffectRisk) {
      components.push({
        key: "corp_effective_defense_zero_effect_risk",
        label: "Rez ohne wirksame Verteidigung",
        value: -1600,
        reason: effectiveDefense.evidence.join("|"),
      });
    }
    const downstreamReserve = corpDownstreamRezReserveAssessment(
      input,
      action,
      actionSemanticCandidate,
      dependencies,
      effectiveDefense,
    );
    if (downstreamReserve) components.push(downstreamReserve);
  }
  const postPassIceLifecycle = corpPostPassIceLifecycleComponent(action);
  if (postPassIceLifecycle) components.push(postPassIceLifecycle);
  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    const upgradePlacement = corpUpgradeInstallPlacementComponent({
      input,
      action,
      roles,
      actionSemanticCandidate,
      sourceCard: visibleSourceCardForAction(input, action),
      serverId: corpInstallServerId(action),
    });
    if (upgradePlacement) components.push(upgradePlacement);
    if (dependencies.corpActionIsScoreLine(input, action, roles)) {
      components.push({
        key: "corp_install_score_line",
        label: "Scoring-Aufbau",
        value: 550,
        reason: "score_line",
      });
      const punishPrimaryDampen =
        corpPunishPrimarySpeculativeScorelineDampenComponent(
          input,
          action,
          dependencies,
          roles,
        );
      if (punishPrimaryDampen) components.push(punishPrimaryDampen);
    }
    const hqAgendaRelief = corpHqAgendaReliefScorelineContext(
      input,
      action,
      dependencies,
      roles,
      boardTriageState,
    );
    if (
      action.payload?.placement === "ice" ||
      rolesMatch(roles, ["ice", "protect"])
    ) {
      components.push({
        key: "corp_install_protection",
        label: "Schutz-Aufbau",
        value: 650,
        reason: "protect_role",
      });
    }
    const icePlacement = corpIcePlacementComponent(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
    );
    if (icePlacement) components.push(icePlacement);
    const scorelineIceFundingPenalty =
      corpRemoteScorelineIceFundingPenaltyComponent(
        input,
        action,
        dependencies,
        roles,
        icePlacement,
      );
    if (scorelineIceFundingPenalty) {
      components.push(scorelineIceFundingPenalty);
    }
    if (rolesMatch(roles, ["economy"])) {
      components.push({
        key: "corp_install_economy",
        label: "Economy-Aufbau",
        value: 500,
        reason: "economy_role",
      });
    }
    const remoteScore = dependencies.corpInstallRemoteScore(
      input,
      action,
      roles,
      actionSemanticCandidate,
    );
    if (remoteScore !== 0) {
      const adjustedRemoteScore = hqAgendaRelief
        ? Math.max(remoteScore, -350)
        : remoteScore;
      components.push({
        key: "corp_install_remote_context",
        label: "Installations-Kontext",
        value: adjustedRemoteScore,
        reason: hqAgendaRelief
          ? `${scopeId}|${hqAgendaRelief.evidence.join("|")}|remote_context_floor:-350`
          : scopeId,
      });
    }
    const rootPayloadPlan = corpNonAgendaRootBlocksScoreRemoteComponent(
      input,
      action,
      dependencies,
      roles,
    );
    if (rootPayloadPlan) components.push(rootPayloadPlan);
    const scoreRemotePipeline =
      corpExistingScoreRemotePipelineComponent(
        input,
        action,
        dependencies,
        roles,
        boardTriageState,
      );
    if (scoreRemotePipeline) components.push(scoreRemotePipeline);
    const lowValueInstallDefer = corpLowValueInstallDeferComponent(
      input,
      action,
      dependencies,
      roles,
      boardTriageState,
    );
    if (lowValueInstallDefer) components.push(lowValueInstallDefer);
    if (hqAgendaRelief) components.push(hqAgendaRelief.component);
    addCorpScoringWindowEvidenceComponent(
      components,
      dependencies.corpScoringWindowAssessment?.(input, action, roles),
    );
    const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
    if (rezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_penalty",
          "Remote-Rez-Floor",
          -2400,
          rezFloor.evidence,
        ),
      );
    }
    const centralRezFloor = dependencies.corpCentralRezReserveAssessment(
      input,
      action,
    );
    if (centralRezFloor?.blockedByFloor) {
      components.push(
        corpReserveScoreComponent(
          "corp_central_rez_floor_penalty",
          "Zentrale Rez-Reserve",
          -4200,
          centralRezFloor.evidence,
        ),
      );
      components.push({
        key: "corp_central_unrezzable_ice_install_stop",
        label: "Unrezzbare Zentral-ICE-Installation",
        value: -500,
        reason: centralRezFloor.evidence.join("|"),
      });
    }
  }
  const contestableScoreLine =
    dependencies.corpRemoteScoreContestabilityAssessment(input, action);
  if (contestableScoreLine?.contestable) {
    const roles = dependencies.rolesForAction(input, action);
    const scoringWindow = dependencies.corpScoringWindowAssessment?.(
      input,
      action,
      roles,
    );
    if (corpScoringWindowSuppressesContestableRemotePenalty(scoringWindow)) {
      components.push({
        key: "corp_contestable_remote_score_penalty_suppressed",
        label: "Scoring-Window hebt Contestability auf",
        value: 0,
        reason: [
          ...contestableScoreLine.evidence,
          ...(scoringWindow?.evidence ?? []),
          "contestable_penalty_suppressed_by_scoring_window:true",
        ].join("|"),
      });
    } else {
      const hqAgendaRelief = corpHqAgendaReliefScorelineContext(
        input,
        action,
        dependencies,
        roles,
        boardTriageState,
      );
      components.push({
        key: "corp_contestable_remote_score_penalty",
        label: "Contestable Remote-Scoreline",
        value: hqAgendaRelief ? -900 : -3000,
        reason: [
          ...contestableScoreLine.evidence,
          ...(hqAgendaRelief
            ? [
                ...hqAgendaRelief.evidence,
                "contestable_penalty_softened_for_hq_relief:true",
              ]
            : []),
        ].join("|"),
      });
    }
  }
  const advancementPlacement =
    dependencies.corpAdvancementCounterPlacementAssessment(input, action);
  if (advancementPlacement) {
    components.push({
      key: advancementPlacement.dominatedByBasicAdvance
        ? "corp_advancement_counter_placement_dominated_by_basic_advance"
        : "corp_advancement_counter_placement_incremental_value",
      label: advancementPlacement.dominatedByBasicAdvance
        ? "Basic-Advance-Dominanz"
        : "Advancement-Mehrwert",
      value: advancementPlacement.scoreValue,
      reason: advancementPlacement.evidence.join("|"),
    });
  }
  if (
    action.type !== "score_agenda" &&
    corpActionCandidateHasScoreCloseoutSignal(actionSemanticCandidate)
  ) {
    const hasScoreCloseoutBasis =
      corpInputHasScoreCloseoutBasis(input) ||
      corpActionCandidateTargetsCorpScoreline(actionSemanticCandidate);
    if (hasScoreCloseoutBasis) {
      components.push({
        key: "corp_score_closeout_semantic_candidate",
        label: "Score-Closeout-Semantik",
        value: 1050,
        reason: [
          "score_closeout_signal:true",
          `score_closeout_basis:${hasScoreCloseoutBasis}`,
          `action:${action.type}`,
        ].join("|"),
      });
    }
  }
  const burstEconomyOperation = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  if (burstEconomyOperation) {
    components.push({
      key:
        burstEconomyOperation.actionKind === "activated_ability"
          ? "corp_activated_burst_economy"
          : "corp_operation_burst_economy",
      label:
        burstEconomyOperation.actionKind === "activated_ability"
          ? "Aktivierte Economy-Fähigkeit"
          : "Immediate-Economy-Operation",
      value: corpImmediateEconomyOperationScoreValue(burstEconomyOperation),
      reason: burstEconomyOperation.evidence.join("|"),
    });
  }
  const hqAgendaFloodDrawRisk = corpHqAgendaFloodDrawRiskComponent(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
    boardTriageState,
  );
  if (hqAgendaFloodDrawRisk) components.push(hqAgendaFloodDrawRisk);
  const burstEconomyThreshold =
    action.type === "gain_credit" && action.source === "basic_action"
      ? corpBurstEconomyThresholdAfterBasicCredit(input)
      : undefined;
  if (burstEconomyThreshold) {
    components.push({
      key: "corp_operation_economy_threshold_funding",
      label: "Operation-Schwelle",
      value: corpImmediateEconomyThresholdScoreValue(burstEconomyThreshold),
      reason: burstEconomyThreshold.evidence.join("|"),
    });
  }
  if (actionProvidesCredits(action) && credits < 6) {
    components.push({
      key: "corp_low_credits",
      label: "Credit-Bedarf",
      value: 700,
      reason: `credits:${credits}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_credit_reserve",
        label: "Remote-Reserve",
        value: 250,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_credit_reserve",
          "Remote-Rez-Floor",
          900,
          ["low_rez_reserve"],
        ),
      );
    }
    if (dependencies.corpHasCentralRezFloorFundingNeed(input)) {
      components.push(
        corpReserveScoreComponent(
          "corp_central_rez_floor_credit_reserve",
          "Zentrale Rez-Reserve",
          900,
          ["central_rez_reserve_needed"],
        ),
      );
    }
  }
  if (
    action.type === "gain_credit" &&
    credits >= 4 &&
    !dependencies.corpHasRemoteInstability(input) &&
    !dependencies.corpHasRemoteRezFloorFundingNeed(input) &&
    !dependencies.corpHasCentralRezFloorFundingNeed(input) &&
    corpInputHasConcreteDevelopmentAction(input, action)
  ) {
    components.push(
      corpReserveScoreComponent(
        "corp_reserve_satisfied_credit_loop_penalty",
        "Reserve erfüllt",
        -750,
        ["reserve_satisfied_concrete_action_available"],
      ),
    );
  }
  const preparedScoreRemoteAgendaSearch =
    corpPreparedScoreRemoteAgendaSearchComponent(
      input,
      action,
      dependencies,
      actionSemanticCandidate,
      boardTriageState,
    );
  if (preparedScoreRemoteAgendaSearch) {
    components.push(preparedScoreRemoteAgendaSearch);
  }
  if (action.type === "draw_card" && input.playerView.own.gripOrHq.length < 4) {
    components.push({
      key: "corp_low_hand",
      label: "Handkarten-Bedarf",
      value: 450,
      reason: `hand:${input.playerView.own.gripOrHq.length}`,
    });
    if (dependencies.corpHasRemoteInstability(input)) {
      components.push({
        key: "corp_remote_instability_draw",
        label: "Remote-Nachschub",
        value: 200,
        reason: "remote_instability",
      });
    }
    if (dependencies.corpHasRemoteRezFloorFundingNeed(input)) {
      components.push(
        corpReserveScoreComponent(
          "corp_remote_rez_floor_draw_fallback",
          "Remote-Rez-Floor",
          450,
          ["low_rez_reserve"],
        ),
      );
    }
    if (dependencies.corpHasCentralRezFloorFundingNeed(input)) {
      components.push(
        corpReserveScoreComponent(
          "corp_central_rez_floor_draw_fallback",
          "Zentrale Rez-Reserve",
          450,
          ["central_rez_reserve_needed"],
        ),
      );
    }
  }
  const taggedRunnerPayoffPressure =
    dependencies.corpTaggedRunnerPayoffPressure(input, action);
  if (taggedRunnerPayoffPressure) components.push(taggedRunnerPayoffPressure);
  const taggedPayoffPassivePenalty =
    dependencies.corpTaggedPayoffWindowPassiveActionPenalty(input, action);
  if (taggedPayoffPassivePenalty) components.push(taggedPayoffPassivePenalty);
  const passiveScoreLinePenalty = dependencies.corpPassiveScoreLinePenalty(
    input,
    action,
  );
  if (passiveScoreLinePenalty) components.push(passiveScoreLinePenalty);
  if (action.type === "decline_rez" && scopeId === "simple_rez") {
    components.push({
      key: "corp_decline_rez_pressure",
      label: "Rez ablehnen",
      value: -700,
      reason: scopeId,
    });
  }
  if (action.type === "end_turn" && input.playerView.own.clicks > 0) {
    components.push({
      key: "corp_unused_actions",
      label: "Ungenutzte Aktionen",
      value: -1400,
      reason: `actions:${input.playerView.own.clicks}`,
    });
    if (
      credits <= 2 &&
      corpLegalEconomyActionExists(input) &&
      (dependencies.corpHasRemoteInstability(input) ||
        dependencies.corpHasRemoteRezFloorFundingNeed(input) ||
        dependencies.corpHasCentralRezFloorFundingNeed(input))
    ) {
      components.push({
        key: "corp_end_turn_leaves_critical_funding_gap",
        label: "Funding vor Zugende",
        value: -900,
        reason: [
          `credits:${credits}`,
          `remote_instability:${dependencies.corpHasRemoteInstability(input)}`,
          `remote_rez_floor:${dependencies.corpHasRemoteRezFloorFundingNeed(input)}`,
          `central_rez_floor:${dependencies.corpHasCentralRezFloorFundingNeed(input)}`,
        ].join("|"),
      });
    }
  }
  return components;
}

function corpScoringWindowSuppressesContestableRemotePenalty(
  assessment: CorpScoringWindowAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (
    assessment.windowKind !== "durable" &&
    assessment.windowKind !== "temporary_safe"
  ) {
    return false;
  }
  if (assessment.runnerCanContestBeforeScore) return false;
  if (assessment.agendaStealRelevantBeforeScore) return false;
  if (!assessment.corpCanRezRelevantIce) return false;
  if (assessment.corpCanRezFullPathWithDynamicReserve === false) return false;
  return true;
}

function corpHqAgendaCount(input: AiDecisionInput): number {
  return input.playerView.own.gripOrHq.filter(
    (card) => card.known !== false && corpVisibleCardIsAgenda(card),
  ).length;
}

export function normalizedCorpReserveScoreValue(rawValue: number): number {
  return Math.max(
    -100,
    Math.min(
      100,
      Math.round(rawValue / CORP_RESERVE_SCORE_NORMALIZATION_DIVISOR),
    ),
  );
}

function corpReserveScoreComponent(
  key: string,
  label: string,
  rawValue: number,
  evidence: readonly string[],
): AiDecisionScoreComponent {
  const normalizedValue = normalizedCorpReserveScoreValue(rawValue);
  return {
    key,
    label,
    value: normalizedValue,
    reason: [
      ...evidence,
      `reserve_raw_value:${rawValue}`,
      `reserve_normalized_value:${normalizedValue}`,
    ].join("|"),
  };
}

function corpGameEndingScorelineExposurePenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "advance_card") {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (dependencies.corpAdvanceCompletesScore?.(input, action) === true) {
    return undefined;
  }
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (!assessment || assessment.scoreHorizon === "immediate") {
    return undefined;
  }
  const runnerCanAccessBeforeScore =
    assessment.runnerCanContestBeforeScore ||
    assessment.runnerCanReachAccessBeforeScore ||
    assessment.agendaStealRelevantBeforeScore;
  if (!runnerCanAccessBeforeScore) return undefined;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  const runnerAgendaPointsAfterSteal =
    typeof assessment.runnerAgendaPointsAfterSteal === "number"
      ? assessment.runnerAgendaPointsAfterSteal
      : 0;
  const gameEndingSteal =
    assessment.agendaStealSeverity === "game_ending" ||
    runnerAgendaPointsAfterSteal >= pointsToWin;
  if (!gameEndingSteal) return undefined;
  if (
    assessment.windowKind !== "unsafe" &&
    assessment.recommendedNextStep !== "build_remote_ice" &&
    assessment.recommendedNextStep !== "gain_credit"
  ) {
    return undefined;
  }
  return {
    key: "corp_game_ending_scoreline_exposure_penalty",
    label: "Game-ending Scoreline-Exposure",
    value: -4600,
    reason: [
      "scoreline_exposes_game_ending_steal:true",
      `action:${action.type}`,
      `server:${assessment.serverId}`,
      `score_horizon:${assessment.scoreHorizon}`,
      `window_kind:${assessment.windowKind}`,
      `recommended_next_step:${assessment.recommendedNextStep}`,
      `runner_can_contest_before_score:${assessment.runnerCanContestBeforeScore}`,
      `runner_can_reach_access_before_score:${assessment.runnerCanReachAccessBeforeScore}`,
      `agenda_steal_relevant_before_score:${assessment.agendaStealRelevantBeforeScore}`,
      `agenda_steal_severity:${assessment.agendaStealSeverity ?? "unknown"}`,
      `runner_points_after_steal:${runnerAgendaPointsAfterSteal}`,
      ...assessment.evidence,
    ].join("|"),
  };
}

type CorpActiveRemoteScorelineState = {
  serverId: string;
  cardId: string;
  reserveFloor: number;
  agendaPointsAtRisk: number;
  advancesRemaining: number;
  unrezzedRemoteRezCost: number;
  evidence: string[];
};

function corpActiveRemoteAgendaAdvanceClockComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.instanceId !== state.cardId) {
    return undefined;
  }
  const roles = dependencies.rolesForAction(input, action);
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  const rezFloor = dependencies.corpRemoteRezFloorAssessment(input, action);
  if (rezFloor?.blockedByFloor) return undefined;
  const creditsAfterAction =
    input.playerView.own.credits - dependencies.actionCreditCost(action);
  const closesBeforeRunner =
    dependencies.corpAdvanceCompletesScore?.(input, action) === true ||
    scoringWindow?.scoreHorizon === "immediate";
  const scoringWindowNeedsFunding =
    scoringWindow?.recommendedNextStep === "gain_credit" ||
    scoringWindow?.corpCanRezRelevantIce === false ||
    scoringWindow?.corpCanRezFullPathWithDynamicReserve === false;
  const tempoAdvanceUnderClock =
    corpActiveRemoteAgendaCanTempoAdvanceUnderClock(
      input,
      dependencies,
      boardTriageState,
      state,
    );
  if (
    !closesBeforeRunner &&
    scoringWindowNeedsFunding &&
    creditsAfterAction < state.reserveFloor &&
    !tempoAdvanceUnderClock.allowed
  ) {
    return {
      key: "corp_active_remote_agenda_underfunded_advance",
      label: "Remote-Agenda-Funding",
      value: -9000,
      reason: [
        "active_remote_agenda:true",
        "advance_breaks_score_remote_reserve:true",
        `server:${state.serverId}`,
        `card:${state.cardId}`,
        `credits_after_action:${creditsAfterAction}`,
        `reserve_floor:${state.reserveFloor}`,
        `advances_remaining:${state.advancesRemaining}`,
        `unrezzed_remote_rez_cost:${state.unrezzedRemoteRezCost}`,
        ...(scoringWindow?.recommendedNextStep
          ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
          : []),
        ...tempoAdvanceUnderClock.evidence,
        ...state.evidence,
      ].join("|"),
    };
  }
  if (scoringWindow?.recommendedNextStep === "gain_credit") {
    return undefined;
  }
  if (
    boardTriageState.primary === "protect_hq" ||
    boardTriageState.primary === "protect_rd"
  ) {
    if (boardTriageState.severity === "critical") return undefined;
  }
  const runnerAgendaPoints = positiveOrZeroNumber(
    input.playerView.opponent?.agendaPoints,
  ) ?? 0;
  const severityBonus =
    runnerAgendaPoints >= 5 ||
    state.agendaPointsAtRisk >= 3 ||
    scoringWindow?.agendaStealSeverity === "near_win" ||
        scoringWindow?.agendaStealSeverity === "game_ending"
      ? 700
      : 0;
  const tempoAdvanceBonus =
    tempoAdvanceUnderClock.allowed && boardTriageState.severity === "critical"
      ? 1600
      : tempoAdvanceUnderClock.allowed
        ? 800
        : 0;
  return {
    key: "corp_active_remote_agenda_advance_clock",
    label: "Aktive Remote-Agenda",
    value: 2600 + severityBonus + tempoAdvanceBonus,
    reason: [
      "active_remote_agenda:true",
      ...(tempoAdvanceUnderClock.allowed
        ? ["tempo_advance_under_scoreline_clock:true"]
        : []),
      `server:${state.serverId}`,
      `card:${state.cardId}`,
      `advances_remaining:${state.advancesRemaining}`,
      `agenda_points_at_risk:${state.agendaPointsAtRisk}`,
      `runner_agenda_points:${runnerAgendaPoints}`,
      ...(scoringWindow?.recommendedNextStep
        ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
        : []),
      ...tempoAdvanceUnderClock.evidence,
      ...state.evidence,
    ].join("|"),
  };
}

function corpActiveRemoteAgendaCanTempoAdvanceUnderClock<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
  state: CorpActiveRemoteScorelineState,
): { allowed: boolean; evidence: string[] } {
  if (boardTriageState.primary !== "score_now") {
    return { allowed: false, evidence: ["tempo_score_now:false"] };
  }
  const triageServer =
    boardTriageState.scoreRemoteServerId ?? boardTriageState.targetServerId;
  if (triageServer !== undefined && triageServer !== state.serverId) {
    return {
      allowed: false,
      evidence: [`tempo_score_now_target_mismatch:${triageServer}`],
    };
  }
  const blockingIce = corpStrongSameRemoteIceInstallForScoreline(
    input,
    dependencies,
    state.serverId,
  );
  if (blockingIce) {
    return {
      allowed: false,
      evidence: [
        "tempo_score_now_blocked_by_remote_ice:true",
        `blocking_ice_action:${blockingIce.actionId}`,
        `blocking_ice_score:${blockingIce.score}`,
        `blocking_ice_recommendation:${blockingIce.recommendation}`,
      ],
    };
  }
  return { allowed: true, evidence: ["tempo_score_now:true"] };
}

function corpStrongSameRemoteIceInstallForScoreline<TConsumer extends string>(
  input: AiDecisionInput,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  serverId: string,
):
  | {
      actionId: string;
      score: number;
      recommendation: string;
    }
  | undefined {
  const legalActions = input.legalActions ?? input.playerView.legalActions ?? [];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return legalActions
    .map((candidateAction) => {
      if (
        candidateAction.side !== "corp" ||
        candidateAction.type !== "install_card" ||
        candidateAction.payload?.placement !== "ice" ||
        corpInstallServerId(candidateAction) !== serverId
      ) {
        return undefined;
      }
      const sourceCard = visibleSourceCardForAction(input, candidateAction);
      return corpIcePlacementCandidateForAction({
        input,
        action: candidateAction,
        serverId,
        server,
        sourceCard,
        actionCreditCost: dependencies.actionCreditCost(candidateAction),
        iceRezCost: sourceCard?.rezCost,
        hasUrgentScoreline: true,
      });
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> =>
      Boolean(candidate),
    )
    .filter(
      (candidate) =>
        candidate.recommendation === "install_now" &&
        candidate.score >= CORP_SCORE_NOW_TEMPO_BLOCKING_REMOTE_ICE_SCORE,
    )
    .sort((left, right) => right.score - left.score)[0];
}

function corpActiveScoreRemoteReserveFundingComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "gain_credit") return undefined;
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const credits = input.playerView.own.credits;
  if (credits >= state.reserveFloor) return undefined;
  return {
    key: "corp_active_score_remote_reserve_funding",
    label: "Score-Remote-Reserve",
    value: 950,
    reason: [
      "active_remote_agenda:true",
      `server:${state.serverId}`,
      `credits:${credits}`,
      `reserve_floor:${state.reserveFloor}`,
      `advances_remaining:${state.advancesRemaining}`,
      `unrezzed_remote_rez_cost:${state.unrezzedRemoteRezCost}`,
      ...state.evidence,
    ].join("|"),
  };
}

function corpActiveScorelineOffPathPenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "rez_ice") {
    return undefined;
  }
  const state = corpActiveRemoteScorelineState(input);
  if (!state) return undefined;
  const actionServerId = corpScorelineActionServerId(input, action);
  if (actionServerId === state.serverId) return undefined;
  if (
    (boardTriageState.primary === "protect_hq" ||
      boardTriageState.primary === "protect_rd") &&
    boardTriageState.severity === "critical" &&
    actionServerId === boardTriageState.targetServerId
  ) {
    return undefined;
  }
  if (
    action.type === "install_card" &&
    action.payload?.placement === "root" &&
    dependencies.corpActionIsScoreLine(
      input,
      action,
      dependencies.rolesForAction(input, action),
    )
  ) {
    return undefined;
  }
  const cost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const creditsAfterAction = input.playerView.own.credits - cost;
  const breaksReserve = creditsAfterAction < state.reserveFloor;
  return {
    key: "corp_active_scoreline_off_path_spend",
    label: "Scoreline-Reservebruch",
    value: breaksReserve ? -2600 : -1500,
    reason: [
      "active_remote_agenda:true",
      `score_remote:${state.serverId}`,
      `action_server:${actionServerId ?? "none"}`,
      `action:${action.type}`,
      `cost:${cost}`,
      `credits_after_action:${creditsAfterAction}`,
      `reserve_floor:${state.reserveFloor}`,
      `breaks_reserve:${breaksReserve}`,
      ...state.evidence,
    ].join("|"),
  };
}

function corpExistingScoreRemotePipelineComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card") return undefined;
  if (
    boardTriageState.primary === "protect_hq" ||
    boardTriageState.primary === "protect_rd"
  ) {
    if (boardTriageState.severity === "critical") return undefined;
  }
  if (corpActiveRemoteScorelineState(input)) return undefined;
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (!pipeline) return undefined;
  const serverId = corpInstallServerId(action);
  const isScorelineRoot =
    action.payload?.placement === "root" &&
    dependencies.corpActionIsScoreLine(input, action, roles);
  if (serverId === pipeline.serverId) {
    if (isScorelineRoot) {
      return {
        key: "corp_existing_score_remote_pipeline",
        label: "Vorbereitetes Scoring-Remote",
        value: 1800,
        reason: [
          "existing_score_remote_pipeline:true",
          `server:${pipeline.serverId}`,
          `ice_count:${pipeline.iceCount}`,
          "payload:scoreline_root",
        ].join("|"),
      };
    }
    if (action.payload?.placement === "ice") {
      return {
        key: "corp_existing_score_remote_pipeline",
        label: "Vorbereitetes Scoring-Remote",
        value: 700,
        reason: [
          "existing_score_remote_pipeline:true",
          `server:${pipeline.serverId}`,
          `ice_count:${pipeline.iceCount}`,
          "payload:additional_remote_ice",
        ].join("|"),
      };
    }
    return undefined;
  }
  if (serverId === "new_remote") {
    return {
      key: "corp_remote_sprawl_penalty",
      label: "Remote-Sprawl",
      value: -3600,
      reason: [
        "existing_score_remote_pipeline:true",
        `preferred_server:${pipeline.serverId}`,
        "action_server:new_remote",
        `placement:${String(action.payload?.placement ?? "unknown")}`,
      ].join("|"),
    };
  }
  if (serverId?.startsWith("remote_") && !isScorelineRoot) {
    return {
      key: "corp_remote_sprawl_penalty",
      label: "Remote-Sprawl",
      value: -1800,
      reason: [
        "existing_score_remote_pipeline:true",
        `preferred_server:${pipeline.serverId}`,
        `action_server:${serverId}`,
        `placement:${String(action.payload?.placement ?? "unknown")}`,
      ].join("|"),
    };
  }
  return undefined;
}

function corpLowValueInstallDeferComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card") return undefined;
  if (boardTriageState.primary !== "low_value") return undefined;
  if (dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (rolesMatch(roles, ["economy"])) return undefined;
  const serverId = corpInstallServerId(action);
  const iceCount = serverId ? corpServerIceCount(input, serverId) : 0;
  const emptyRemote =
    serverId?.startsWith("remote_") === true &&
    input.playerView.servers.find((server) => server.id === serverId)?.root
      .length === 0;
  if (
    action.payload?.placement !== "ice" &&
    action.payload?.placement !== "root"
  ) {
    return undefined;
  }
  if (iceCount < 2 && !emptyRemote && serverId !== "new_remote") {
    return undefined;
  }
  return {
    key: "corp_low_value_install_defer",
    label: "Installation vertagen",
    value: -1300,
    reason: [
      "triage_primary:low_value",
      `server:${serverId ?? "none"}`,
      `ice_count:${iceCount}`,
      `empty_remote:${emptyRemote}`,
      `placement:${String(action.payload?.placement ?? "unknown")}`,
    ].join("|"),
  };
}

function corpActiveRemoteScorelineState(
  input: AiDecisionInput,
): CorpActiveRemoteScorelineState | undefined {
  return input.playerView.servers
    .filter((server) => server.id.startsWith("remote_"))
    .flatMap((server) =>
      server.root
        .filter((card) => card.known !== false && corpVisibleCardIsAgenda(card))
        .map((card) => {
          const requirement = corpVisibleAdvancementRequirement(card);
          const counters = positiveOrZeroNumber(card.advancementCounters) ?? 0;
          const advancesRemaining =
            requirement === undefined
              ? 0
              : Math.max(0, requirement - counters);
          const unrezzedRemoteRezCost = corpVisibleUnrezzedRezCost(server.ice);
          const reserveFloor = Math.min(
            8,
            Math.max(2, advancesRemaining + unrezzedRemoteRezCost),
          );
          const agendaPointsAtRisk = corpVisibleAgendaPoints(card);
          return {
            serverId: server.id,
            cardId: card.instanceId,
            reserveFloor,
            agendaPointsAtRisk,
            advancesRemaining,
            unrezzedRemoteRezCost,
            evidence: [
              `active_scoreline_server:${server.id}`,
              `active_scoreline_card:${card.instanceId}`,
              `active_scoreline_requirement:${requirement ?? "unknown"}`,
              `active_scoreline_counters:${counters}`,
              `active_scoreline_reserve_floor:${reserveFloor}`,
            ],
          };
        }),
    )
    .sort(
      (left, right) =>
        right.agendaPointsAtRisk - left.agendaPointsAtRisk ||
        right.reserveFloor - left.reserveFloor ||
        left.serverId.localeCompare(right.serverId),
    )[0];
}

type CorpPreparedScoreRemotePipeline = {
  serverId: string;
  iceCount: number;
  unrezzedRezCost: number;
  reserveFloor: number;
};

function corpPreparedScoreRemotePipeline(
  input: AiDecisionInput,
): CorpPreparedScoreRemotePipeline | undefined {
  return input.playerView.servers
    .filter(
      (server) =>
        server.id.startsWith("remote_") &&
        server.root.length === 0 &&
        server.ice.length > 0,
    )
    .map((server) => {
      const unrezzedRezCost = corpVisibleUnrezzedRezCost(server.ice);
      return {
        serverId: server.id,
        iceCount: server.ice.length,
        unrezzedRezCost,
        reserveFloor: Math.min(8, Math.max(3, unrezzedRezCost + 2)),
      };
    })
    .sort(
      (left, right) =>
        right.iceCount - left.iceCount ||
        right.reserveFloor - left.reserveFloor ||
        left.serverId.localeCompare(right.serverId),
    )[0];
}

function corpPreparedScoreRemoteAgendaSearchComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (corpActiveRemoteScorelineState(input)) return undefined;
  const pipeline = corpPreparedScoreRemotePipeline(input);
  if (!pipeline) return undefined;
  if (corpHqAgendaCount(input) > 0) return undefined;
  const rdCount = positiveOrZeroNumber(input.playerView.own.stackOrRdCount) ?? 0;
  if (rdCount <= 0) return undefined;
  if (
    (boardTriageState.primary === "protect_hq" ||
      boardTriageState.primary === "protect_rd") &&
    boardTriageState.severity === "critical"
  ) {
    return undefined;
  }
  const credits = input.playerView.own.credits;
  if (credits < pipeline.reserveFloor) return undefined;
  const roles = dependencies.rolesForAction(input, action);
  const burstEconomy = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  const drawsCards =
    action.type === "draw_card" || (burstEconomy?.drawCards ?? 0) > 0;
  const isEconomy =
    action.type === "gain_credit" ||
    Boolean(burstEconomy) ||
    rolesMatch(roles, ["economy"]);
  const evidence = [
    "prepared_score_remote_agenda_search:true",
    `server:${pipeline.serverId}`,
    `ice_count:${pipeline.iceCount}`,
    `credits:${credits}`,
    `reserve_floor:${pipeline.reserveFloor}`,
    `unrezzed_remote_rez_cost:${pipeline.unrezzedRezCost}`,
    `rd_count:${rdCount}`,
    `triage_primary:${boardTriageState.primary}`,
    `triage_severity:${boardTriageState.severity}`,
  ];
  if (drawsCards) {
    return {
      key: "corp_prepared_score_remote_agenda_search",
      label: "Agenda-Suche fuer vorbereitetes Remote",
      value: action.type === "draw_card" ? 2200 : 1300,
      reason: [...evidence, `action:${action.type}`, "draws_cards:true"].join(
        "|",
      ),
    };
  }
  if (isEconomy) {
    return {
      key: "corp_prepared_score_remote_credit_loop_penalty",
      label: "Credit-Loop trotz vorbereitetem Remote",
      value: -1300,
      reason: [...evidence, `action:${action.type}`, "draws_cards:false"].join(
        "|",
      ),
    };
  }
  return undefined;
}

function corpVisibleUnrezzedRezCost(ice: readonly VisibleCard[]): number {
  return ice
    .filter((card) => card.known !== false && card.rezzed !== true)
    .reduce((sum, card) => {
      const definition = visibleCardDefinition(card);
      const rezCost =
        positiveOrZeroNumber(card.rezCost) ??
        positiveOrZeroNumber(definition?.rezCost) ??
        0;
      return sum + rezCost;
    }, 0);
}

function corpVisibleAgendaPoints(card: VisibleCard): number {
  const definition = visibleCardDefinition(card);
  return (
    positiveOrZeroNumber(card.agendaPoints) ??
    positiveOrZeroNumber(definition?.agendaPoints) ??
    0
  );
}

function corpServerIceCount(input: AiDecisionInput, serverId: string): number {
  return (
    input.playerView.servers.find((server) => server.id === serverId)?.ice
      .length ?? 0
  );
}

function corpHqAgendaReliefScorelineContext<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
):
  | {
      component: AiDecisionScoreComponent;
      evidence: string[];
    }
  | undefined {
  if (boardTriageState.primary !== "force_scoreline_clock") return undefined;
  if (
    !boardTriageState.evidence.includes("corp_hq_agenda_flood_pressure:true") ||
    !boardTriageState.evidence.includes(
      "corp_hq_agenda_relative_remote_relief:true",
    )
  ) {
    return undefined;
  }
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  if (
    action.type !== "advance_card" &&
    !(
      action.type === "install_card" &&
      action.payload?.placement !== "ice"
    )
  ) {
    return undefined;
  }

  const serverId = corpScorelineActionServerId(input, action);
  if (
    !serverId?.startsWith("remote_") ||
    (boardTriageState.targetServerId !== undefined &&
      boardTriageState.targetServerId !== serverId)
  ) {
    return undefined;
  }

  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (!assessment) return undefined;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  const runnerAgendaPointsAfterSteal =
    typeof assessment.runnerAgendaPointsAfterSteal === "number"
      ? assessment.runnerAgendaPointsAfterSteal
      : 0;
  if (
    assessment.windowKind !== "unsafe" ||
    assessment.agendaStealSeverity !== "near_win" ||
    runnerAgendaPointsAfterSteal >= pointsToWin ||
    assessment.recommendedNextStep === "gain_credit" ||
    assessment.corpCanRezRelevantIce === false ||
    assessment.corpCanRezFullPathWithDynamicReserve === false ||
    (assessment.dynamicProtectionWeaknessCount ?? 0) > 0 ||
    (assessment.affordableDurableRelevantIceCount ?? 0) < 1
  ) {
    return undefined;
  }

  const evidence = [
    "hq_agenda_relief_scoreline:true",
    `server:${serverId}`,
    `agenda_steal_severity:${assessment.agendaStealSeverity}`,
    `runner_points_after_steal:${runnerAgendaPointsAfterSteal}`,
    `affordable_durable_ice:${assessment.affordableDurableRelevantIceCount ?? 0}`,
  ];
  return {
    component: {
      key: "corp_hq_agenda_relief_scoreline",
      label: "HQ-Agenda-Entlastung",
      value: 3200,
      reason: evidence.join("|"),
    },
    evidence,
  };
}

function corpPunishPrimarySpeculativeScorelineDampenComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
): AiDecisionScoreComponent | undefined {
  if (!corpScoreRuntimeIsPunishPrimary(input)) return undefined;
  if (action.type !== "install_card" || action.payload?.placement === "ice") {
    return undefined;
  }
  if (!dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  const assessment = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  if (assessment?.scoreHorizon === "immediate") return undefined;
  const runnerAgendaPoints =
    positiveOrZeroNumber(input.playerView.opponent?.agendaPoints) ?? 0;
  const runnerAgendaPointsAfterSteal =
    positiveOrZeroNumber(assessment?.runnerAgendaPointsAfterSteal) ?? 0;
  const pointsToWin = input.playerView.agendaPointsToWin ?? 7;
  if (
    runnerAgendaPoints >= 5 ||
    runnerAgendaPointsAfterSteal >= pointsToWin ||
    assessment?.agendaStealSeverity === "game_ending"
  ) {
    return undefined;
  }
  return {
    key: "corp_punish_primary_speculative_scoreline_dampen",
    label: "Punish-Deck-Scoreline",
    value: -1800,
    reason: [
      "corp_primary_win_intent:punish_runner",
      "speculative_scoreline_install:true",
      assessment?.scoreHorizon
        ? `score_horizon:${assessment.scoreHorizon}`
        : "score_horizon:unknown",
    ].join("|"),
  };
}

function corpScoreRuntimeIsPunishPrimary(input: AiDecisionInput): boolean {
  const intent = (
    input as AiDecisionInput & {
      ownCorpStrategicIntent?: {
        primaryWinIntent?: string;
        scorePlan?: readonly string[];
        punishPlan?: readonly string[];
      };
    }
  ).ownCorpStrategicIntent;
  if (!intent) return false;
  if (intent.primaryWinIntent === "corp.punish_runner") return true;
  return (
    (intent.punishPlan?.length ?? 0) > 0 &&
    intent.scorePlan?.some((plan) =>
      ["corp.rush_scoreline", "corp.fast_advance_scoreline"].includes(plan),
    ) !== true
  );
}

function corpScorelineActionServerId(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const direct =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  if (typeof direct === "string") return direct;
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof action.payload?.targetCardId === "string"
        ? action.payload.targetCardId
        : typeof action.payload?.iceId === "string"
          ? action.payload.iceId
          : typeof action.source === "string"
            ? action.source
            : undefined;
  return cardId ? corpServerIdForInstalledCard(input, cardId) : undefined;
}

function corpNonAgendaRootBlocksScoreRemoteComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "root") {
    return undefined;
  }
  if (dependencies.corpActionIsScoreLine(input, action, roles)) {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  if (!serverId?.startsWith("remote_")) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server || server.root.length > 0 || server.ice.length === 0) {
    return undefined;
  }
  const source = visibleSourceCardForAction(input, action);
  const definition = source ? visibleCardDefinition(source) : undefined;
  if (source?.type === "agenda" || definition?.type === "agenda") {
    return undefined;
  }
  const agendaInstall = corpLegalActions(input).find((candidate) => {
    if (candidate.actionId === action.actionId) return false;
    if (
      candidate.type !== "install_card" ||
      candidate.payload?.placement !== "root" ||
      corpInstallServerId(candidate) !== serverId
    ) {
      return false;
    }
    const candidateRoles = dependencies.rolesForAction(input, candidate);
    return dependencies.corpActionIsScoreLine(
      input,
      candidate,
      candidateRoles,
    );
  });
  if (!agendaInstall) return undefined;
  return {
    key: "corp_non_agenda_root_blocks_score_remote",
    label: "Scoring-Remote-Payload",
    value: -1800,
    reason: [
      "non_agenda_root_blocks_score_remote:true",
      `server:${serverId}`,
      `available_scoreline_action:${agendaInstall.actionId}`,
    ].join("|"),
  };
}

function corpHqAgendaFloodDrawRiskComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  boardTriageState: ReturnType<typeof semanticRuntimeCorpBoardTriage>,
): AiDecisionScoreComponent | undefined {
  if (boardTriageState.primary !== "force_scoreline_clock") return undefined;
  if (!boardTriageState.evidence.includes("corp_hq_agenda_flood_pressure:true")) {
    return undefined;
  }
  const burstEconomyOperation = corpBurstEconomyOperationForAction(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  const drawCards =
    action.type === "draw_card" ? 1 : burstEconomyOperation?.drawCards ?? 0;
  if (drawCards <= 0) return undefined;
  return {
    key: "corp_hq_agenda_flood_draw_risk",
    label: "HQ-Flood-Draw-Risiko",
    value: -1800,
    reason: [
      "hq_agenda_flood:true",
      `draw_cards:${drawCards}`,
      "scoreline_clock_before_more_hq_cards:true",
    ].join("|"),
  };
}

function corpLegalActions(input: AiDecisionInput): LegalAction[] {
  return (input.legalActions ?? input.playerView.legalActions ?? []).filter(
    (action) => action.side === "corp",
  );
}

function corpInputHasConcreteDevelopmentAction(
  input: AiDecisionInput,
  currentAction: LegalAction,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some((candidate) => {
    if (candidate.actionId === currentAction.actionId) return false;
    if (candidate.side !== "corp") return false;
    return (
      candidate.type === "score_agenda" ||
      candidate.type === "advance_card" ||
      candidate.type === "rez_ice" ||
      (candidate.type === "install_card" &&
        (candidate.payload?.placement === "ice" ||
          candidate.payload?.placement === "root")) ||
      candidate.type === "play_operation"
    );
  });
}

function corpLegalEconomyActionExists(input: AiDecisionInput): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some(
    (candidate) =>
      candidate.side === "corp" &&
      (actionProvidesCredits(candidate) ||
        candidate.type === "play_operation" ||
        candidate.type === "activated_card_ability" ||
        candidate.type === "trigger_ability"),
  );
}

function corpIcePlacementComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  const server =
    serverId && serverId !== "new_remote"
      ? input.playerView.servers.find((candidate) => candidate.id === serverId)
      : undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    dependencies.rolesForAction(input, action),
  );
  return corpIcePlacementScoreComponent({
    input,
    action,
    serverId,
    server,
    sourceCard,
    actionCreditCost: semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ),
    iceRezCost: sourceCard?.rezCost,
    hasUrgentScoreline:
      scoringWindow?.recommendedNextStep === "build_remote_ice" ||
      scoringWindow?.agendaStealSeverity === "game_ending",
  });
}

function corpRemoteScorelineIceFundingPenaltyComponent<
  TConsumer extends string,
>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  roles: string[],
  icePlacement: AiDecisionScoreComponent | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" || action.payload?.placement !== "ice") {
    return undefined;
  }
  const serverId = corpInstallServerId(action);
  if (!serverId?.startsWith("remote_")) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const hasActiveScoreline = corpServerHasVisibleScorelineRoot(server);
  const preparedPipeline = corpPreparedScoreRemotePipeline(input);
  const isPreparedScoreRemote =
    !hasActiveScoreline && preparedPipeline?.serverId === serverId;
  if (!hasActiveScoreline && !isPreparedScoreRemote) return undefined;

  const placementReason = icePlacement?.reason ?? "";
  const placementPrefersFunding =
    placementReason.includes("recommendation:prefer_economy") ||
    placementReason.includes("defer_reason:rez_reserve_too_low");
  const scoringWindow = dependencies.corpScoringWindowAssessment?.(
    input,
    action,
    roles,
  );
  const windowNeedsFunding =
    scoringWindow?.recommendedNextStep === "gain_credit" ||
    scoringWindow?.corpCanRezRelevantIce === false ||
    scoringWindow?.corpCanRezFullPathWithDynamicReserve === false;
  if (!placementPrefersFunding && !windowNeedsFunding) return undefined;
  const value = -1900;

  return {
    key: "corp_remote_scoreline_unfunded_ice_install_penalty",
    label: "Remote-Scoreline-Funding",
    value,
    reason: [
      hasActiveScoreline
        ? "active_remote_scoreline:true"
        : "prepared_score_remote:true",
      `server:${serverId}`,
      `penalty_value:${value}`,
      ...(isPreparedScoreRemote && preparedPipeline
        ? [
            `prepared_ice_count:${preparedPipeline.iceCount}`,
            `prepared_reserve_floor:${preparedPipeline.reserveFloor}`,
          ]
        : []),
      `placement_prefers_funding:${placementPrefersFunding}`,
      `window_needs_funding:${windowNeedsFunding}`,
      ...(scoringWindow?.recommendedNextStep
        ? [`recommended_next_step:${scoringWindow.recommendedNextStep}`]
        : []),
      ...(scoringWindow?.dynamicProtectionReserve !== undefined
        ? [`dynamic_protection_reserve:${scoringWindow.dynamicProtectionReserve}`]
        : []),
    ].join("|"),
  };
}

function corpServerHasVisibleScorelineRoot(
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
): boolean {
  return (
    server?.root.some(
      (card) =>
        card.known !== false &&
        (card.type === "agenda" ||
          typeof card.advancementRequirement === "number" ||
          typeof visibleCardDefinition(card)?.advancementRequirement ===
            "number" ||
          (card.advancementCounters ?? 0) > 0),
    ) === true
  );
}

function corpInstallServerId(action: LegalAction): string | undefined {
  const serverId =
    action.payload?.serverId ??
    action.payload?.targetServerId ??
    action.payload?.attackedServerId;
  return typeof serverId === "string" ? serverId : undefined;
}

function corpPostPassIceLifecycleComponent(
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    action.type !== "continue_run" ||
    action.payload?.corpPostPassIceAbility !== "return_passed_ice_to_hq"
  ) {
    return undefined;
  }
  const decision =
    typeof action.payload.decision === "string"
      ? action.payload.decision
      : "unknown";
  const serverId =
    typeof action.payload.serverId === "string"
      ? action.payload.serverId
      : "unknown";
  const paymentAmount =
    typeof action.payload.paymentAmount === "number" &&
    Number.isFinite(action.payload.paymentAmount)
      ? Math.max(0, Math.floor(action.payload.paymentAmount))
      : 0;
  const isCentral = serverId === "hq" || serverId === "rd";
  const hqReinstallExtraCost = decision === "return_to_hq" && serverId === "hq";
  if (decision === "pay") {
    return {
      key: "corp_post_pass_ice_lifecycle_preserve",
      label: "ICE-Schutz erhalten",
      value: isCentral ? 1200 : 850,
      reason: [
        "post_pass_ice_lifecycle:pay",
        `server:${serverId}`,
        `payment_amount:${paymentAmount}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "decline") {
    return {
      key: "corp_post_pass_ice_lifecycle_decline_return",
      label: "ICE liegen lassen",
      value: isCentral ? 650 : 450,
      reason: [
        "post_pass_ice_lifecycle:decline",
        `server:${serverId}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "return_to_hq") {
    return {
      key: "corp_post_pass_ice_lifecycle_return_to_hq_penalty",
      label: "ICE-Schutzverlust",
      value: isCentral ? -1900 : -1200,
      reason: [
        "post_pass_ice_lifecycle:return_to_hq",
        `server:${serverId}`,
        "ice_remains_installed:false",
        "central_protection_loss:" + isCentral,
        ...(hqReinstallExtraCost ? ["hq_ice_reinstall_extra_cost:2"] : []),
      ].join("|"),
    };
  }
  return undefined;
}

function corpDownstreamRezReserveAssessment<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost"
  >,
  effectiveDefense: ReturnType<
    typeof semanticRuntimeCorpEffectiveDefenseContext
  >,
): AiDecisionScoreComponent | undefined {
  if (!effectiveDefense?.isRezzableNow) return undefined;
  if (
    !effectiveDefense.visibleBreakerCoverage &&
    !effectiveDefense.zeroEffectRisk
  ) {
    return undefined;
  }
  const sourceId = visibleActionSourceId(action);
  if (!sourceId) return undefined;
  const location = corpServerIceLocation(input, sourceId);
  if (!location || location.iceIndex <= 0) return undefined;
  const innerRezFloor = minimumInnerUnrezzedIceRezCost(location);
  if (innerRezFloor === undefined) return undefined;
  const rezCost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const postRezCredits = input.playerView.own.credits - rezCost;
  if (postRezCredits >= innerRezFloor) return undefined;
  const isCentral = location.server.id === "hq" || location.server.id === "rd";
  const rawValue = isCentral ? -1500 : -1000;
  return corpReserveScoreComponent(
    "corp_downstream_rez_floor_preservation",
    "Innere ICE-Reserve",
    rawValue,
    [
      "downstream_rez_floor:blocked_after_current_rez",
      `server:${location.server.id}`,
      `post_rez_credits:${postRezCredits}`,
      `inner_rez_floor:${innerRezFloor}`,
      `visible_breaker_coverage:${effectiveDefense.visibleBreakerCoverage}`,
      `zero_effect_risk:${effectiveDefense.zeroEffectRisk}`,
    ],
  );
}

function visibleActionSourceId(action: LegalAction): string | undefined {
  if (
    typeof action.source === "string" &&
    action.source !== "basic_action" &&
    action.source !== "game_rule"
  ) {
    return action.source;
  }
  const payloadCardId = action.payload?.cardId;
  return typeof payloadCardId === "string" ? payloadCardId : undefined;
}

function corpServerIceLocation(
  input: AiDecisionInput,
  sourceId: string,
):
  | {
      server: AiDecisionInput["playerView"]["servers"][number];
      iceIndex: number;
    }
  | undefined {
  for (const server of input.playerView.servers ?? []) {
    const iceIndex = server.ice.findIndex((ice) => ice.instanceId === sourceId);
    if (iceIndex >= 0) return { server, iceIndex };
  }
  return undefined;
}

function minimumInnerUnrezzedIceRezCost(location: {
  server: AiDecisionInput["playerView"]["servers"][number];
  iceIndex: number;
}): number | undefined {
  const costs = location.server.ice
    .slice(0, location.iceIndex)
    .filter((ice) => ice.rezzed !== true)
    .map((ice) =>
      typeof ice.rezCost === "number" && Number.isFinite(ice.rezCost)
        ? Math.max(0, Math.floor(ice.rezCost))
        : undefined,
    )
    .filter((cost): cost is number => cost !== undefined);
  if (costs.length === 0) return undefined;
  return Math.min(...costs);
}

function addCorpScoringWindowEvidenceComponent(
  components: AiDecisionScoreComponent[],
  assessment: CorpScoringWindowAssessment | undefined,
): void {
  if (!assessment) return;
  components.push({
    key: "corp_scoring_window_assessment",
    label: "Scoring-Window",
    value: 0,
    reason: assessment.evidence.join("|"),
  });
}

function corpTacticalGoalFitScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  const goals = corpTacticalGoalsForInput(input);
  if (goals.length === 0) return undefined;
  const goal = highestPriorityCorpGoalForAction(
    goals,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (!goal) return undefined;
  return {
    key: "corp_goal_fit_tactical_goal",
    label: "Corp-TacticalGoal",
    value: corpTacticalGoalScoreValue(goal),
    reason: [
      `goal:${goal.goalId}`,
      `family:${goal.family}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      `action:${action.type}`,
      `scope:${scopeId}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  };
}

function corpTacticalGoalsForInput(
  input: AiDecisionInput,
): readonly TacticalGoalLike[] {
  return (
    (
      input as AiDecisionInput & {
        ownCorpTacticalGoals?: readonly TacticalGoalLike[];
      }
    ).ownCorpTacticalGoals ?? []
  );
}

function semanticRuntimeCorpActionCreditCost<TConsumer extends string>(
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost"
  >,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const costProfile = actionSemanticCandidate?.costProfile;
  if (costProfile === undefined) return dependencies.actionCreditCost(action);
  if (typeof costProfile.creditCost === "number") return costProfile.creditCost;
  if (
    costProfile.costKnownStatus === "known" ||
    costProfile.costKnownStatus === "not_applicable"
  ) {
    return 0;
  }
  return dependencies.actionCreditCost(action);
}

function semanticRuntimeCorpActionClickCost(
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): number {
  const candidateClickCost = actionSemanticCandidate?.costProfile.clickCost;
  if (
    typeof candidateClickCost === "number" &&
    Number.isFinite(candidateClickCost)
  ) {
    return Math.max(0, Math.floor(candidateClickCost));
  }
  const costs = action.costs
    .map((cost) => cost.clicks)
    .filter((value): value is number => typeof value === "number");
  if (costs.length > 0) {
    return costs.reduce((sum, value) => sum + value, 0);
  }
  return action.type === "advance_card" ? 1 : 0;
}

function corpSameTurnScoreCloseoutComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: Pick<
    SemanticRuntimeCorpScoreDependencies<TConsumer>,
    "actionCreditCost" | "corpAdvanceCompletesScore"
  >,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;
  if (!corpVisibleCardIsAgenda(sourceCard)) return undefined;
  const requirement = corpVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return undefined;
  const counters = positiveOrZeroNumber(sourceCard.advancementCounters) ?? 0;
  if (counters >= requirement) return undefined;
  const countersAfterCurrentAction = counters + 1;
  const additionalAdvancesNeeded = Math.max(
    0,
    requirement - countersAfterCurrentAction,
  );
  if (additionalAdvancesNeeded === 0) {
    if (dependencies.corpAdvanceCompletesScore?.(input, action) !== true) {
      return undefined;
    }
  }
  const actionClickCost = Math.max(
    1,
    semanticRuntimeCorpActionClickCost(action, actionSemanticCandidate),
  );
  const actionCreditCost = Math.max(
    1,
    semanticRuntimeCorpActionCreditCost(
      dependencies,
      action,
      actionSemanticCandidate,
    ),
  );
  const remainingClicks = input.playerView.own.clicks - actionClickCost;
  const remainingCredits = input.playerView.own.credits - actionCreditCost;
  if (remainingClicks < additionalAdvancesNeeded) return undefined;
  if (remainingCredits < additionalAdvancesNeeded) return undefined;
  const serverId = corpServerIdForRootCard(input, sourceCard.instanceId);
  return {
    key: "corp_same_turn_score_closeout_advance",
    label: "Score-Closeout",
    value: 3400,
    reason: [
      "same_turn_score_closeout:true",
      `card:${sourceCard.instanceId}`,
      `server:${serverId ?? "unknown"}`,
      `advancement_requirement:${requirement}`,
      `advancement_counters:${counters}`,
      `additional_advances_needed:${additionalAdvancesNeeded}`,
      `remaining_clicks_after_action:${remainingClicks}`,
      `remaining_credits_after_action:${remainingCredits}`,
    ].join("|"),
  };
}

function corpScoreableAgendaAdvancePenaltyComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "advance_card") return undefined;
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard || sourceCard.known === false) return undefined;
  if (!corpVisibleCardIsAgenda(sourceCard)) return undefined;
  const requirement = corpVisibleAdvancementRequirement(sourceCard);
  if (requirement === undefined) return undefined;
  const counters = positiveOrZeroNumber(sourceCard.advancementCounters) ?? 0;
  if (counters < requirement) return undefined;
  if (!corpLegalScoreActionExistsForCard(input, sourceCard.instanceId)) {
    return undefined;
  }
  if (
    corpAgendaAdvanceReachesVisibleOveradvancePayoff(
      sourceCard,
      counters,
      requirement,
    )
  ) {
    return undefined;
  }
  const serverId = corpServerIdForRootCard(input, sourceCard.instanceId);
  return {
    key: "corp_scoreable_agenda_overadvance_penalty",
    label: "Scorebare Agenda weiter advancen",
    value: -4200,
    reason: [
      "score_agenda_legal:true",
      "overadvance_next_threshold_reached:false",
      `card:${sourceCard.instanceId}`,
      `server:${serverId ?? "unknown"}`,
      `advancement_requirement:${requirement}`,
      `advancement_counters:${counters}`,
    ].join("|"),
  };
}

function corpLegalScoreActionExistsForCard(
  input: AiDecisionInput,
  cardId: string,
): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  return legalActions.some(
    (candidate) =>
      candidate.side === "corp" &&
      candidate.type === "score_agenda" &&
      visibleActionSourceId(candidate) === cardId,
  );
}

function corpVisibleAdvancementRequirement(
  card: VisibleCard,
): number | undefined {
  return (
    positiveIntegerNumber(card.advancementRequirement) ??
    positiveIntegerNumber(visibleCardDefinition(card)?.advancementRequirement)
  );
}

function corpAgendaAdvanceReachesVisibleOveradvancePayoff(
  card: VisibleCard,
  counters: number,
  requirement: number,
): boolean {
  const interval = corpVisibleOveradvanceCounterInterval(card);
  if (interval === undefined) return false;
  const overNow = Math.max(0, counters - requirement);
  const overAfterAdvance = Math.max(0, counters + 1 - requirement);
  return (
    Math.floor(overAfterAdvance / interval) > Math.floor(overNow / interval)
  );
}

function corpVisibleOveradvanceCounterInterval(
  card: VisibleCard,
): number | undefined {
  const definition = visibleCardDefinition(card);
  const mechanics = definition?.mechanics ?? [];
  const text = [card.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const tokens = corpRulesTextTokens(text);
  const interval = tokens
    .map((token, index) => {
      if (token !== "for" || tokens[index + 1] !== "every") return 0;
      const amount = numberFromDigitOrWord(tokens[index + 2] ?? "");
      if (amount <= 0) return 0;
      const referencesAdvancementCounters =
        tokens[index + 3] === "advancement" &&
        (tokens[index + 4] === "counter" || tokens[index + 4] === "counters") &&
        tokens[index + 5] === "over";
      return referencesAdvancementCounters ? amount : 0;
    })
    .find((amount) => amount > 0);
  if (interval !== undefined) return interval;
  if (tokens.includes("overadvance")) return 1;
  if (
    mechanics.some((mechanic) =>
      rolesMatch([mechanic], ["overadvance", "overadvance_bonus"]),
    )
  ) {
    return 1;
  }
  return undefined;
}

function corpServerIdForRootCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find((server) =>
    (server.root ?? []).some((card) => card.instanceId === cardId),
  )?.id;
}

function corpServerIdForInstalledCard(
  input: AiDecisionInput,
  cardId: string,
): string | undefined {
  return input.playerView.servers.find(
    (server) =>
      (server.root ?? []).some((card) => card.instanceId === cardId) ||
      (server.ice ?? []).some((card) => card.instanceId === cardId),
  )?.id;
}

function highestPriorityCorpGoalForAction(
  goals: readonly TacticalGoalLike[],
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): TacticalGoalLike | undefined {
  return goals
    .filter((goal) =>
      corpGoalMatchesAction(goal, action, scopeId, actionSemanticCandidate),
    )
    .sort((left, right) => right.priority - left.priority)[0];
}

function corpGoalMatchesAction(
  goal: TacticalGoalLike,
  action: LegalAction,
  scopeId: string,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): boolean {
  switch (goal.goalId) {
    case "corp.tactical.score_closeout":
      return (
        action.type === "score_agenda" ||
        corpActionCandidateHasScoreCloseoutSignal(actionSemanticCandidate)
      );
    case "corp.tactical.advance_scoreline":
      return action.type === "advance_card";
    case "corp.tactical.rez_relevant_ice":
      return action.type === "rez_ice";
    case "corp.tactical.prepare_remote":
    case "corp.tactical.protect_central":
      return action.type === "install_card";
    case "corp.tactical.stabilize_economy":
      return (
        action.type === "gain_credit" ||
        action.type === "draw_card" ||
        (action.type === "play_operation" &&
          corpActionCandidateHasVisibleSignal(actionSemanticCandidate, [
            "economy_operation",
            "recover_economy",
            "economy.corp_credit_burst",
            "corp_credit_burst",
          ]))
      );
    case "corp.tactical.visible_tag_punish":
      return (
        scopeId === "corp_tag_punish" ||
        corpActionCandidateHasVisibleSignal(actionSemanticCandidate, [
          "tag",
          "trace",
          "punish",
          "trash_runner_resource",
        ])
      );
    case "corp.tactical.visible_damage_or_ambush_window":
      return (
        scopeId === "corp_tag_punish" ||
        corpActionCandidateHasVisibleSignal(actionSemanticCandidate, ["ambush"])
      );
    default:
      return false;
  }
}

function corpTacticalGoalScoreValue(goal: TacticalGoalLike): number {
  return 500 + Math.min(500, Math.max(0, goal.priority - 500));
}

export function corpActionCandidateHasVisibleSignal(
  candidate: ActionSemanticCandidate | undefined,
  needles: readonly string[],
): boolean {
  if (!candidate) return false;
  const signals = [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
  return needles.some((needle) => {
    const normalizedNeedle = needle.toLocaleLowerCase("en-US");
    return (
      signals.includes(normalizedNeedle) ||
      rolesMatch(signals, [normalizedNeedle])
    );
  });
}

function corpActionCandidateHasScoreCloseoutSignal(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  return corpActionCandidateHasVisibleSignal(candidate, [
    "corp.score_closeout",
    "closeout.agenda_score",
    "advance_burst",
    "advance.counter_cashout",
    "score.advance_burst",
  ]);
}

function corpInputHasScoreCloseoutBasis(input: AiDecisionInput): boolean {
  const legalActions =
    input.legalActions ?? input.playerView.legalActions ?? [];
  if (
    legalActions.some(
      (candidate) =>
        candidate.side === "corp" &&
        (candidate.type === "score_agenda" ||
          (candidate.type === "advance_card" &&
            corpActionTargetsVisibleAgenda(input, candidate))),
    )
  ) {
    return true;
  }
  return (input.playerView.servers ?? []).some((server) =>
    (server.root ?? []).some(
      (card) => card.known !== false && corpVisibleCardIsAgenda(card),
    ),
  );
}

function corpActionTargetsVisibleAgenda(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const sourceCard = visibleSourceCardForAction(input, action);
  return sourceCard !== undefined && corpVisibleCardIsAgenda(sourceCard);
}

function corpVisibleCardIsAgenda(card: VisibleCard): boolean {
  return card.type === "agenda" || visibleCardDefinition(card)?.type === "agenda";
}

function corpBurstEconomyOperationForAction<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
): CorpBurstEconomyOperation | undefined {
  if (
    action.type !== "play_operation" &&
    action.type !== "activated_card_ability" &&
    action.type !== "trigger_ability"
  ) {
    return undefined;
  }
  const sourceCard = visibleSourceCardForAction(input, action);
  if (!sourceCard) return undefined;
  const fallbackCost = semanticRuntimeCorpActionCreditCost(
    dependencies,
    action,
    actionSemanticCandidate,
  );
  const operation =
    action.type === "play_operation"
      ? corpBurstEconomyOperationForVisibleCard(sourceCard, fallbackCost)
      : corpBurstEconomyAbilityForVisibleCard(
          sourceCard,
          action,
          actionSemanticCandidate,
          fallbackCost,
        );
  if (!operation) return undefined;
  if (input.playerView.own.credits < operation.cost) return undefined;
  return {
    ...operation,
    evidence: [
      operation.actionKind === "activated_ability"
        ? "corp_activated_burst_economy:true"
        : "corp_operation_burst_economy:true",
      ...operation.evidence,
      action.type === "play_operation"
        ? "play_operation_affordable:true"
        : "activated_economy_affordable:true",
    ],
  };
}

function corpBurstEconomyThresholdAfterBasicCredit(
  input: AiDecisionInput,
): CorpBurstEconomyOperation | undefined {
  const credits = input.playerView.own.credits;
  const creditsAfterFunding = credits + 1;
  const bestOperation = input.playerView.own.gripOrHq
    .map((card) => corpBurstEconomyOperationForVisibleCard(card))
    .filter((operation): operation is CorpBurstEconomyOperation => {
      return (
        operation !== undefined &&
        operation.cost > credits &&
        operation.cost <= creditsAfterFunding
      );
    })
    .sort((left, right) => right.actionValue - left.actionValue)[0];
  if (!bestOperation) return undefined;
  return {
    ...bestOperation,
    evidence: [
      "corp_operation_economy_threshold:true",
      `credits_before_funding:${credits}`,
      `credits_after_funding:${creditsAfterFunding}`,
      ...bestOperation.evidence,
    ],
  };
}

function corpBurstEconomyOperationForVisibleCard(
  card: VisibleCard,
  fallbackCost?: number,
): CorpBurstEconomyOperation | undefined {
  if (card.known === false) return undefined;
  const definition = visibleCardDefinition(card);
  const type = card.type ?? definition?.type;
  if (type !== "operation") return undefined;
  if (corpImmediateEconomyOperationHasVisibleDrawback(card, definition)) {
    return undefined;
  }
  const cost =
    positiveOrZeroNumber(card.cost) ??
    positiveOrZeroNumber(definition?.cost) ??
    positiveOrZeroNumber(fallbackCost) ??
    0;
  const rulesText = card.rulesText ?? definition?.rulesText;
  const gain = corpCreditGainFromRulesText(rulesText);
  const drawCards = corpDrawCountFromRulesText(rulesText);
  if (gain <= 0 && drawCards <= 0) return undefined;
  const netGain = gain - cost;
  const actionValue = netGain + drawCards;
  if (actionValue < CORP_IMMEDIATE_ECONOMY_MIN_ACTION_VALUE) return undefined;
  return {
    actionKind: "operation",
    cost,
    gain,
    drawCards,
    netGain,
    actionValue,
    evidence: [
      `operation_cost:${cost}`,
      `operation_gain:${gain}`,
      `operation_draw:${drawCards}`,
      `burst_economy_net_gain:${netGain}`,
      `operation_action_value:${actionValue}`,
      `operation_economy_tier:${actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE ? "burst" : "efficient"}`,
    ],
  };
}

function corpBurstEconomyAbilityForVisibleCard(
  card: VisibleCard,
  action: LegalAction,
  actionSemanticCandidate: ActionSemanticCandidate | undefined,
  fallbackCost?: number,
): CorpBurstEconomyOperation | undefined {
  if (card.known === false) return undefined;
  const definition = visibleCardDefinition(card);
  const rulesText = card.rulesText ?? definition?.rulesText;
  const payloadGain = corpCreditGainFromActionPayload(action, card);
  const payloadDrawCards = positiveIntegerPayloadNumber(
    action.payload,
    "drawCardsAmount",
  );
  const gain = payloadGain?.amount ?? corpCreditGainFromRulesText(rulesText);
  const drawCards =
    payloadDrawCards ?? corpDrawCountFromRulesText(rulesText);
  if (gain <= 0 && drawCards <= 0) return undefined;
  const cost = positiveOrZeroNumber(fallbackCost) ?? 0;
  const netGain = gain - cost;
  const actionValue = netGain + drawCards;
  if (actionValue < CORP_IMMEDIATE_ECONOMY_MIN_ACTION_VALUE) return undefined;
  const clickCost =
    semanticRuntimeCorpActionClickCost(action, actionSemanticCandidate) ||
    corpActionClickCostFromRulesText(rulesText);
  return {
    actionKind: "activated_ability",
    cost,
    gain,
    drawCards,
    netGain,
    actionValue,
    evidence: [
      ...(payloadGain?.evidence ?? []),
      ...(payloadDrawCards !== undefined
        ? [`ability_payload_draw_cards:${payloadDrawCards}`]
        : []),
      `ability_click_cost:${clickCost}`,
      `ability_credit_cost:${cost}`,
      `ability_gain:${gain}`,
      `ability_draw:${drawCards}`,
      `burst_economy_net_gain:${netGain}`,
      `ability_action_value:${actionValue}`,
      `activated_economy_efficiency:${clickCost > 0 ? netGain / clickCost : netGain}`,
    ],
  };
}

function corpCreditGainFromActionPayload(
  action: LegalAction,
  sourceCard: VisibleCard,
): { amount: number; evidence: string[] } | undefined {
  const payloadGain = positiveIntegerPayloadNumber(
    action.payload,
    "gainCreditsAmount",
  );
  if (payloadGain === undefined) return undefined;

  const evidence = [`ability_payload_gain_credits:${payloadGain}`];
  let amount = payloadGain;
  const hostedCreditTakeAmount = positiveIntegerPayloadNumber(
    action.payload,
    "hostedCreditTakeAmount",
  );
  const takesHostedCredits =
    booleanPayloadValue(action.payload, "cardImplementationTakesHostedCredits") ===
      true || hostedCreditTakeAmount !== undefined;
  if (takesHostedCredits) {
    evidence.push("ability_payload_takes_hosted_credits:true");
    if (hostedCreditTakeAmount !== undefined) {
      evidence.push(`ability_payload_hosted_credit_take:${hostedCreditTakeAmount}`);
      amount = Math.min(amount, hostedCreditTakeAmount);
    }
    const visibleHostedCredits = visibleHostedCreditCounterAmount(sourceCard);
    if (visibleHostedCredits !== undefined) {
      evidence.push(`ability_visible_hosted_credits:${visibleHostedCredits}`);
      amount = Math.min(amount, visibleHostedCredits);
    }
  }

  if (amount <= 0) return undefined;
  if (amount !== payloadGain) {
    evidence.push(`ability_payload_effective_gain_credits:${amount}`);
  }
  return { amount, evidence };
}

function visibleHostedCreditCounterAmount(card: VisibleCard): number | undefined {
  const counters = card.counters;
  if (!counters) return undefined;
  const counterValues = counters as Partial<Record<string, number>>;
  for (const key of ["bit", "recurring_credit", "credit"]) {
    const value = positiveOrZeroNumber(counterValues[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function positiveIntegerPayloadNumber(
  payload: LegalAction["payload"],
  key: string,
): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}

function booleanPayloadValue(
  payload: LegalAction["payload"],
  key: string,
): boolean | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : undefined;
}

function corpImmediateEconomyOperationScoreValue(
  operation: CorpBurstEconomyOperation,
): number {
  return operation.actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE
    ? 1350 + operation.actionValue * 180
    : 1050 + operation.actionValue * 240;
}

function corpImmediateEconomyThresholdScoreValue(
  operation: CorpBurstEconomyOperation,
): number {
  return operation.actionValue >= CORP_IMMEDIATE_ECONOMY_STRONG_ACTION_VALUE
    ? 1200 + operation.actionValue * 160
    : 650 + operation.actionValue * 140;
}

function corpImmediateEconomyOperationHasVisibleDrawback(
  card: VisibleCard,
  definition: ReturnType<typeof visibleCardDefinition>,
): boolean {
  const mechanics = definition?.mechanics ?? [];
  if (
    mechanics.some((mechanic) =>
      ["bad_publicity", "add_bad_publicity"].includes(mechanic),
    )
  ) {
    return true;
  }
  const text = [card.rulesText, definition?.rulesText]
    .filter((value): value is string => typeof value === "string")
    .flatMap(corpImmediateEconomyRulesTextTokens);
  return corpImmediateEconomyRulesTextHasBadPublicityDrawback(text);
}

function corpImmediateEconomyRulesTextHasBadPublicityDrawback(
  tokens: readonly string[],
): boolean {
  const drawbackVerbs = new Set(["take", "add", "gain", "suffer"]);
  return tokens.some(
    (token, index) =>
      drawbackVerbs.has(token) &&
      corpImmediateEconomyTokenIsPositiveInteger(tokens[index + 1]) &&
      tokens[index + 2] === "bad" &&
      tokens[index + 3] === "publicity",
  );
}

function corpImmediateEconomyRulesTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function corpImmediateEconomyTokenIsPositiveInteger(
  token: string | undefined,
): boolean {
  if (token === undefined || token === "") return false;
  const numeric = Number.parseInt(token, 10);
  return String(numeric) === token && numeric > 0;
}

function visibleSourceCardForAction(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const sourceId = visibleActionSourceId(action);
  if (!sourceId) return undefined;
  return [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ]
    .flat()
    .find((card) => card.instanceId === sourceId && card.known);
}

function corpCreditGainFromRulesText(rulesText: string | undefined): number {
  const tokens = corpRulesTextTokens(rulesText);
  const bracketToken = tokens.find(
    (token, index) =>
      tokens[index - 2] === "gain" &&
      tokens[index - 1] === "bracketopen" &&
      tokens[index + 1] === "bracketclose",
  );
  if (bracketToken) return numberFromDigitOrWord(bracketToken);
  const creditToken = tokens.find(
    (token, index) =>
      (tokens[index - 1] === "gain" || tokens[index - 1] === "erhalte") &&
      (tokens[index + 1] === "credit" || tokens[index + 1] === "credits"),
  );
  if (creditToken) return numberFromDigitOrWord(creditToken);
  return 0;
}

function corpDrawCountFromRulesText(rulesText: string | undefined): number {
  const tokens = corpRulesTextTokens(rulesText);
  const drawToken = tokens.find(
    (token, index) =>
      (tokens[index - 1] === "draw" || tokens[index - 1] === "ziehe") &&
      (tokens[index + 1] === "card" ||
        tokens[index + 1] === "cards" ||
        tokens[index + 1] === "karte" ||
        tokens[index + 1] === "karten"),
  );
  if (drawToken) return numberFromDigitOrWord(drawToken);
  return 0;
}

function corpActionClickCostFromRulesText(
  rulesText: string | undefined,
): number {
  const tokens = corpRulesTextTokens(rulesText);
  const colonIndex = tokens.findIndex((token) => token === "colon");
  const costTokens = colonIndex >= 0 ? tokens.slice(0, colonIndex) : tokens;
  const bracketActions = costTokens.filter(
    (token, index) =>
      token === "a" &&
      costTokens[index - 1] === "bracketopen" &&
      costTokens[index + 1] === "bracketclose",
  ).length;
  if (bracketActions > 0) return bracketActions;
  return costTokens.filter((token) => token === "action").length;
}

function numberFromDigitOrWord(value: string): number {
  const numeric = Number.parseInt(value, 10);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  switch (value.trim().toLocaleLowerCase("de-DE")) {
    case "one":
    case "eins":
    case "eine":
    case "einen":
      return 1;
    case "two":
    case "zwei":
      return 2;
    case "three":
    case "drei":
      return 3;
    case "four":
    case "vier":
      return 4;
    case "five":
    case "fünf":
    case "fuenf":
      return 5;
    case "six":
    case "sechs":
      return 6;
    case "seven":
    case "sieben":
      return 7;
    case "eight":
    case "acht":
      return 8;
    case "nine":
    case "neun":
      return 9;
    case "ten":
    case "zehn":
      return 10;
    default:
      return 0;
  }
}

function corpRulesTextTokens(rulesText: string | undefined): string[] {
  if (!rulesText) return [];
  return rulesText
    .replaceAll("[", " bracketopen ")
    .replaceAll("]", " bracketclose ")
    .replaceAll(":", " colon ")
    .toLocaleLowerCase("de-DE")
    .split(/[^\p{L}0-9]+/u)
    .filter(Boolean);
}

function positiveOrZeroNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function positiveIntegerNumber(value: number | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : undefined;
}

function corpActionCandidateTargetsCorpScoreline(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  if (!candidate?.targetContext) return false;
  const targets = [
    ...candidate.targetContext.selectedTargets,
    ...(candidate.targetContext.availableTargets ?? []),
  ];
  return targets.some((target) => {
    return (
      target.targetSide !== "runner" &&
      (target.targetKind === "agenda" ||
        target.evidence.some((entry) => evidenceHasTerm(entry, "agenda")))
    );
  });
}

function evidenceHasTerm(entry: string, term: string): boolean {
  const termSet = new Set(
    entry
      .toLocaleLowerCase("en-US")
      .split(/[._:-]+/)
      .filter(Boolean),
  );
  return termSet.has(term);
}
