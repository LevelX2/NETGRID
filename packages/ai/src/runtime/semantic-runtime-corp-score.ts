import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { corpPurgeImpactScoreComponent } from "./corp-purge-impact";
import { actionProvidesCredits } from "../actions/action-effect-classification";
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
  corpBurstEconomyThresholdAfterBasicCredit,
  corpImmediateEconomyOperationScoreValue,
  corpImmediateEconomyThresholdScoreValue,
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
  corpActiveScoreRemoteReserveFundingComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-active-remote";
import {
  corpContestedAgendaPointRiskComponent,
  corpGameEndingScorelineExposurePenaltyComponent,
  corpReserveScoreComponent,
  corpScorelineFundingAssessmentComponent,
  corpScoringWindowSuppressesContestableRemotePenalty,
  corpUnbackedExtraActionBurstComponent,
  corpUnsafeDelayedScorelineExposureComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";
import { corpPreparedScoreRemoteAgendaSearchComponent } from "./corp-scoreline/semantic-runtime-corp-score-state";
import { corpOptionalDrawScoreComponents } from "./corp-economy/corp-defensive-draw";
import {
  corpActionCanResolveProfiledTrace,
  corpActionFamilyScoreComponents,
} from "./corp-scoreline/semantic-runtime-corp-score-action-families";

export type { SemanticRuntimeCorpScoreDependencies } from "./corp-scoreline/semantic-runtime-corp-score-contracts";

export { corpActionCandidateHasVisibleSignal } from "./corp-scoreline/semantic-runtime-corp-score-action-economy";

export { normalizedCorpReserveScoreValue } from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";

export function semanticRuntimeCorpScoreComponents<TConsumer extends string>(
  input: AiDecisionInput,
  action: LegalAction,
  scopeId: string,
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent[] {
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  const boardTriageState = semanticRuntimeCorpBoardTriage(input, dependencies);
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
  const activeScoreRemoteFunding = corpActiveScoreRemoteReserveFundingComponent(
    input,
    action,
  );
  const boardTriage = semanticRuntimeCorpBoardTriageActionComponent(
    input,
    action,
    dependencies,
    actionSemanticCandidate,
  );
  if (
    boardTriage &&
    !(
      activeScoreRemoteFunding &&
      boardTriage.key === "corp_board_triage_mismatch"
    )
  ) {
    components.push(boardTriage);
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
  const activeScorelineAdvance = corpActiveRemoteAgendaAdvanceClockComponent(
    input,
    action,
    dependencies,
    boardTriageState,
  );
  if (activeScorelineAdvance) components.push(activeScorelineAdvance);
  if (activeScoreRemoteFunding) components.push(activeScoreRemoteFunding);
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
  );
  if (gameEndingExposure) components.push(gameEndingExposure);
  const unsafeDelayedExposure = corpUnsafeDelayedScorelineExposureComponent(
    input,
    action,
    dependencies,
    boardTriageState,
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
      activeScoreRemoteFunding,
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
  const optionalDrawComponents = corpOptionalDrawScoreComponents(input, action, boardTriageState);
  components.push(...optionalDrawComponents);
  if (optionalDrawComponents.some((component) => component.key === "corp_low_hand")) {
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
