import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import {
  assessRandomBreakOrDamageRiskForVisibleRunPath,
  randomBreakOrDamageRiskCanCarryRunPath,
} from "../../actions/risk-action-projection";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { reconstructBeliefState } from "../../belief-state";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  ActiveRunnerRunRoot,
  RunnerRunOrigin,
} from "../../plans/runner-run-origin-contract";
import {
  type RunnerPlanDomain,
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunRiskReassessmentSignal,
  type RunnerRunWindowActionAssessment,
} from "../../plans/runner-tactical-plan-contracts";
import { quoteRunnerRunRiskReserve } from "../../run-analysis/runner-run-risk-reserve";
import {
  runnerConfirmedDamageRequiredHandFloor,
  runnerDamageThreatAssessment,
  runnerVisibleLethalIceDamageAssessment,
  runnerVisibleLethalIceDamageJackOutAssessment,
} from "../../runner-damage-threat-assessment";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { runnerRunTargetHasOptionalBonusRunValue } from "../../runner-run-target-guidance";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
  currentRunHasPendingAutoPassIce,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import type { RunWindowAssessmentServices } from "./run-window-services";
import { assessRunnerAccessTrashImpact } from "./runner-access-trash-impact";
import {
  runnerFortPassTollWindow,
  runnerRunExitAction,
  runnerRunWindowCreditBudget,
} from "../../runtime/runner-fort-pass-toll";
import {
  runnerCurrentRunHasSafeCompletionReward,
  runnerRemoteHasKnownNoCurrentPayoff,
} from "../../runtime/runner-known-access-payoff-context";
import {
  assessRunnerAdditionalAccessRunWindowAction,
  runnerCandidateHasVisibleAdditionalAccessEffect,
} from "./runner-run-window-additional-access";
import type { SemanticRuntimeExclusion } from "../../runtime/semantic-runtime-types";
import {
  breakSubroutineIndexesForAction,
  parseSubroutineIndexes,
} from "../../runtime/subroutine-indexes";
import { visibleKnownAgendaOnServer } from "../../runtime/visible-server-agenda-facts";
import {
  assessKnownRezzedIcePath,
  visibleDeflectorSubroutineCanResolve,
} from "../../visible-run-analysis";
import { reservedAccessTrashCredits } from "./run-window-access";
import {
  isRunnerRunWindowCandidate,
  runnerOptionalBonusRunDeclineAction,
  runnerPostPassDerezAndEndRunAction,
  runnerRestrictedRunSequenceAction,
  runnerRunPaymentSupportAction,
  runnerRunRemainderStrengthBoostAction,
  runnerSuccessfulRunBeforeAccessEffectAction,
} from "./run-window-action-facts";

function runnerRunPaymentSupportAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunWindowActionAssessment {
  const original = input.legalActions.find(
    (entry) =>
      entry.actionId === action.payload?.costPenaltySupportOriginalActionId &&
      entry.payload?.runnerCostPenaltySupportContinuation === true &&
      entry.payload.runnerCostPenaltySupportWindowId ===
        action.payload?.costPenaltySupportWindowId,
  );
  const source = (input.playerView.own.rig ?? []).find(
    (card) => card.instanceId === action.source,
  );
  const ability = source?.runnerPaymentSupportAbilities?.find(
    (entry) => entry.sourceAbilityId === action.abilityRef?.sourceAbilityId,
  );
  const cash = input.playerView.own.credits;
  const cashTarget = action.payload?.costPenaltySupportRunnerCreditTarget;
  if (!Number.isSafeInteger(cashTarget) || Number(cashTarget) < 0)
    return {
      admissible: false,
      evidenceCodes: ["runner_run_payment_support_cash_target_quote_missing"],
    };
  const validPositivePaymentSource =
    original !== undefined &&
    ability !== undefined &&
    ability.trashesSource &&
    ability.creditCost > 0 &&
    ability.creditCost <= cash &&
    ability.gainCredits > ability.creditCost &&
    legalActionCreditCost(action) === ability.creditCost &&
    action.payload?.gainCreditsAmount === ability.gainCredits;
  const preservesActivationCash =
    validPositivePaymentSource &&
    cash - Number(cashTarget) < ability.creditCost;
  const contract = runOrigin?.runRiskContract;
  const remainingUnknownIce = currentRunRemainingIce(input).some(
    (ice) => ice.known !== true || ice.rezzed !== true,
  );
  const requiredReserve =
    remainingUnknownIce &&
    contract?.serverId === input.playerView.run?.attackedServerId
      ? (contract?.reserveQuote.requiredCredits ?? 0)
      : 0;
  const fundsBoundRunReserve =
    validPositivePaymentSource &&
    cash - Number(cashTarget) < requiredReserve &&
    cash - Number(cashTarget) + ability.gainCredits - ability.creditCost >=
      requiredReserve;
  const usePaymentSource = preservesActivationCash || fundsBoundRunReserve;
  return {
    admissible: usePaymentSource,
    value: usePaymentSource ? ability.gainCredits - ability.creditCost : 0,
    evidenceCodes: [
      preservesActivationCash
        ? "runner_run_payment_support_before_activation_cash_is_spent"
        : fundsBoundRunReserve
          ? "runner_run_payment_support_funds_bound_unknown_ice_reserve"
          : "runner_run_payment_support_activation_cash_preserved",
    ],
  };
}

function runnerSuccessfulRunBeforeAccessEffectAssessment(
  action: LegalAction,
): RunnerRunWindowActionAssessment {
  const effectKind = action.payload?.cardImplementationEffectKind;
  const effectAmount =
    effectKind === "corp_lose_credits"
      ? Number(action.payload?.creditLoss)
      : Number(action.payload?.targetCount);
  return {
    admissible: true,
    value: Math.max(1, effectAmount) * 20,
    evidenceCodes: [
      "runner_successful_run_before_access_effect_plan_admissible",
      `runner_successful_run_before_access_effect:${effectKind}`,
      `runner_successful_run_before_access_effect_amount:${effectAmount}`,
      `runner_successful_run_before_access_capability:${action.payload?.cardImplementationAbilityKey}`,
    ],
  };
}

