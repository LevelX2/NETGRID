import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { corpPurgeImpactScoreComponent } from "./corp-purge-impact";
import {
  actionHasImmediateCreditGain,
  actionProvidesCredits,
} from "../actions/action-effect-classification";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
} from "./semantic-runtime-corp-board-triage";
import {
  candidateRequiresSuccessfulTrace,
  traceActionLeavesImmediatePunishWindow,
  traceTagExpectedSuccessEstimate,
} from "./trace-tag-success-estimate";
import type { SemanticRuntimeCorpScoreDependencies } from "./corp-scoreline/semantic-runtime-corp-score-contracts";
import {
  corpActionCandidateHasScoreCloseoutSignal,
  corpActionCandidateHasVisibleSignal,
  corpActionCandidateTargetsCorpScoreline,
  corpBurstEconomyOperationForAction,
  corpInputHasScoreCloseoutBasis,
} from "./corp-scoreline/semantic-runtime-corp-score-action-economy";
import {
  corpHqAgendaFloodDrawRiskComponent,
  corpHqAgendaReliefScorelineContext,
  corpInputHasConcreteDevelopmentAction,
  corpLegalCreditActionExists,
  corpLegalEconomyActionExists,
  corpProtectedScorelineCommitmentComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-hq-pressure";
import { corpTacticalGoalFitScoreComponent } from "./corp-scoreline/semantic-runtime-corp-score-install-sequencing";
import {
  corpActiveRemoteAgendaAdvanceClockComponent,
  corpActiveScorelineOffPathPenaltyComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-active-remote";
import {
  corpContestedAgendaPointRiskComponent,
  corpGameEndingScorelineExposurePenaltyComponent,
  corpMatchpointHqProtectionComponent,
  corpReserveScoreComponent,
  corpScorelineFundingAssessmentComponent,
  corpScoringWindowSuppressesContestableRemotePenalty,
  corpUnbackedExtraActionBurstComponent,
  corpUnsafeDelayedScorelineExposureComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";
import { corpPreparedScoreRemoteAgendaSearchComponent } from "./corp-scoreline/semantic-runtime-corp-score-state";
import {
  corpOptionalDrawScoreComponents,
  corpProjectedDrawCount,
  corpQuantitativeDrawScoreComponents,
} from "./corp-economy/corp-defensive-draw";
import {
  corpActionCanResolveProfiledTrace,
  corpActionFamilyScoreComponents,
} from "./corp-scoreline/semantic-runtime-corp-score-action-families";
import {
  corpScorelineActionCanCloseThisTurn,
  corpScorelineFeasibilityForDecisionInput,
} from "./corp-scoreline-feasibility";
import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";
import { economyRuntimeScoreComponents } from "./economy-score-components";
import type { CreditDemand } from "../plans/credit-demand";

export type { SemanticRuntimeCorpScoreDependencies } from "./corp-scoreline/semantic-runtime-corp-score-contracts";

export { corpActionCandidateHasVisibleSignal } from "./corp-scoreline/semantic-runtime-corp-score-action-economy";

export { normalizedCorpReserveScoreValue } from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";

export function semanticRuntimeCorpScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
  creditDemands: readonly CreditDemand[] = [],
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  components.push(
    ...economyRuntimeScoreComponents(actionSemanticCandidate, creditDemands),
  );
  const projectedCardsDrawn =
    actionSemanticCandidate?.economyProjection?.cardsDrawn ?? 0;
  if (
    projectedCardsDrawn > 0 &&
    projectedCardsDrawn > input.playerView.own.stackOrRdCount
  ) {
    components.push({
      key: "corp_economy_draw_exceeds_rd",
      label: "Ökonomie-Draweffekt ohne ausreichendes R&D",
      value: -4000,
      reason: [
        `projected_cards_drawn:${projectedCardsDrawn}`,
        `rd_cards:${input.playerView.own.stackOrRdCount}`,
      ].join("|"),
    });
  }
  const creditSaturation = corpCreditSaturationComponent(
    input,
    action,
    dependencies,
    creditDemands,
  );
  if (creditSaturation) components.push(creditSaturation);
  const credits = input.playerView.own.credits;
  const boardTriageState = semanticRuntimeCorpBoardTriage(input, dependencies);
  const deadlineScorelineAction =
    corpDeadlineUnconvertibleScorelineActionComponent(input, action);
  if (deadlineScorelineAction) components.push(deadlineScorelineAction);
  const purgeImpact = corpPurgeImpactScoreComponent(
    input,
    action,
    boardTriageState,
  );
  if (purgeImpact) components.push(purgeImpact);
  const tacticalGoalFit = corpTacticalGoalFitScoreComponent(
    input,
    action,
    scopeId,
    actionSemanticCandidate,
  );
  if (tacticalGoalFit) components.push(tacticalGoalFit);
  const actionResolvesTrace =
    corpActionCanResolveProfiledTrace(action) &&
    candidateRequiresSuccessfulTrace(actionSemanticCandidate);
  if (actionResolvesTrace && traceTagExpectedSuccessEstimate(input) === 0) {
    components.push({
      key: "corp_trace_without_conversion_window",
      label: "Trace ohne Conversion-Fenster",
      value: -2400,
      reason: [
        `corp_credits:${input.playerView.own.credits}`,
        `corp_clicks:${input.playerView.own.clicks}`,
        `runner_credits:${input.playerView.opponent.credits}`,
        "trace_expected_success:0",
      ].join("|"),
    });
  }
  if (
    actionResolvesTrace &&
    !traceActionLeavesImmediatePunishWindow(input, actionSemanticCandidate)
  ) {
    components.push({
      key: "corp_last_click_trace_without_payoff",
      label: "Letzter Trace ohne Payoff",
      value: -2400,
      reason: [
        `corp_clicks:${input.playerView.own.clicks}`,
        `trace_click_cost:${actionSemanticCandidate?.costProfile.clickCost ?? 1}`,
        "immediate_punish_payoff:false",
      ].join("|"),
    });
  }
  const boardTriage = semanticRuntimeCorpBoardTriageActionComponent(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  const fundsCurrentScoreOrRezDemand =
    actionHasImmediateCreditGain(action) &&
    creditDemands.some(
      (demand) =>
        demand.gap > 0 &&
        (demand.purpose === "current_score_window" ||
          demand.purpose === "current_rez_window"),
    );
  const matchpointHqProtection = corpMatchpointHqProtectionComponent(
    input,
    action,
  );
  const matchpointHqOverridesCentralMismatch =
    boardTriage?.key === "corp_board_triage_mismatch" &&
    matchpointHqProtection?.key === "corp_matchpoint_hq_protection_alignment";
  if (
    boardTriage &&
    !(
      fundsCurrentScoreOrRezDemand &&
      boardTriage.key === "corp_board_triage_mismatch"
    ) &&
    !matchpointHqOverridesCentralMismatch
  ) {
    components.push(boardTriage);
  }
  if (matchpointHqOverridesCentralMismatch) {
    components.push({
      key: "corp_board_triage_matchpoint_hq_override",
      label: "Matchpoint-HQ-Schutz vor historischer Zentral-Triage",
      value: 0,
      reason: [
        "runner_at_match_point:true",
        "matchpoint_hq_protection_alignment:true",
        `suppressed_component:${boardTriage?.key ?? "none"}`,
      ].join("|"),
    });
  }
  const unbackedExtraActionBurst = corpUnbackedExtraActionBurstComponent(
    input,
    action,
    dependencies,
    boardTriageState,
    boardTriage,
    actionSemanticCandidate,
  );
  if (unbackedExtraActionBurst) components.push(unbackedExtraActionBurst);
  const closesScorelineThisTurn = corpScorelineActionCanCloseThisTurn(
    corpScorelineFeasibilityForDecisionInput(input),
    action.actionId,
  );
  if (closesScorelineThisTurn) {
    components.push({
      key: "corp_same_turn_scoreline_exposure_suppressed",
      label: "Scoreline schließt noch im selben Zug",
      value: 0,
      reason: [
        "same_turn_scoreline_closeout:true",
        `action:${action.actionId}`,
        "runner_has_no_action_window_before_score:true",
      ].join("|"),
    });
  }
  const activeScorelineAdvance = corpActiveRemoteAgendaAdvanceClockComponent(
    input,
    action,
    dependencies,
    boardTriageState,
    closesScorelineThisTurn,
  );
  if (activeScorelineAdvance) components.push(activeScorelineAdvance);
  const activeScorelineOffPath = corpActiveScorelineOffPathPenaltyComponent(
    input,
    action,
    dependencies,
    boardTriageState,
    actionSemanticCandidate,
  );
  if (activeScorelineOffPath) components.push(activeScorelineOffPath);
  const protectedScoreline = corpProtectedScorelineCommitmentComponent(
    input,
    action,
    dependencies,
    dependencies.rolesForAction(input, action),
  );
  if (protectedScoreline) components.push(protectedScoreline);
  const contestedAgendaPointRisk = corpContestedAgendaPointRiskComponent(
    input,
    action,
    dependencies,
  );
  if (contestedAgendaPointRisk) components.push(contestedAgendaPointRisk);
  const gameEndingExposure = corpGameEndingScorelineExposurePenaltyComponent(
    input,
    action,
    dependencies,
    closesScorelineThisTurn,
  );
  if (gameEndingExposure) components.push(gameEndingExposure);
  const unsafeDelayedExposure = corpUnsafeDelayedScorelineExposureComponent(
    input,
    action,
    dependencies,
    boardTriageState,
    closesScorelineThisTurn,
  );
  if (unsafeDelayedExposure) components.push(unsafeDelayedExposure);
  const scorelineFunding = corpScorelineFundingAssessmentComponent(
    input,
    action,
    dependencies,
  );
  if (scorelineFunding) components.push(scorelineFunding);
  components.push(
    ...corpActionFamilyScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      boardTriageState,
      undefined,
      actionSemanticCandidate,
    ),
  );
  const contestableScoreLine =
    dependencies.corpRemoteScoreContestabilityAssessment(input, action);
  if (contestableScoreLine?.contestable) {
    const roles = dependencies.rolesForAction(input, action);
    const scoringWindow = dependencies.corpScoringWindowAssessment?.(
      input,
      action,
      roles,
    );
    if (
      protectedScoreline ||
      closesScorelineThisTurn ||
      corpScoringWindowSuppressesContestableRemotePenalty(scoringWindow)
    ) {
      components.push({
        key: "corp_contestable_remote_score_penalty_suppressed",
        label: "Scoring-Window hebt Contestability auf",
        value: 0,
        reason: [
          ...contestableScoreLine.evidence,
          ...(scoringWindow?.evidence ?? []),
          protectedScoreline
            ? "contestable_penalty_suppressed_by_protected_commitment:true"
            : closesScorelineThisTurn
              ? "contestable_penalty_suppressed_by_same_turn_closeout:true"
              : "contestable_penalty_suppressed_by_scoring_window:true",
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
        : advancementPlacement.noConcreteConversion
          ? "corp_advancement_counter_placement_without_conversion"
          : "corp_advancement_counter_placement_incremental_value",
      label: advancementPlacement.dominatedByBasicAdvance
        ? "Basic-Advance-Dominanz"
        : advancementPlacement.noConcreteConversion
          ? "Advancement ohne Conversion"
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
  const hqAgendaFloodDrawRisk = corpHqAgendaFloodDrawRiskComponent(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
    boardTriageState,
  );
  if (hqAgendaFloodDrawRisk) components.push(hqAgendaFloodDrawRisk);
  if (
    action.type === "gain_credit" &&
    !actionProvidesCredits(action) &&
    corpLegalCreditActionExists(input, action)
  ) {
    components.push({
      key: "corp_noncredit_gain_wrapper_penalty",
      label: "Keine echte Credit-Aktion",
      value: -1200,
      reason: "gain_credit_wrapper_without_credit_gain",
    });
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
  const optionalDrawComponents = corpOptionalDrawScoreComponents(
    input,
    action,
    boardTriageState,
  );
  components.push(...corpQuantitativeDrawScoreComponents(input, action));
  components.push(...optionalDrawComponents);
  if (
    optionalDrawComponents.some(
      (component) => component.key === "corp_low_hand",
    )
  ) {
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

function corpCreditSaturationComponent<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  creditDemands: readonly CreditDemand[],
): AiDecisionScoreComponent | undefined {
  if (action.type !== "gain_credit" || !actionHasImmediateCreditGain(action)) {
    return undefined;
  }
  const unresolvedDemand = creditDemands.some((demand) => demand.gap > 0);
  if (unresolvedDemand) return undefined;
  const visibleCostCeiling = input.legalActions.reduce(
    (ceiling, candidate) =>
      Math.max(ceiling, Math.max(0, dependencies.actionCreditCost(candidate))),
    0,
  );
  const targetReserve = Math.max(5, visibleCostCeiling + 2);
  if (input.playerView.own.credits < targetReserve) return undefined;
  const alternativeDrawCount = input.legalActions.reduce(
    (count, candidate) => Math.max(count, corpProjectedDrawCount(candidate)),
    0,
  );
  if (alternativeDrawCount <= 0) return undefined;
  return {
    key: "corp_credit_saturation_penalty",
    label: "Credit-Reserve bereits erfüllt",
    value: -900,
    reason: [
      `credits:${input.playerView.own.credits}`,
      `target_reserve:${targetReserve}`,
      `visible_cost_ceiling:${visibleCostCeiling}`,
      "unresolved_credit_demand:false",
      `alternative_draw_count:${alternativeDrawCount}`,
    ].join("|"),
  };
}

function corpDeadlineUnconvertibleScorelineActionComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (action.type !== "install_card" && action.type !== "advance_card") {
    return undefined;
  }
  const feasibility = corpScorelineFeasibilityForDecisionInput(input);
  if (feasibility?.deadline !== "current_turn_only") return undefined;
  if (corpScorelineActionCanCloseThisTurn(feasibility, action.actionId)) {
    return undefined;
  }
  const source = semanticRuntimeVisibleSourceCard(input, action);
  const relevantInstall =
    action.type === "install_card" &&
    (source?.type === "ice" || source?.type === "agenda");
  const relevantAdvance =
    action.type === "advance_card" && source?.type === "agenda";
  if (!relevantInstall && !relevantAdvance) return undefined;
  const actionKind = action.type === "advance_card" ? "advance" : "install";
  return {
    key: `corp_deadline_unconvertible_${actionKind}`,
    label:
      action.type === "advance_card"
        ? "Advancement ohne Conversion vor Deckout"
        : "Installation ohne Conversion vor Deckout",
    value: -3600,
    reason: [
      `card_type:${source.type}`,
      `action:${action.actionId}`,
      ...feasibility.evidence,
      "deadline_conversion:false",
    ].join("|"),
  };
}
