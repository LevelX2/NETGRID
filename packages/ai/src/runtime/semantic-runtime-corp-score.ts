import type { AiDecisionInput, AiDecisionScoreComponent, LegalAction, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { corpPurgeImpactScoreComponent } from "./corp-purge-impact";
import { actionProvidesCredits } from "../actions/action-effect-classification";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { semanticRuntimeCorpEffectiveDefenseContext } from "./semantic-runtime-corp-effective-defense";
import {
  semanticRuntimeCorpBoardTriage,
  semanticRuntimeCorpBoardTriageActionComponent,
  type CorpBoardTriage,
} from "./semantic-runtime-corp-board-triage";
import {
  corpIcePlacementCandidateForAction,
  corpIcePlacementScoreComponent,
} from "./corp-ice-placement/corp-ice-placement";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
} from "./corp-upgrade-placement";
import { visibleCardDefinition } from "./card-definition-lookup";
import { rolesMatch } from "./role-match";
import { semanticRuntimeCorpCentralPressureAssessment } from "./semantic-runtime-corp-central-pressure";
import type { CorpScoringWindowAssessment } from "./semantic-runtime-corp-scoring-window";
import type { CorpScorelineWindowAssessment } from "./corp-scoreline/semantic-runtime-corp-scoreline-assessment";
import { corpKnownAgendaInventory } from "./corp-known-agenda-inventory";
import {
  candidateRequiresSuccessfulTrace,
  traceActionLeavesImmediatePunishWindow,
  traceTagExpectedSuccessEstimate,
} from "./trace-tag-success-estimate";
import type { SemanticRuntimeCorpScoreDependencies } from "./corp-scoreline/semantic-runtime-corp-score-contracts";
import { corpConditionalScoreEconomyComponent } from "./corp-scoreline/semantic-runtime-corp-score-conditional-economy";
export type { SemanticRuntimeCorpScoreDependencies } from "./corp-scoreline/semantic-runtime-corp-score-contracts";
import {
  corpActionCandidateHasScoreCloseoutSignal,
  corpActionCandidateHasVisibleSignal,
  corpActionCandidateTargetsCorpScoreline,
  corpBurstEconomyOperationForAction,
  corpBurstEconomyThresholdAfterBasicCredit,
  corpImmediateEconomyOperationScoreValue,
  corpImmediateEconomyThresholdScoreValue,
  corpInputHasScoreCloseoutBasis,
  corpSameTurnScoreCloseoutComponent,
  corpScoreableAgendaAdvancePenaltyComponent,
  visibleSourceCardForAction,
  semanticRuntimeCorpActionCreditCost,
} from "./corp-scoreline/semantic-runtime-corp-score-action-economy";
import {
  corpHqAgendaFloodDrawRiskComponent,
  corpHqAgendaReliefScorelineContext,
  corpInputHasConcreteDevelopmentAction,
  corpLegalCreditActionExists,
  corpLegalEconomyActionExists,
  corpNonAgendaRootBlocksScoreRemoteComponent,
  corpProtectedScorelineCommitmentComponent,
  corpPunishPrimarySpeculativeScorelineDampenComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-hq-pressure";
import {
  corpDownstreamRezReserveAssessment,
  corpIcePlacementComponent,
  corpInstallServerId,
  corpPostPassIceLifecycleComponent,
  corpRemoteScorelineIceFundingPenaltyComponent,
  corpRootRezTimingComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-ice-components";
import {
  addCorpScoringWindowEvidenceComponent,
  corpPersistentInstallDiscountSequenceComponent,
  corpTacticalGoalFitScoreComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-install-sequencing";
import {
  corpActiveRemoteAgendaAdvanceClockComponent,
  corpActiveScorelineOffPathPenaltyComponent,
  corpActiveScoreRemoteReserveFundingComponent,
  corpCentralOvericeRemoteUnderbuildComponent,
  corpContestedAgendaPointRiskComponent,
  corpExistingScoreRemotePipelineComponent,
  corpGameEndingScorelineExposurePenaltyComponent,
  corpLowValueInstallDeferComponent,
  corpMatchpointHqProtectionComponent,
  corpReserveScoreComponent,
  corpScorelineFundingAssessmentComponent,
  corpScoringWindowSuppressesContestableRemotePenalty,
  corpUnbackedExtraActionBurstComponent,
  corpUnsafeDelayedScorelineExposureComponent,
} from "./corp-scoreline/semantic-runtime-corp-score-scoreline-components";
import { corpPreparedScoreRemoteAgendaSearchComponent } from "./corp-scoreline/semantic-runtime-corp-score-state";

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
  if (
    candidateRequiresSuccessfulTrace(actionSemanticCandidate) &&
    traceTagExpectedSuccessEstimate(input) === 0
  ) {
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
    candidateRequiresSuccessfulTrace(actionSemanticCandidate) &&
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
  if (action.type === "score_agenda") {
    components.push({
      key: "corp_score_available_agenda",
      label: "Agenda punkten",
      value: 1200,
      reason: "score_agenda",
    });
    const conditionalScoreEconomy = corpConditionalScoreEconomyComponent(input, action);
    if (conditionalScoreEconomy) components.push(conditionalScoreEconomy);
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
  if (action.type === "rez_ice" || action.type === "rez_card") {
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
    const sourceCard = visibleSourceCardForAction(input, action);
    const persistentInstallDiscountSequence =
      corpPersistentInstallDiscountSequenceComponent(
        input,
        action,
        sourceCard,
        actionSemanticCandidate,
        dependencies,
        boardTriageState,
      );
    if (persistentInstallDiscountSequence) {
      components.push(persistentInstallDiscountSequence);
    }
    const rootRezTiming = corpRootRezTimingComponent(input, action, sourceCard);
    if (rootRezTiming) components.push(rootRezTiming);
    const effectiveDefense =
      !sourceCard || sourceCard.type === "ice"
        ? semanticRuntimeCorpEffectiveDefenseContext(
            input,
            action,
            actionSemanticCandidate,
            { actionCreditCost: dependencies.actionCreditCost },
          )
        : undefined;
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
    const regionReplacement = corpRegionReplacementComponent({
      input,
      action,
      roles,
      actionSemanticCandidate,
      sourceCard: visibleSourceCardForAction(input, action),
      serverId: corpInstallServerId(action),
    });
    if (regionReplacement) components.push(regionReplacement);
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
          boardTriageState,
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
    const matchpointHqProtection = corpMatchpointHqProtectionComponent(
      input,
      action,
    );
    if (matchpointHqProtection) components.push(matchpointHqProtection);
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
    const scoreRemotePipeline = corpExistingScoreRemotePipelineComponent(
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
    const centralOvericeRemoteUnderbuild =
      corpCentralOvericeRemoteUnderbuildComponent(
        input,
        action,
        boardTriageState,
      );
    if (centralOvericeRemoteUnderbuild) {
      components.push(centralOvericeRemoteUnderbuild);
    }
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