export function visibleEncounterMitigation(
  input: AiDecisionInput,
): string | undefined {
  const visibleContinueThreat = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      (action.payload?.encounterWillEndRun === true ||
        Number(action.payload?.unbrokenSubroutineCount ?? 0) > 0),
  );
  const definitionId = input.playerView.run?.encounteredIce?.definitionId;
  if (!definitionId)
    return visibleContinueThreat
      ? "runner_visible_encounter_continue_resolves_threat"
      : undefined;
  const hint = AI_HINTS_BY_CARD.get(definitionId);
  const threateningEffect = hint?.effects?.some((effect) =>
    [
      "damage",
      "end_run",
      "future_encounter_effect",
      "tag",
      "tag_source",
    ].includes(effect.kind),
  );
  if (!threateningEffect && !visibleContinueThreat) return undefined;
  return `runner_visible_encounter_requires_mitigation:${definitionId}`;
}

export function runnerRunRiskContractReassessment(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunRiskReassessmentSignal | undefined {
  const run = input.playerView.run;
  const contract = runOrigin?.runRiskContract;
  if (!run || !contract || contract.serverId !== run.attackedServerId) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  const currentRiskModel = reconstructBeliefState(
    input,
  ).runnerOpponentModel?.unrezzedIceRiskModel.find(
    (entry) => entry.serverId === run.attackedServerId,
  );
  if (!currentRiskModel) {
    return {
      schemaVersion: "runner-run-risk-reassessment-v1",
      serverId: run.attackedServerId,
      observedAtStateVersion: input.playerView.stateVersion,
      decision: "prefer_jack_out",
      baselineReserveQuote: structuredClone(contract.reserveQuote),
      evidenceCodes: [
        "runner_run_risk_contract_reassessment_failed_closed",
        "runner_run_risk_contract_current_server_risk_model_missing",
      ],
      failureCode: "current_server_risk_model_missing",
    };
  }
  const remainingIce = currentRunRemainingIce(input);
  const unknownIcePositions = remainingIce.flatMap((card, index) =>
    card.known === false && card.rezzed !== true ? [index] : [],
  );
  const knownRezzedRemainingIce = remainingIce.filter(
    (card) => card.known !== false && card.rezzed === true,
  );
  const continuationBudget = runnerRunWindowCreditBudget(input);
  const generalCredits = continuationBudget.credits;
  const knownPath = assessKnownRezzedIcePath(
    knownRezzedRemainingIce,
    input.playerView.own.rig ?? [],
    continuationBudget,
    server.root,
    input.playerView.opponent.credits,
  );
  const corpRezCredits = Math.max(0, input.playerView.opponent.credits);
  const visibleDuringRunRezSupport =
    server.statuses?.some(
      (status) => status.kind === "during_run_ice_rez_support",
    ) === true;
  const corpRezExposureActive =
    corpRezCredits > 0 || visibleDuringRunRezSupport;
  const currentRiskCreditBuffer =
    unknownIcePositions.length > 0 && corpRezExposureActive
      ? Math.max(1, Math.ceil(currentRiskModel.risk * 4))
      : 0;
  const creditsAfterKnownPath = Math.max(0, knownPath.creditsAfterPath);
  const currentReserveQuote = quoteRunnerRunRiskReserve({
    purpose: contract.reserveQuote.purpose,
    riskTolerance: contract.reserveQuote.riskTolerance,
    visibleCoverage: contract.reserveQuote.visibleCoverage,
    knownPathCost: Math.max(0, generalCredits - creditsAfterKnownPath),
    creditsAfterKnownPath,
    unknownIceCount: unknownIcePositions.length,
    unknownIcePositions,
    corpRezCredits,
    corpRezExposureActive,
    riskCreditBuffer: currentRiskCreditBuffer,
    runnerGripCount: input.playerView.own.gripOrHq.length,
    informationProbeAllowed:
      contract.reserveQuote.status === "information_probe_only",
  });
  const materialReserveDegradation =
    currentReserveQuote.creditGap > contract.reserveQuote.creditGap ||
    currentReserveQuote.handBufferGap > contract.reserveQuote.handBufferGap;
  const decision = materialReserveDegradation
    ? ("prefer_jack_out" as const)
    : ("preserve_continuation" as const);
  return {
    schemaVersion: "runner-run-risk-reassessment-v1",
    serverId: run.attackedServerId,
    observedAtStateVersion: input.playerView.stateVersion,
    decision,
    currentUnrezzedIceRisk: currentRiskModel.risk,
    baselineReserveQuote: structuredClone(contract.reserveQuote),
    currentReserveQuote,
    evidenceCodes: [
      "runner_run_risk_contract_reassessed",
      `runner_run_risk_contract_decision:${decision}`,
      `runner_run_risk_contract_baseline_credit_gap:${contract.reserveQuote.creditGap}`,
      `runner_run_risk_contract_current_credit_gap:${currentReserveQuote.creditGap}`,
      `runner_run_risk_contract_baseline_hand_gap:${contract.reserveQuote.handBufferGap}`,
      `runner_run_risk_contract_current_hand_gap:${currentReserveQuote.handBufferGap}`,
      `runner_run_risk_contract_current_unknown_ice:${unknownIcePositions.length}`,
      `runner_run_risk_contract_current_corp_rez_exposure:${corpRezExposureActive}`,
    ],
  };
}

export function currentRunAbortAssessment(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment?: RunnerRunRiskReassessmentSignal,
): { evidenceCode: string } | undefined {
  const run = input.playerView.run;
  if (!run || !input.legalActions.some(runnerRunExitAction)) return undefined;
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  const committedPayoff = runOrigin?.accessCommitment?.payoff;
  const preservesKnownAgendaPayoff =
    committedPayoff === "agenda" || committedPayoff === "score_threat";
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  if (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run.phase === "movement" &&
    run.position?.kind === "server" &&
    (run.attackedServerId === "hq" || run.attackedServerId === "rd") &&
    input.playerView.own.gripOrHq.length === 0 &&
    flatlineRisk.level === "critical" &&
    !preservesKnownAgendaPayoff
  ) {
    return {
      evidenceCode: [
        "runner_critical_empty_grip_unknown_central_access_requires_jack_out",
        `server:${run.attackedServerId}`,
        `flatline_risk:${flatlineRisk.level}`,
        "hand:0",
        `committed_payoff:${committedPayoff ?? "none"}`,
      ].join("|"),
    };
  }
  if (runRiskReassessment?.decision === "prefer_jack_out") {
    return {
      evidenceCode: `runner_run_risk_contract_degraded:${run.attackedServerId}`,
    };
  }
  if (
    run.phase === "movement" &&
    run.position?.kind === "server" &&
    run.attackedServerId.startsWith("remote_")
  ) {
    if (
      runnerRemoteHasKnownNoCurrentPayoff(input, run.attackedServerId) &&
      !runnerRunOriginCommittedPayoff(runOrigin) &&
      !runnerCurrentRunHasSafeCompletionReward(input)
    ) {
      return {
        evidenceCode: `runner_current_run_known_no_payoff:${run.attackedServerId}`,
      };
    }
  }
  const remainingIce = currentRunRemainingIce(input);
  if (remainingIce.length === 0) return undefined;
  const continuationBudget = runnerRunWindowCreditBudget(input);
  const path = assessKnownRezzedIcePath(
    remainingIce,
    input.playerView.own.rig ?? [],
    continuationBudget,
    server.root,
    input.playerView.opponent.credits,
  );
  if (path.canReachAccess) return undefined;
  const conditionalRiskRoute = assessRandomBreakOrDamageRiskForVisibleRunPath(
    input,
    {
      targetServerId: run.attackedServerId,
      visibleIce: remainingIce,
    },
  );
  if (randomBreakOrDamageRiskCanCarryRunPath(conditionalRiskRoute)) {
    return undefined;
  }
  return {
    evidenceCode: `runner_current_run_remaining_path_unreachable:${run.attackedServerId}`,
  };
}

export function runnerTerminalContestPreservesNonlethalDamageContinuation(
  runOrigin: ActiveRunnerRunRoot | undefined,
  visibleDamageAssessment:
    | ReturnType<typeof runnerVisibleLethalIceDamageJackOutAssessment>
    | undefined,
): boolean {
  const evidenceCode = visibleDamageAssessment?.evidenceCode;
  return (
    runOrigin?.parentBinding?.moduleId === "runner.contest_remote" &&
    runOrigin.parentBinding.signal.terminalPatternThreat === true &&
    runOrigin.purpose === "contest" &&
    runnerRunOriginCommittedPayoff(runOrigin) === "score_threat" &&
    runOrigin.runRiskContract !== undefined &&
    evidenceCode?.startsWith(
      "runner_visible_ice_damage_below_required_hand_floor_requires_jack_out|",
    ) === true
  );
}

export function runnerRunWindowActionAssessments(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
  dependencies: RunWindowAssessmentServices,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined,
): NonNullable<RunnerPlanDomain["runWindows"][number]["actionAssessments"]> {
  const assessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  > = {};
  for (const candidate of candidates.filter((entry) =>
    isRunnerRunWindowCandidate(input, entry),
  )) {
    const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    if (!action) {
      assessments[candidate.actionId] = {
        admissible: false,
        evidenceCodes: [
          "runner_run_window_candidate_has_no_matching_legal_action",
        ],
      };
      continue;
    }
    if (
      action.type === "trigger_ability" &&
      (action.payload?.approachIceExposeDecision === "expose" ||
        action.payload?.approachIceExposeDecision === "decline")
    ) {
      continue;
    }
    assessments[candidate.actionId] = runnerRunWindowActionAssessment(
      input,
      candidate,
      action,
      runTargets,
      economy,
      dependencies,
      runOrigin,
      runRiskReassessment,
    );
  }
  return assessments;
}

function runnerRunWindowActionAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  action: AiDecisionInput["legalActions"][number],
  runTargets: readonly RunnerRunTargetEvaluation[],
  economy: RunnerEconomyPosture,
  dependencies: RunWindowAssessmentServices,
  runOrigin: RunnerRunOrigin | undefined,
  runRiskReassessment: RunnerRunRiskReassessmentSignal | undefined,
): RunnerRunWindowActionAssessment {
  const paymentSupport = runnerRunPaymentSupportAction(input, candidate);
  if (paymentSupport)
    return runnerRunPaymentSupportAssessment(input, paymentSupport, runOrigin);
  const additionalAccessAssessment =
    assessRunnerAdditionalAccessRunWindowAction({
      candidate,
      activeServerId: input.playerView.run?.attackedServerId,
      runOriginPurpose: runOrigin?.purpose,
    });
  if (additionalAccessAssessment) return additionalAccessAssessment;
  const accessAction = candidate.semanticActionType.startsWith("access.");
  const restrictedRunSequenceAction = runnerRestrictedRunSequenceAction(
    input,
    candidate,
  );
  const optionalBonusRunDeclineAction = runnerOptionalBonusRunDeclineAction(
    input,
    candidate,
  );
  if (!input.playerView.run) {
    if (optionalBonusRunDeclineAction) {
      return {
        admissible: true,
        value: 0,
        evidenceCodes: [
          "runner_optional_bonus_run_decline",
          "runner_optional_bonus_run_decline_preserves_ordinary_actions",
        ],
      };
    }
    if (restrictedRunSequenceAction) {
      const serverId = restrictedRunSequenceAction.payload?.serverId;
      const costProfile =
        restrictedRunSequenceAction.payload?.restrictedActionGrantCostProfile;
      const costFree =
        costProfile === "no_click" &&
        restrictedRunSequenceAction.costs.every(
          (cost) => (cost.clicks ?? 0) === 0,
        );
      const targetEvaluation = runTargets.find(
        (evaluation) =>
          evaluation.actionId === restrictedRunSequenceAction.actionId,
      );
      const optionalBonusRun =
        restrictedRunSequenceAction.payload?.optionalBonusRun === true;
      const optionalBonusRunHasValue =
        !optionalBonusRun ||
        runnerRunTargetHasOptionalBonusRunValue(targetEvaluation);
      const hasOrdinaryActionAlternative = input.legalActions.some(
        (legalAction) =>
          legalAction.actionId !== restrictedRunSequenceAction.actionId &&
          legalAction.type !== "start_run",
      );
      const optionalRestrictedRunIsSafe =
        !hasOrdinaryActionAlternative ||
        (targetEvaluation?.pathPassability === "reachable" &&
          (targetEvaluation.recommendation === "run_now" ||
            targetEvaluation.recommendation === "run_if_free"));
      return {
        admissible:
          typeof serverId === "string" &&
          serverId.length > 0 &&
          optionalBonusRunHasValue &&
          optionalRestrictedRunIsSafe,
        ...(costFree
          ? { value: targetEvaluation?.score ?? 250 }
          : targetEvaluation
            ? { value: targetEvaluation.score }
            : {}),
        evidenceCodes: [
          "runner_engine_restricted_run_sequence_continuation",
          `runner_restricted_run_sequence_action:${restrictedRunSequenceAction.actionId}`,
          `runner_restricted_run_sequence_target:${typeof serverId === "string" ? serverId : "unknown"}`,
          `runner_restricted_run_sequence_remaining:${Number(restrictedRunSequenceAction.payload?.restrictedActionGrantRemainingActions)}`,
          ...(targetEvaluation
            ? [
                `runner_restricted_run_sequence_target_score:${targetEvaluation.score}`,
                `runner_restricted_run_sequence_target_recommendation:${targetEvaluation.recommendation}`,
                `runner_restricted_run_sequence_known_access_state:${targetEvaluation.knownAccessState}`,
              ]
            : ["runner_restricted_run_sequence_target_evaluation_unavailable"]),
          ...(costFree
            ? [
                "runner_restricted_run_sequence_cost_profile:no_click",
                "runner_restricted_run_sequence_cost_free_route_preferred",
              ]
            : []),
          ...(optionalBonusRun
            ? [
                "runner_optional_bonus_run",
                `runner_optional_bonus_run_value:${optionalBonusRunHasValue}`,
              ]
            : []),
          ...(hasOrdinaryActionAlternative
            ? [
                "runner_restricted_run_sequence_ordinary_action_alternative:true",
                `runner_restricted_run_sequence_optional_route_safe:${optionalRestrictedRunIsSafe}`,
              ]
            : []),
        ],
      };
    }
    return accessAction
      ? {
          admissible: true,
          evidenceCodes: [
            "runner_access_window_legal_without_run_snapshot",
            `runner_access_window_action:${action.type}`,
          ],
        }
      : {
          admissible: false,
          evidenceCodes: [
            "runner_run_window_action_requires_visible_active_run",
            `runner_run_window_action:${action.type}`,
          ],
        };
  }
  if (
    action.type === "trigger_ability" &&
    candidate.sourceKind === "card" &&
    typeof action.payload?.sourceDefinitionId === "string" &&
    candidate.abilityBindingMethod === "unresolved"
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind each card-sourced run-window trigger to its exact CardSpec capability before a run plan may assess it.",
    });
  }
  const subtypeChangeAssessment = runnerEncounterSubtypeChangeAssessment(
    input,
    action,
  );
  if (subtypeChangeAssessment) return subtypeChangeAssessment;
  const successfulRunBeforeAccessEffect =
    runnerSuccessfulRunBeforeAccessEffectAction(input, candidate);
  if (successfulRunBeforeAccessEffect) {
    return runnerSuccessfulRunBeforeAccessEffectAssessment(
      successfulRunBeforeAccessEffect,
    );
  }
  const postPassDerezAndEndRun = runnerPostPassDerezAndEndRunAction(
    input,
    candidate,
  );
  const claimsPostPassDerezAndEndRun =
    (action.payload?.abilityId ?? action.payload?.runnerUtilityAbility) ===
    "derez_fully_broken_passed_ice_and_end_run";
  if (claimsPostPassDerezAndEndRun && !postPassDerezAndEndRun) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map(
        (legalAction) => legalAction.type,
      ),
      unresolvedActionIds: [action.actionId],
      owner: "action_semantics",
      removalCondition:
        "Bind the post-pass derez action to its exact CardSpec capability and both action-bound functional effects.",
    });
  }
  if (postPassDerezAndEndRun) {
    return runnerPostPassDerezAndEndRunAssessment(
      input,
      postPassDerezAndEndRun,
      runOrigin,
    );
  }
  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    input.playerView.run.phase !== "encounter_ice"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_action_requires_encounter_phase",
        `runner_run_phase:${input.playerView.run.phase}`,
      ],
    };
  }
  const supportedRunAction =
    accessAction ||
    restrictedRunSequenceAction !== undefined ||
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out" ||
    candidate.semanticActionType === "breaker.boost_strength" ||
    candidate.semanticActionType === "breaker.break_subroutine" ||
    postPassDerezAndEndRun !== undefined ||
    runnerRunRemainderStrengthBoostAction(input, candidate) !== undefined;
  if (!supportedRunAction) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_run_window_action_has_no_plan_local_assessment",
        `runner_run_window_semantic:${candidate.semanticActionType}`,
      ],
    };
  }
  const encounterExclusion =
    action.type === "pump_breaker" || action.type === "break_subroutine"
      ? dependencies.runnerEncounterActionExclusion(input, action)
      : undefined;
  const fullPathCommitmentPreserved = runnerFullPathCommitmentIsPreserved(
    input,
    runOrigin,
    runRiskReassessment,
  );
  const overriddenEncounterExclusion =
    fullPathCommitmentPreserved &&
    encounterExclusion &&
    runnerFullPathCommitmentCanOverrideEncounterExclusion(encounterExclusion)
      ? encounterExclusion
      : undefined;
  const effectiveEncounterExclusion = overriddenEncounterExclusion
    ? undefined
    : encounterExclusion;
  const planStepExclusion = runnerRunWindowPlanStepExclusion(
    input,
    action,
    dependencies,
    runOrigin,
  );
  const exclusion = effectiveEncounterExclusion ?? planStepExclusion;
  const programPreservationPayment = runnerProgramPreservationPaymentValue(
    input,
    action,
  );
  const accessedDefinitionId = input.playerView.run.accessedCard?.definitionId;
  const exactParentTrashTarget =
    accessedDefinitionId !== undefined &&
    runOrigin?.accessCommitment?.knownTargetDefinitionIds.includes(
      accessedDefinitionId,
    ) === true;
  const accessTrashAction =
    action.type === "trash_accessed_card"
      ? action
      : input.legalActions.find(
          (candidateAction) => candidateAction.type === "trash_accessed_card",
        );
  const accessTrashImpact =
    (action.type === "trash_accessed_card" ||
      action.type === "decline_trash") &&
    accessTrashAction
      ? assessRunnerAccessTrashImpact({
          input,
          trashAction: accessTrashAction,
          economyReserve: economy.desiredCreditReserve,
          parentReservedCredits: exactParentTrashTarget
            ? 0
            : reservedAccessTrashCredits(input, runOrigin?.accessCommitment),
        })
      : undefined;
  const committedParentPayoff = runnerRunOriginCommittedPayoff(runOrigin);
  return exclusion
    ? {
        admissible: false,
        evidenceCodes: [
          `runner_run_window_action_excluded:${exclusion.key}`,
          ...exclusion.reason
            .split("|")
            .map((entry) => entry.trim())
            .filter(Boolean),
        ],
      }
    : {
        admissible: true,
        ...(programPreservationPayment !== undefined
          ? { value: programPreservationPayment }
          : accessTrashImpact
            ? {
                value:
                  action.type === "trash_accessed_card"
                    ? accessTrashImpact.margin
                    : -accessTrashImpact.margin,
              }
            : {}),
        evidenceCodes: [
          accessAction
            ? "runner_access_window_action_plan_admissible"
            : action.type === "pump_breaker" ||
                action.type === "break_subroutine"
              ? "runner_encounter_action_plan_admissible"
              : "runner_run_window_action_plan_admissible",
          `runner_run_window_action:${action.type}`,
          ...(committedParentPayoff
            ? [`runner_run_parent_payoff_preserved:${committedParentPayoff}`]
            : []),
          ...(fullPathCommitmentPreserved
            ? ["runner_full_path_commitment_preserved"]
            : []),
          ...(overriddenEncounterExclusion
            ? [
                `runner_full_path_commitment_overrode_encounter_exclusion:${overriddenEncounterExclusion.key}`,
                ...overriddenEncounterExclusion.reason
                  .split("|")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ]
            : []),
          ...(accessTrashImpact?.evidenceCodes ?? []),
          ...(runOrigin?.informationBoundaryReassessment?.evidenceCodes ?? []),
        ],
      };
}

function runnerEncounterSubtypeChangeAssessment(
  input: AiDecisionInput,
  action: LegalAction,
): RunnerRunWindowActionAssessment | undefined {
  if (
    action.type !== "trigger_ability" ||
    action.payload?.runnerAbility !== "change_icebreaker_subtype"
  ) {
    return undefined;
  }
  const selectedSubtype = action.payload.selectedSubtype;
  const run = input.playerView.run;
  if (
    run?.phase !== "encounter_ice" ||
    input.playerView.timingPoint !== "run.encounter_ice"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_exact_visible_encounter",
      ],
    };
  }
  if (typeof selectedSubtype !== "string" || selectedSubtype.length === 0) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_exact_selected_subtype",
      ],
    };
  }
  const encounteredIce = currentEncounteredIceCard(input);
  if (
    !encounteredIce ||
    encounteredIce.known !== true ||
    encounteredIce.rezzed !== true ||
    !encounteredIce.effectiveRunQuote
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_requires_engine_quoted_visible_ice",
      ],
    };
  }
  if (!encounteredIce.subtypes?.includes(selectedSubtype)) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_does_not_match_current_ice",
        `runner_encounter_selected_subtype:${selectedSubtype}`,
      ],
    };
  }
  const sourceCardId = action.payload.cardId;
  const rig = input.playerView.own.rig ?? [];
  if (typeof sourceCardId !== "string") {
    return {
      admissible: false,
      evidenceCodes: ["runner_encounter_subtype_change_source_card_missing"],
    };
  }
  const sourceCard = rig.find((card) => card.instanceId === sourceCardId);
  if (!sourceCard) {
    return {
      admissible: false,
      evidenceCodes: ["runner_encounter_subtype_change_source_not_in_own_rig"],
    };
  }
  const path = assessKnownRezzedIcePath(
    [encounteredIce],
    rig.map((card) =>
      card.instanceId === sourceCard.instanceId
        ? { ...card, selectedSubtype }
        : card,
    ),
    input.playerView.own.credits,
  );
  if (!path.canReachAccess || path.blocked) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_encounter_subtype_change_has_no_payable_break_continuation",
        `runner_encounter_selected_subtype:${selectedSubtype}`,
        ...(path.noAccessReason
          ? [`runner_encounter_subtype_path:${path.noAccessReason}`]
          : []),
      ],
    };
  }
  return {
    admissible: true,
    value: 500,
    evidenceCodes: [
      "runner_run_window_action_plan_admissible",
      "runner_encounter_subtype_change_enables_payable_break_continuation",
      `runner_encounter_selected_subtype:${selectedSubtype}`,
      ...(path.visibleBreakCost !== undefined
        ? [`runner_encounter_subtype_break_cost:${path.visibleBreakCost}`]
        : []),
    ],
  };
}

function runnerPostPassDerezAndEndRunAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunWindowActionAssessment {
  const run = input.playerView.run;
  const targetIceId = action.payload?.targetIceId;
  const targetMatches =
    typeof targetIceId === "string"
      ? input.playerView.servers.flatMap((server) =>
          server.ice
            .filter((ice) => ice.instanceId === targetIceId)
            .map((ice) => ({ serverId: server.id, ice })),
        )
      : [];
  if (
    !run ||
    run.phase !== "movement" ||
    input.playerView.timingPoint !== "run.jack_out_window" ||
    targetMatches.length !== 1 ||
    targetMatches[0]!.serverId !== run.attackedServerId ||
    targetMatches[0]!.ice.rezzed !== true
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_post_pass_derez_and_end_run_target_not_exactly_visible",
        `runner_post_pass_target:${typeof targetIceId === "string" ? targetIceId : "missing"}`,
      ],
    };
  }
  const committedPayoff = runOrigin?.accessCommitment?.payoff;
  if (
    visibleKnownAgendaOnServer(input, run.attackedServerId) ||
    committedPayoff === "agenda" ||
    committedPayoff === "score_threat"
  ) {
    return {
      admissible: false,
      evidenceCodes: [
        "runner_post_pass_derez_and_end_run_would_abandon_known_agenda",
        `runner_run_target:${run.attackedServerId}`,
      ],
    };
  }
  const targetDefinition = targetMatches[0]!.ice.definitionId
    ? CARD_DEFINITIONS_BY_ID[targetMatches[0]!.ice.definitionId!]
    : undefined;
  const rezCost =
    targetDefinition?.type === "ice" &&
    Number.isFinite(targetDefinition.rezCost)
      ? Math.max(0, targetDefinition.rezCost ?? 0)
      : 0;
  const paidCredits = legalActionCreditCost(action);
  return {
    admissible: true,
    value: 140 + Math.min(8, rezCost) * 40 - paidCredits * 60,
    evidenceCodes: [
      "runner_post_pass_derez_and_end_run_plan_admissible",
      `runner_post_pass_target:${targetIceId}`,
      `runner_post_pass_target_rez_cost:${rezCost}`,
      `runner_post_pass_paid_credits:${paidCredits}`,
      `runner_run_target:${run.attackedServerId}`,
    ],
  };
}

function runnerProgramPreservationPaymentValue(
  input: AiDecisionInput,
  action: LegalAction,
): number | undefined {
  const payment = action.payload?.payOrTrashProgramSubroutinePayment;
  if (typeof payment !== "number" || payment <= 0) return undefined;
  const installedProgramCount = (input.playerView.own.rig ?? []).filter(
    (card) => card.type === "program",
  ).length;
  if (installedProgramCount === 0) return undefined;
  return 1_000 + installedProgramCount * 100;
}

export function runnerExactRunWindowPhaseActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  assessments: Readonly<Record<string, { admissible: boolean }>>,
  safetyRequiresJackOut: boolean,
  encounterRequiresTargetPreservingBreak: boolean,
): string[] {
  const run = input.playerView.run;
  if (!run) return [];
  const admissibleRunWindowCandidates = candidates.filter(
    (candidate) =>
      isRunnerRunWindowCandidate(input, candidate) &&
      assessments[candidate.actionId]?.admissible === true,
  );
  const fortToll = runnerFortPassTollWindow(input);
  if (fortToll) {
    const selected =
      safetyRequiresJackOut || !fortToll.pay ? fortToll.end : fortToll.pay;
    if (assessments[selected.actionId]?.admissible !== true) {
      throw new PlanResolutionFailure("no_current_route_head", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: [selected.actionId],
        owner: "plan_module",
        removalCondition:
          "Resolve the current fort-pass continuation or safety exit inside runner.convert_run_window.",
      });
    }
    return [selected.actionId];
  }
  if (safetyRequiresJackOut) {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "jack_out")
      .map((candidate) => candidate.actionId);
  }
  const paymentSupport = admissibleRunWindowCandidates.filter(
    (candidate) =>
      runnerRunPaymentSupportAction(input, candidate) !== undefined,
  );
  if (paymentSupport.length > 0)
    return paymentSupport.map((candidate) => candidate.actionId);
  const exactPayOrEndRunRouteActionIds =
    runnerExactPayOrEndRunAccessRouteActionIds(
      input,
      admissibleRunWindowCandidates,
    );
  if (exactPayOrEndRunRouteActionIds.length > 0) {
    return exactPayOrEndRunRouteActionIds;
  }
  if (encounterRequiresTargetPreservingBreak) {
    const directEncounterActionIds = input.legalActions
      .filter(
        (action) =>
          (action.type === "pump_breaker" ||
            action.type === "break_subroutine") &&
          assessments[action.actionId]?.admissible === true,
      )
      .map((action) => action.actionId);
    if (directEncounterActionIds.length > 0) {
      return directEncounterActionIds;
    }
  }
  const accessStartAvailable = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.serverId === run.attackedServerId &&
      action.payload?.encounterContinue !== true,
  );
  if (accessStartAvailable) {
    const additionalAccessRoutes = admissibleRunWindowCandidates.filter(
      runnerCandidateHasVisibleAdditionalAccessEffect,
    );
    if (additionalAccessRoutes.length > 0) {
      return additionalAccessRoutes.map((candidate) => candidate.actionId);
    }
  }
  if (currentRunHasPendingAutoPassIce(input)) {
    return admissibleRunWindowCandidates
      .filter((candidate) => candidate.actionType === "continue_run")
      .map((candidate) => candidate.actionId);
  }
  if (run.phase === "movement" && run.position?.kind === "server") {
    return admissibleRunWindowCandidates
      .filter(
        (candidate) =>
          candidate.actionType === "continue_run" ||
          runnerPostPassDerezAndEndRunAction(input, candidate) !== undefined,
      )
      .map((candidate) => candidate.actionId);
  }
  return [];
}

function runnerExactPayOrEndRunAccessRouteActionIds(
  input: AiDecisionInput,
  admissibleRunWindowCandidates: readonly ActionSemanticCandidate[],
): string[] {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    input.playerView.timingPoint !== "run.encounter_ice"
  ) {
    return [];
  }
  const encounteredIce = currentEncounteredIceCard(input);
  const subroutines = encounteredIce?.effectiveRunQuote?.subroutines;
  if (!subroutines) return [];
  const admissibleActionIds = new Set(
    admissibleRunWindowCandidates.map((candidate) => candidate.actionId),
  );
  const paidContinuation = input.legalActions
    .filter(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        action.payload?.encounterWillEndRun === false &&
        Number(action.payload?.payOrEndRunSubroutinePayment ?? 0) > 0 &&
        admissibleActionIds.has(action.actionId),
    )
    .map((action) => ({
      action,
      indexes: parseSubroutineIndexes(
        action.payload?.payOrEndRunSubroutineIndexes,
      ),
      unbrokenSubroutineCount: Number(
        action.payload?.unbrokenSubroutineCount ?? 0,
      ),
    }))
    .find(
      ({ indexes, unbrokenSubroutineCount }) =>
        indexes.size > 0 &&
        indexes.size === unbrokenSubroutineCount &&
        [...indexes].every(
          (index) =>
            subroutines[index]?.type === "end_the_run_unless_runner_pays",
        ),
    );
  if (!paidContinuation) return [];

  const completeAccessRoutes = input.legalActions.filter((action) => {
    if (!admissibleActionIds.has(action.actionId)) return false;
    if (action.actionId === paidContinuation.action.actionId) return true;
    if (action.type !== "break_subroutine") return false;
    const brokenIndexes = breakSubroutineIndexesForAction(action);
    return [...paidContinuation.indexes].every((index) =>
      brokenIndexes.has(index),
    );
  });
  const cheapestRouteCost = Math.min(
    ...completeAccessRoutes.map(legalActionCreditCost),
  );
  return completeAccessRoutes
    .filter((action) => legalActionCreditCost(action) === cheapestRouteCost)
    .map((action) => action.actionId);
}

export function runnerBindExactRunWindowPhaseRoute(
  assessments: NonNullable<
    RunnerPlanDomain["runWindows"][number]["actionAssessments"]
  >,
  exactPhaseActionIds: readonly string[],
): NonNullable<RunnerPlanDomain["runWindows"][number]["actionAssessments"]> {
  if (exactPhaseActionIds.length === 0) return assessments;
  const exactRoute = new Set(exactPhaseActionIds);
  return Object.fromEntries(
    Object.entries(assessments).map(([actionId, assessment]) => {
      if (exactRoute.has(actionId) || assessment.admissible === false) {
        return [actionId, assessment];
      }
      return [
        actionId,
        {
          admissible: false,
          evidenceCodes: [
            "run_window_action_outside_exact_phase_route",
            ...assessment.evidenceCodes,
          ],
        },
      ];
    }),
  );
}

function runnerRunWindowPlanStepExclusion(
  input: AiDecisionInput,
  action: AiDecisionInput["legalActions"][number],
  dependencies: RunWindowAssessmentServices,
  runOrigin: RunnerRunOrigin | undefined,
): SemanticRuntimeExclusion | undefined {
  const run = input.playerView.run;
  if (!run) return undefined;

  const informationReassessment = runOrigin?.informationBoundaryReassessment;
  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    informationReassessment?.decision === "retain_information" &&
    !runnerInformationProbeRequiresEncounterBreak(input, runOrigin) &&
    !runnerCurrentEncounterRequiresDamagePreservingBreak(input, runOrigin) &&
    !runnerCurrentEncounterRequiresProgramPreservingBreak(input) &&
    (!informationReassessment.knownPathReachable ||
      informationReassessment.fundingGap > 0 ||
      informationReassessment.unavoidableHazardCount > 0)
  ) {
    return {
      key: "run_plan_information_reassessment_not_convertible",
      label: "Die neu quotierte Informationsroute trägt keine Fortsetzung",
      reason: [
        "run_plan_step:information_probe_reassessment",
        `run_plan_target:${run.attackedServerId}`,
        `run_plan_known_path_reachable:${informationReassessment.knownPathReachable}`,
        `run_plan_known_path_cost:${informationReassessment.knownPathCost}`,
        `run_plan_funding_gap:${informationReassessment.fundingGap}`,
        `run_plan_unavoidable_hazards:${informationReassessment.unavoidableHazardCount}`,
      ].join("|"),
    };
  }

  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    runOrigin?.purpose === "information" &&
    runOrigin.encounterCreditSpendLimit !== undefined &&
    !runnerCurrentEncounterRequiresDamagePreservingBreak(input, runOrigin) &&
    !runnerCurrentEncounterRequiresProgramPreservingBreak(input) &&
    legalActionCreditCost(action) > runOrigin.encounterCreditSpendLimit
  ) {
    return {
      key: "run_plan_information_budget_exceeded",
      label: "Informationsplan erlaubt diese Encounter-Ausgabe nicht",
      reason: [
        "run_plan_step:information_probe",
        `run_plan_target:${run.attackedServerId}`,
        `run_plan_encounter_spend_limit:${runOrigin.encounterCreditSpendLimit}`,
        `run_plan_action_credit_cost:${legalActionCreditCost(action)}`,
      ].join("|"),
    };
  }

  if (
    (action.type === "pump_breaker" || action.type === "break_subroutine") &&
    currentActiveRunHasKnownNoPayoff(input) &&
    !runnerRunOriginCommittedPayoff(runOrigin)
  ) {
    return {
      key: "run_plan_known_no_payoff",
      label: "Kein bekannter Zugriffsertrag",
      reason: [
        "run_plan_step:encounter_resource_spend",
        `run_plan_target:${run.attackedServerId}`,
        "run_plan_known_no_current_payoff:true",
      ].join("|"),
    };
  }

  if (
    action.type === "continue_run" &&
    action.payload?.encounterContinue === true &&
    action.payload?.encounterWillEndRun === true &&
    input.legalActions.some(
      (candidate) =>
        candidate.type === "continue_run" &&
        candidate.actionId !== action.actionId &&
        candidate.payload?.encounterContinue === true &&
        candidate.payload?.encounterWillEndRun === false,
    )
  ) {
    return {
      key: "run_plan_access_preserving_continue_available",
      label: "Zugriffspfad kann erhalten werden",
      reason: [
        "run_plan_step:continue_choice",
        "run_plan_access_preserving_continue_available:true",
        "run_plan_selected_continue_would_end_run:true",
      ].join("|"),
    };
  }

  if (
    action.type !== "continue_run" ||
    action.payload?.encounterContinue !== true ||
    !currentEncounterHasUnbrokenResolvableDeflector(input)
  ) {
    return undefined;
  }

  const affordableBreakerRoute = input.legalActions.some((candidate) => {
    if (
      candidate.type !== "pump_breaker" &&
      candidate.type !== "break_subroutine"
    ) {
      return false;
    }
    return (
      dependencies.runnerEncounterActionExclusion(input, candidate) ===
        undefined &&
      runnerRunWindowPlanStepExclusion(
        input,
        candidate,
        dependencies,
        runOrigin,
      ) === undefined
    );
  });
  if (!affordableBreakerRoute) return undefined;
  return {
    key: "run_plan_target_preserving_break_available",
    label: "Aktuelles Run-Ziel kann erhalten werden",
    reason: [
      "run_plan_step:deflector_choice",
      `run_plan_target:${run.attackedServerId}`,
      "run_plan_unbroken_deflector:true",
      "run_plan_target_preserving_break_available:true",
    ].join("|"),
  };
}

export function runnerInformationProbeRequiresEncounterBreak(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): boolean {
  const reassessment = runOrigin?.informationBoundaryReassessment;
  if (
    reassessment?.decision !== "retain_information" ||
    reassessment.unknownIceCount <= 0 ||
    reassessment.fundingGap > 0 ||
    reassessment.unavoidableHazardCount > 0
  ) {
    return false;
  }
  const encounterWouldEndRun = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      action.payload?.encounterWillEndRun === true,
  );
  const encounterBreakAvailable = input.legalActions.some(
    (action) =>
      action.type === "pump_breaker" || action.type === "break_subroutine",
  );
  return encounterWouldEndRun && encounterBreakAvailable;
}

export function runnerCurrentEncounterRequiresProgramPreservingBreak(
  input: AiDecisionInput,
): boolean {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    !input.playerView.own.rig?.some((card) => card.type === "program")
  ) {
    return false;
  }
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines;
  if (
    !subroutines?.some(
      (subroutine) => subroutine.type === "trash_installed_program",
    )
  ) {
    return false;
  }
  return input.legalActions.some((action) => {
    if (
      action.type !== "continue_run" ||
      action.payload?.encounterContinue !== true
    ) {
      return false;
    }
    const quotedIds = action.payload.encounterSubroutineIds;
    const ids =
      typeof quotedIds === "string" ? quotedIds.split(",").filter(Boolean) : [];
    if (
      typeof quotedIds !== "string" ||
      new Set(ids).size !== ids.length ||
      ids.length !== action.payload.unbrokenSubroutineCount ||
      ids.some((id) => !subroutines.some((subroutine) => subroutine.id === id))
    ) {
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((candidate) => candidate.type),
        unresolvedActionIds: [action.actionId],
        owner: "rules_contract",
        removalCondition:
          "Program-preserving encounter admission requires the Engine's exact remaining subroutine IDs and count.",
      });
    }
    const remaining = new Set(ids);
    return (
      subroutines.some(
        (subroutine) =>
          remaining.has(subroutine.id) &&
          subroutine.type === "trash_installed_program",
      ) === true
    );
  });
}

export function runnerCurrentEncounterRequiresDamagePreservingBreak(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
): boolean {
  if (input.playerView.run?.phase !== "encounter_ice") return false;
  // The payment window suspends encounter choices. Its continuation owner
  // resumes the already selected action with the persisted plan binding;
  // this is not a fresh choice to leave any subroutine unbroken.
  if (
    input.legalActions.some(
      (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
    )
  )
    return false;
  if (currentEncounterRequiresFullBreak(input)) return true;
  const encounteredIce = currentEncounteredIceCard(input);
  if (!encounteredIce?.effectiveRunQuote) return false;
  if (
    !encounteredIce.effectiveRunQuote.subroutines.some(
      (subroutine) =>
        (subroutine.type === "do_damage" ||
          subroutine.type === "random_damage") &&
        typeof subroutine.amount === "number" &&
        subroutine.amount > 0,
    )
  )
    return false;
  const unbrokenIndexes = currentEncounterUnbrokenSubroutineIndexes(input);
  const remainingDamageIce = {
    ...encounteredIce,
    effectiveRunQuote: {
      ...encounteredIce.effectiveRunQuote,
      subroutines: encounteredIce.effectiveRunQuote.subroutines.filter(
        (_, index) => unbrokenIndexes.has(index),
      ),
    },
  };
  return (
    runnerVisibleLethalIceDamageAssessment(input, [remainingDamageIce], {
      // Quote the consequence of deliberately leaving the current damage
      // subroutine unbroken. Affordability is evaluated by the exact
      // pump/break LegalActions, not by this consequence check.
      generalCredits: 0,
      // An information run already reserved a hand buffer for the unknown
      // remainder. Its encounter budget cannot discard that bound reserve
      // merely because the immediate damage is not itself a flatline.
      requiredHandFloor: Math.max(
        runnerConfirmedDamageRequiredHandFloor(input),
        runOrigin?.purpose === "information"
          ? (runOrigin.runRiskContract?.reserveQuote.requiredHandBuffer ?? 0)
          : 0,
      ),
    }) !== undefined
  );
}

function runnerRunOriginCommittedPayoff(
  runOrigin: RunnerRunOrigin | undefined,
): RunnerRunAccessCommitmentSignal["payoff"] | undefined {
  const commitment = runOrigin?.accessCommitment;
  if (!commitment || commitment.intendedAction === "decline") return undefined;
  const committed =
    commitment.payoff === "agenda" ||
    commitment.payoff === "score_threat" ||
    commitment.payoff === "trash_affordable" ||
    commitment.payoff === "access_bonus";
  return committed ? commitment.payoff : undefined;
}

function runnerFullPathCommitmentIsPreserved(
  input: AiDecisionInput,
  runOrigin: RunnerRunOrigin | undefined,
  reassessment: RunnerRunRiskReassessmentSignal | undefined,
): boolean {
  const run = input.playerView.run;
  const contract = runOrigin?.runRiskContract;
  return (
    run !== undefined &&
    contract !== undefined &&
    contract.serverId === run.attackedServerId &&
    contract.runCommitment === "full_path" &&
    contract.reserveQuote.unknownIceCount === 0 &&
    reassessment?.decision === "preserve_continuation" &&
    reassessment.currentReserveQuote?.unknownIceCount === 0
  );
}

function runnerFullPathCommitmentCanOverrideEncounterExclusion(
  exclusion: SemanticRuntimeExclusion,
): boolean {
  return (
    exclusion.key === "encounter_remote_payoff_reserve_would_break" ||
    exclusion.key === "encounter_reserve_would_break"
  );
}

export function runnerFullPathCommitmentRequiresEncounterBreak(
  input: AiDecisionInput,
  assessments: Readonly<Record<string, { admissible: boolean }>>,
  runOrigin: RunnerRunOrigin | undefined,
  reassessment: RunnerRunRiskReassessmentSignal | undefined,
): boolean {
  if (!runnerFullPathCommitmentIsPreserved(input, runOrigin, reassessment)) {
    return false;
  }
  const encounterWouldEndRun = input.legalActions.some(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true &&
      action.payload?.encounterWillEndRun === true,
  );
  if (!encounterWouldEndRun) return false;
  return input.legalActions.some(
    (action) =>
      (action.type === "pump_breaker" || action.type === "break_subroutine") &&
      assessments[action.actionId]?.admissible === true,
  );
}

export function currentEncounterHasUnbrokenResolvableDeflector(
  input: AiDecisionInput,
): boolean {
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  if (!quote) return false;
  const continueAction = input.legalActions.find(
    (action) =>
      action.type === "continue_run" &&
      action.payload?.encounterContinue === true,
  );
  const unbrokenSubroutineCount = Number(
    continueAction?.payload?.unbrokenSubroutineCount ?? 0,
  );
  if (unbrokenSubroutineCount !== quote.subroutines.length) return false;
  const deflectorContext = {
    visibleRemoteServerCount: input.playerView.servers.filter((server) =>
      server.id.startsWith("remote_"),
    ).length,
    visibleCorpCredits: input.playerView.opponent.credits,
  };
  return quote.subroutines.some((subroutine) =>
    visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext),
  );
}

function currentActiveRunHasKnownNoPayoff(input: AiDecisionInput): boolean {
  const serverId = input.playerView.run?.attackedServerId;
  if (!serverId?.startsWith("remote_")) return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.root.length === 0 ||
    runnerRemoteHasKnownNoCurrentPayoff(input, serverId)
  );
}
