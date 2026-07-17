import type {
  AiDecisionInput,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  mapPlanStepToLegalActions,
  type PlanStepMappingResult,
  type TacticalPlan,
  type TacticalPlanRuntimeResult,
} from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";
import { semanticRuntimeServerId } from "./semantic-runtime-scope";

// Tactical plans define the active action lane. Scores rank choices inside that lane;
// off-plan Runner overrides need explicit hard-interrupt evidence.
const PLAN_MAPPED_CHOICE_MAX_SCORE_GAP = 600;
const STRATEGIC_EXACT_OVERRIDE_SCORE_GAP = 320;
const STRATEGIC_KIND_OVERRIDE_SCORE_GAP = 480;
const STRATEGIC_EXACT_MAPPING_PROTECTION_SCORE_GAP = 900;
const STRATEGIC_KIND_MAPPING_PROTECTION_SCORE_GAP = 720;
const BACKGROUND_BANK_BUILD_MAX_SCORE_GAP = 300;
const BACKGROUND_BANK_HAND_BUFFER_MAX_SCORE_DEFICIT = 300;

export function bestSemanticRuntimeChoice(
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  return (
    choices.find((candidate) => !candidate.exclusion && candidate.score > 0) ??
    choices.find((candidate) => !candidate.exclusion)
  );
}

export function bestSemanticRuntimeChoiceForTacticalPlanOverride(
  choices: readonly SemanticRuntimeChoice[],
  planRuntime: TacticalPlanRuntimeResult,
): SemanticRuntimeChoice | undefined {
  const viableChoices = choices.filter(
    (choice) => !tacticalPlanBlocksSemanticChoice(planRuntime, choice),
  );
  return bestSemanticRuntimeChoice(viableChoices);
}

export function tacticalPlanMappedChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
  mapping: PlanStepMappingResult | undefined,
  overrideChoice: SemanticRuntimeChoice | undefined,
): TacticalPlanMappedChoiceResult {
  if (!mapping) return {};
  const mappedActionIds = new Set(
    mapping.legalActions.map((action) => action.actionId),
  );
  const mappedChoices = mapping.legalActions
    .map((action) =>
      choices.find(
        (choice) =>
          !choice.exclusion && choice.action.actionId === action.actionId,
      ),
    )
    .filter((choice): choice is SemanticRuntimeChoice => Boolean(choice));
  const mappedChoice = bestPlanCompatibleSemanticChoice(mappedChoices, mapping);
  if (!mappedChoice) return {};
  const mappedStrategicFit =
    semanticRuntimeChoiceStrategicFitLevel(mappedChoice);
  if (mappedStrategicFit === "none") {
    const strategicOverrideChoice = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          semanticRuntimeChoiceStrategicFitLevel(choice) !== "none",
      ),
    );
    if (
      strategicOverrideChoice &&
      strategicOverrideChoice.score > 0 &&
      strategicOverrideChoice.score > mappedChoice.score &&
      (mapping.plan.side !== "runner" ||
        strategicOverrideChoice.score >
          (overrideChoice?.score ?? Number.NEGATIVE_INFINITY))
    ) {
      overrideChoice = strategicOverrideChoice;
    }
  }
  if (
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice)
  ) {
    const acuteHandBufferOverride = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          semanticRuntimeChoiceIsAcuteHandBufferDraw(choice),
      ),
    );
    if (
      acuteHandBufferOverride &&
      !semanticRuntimeChoiceHasPositiveDevelopmentCommitment(overrideChoice)
    ) {
      overrideChoice = acuteHandBufferOverride;
    }
  }
  if (
    overrideChoice?.action.actionId === mappedChoice.action.actionId &&
    mapping.plan.type === "runner.build_credit_bank" &&
    mapping.plan.evidence.includes("runner_bank_concrete_funding_need:false")
  ) {
    const damagePressureDraw = bestSemanticRuntimeChoice(
      choices.filter(
        (choice) =>
          !choice.exclusion &&
          choice.action.actionId !== mappedChoice.action.actionId &&
          semanticRuntimeChoiceIsDamagePressureHandBufferDraw(choice),
      ),
    );
    if (damagePressureDraw) overrideChoice = damagePressureDraw;
  }
  if (
    overrideChoice &&
    overrideChoice.action.actionId !== mappedChoice.action.actionId &&
    !tacticalPlanStepPriorityKeepsMappedChoice(
      mapping,
      mappedChoice,
      overrideChoice,
    )
  ) {
    const scoreGap = roundScore(overrideChoice.score - mappedChoice.score);
    const threshold = tacticalPlanOverrideScoreGapThreshold(
      mappedChoice,
      overrideChoice,
    );
    const coverageProbeRunShouldYield = tacticalPlanCoverageProbeRunShouldYield(
      mapping,
      mappedChoice,
      overrideChoice,
      scoreGap,
    );
    const lowValueRunEventShouldYield =
      tacticalPlanLowValueRunEventMappingShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const urgentRunNowDevelopmentShouldYield =
      tacticalPlanUrgentRunNowDevelopmentShouldYield(
        input,
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    if (
      tacticalPlanFundedDevelopmentContinuationBlocksOverride(
        mapping,
        mappedChoice,
        overrideChoice,
      ) &&
      !lowValueRunEventShouldYield &&
      !urgentRunNowDevelopmentShouldYield
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "funded_development_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    if (
      tacticalPlanRemoteContestMappingBlocksRunOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "remote_contest_plan_mapping",
        scoreGap,
        threshold: 3000,
      });
    }
    if (
      tacticalPlanCoverageMappingBlocksRunOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
        scoreGap,
        threshold.scoreGap,
      ) &&
      !coverageProbeRunShouldYield
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "coverage_plan_mapping",
        scoreGap,
        threshold: threshold.scoreGap,
      });
    }
    if (
      tacticalPlanCoverageMappingBlocksEconomyOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
        threshold.scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "coverage_plan_mapping",
        scoreGap,
        threshold: Math.max(threshold.scoreGap, 900),
      });
    }
    if (
      tacticalPlanHandBufferMappingBlocksProbeRunOverride(
        mapping,
        overrideChoice,
        scoreGap,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "hand_buffer_plan_mapping",
        scoreGap,
        threshold: 1800,
      });
    }
    if (
      tacticalPlanCorpScoreConversionBlocksOffPlanOverride(
        mapping,
        overrideChoice,
        mappedActionIds,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "corp_score_conversion_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    if (
      tacticalPlanCorpEconomyActivationBlocksOffPlanOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason:
          mapping.plan.type === "corp.activate_persistent_economy"
            ? "corp_persistent_economy_plan_controller"
            : "corp_finite_economy_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    if (
      tacticalPlanCorpScorelineSupportBlocksOffPlanOverride(
        input,
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "corp_scoreline_support_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    const mappedNonPositiveAgainstPositive =
      mappedChoice.score <= 0 && overrideChoice.score > 0;
    const deferredDevelopmentInstallShouldYield =
      tacticalPlanDeferredDevelopmentInstallShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
      ) ||
      tacticalPlanMarginalDevelopmentInstallShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const noNeedSearchShouldYield = tacticalPlanNoNeedSearchShouldYield(
      mapping,
      mappedChoice,
      overrideChoice,
    );
    if (
      mappedNonPositiveAgainstPositive &&
      !deferredDevelopmentInstallShouldYield &&
      !urgentRunNowDevelopmentShouldYield &&
      !noNeedSearchShouldYield &&
      tacticalPlanNonPositiveMappingStillProtected(
        mapping,
        mappedChoice,
        overrideChoice,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "economy_route_plan_mapping",
        scoreGap,
        threshold: Math.max(threshold.scoreGap, 900),
      });
    }
    const repeatedRunShouldYield = tacticalPlanRepeatedRunMappingShouldYield(
      input,
      mapping,
      mappedChoice,
      overrideChoice,
      scoreGap,
    );
    const nonPositiveProjectedRunShouldYield =
      tacticalPlanNonPositiveProjectedRunShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
      );
    const acuteHandBufferShouldYield = tacticalPlanAcuteHandBufferShouldYield(
      mapping,
      mappedChoice,
      overrideChoice,
      scoreGap,
    );
    const damageReactionReserveShouldYield =
      tacticalPlanDamageReactionReserveShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const lowValueRecoveryShouldYield =
      tacticalPlanLowValueRecoveryMappingShouldYield(
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const inferiorRunTargetShouldYield =
      tacticalPlanInferiorRunTargetMappingShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
        threshold.scoreGap,
      );
    const corpBoardTriageMismatchShouldYield =
      tacticalPlanCorpBoardTriageMismatchShouldYield(
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const backgroundBankBuildShouldYield =
      tacticalPlanBackgroundBankBuildShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const hardInterruptShouldYield =
      mapping.plan.side === "runner" &&
      (semanticRuntimeChoiceHasScoreBreakdownComponent(
        overrideChoice,
        "runner_matchpoint_run_lock_release",
      ) ||
        semanticRuntimeChoiceHasScoreBreakdownComponent(
          overrideChoice,
          "runner_viable_followup_run_lock_release",
        ) ||
        runnerUrgentRemoteContestRunCanInterruptPlan(
          mapping.plan,
          overrideChoice,
        ));
    if (
      tacticalPlanRunnerMappingBlocksOffPlanOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
        {
          repeatedRunShouldYield,
          nonPositiveProjectedRunShouldYield,
          acuteHandBufferShouldYield,
          damageReactionReserveShouldYield,
          lowValueRecoveryShouldYield,
          inferiorRunTargetShouldYield,
          corpBoardTriageMismatchShouldYield,
          deferredDevelopmentInstallShouldYield,
          backgroundBankBuildShouldYield,
          noNeedSearchShouldYield,
          coverageProbeRunShouldYield,
          lowValueRunEventShouldYield,
          urgentRunNowDevelopmentShouldYield,
        },
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "runner_plan_controller",
        scoreGap,
        threshold: Number.POSITIVE_INFINITY,
      });
    }
    if (
      mappedNonPositiveAgainstPositive ||
      repeatedRunShouldYield ||
      acuteHandBufferShouldYield ||
      damageReactionReserveShouldYield ||
      lowValueRecoveryShouldYield ||
      inferiorRunTargetShouldYield ||
      corpBoardTriageMismatchShouldYield ||
      backgroundBankBuildShouldYield ||
      hardInterruptShouldYield ||
      noNeedSearchShouldYield ||
      coverageProbeRunShouldYield ||
      lowValueRunEventShouldYield ||
      urgentRunNowDevelopmentShouldYield ||
      scoreGap > threshold.scoreGap
    ) {
      const result = {
        outcome: "semantic_choice_selected" as const,
        overrideChoice,
        overriddenMappedChoice: mappedChoice,
        overrideReason: urgentRunNowDevelopmentShouldYield
          ? "urgent_run_now_development_yield"
          : noNeedSearchShouldYield
            ? "no_need_search_mapping_yield"
            : coverageProbeRunShouldYield
              ? "coverage_probe_run_mapping_yield"
              : lowValueRunEventShouldYield
                ? "low_value_run_event_mapping_yield"
                : mappedNonPositiveAgainstPositive
                  ? "mapped_nonpositive_against_positive"
                  : repeatedRunShouldYield
                    ? "repeated_run_mapping_yield"
                    : acuteHandBufferShouldYield
                      ? "acute_hand_buffer_mapping_yield"
                      : damageReactionReserveShouldYield
                        ? "damage_reaction_reserve_mapping_yield"
                        : lowValueRecoveryShouldYield
                          ? "low_value_recovery_mapping_yield"
                          : inferiorRunTargetShouldYield
                            ? "inferior_run_target_mapping_yield"
                            : corpBoardTriageMismatchShouldYield
                              ? "corp_board_triage_mismatch_yield"
                              : backgroundBankBuildShouldYield
                                ? "background_bank_build_mapping_yield"
                                : hardInterruptShouldYield
                                  ? "runner_hard_interrupt"
                                  : threshold.reason,
        overrideThreshold: threshold.scoreGap,
        scoreGap,
      };
      return {
        ...result,
        choice: semanticRuntimeChoiceWithAddedEvidence(
          overrideChoice,
          tacticalPlanMappingOverrideEvidence(result),
        ),
      };
    }
    return tacticalPlanBlockedOverrideResult({
      mappedChoice,
      overrideChoice,
      reason: threshold.reason.endsWith("mapping_protected")
        ? threshold.reason
        : "semantic_score_gap_below_threshold",
      scoreGap,
      threshold: threshold.scoreGap,
    });
  }
  return {
    outcome: "plan_mapping_selected",
    choice: semanticRuntimeChoiceWithAddedEvidence(
      mappedChoice,
      tacticalPlanMappingSelectedEvidence(mapping, mappedChoice),
    ),
  };
}

function tacticalPlanFundedDevelopmentContinuationBlocksOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    mapping.plan.type === "runner.develop_hand_card" &&
    (mapping.plan.evidence.includes(
      "funded_hand_development_continuation:true",
    ) ||
      mapping.plan.evidence.includes(`previous_plan:${mapping.plan.planId}`)) &&
    (mappedChoice.action.type === "install_card" ||
      mappedChoice.action.type === "play_event") &&
    !tacticalPlanDeferredDevelopmentInstallShouldYield(
      mapping,
      mappedChoice,
      overrideChoice,
    ) &&
    !semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_activated_agenda_score",
    )
  );
}

function bestPlanCompatibleSemanticChoice(
  choices: readonly SemanticRuntimeChoice[],
  mapping: PlanStepMappingResult,
): SemanticRuntimeChoice | undefined {
  const viable = choices.filter((choice) => !choice.exclusion);
  if (viable.length === 0) return undefined;
  const priorityByActionId = tacticalPlanStepPriorityByActionId(mapping);
  const hasStepPriority = viable.some(
    (choice) => (priorityByActionId.get(choice.action.actionId) ?? 0) > 0,
  );
  if (hasStepPriority) {
    return [...viable].sort(
      (left, right) =>
        (priorityByActionId.get(right.action.actionId) ?? 0) -
          (priorityByActionId.get(left.action.actionId) ?? 0) ||
        positiveScoreRank(right.score) - positiveScoreRank(left.score) ||
        right.score - left.score ||
        left.action.actionId.localeCompare(right.action.actionId),
    )[0];
  }
  return [...viable].sort(
    (left, right) =>
      positiveScoreRank(right.score) - positiveScoreRank(left.score) ||
      right.score - left.score ||
      left.action.actionId.localeCompare(right.action.actionId),
  )[0];
}

function tacticalPlanStepPriorityKeepsMappedChoice(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    !mapping.legalActions.some(
      (action) => action.actionId === overrideChoice.action.actionId,
    )
  ) {
    return false;
  }
  const priorityByActionId = tacticalPlanStepPriorityByActionId(mapping);
  const mappedPriority =
    priorityByActionId.get(mappedChoice.action.actionId) ?? 0;
  const overridePriority =
    priorityByActionId.get(overrideChoice.action.actionId) ?? 0;
  return mappedPriority > 0 && mappedPriority > overridePriority;
}

function tacticalPlanStepPriorityByActionId(
  mapping: PlanStepMappingResult,
): ReadonlyMap<string, number> {
  return new Map(
    (mapping.actionPriorities ?? []).map((entry) => [
      entry.actionId,
      entry.priority,
    ]),
  );
}

function tacticalPlanMappingSelectedEvidence(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
): string[] {
  const priority =
    tacticalPlanStepPriorityByActionId(mapping).get(
      mappedChoice.action.actionId,
    ) ?? 0;
  return [
    "tactical_plan_mapping_outcome:plan_mapping_selected",
    ...(priority > 0
      ? [
          "tactical_plan_step_priority_selected:true",
          `tactical_plan_step_priority:${priority}`,
        ]
      : []),
  ];
}

function positiveScoreRank(score: number): number {
  return score > 0 ? 1 : 0;
}

function tacticalPlanRunnerMappingBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  exceptions: {
    repeatedRunShouldYield: boolean;
    nonPositiveProjectedRunShouldYield: boolean;
    acuteHandBufferShouldYield: boolean;
    damageReactionReserveShouldYield: boolean;
    lowValueRecoveryShouldYield: boolean;
    inferiorRunTargetShouldYield: boolean;
    corpBoardTriageMismatchShouldYield: boolean;
    deferredDevelopmentInstallShouldYield: boolean;
    backgroundBankBuildShouldYield: boolean;
    noNeedSearchShouldYield: boolean;
    coverageProbeRunShouldYield: boolean;
    lowValueRunEventShouldYield: boolean;
    urgentRunNowDevelopmentShouldYield: boolean;
  },
): boolean {
  if (mapping.plan.side !== "runner") return false;
  if (!runnerPlanTypeRequiresPlanDominance(mapping.plan.type)) return false;
  if (mappedActionIds.has(overrideChoice.action.actionId)) return false;
  if (exceptions.repeatedRunShouldYield) return false;
  if (exceptions.nonPositiveProjectedRunShouldYield) return false;
  if (exceptions.acuteHandBufferShouldYield) return false;
  if (exceptions.damageReactionReserveShouldYield) return false;
  if (exceptions.lowValueRecoveryShouldYield) return false;
  if (exceptions.inferiorRunTargetShouldYield) return false;
  if (exceptions.corpBoardTriageMismatchShouldYield) return false;
  if (exceptions.deferredDevelopmentInstallShouldYield) return false;
  if (exceptions.backgroundBankBuildShouldYield) return false;
  if (exceptions.noNeedSearchShouldYield) return false;
  if (exceptions.coverageProbeRunShouldYield) return false;
  if (exceptions.lowValueRunEventShouldYield) return false;
  if (exceptions.urgentRunNowDevelopmentShouldYield) return false;
  return !runnerPlanOverrideIsHardInterrupt(
    mapping.plan,
    mappedChoice,
    overrideChoice,
  );
}

function tacticalPlanLowValueRunEventMappingShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    (mapping.plan.type === "runner.develop_hand_card" ||
      mapping.plan.type === "runner.play_best_hand_card") &&
    mappedChoice.action.type === "play_event" &&
    overrideChoice.score > 0 &&
    scoreGap > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_run_target_semantic_guidance" &&
        component.value < 0,
    )
  );
}

function tacticalPlanBackgroundBankBuildShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.build_credit_bank" &&
    mapping.step.kind === "build_bank_counter" &&
    mapping.plan.evidence.includes("runner_bank_concrete_funding_need:false") &&
    overrideChoice.score > 0 &&
    (scoreGap > BACKGROUND_BANK_BUILD_MAX_SCORE_GAP ||
      (semanticRuntimeChoiceIsDamagePressureHandBufferDraw(overrideChoice) &&
        scoreGap > -BACKGROUND_BANK_HAND_BUFFER_MAX_SCORE_DEFICIT &&
        semanticRuntimeChoiceHasScoreComponent(
          mappedChoice,
          "runner_bank_investment_commitment",
        )))
  );
}

function tacticalPlanInferiorRunTargetMappingShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
  threshold: number,
): boolean {
  if (
    mapping.plan.type !== "runner.opportunistic_central_run" ||
    mappedChoice.action.type !== "start_run" ||
    overrideChoice.action.type !== "start_run" ||
    scoreGap <= threshold
  ) {
    return false;
  }
  const mappedServerId = semanticRuntimeServerId(mappedChoice.action);
  const overrideServerId = semanticRuntimeServerId(overrideChoice.action);
  if (
    !mappedServerId ||
    !overrideServerId ||
    mappedServerId === overrideServerId
  ) {
    return false;
  }
  if (
    !mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_visible_ice_path_cost" && component.value < 0,
    )
  ) {
    return false;
  }
  if (mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice)) {
    return false;
  }
  return !(
    semanticRuntimeChoiceHasScoreComponent(
      mappedChoice,
      "runner_rnd_fresh_memory",
    ) ||
    mappedChoice.scoreBreakdown.some(
      (component) => component.key === "runner_rnd_fresh_memory",
    )
  );
}

function tacticalPlanCorpScoreConversionBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  return (
    mapping.plan.side === "corp" &&
    mapping.plan.type === "corp.create_score_window" &&
    (mapping.plan.status === "active" ||
      mapping.plan.status === "progressing") &&
    mapping.plan.evidence.includes(
      "corp_score_conversion_same_turn_guaranteed:true",
    ) &&
    mapping.plan.evidence.includes(
      "corp_score_sequence:same_turn_conversion",
    ) &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

function tacticalPlanCorpEconomyActivationBlocksOffPlanOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  if (
    tacticalPlanCorpBoardTriageMismatchShouldYield(
      mappedChoice,
      overrideChoice,
      overrideChoice.score - mappedChoice.score,
    )
  ) {
    return false;
  }
  if (
    overrideChoice.score > mappedChoice.score &&
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice) !== "none" &&
    semanticRuntimeChoiceStrategicFitLevel(mappedChoice) === "none"
  ) {
    return false;
  }
  return (
    mapping.plan.side === "corp" &&
    (mapping.plan.type === "corp.develop_finite_economy" ||
      mapping.plan.type === "corp.activate_persistent_economy") &&
    (mapping.plan.status === "active" ||
      mapping.plan.status === "progressing") &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

function tacticalPlanCorpScorelineSupportBlocksOffPlanOverride(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
): boolean {
  if (
    tacticalPlanCorpBoardTriageMismatchShouldYield(
      mappedChoice,
      overrideChoice,
      overrideChoice.score - mappedChoice.score,
    )
  ) {
    return false;
  }
  if (
    tacticalPlanBuildRezReserveBurstEconomyShouldYield(
      input,
      mapping,
      mappedChoice,
      overrideChoice,
    )
  ) {
    return false;
  }
  return (
    mapping.plan.side === "corp" &&
    mapping.plan.type === "corp.create_score_window" &&
    mapping.plan.status === "progressing" &&
    (mapping.step.kind === "protect_remote" ||
      mapping.step.kind === "build_rez_reserve") &&
    !mappedActionIds.has(overrideChoice.action.actionId)
  );
}

function tacticalPlanBuildRezReserveBurstEconomyShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    mapping.plan.side !== "corp" ||
    mapping.plan.type !== "corp.create_score_window" ||
    mapping.plan.status !== "progressing" ||
    mapping.step.kind !== "build_rez_reserve" ||
    mappedChoice.action.type !== "gain_credit" ||
    overrideChoice.action.type !== "play_operation" ||
    overrideChoice.score <= mappedChoice.score ||
    input.playerView.own.stackOrRdCount <= 0
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "corp_operation_burst_economy" && component.value > 0,
  );
}

function tacticalPlanDeferredDevelopmentInstallShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mappedChoice.action.type !== "install_card" ||
    mappedChoice.score > 0 ||
    overrideChoice.score <= 0
  ) {
    return false;
  }
  return mappedChoice.scoreBreakdown.some(
    (component) =>
      component.value < 0 &&
      (component.key === "runner_bank_install_commitment" ||
        component.key === "runner_no_run_economy_install_commitment" ||
        (component.key === "runner_persistent_install_fit" &&
          ((component.reason ?? "").includes("duplicate:redundant_duplicate") ||
            (component.reason ?? "").includes("duplicate:useful_backup") ||
            (component.reason ?? "").includes("delta:backup_only")))),
  );
}

function tacticalPlanUrgentRunNowDevelopmentShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    (mappedChoice.action.type !== "gain_credit" &&
      mappedChoice.action.type !== "install_card" &&
      mappedChoice.action.type !== "play_event") ||
    (mappedChoice.action.type === "gain_credit" &&
      !mapping.plan.evidence.includes("hand_development_fit:blocked")) ||
    (mappedChoice.action.type === "gain_credit" &&
      input.playerView.own.clicks <= 1) ||
    mappedChoice.score > 0 ||
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "semantic_strategic_action_fit" &&
        component.value > 0,
    ) ||
    overrideChoice.action.type !== "start_run" ||
    overrideChoice.score <= 0 ||
    scoreGap <= PLAN_MAPPED_CHOICE_MAX_SCORE_GAP
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_goal_fit_tactical_goal_run_target" &&
      component.value > 0 &&
      (component.reason ?? "").includes("urgency:high") &&
      (component.reason ?? "").includes("recommendation:run_now"),
  );
}

function tacticalPlanNoNeedSearchShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    (mapping.plan.type === "runner.develop_hand_card" ||
      mapping.plan.type === "runner.play_best_hand_card") &&
    (mappedChoice.action.type === "play_event" ||
      mappedChoice.action.type === "activated_card_ability") &&
    mappedChoice.score <= 0 &&
    overrideChoice.score > 0 &&
    mappedChoice.scoreBreakdown.some(
      (component) =>
        component.key === "runner_goal_fit_coverage_search_no_need" &&
        component.value < 0,
    )
  );
}

function tacticalPlanMarginalDevelopmentInstallShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  const bankInvestmentOverride = semanticRuntimeChoiceHasScoreComponent(
    overrideChoice,
    "runner_bank_investment_commitment",
  );
  const basicCapacityOverride =
    overrideChoice.action.type === "draw_card" ||
    overrideChoice.action.type === "gain_credit";
  const immediateHandPlayOverride = overrideChoice.action.type === "play_event";
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mappedChoice.action.type !== "install_card" ||
    mappedChoice.score > 700 ||
    (!bankInvestmentOverride &&
      !basicCapacityOverride &&
      !immediateHandPlayOverride) ||
    overrideChoice.score <= 0 ||
    scoreGap <= PLAN_MAPPED_CHOICE_MAX_SCORE_GAP
  ) {
    return false;
  }
  return mappedChoice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_persistent_install_fit" &&
      component.value <= 100 &&
      (bankInvestmentOverride ||
        immediateHandPlayOverride ||
        (component.reason ?? "").includes("delta:cumulative_capacity")),
  );
}

function tacticalPlanDamageReactionReserveShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    mapping.plan.type === "runner.opportunistic_central_run" &&
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(mapping.plan, mappedChoice) &&
    overrideChoice.action.type === "gain_credit" &&
    overrideChoice.score > 0 &&
    scoreGap > 0 &&
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_damage_locked_hand_reaction_reserve",
    )
  );
}

function runnerPlanTypeRequiresPlanDominance(
  type: TacticalPlan["type"],
): boolean {
  return (
    type === "runner.contest_remote" ||
    type === "runner.obtain_breaker_coverage" ||
    type === "runner.opportunistic_central_run" ||
    type === "runner.clear_tags_or_survive" ||
    type === "runner.convert_success_window" ||
    type === "runner.survival_defense" ||
    type === "runner.restore_hand_buffer" ||
    type === "runner.develop_hand_card" ||
    type === "runner.play_best_hand_card" ||
    type === "runner.build_credit_bank" ||
    type === "runner.cash_out_credit_bank"
  );
}

function runnerPlanOverrideIsHardInterrupt(
  mappedPlan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_activated_agenda_score",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_terminal_remote_tool",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_matchpoint_run_lock_release",
    )
  ) {
    return true;
  }
  if (
    semanticRuntimeChoiceHasScoreBreakdownComponent(
      overrideChoice,
      "runner_viable_followup_run_lock_release",
    )
  ) {
    return true;
  }
  if (
    runnerUrgentRemoteContestRunCanInterruptPlan(mappedPlan, overrideChoice)
  ) {
    return true;
  }
  if (
    runnerEconomyCommitmentCanInterruptPlan(mappedPlan.type) &&
    semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_bank_cashout_gate",
      "runner_bank_investment_commitment",
      "runner_no_run_economy_setup_hold",
    ])
  ) {
    return true;
  }
  if (semanticRuntimeChoiceHasAllowedLoanInterrupt(overrideChoice)) {
    return true;
  }
  if (
    acuteHandBufferCanInterruptMappedRun(
      mappedPlan,
      mappedChoice,
      overrideChoice,
    )
  ) {
    return true;
  }
  if (overrideChoice.action.type !== "start_run") return false;
  if (mappedPlan.type === "runner.survival_defense") {
    return semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_hq_known_agenda",
    ]);
  }
  return semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
    "runner_hq_known_agenda",
    "runner_rnd_fresh_memory",
    "runner_goal_fit_tactical_goal_run_target",
  ]);
}

function runnerUrgentRemoteContestRunCanInterruptPlan(
  plan: TacticalPlan,
  choice: SemanticRuntimeChoice,
): boolean {
  if (plan.type !== "runner.contest_remote") {
    return false;
  }
  const planTarget =
    plan.target?.kind === "server" ? plan.target.id : undefined;
  if (
    !planTarget?.startsWith("remote_") ||
    semanticRuntimeServerId(choice.action) !== planTarget
  ) {
    return false;
  }
  const targetMarker = `target:${planTarget}`;
  const urgentGoalFit = choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_goal_fit_tactical_goal_run_target" &&
      (component.reason ?? "").includes(targetMarker) &&
      (component.reason ?? "").includes("urgency:high") &&
      (component.reason ?? "").includes("recommendation:run_now"),
  );
  return urgentGoalFit;
}

function tacticalPlanAcuteHandBufferShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    acuteHandBufferCanInterruptMappedRun(
      mapping.plan,
      mappedChoice,
      overrideChoice,
    ) ||
    (scoreGap > 0 &&
      mappedChoice.action.type === "gain_credit" &&
      semanticRuntimeChoiceIsAcuteHandBufferDraw(overrideChoice))
  );
}

function acuteHandBufferCanInterruptMappedRun(
  plan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    semanticRuntimeChoiceIsAcuteHandBufferDraw(overrideChoice) &&
    semanticRuntimeChoiceIsProjectedRun(mappedChoice) &&
    !mappedPlanHasImmediateVisibleRunPayoff(plan, mappedChoice)
  );
}

function mappedPlanHasImmediateVisibleRunPayoff(
  plan: TacticalPlan,
  mappedChoice: SemanticRuntimeChoice,
): boolean {
  return (
    plan.evidence.includes("runner_run_target_payoff:agenda") ||
    plan.evidence.includes("runner_run_target_payoff:score_threat") ||
    semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
      "runner_hq_known_agenda",
    ])
  );
}

function semanticRuntimeChoiceIsAcuteHandBufferDraw(
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "draw_card") return false;
  const component = choice.scoreBreakdown.find(
    (entry) => entry.key === "runner_hand_buffer_need",
  );
  if (!component) return false;
  const handMatch = /(?:^|\|)hand:(\d+)(?:\||$)/.exec(component.reason ?? "");
  return handMatch !== null && Number(handMatch[1] ?? Number.NaN) <= 2;
}

function semanticRuntimeChoiceIsDamagePressureHandBufferDraw(
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "draw_card") return false;
  return choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_hand_buffer_need" &&
      component.value > 0 &&
      (component.reason ?? "").includes("damage_pressure:true"),
  );
}

function semanticRuntimeChoiceHasPositiveDevelopmentCommitment(
  choice: SemanticRuntimeChoice | undefined,
): boolean {
  if (!choice) return false;
  return choice.scoreBreakdown.some(
    (component) =>
      component.value > 0 &&
      [
        "runner_bank_investment_commitment",
        "runner_no_run_economy_setup_hold",
      ].includes(component.key),
  );
}

function semanticRuntimeChoiceHasAllowedLoanInterrupt(
  choice: SemanticRuntimeChoice,
): boolean {
  return choice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_loan_liability_assessment" &&
      typeof component.reason === "string" &&
      component.reason.includes("why_loan_allowed_despite_risk:"),
  );
}

function runnerEconomyCommitmentCanInterruptPlan(
  type: TacticalPlan["type"],
): boolean {
  return (
    type === "runner.opportunistic_central_run" ||
    type === "runner.build_credit_base"
  );
}

function tacticalPlanHandBufferMappingBlocksProbeRunOverride(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    (mapping.plan.type === "runner.restore_hand_buffer" ||
      mapping.plan.type === "runner.survival_defense") &&
    overrideChoice.action.type === "start_run" &&
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice) === "none" &&
    scoreGap <= 1800
  );
}

function tacticalPlanRepeatedRunMappingShouldYield(
  input: AiDecisionInput,
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (scoreGap <= 0) return false;
  if (mappedChoice.action.type !== "start_run") return false;
  const serverId = semanticRuntimeServerId(mappedChoice.action);
  if (!serverId) return false;
  if (semanticRuntimeRecentRunnerStartRunsOnServer(input, serverId) <= 0) {
    return false;
  }
  if (overrideChoice.action.type !== "start_run") return true;
  if (
    mapping.plan.type !== "runner.opportunistic_central_run" ||
    mappedChoice.score >= 0 ||
    overrideChoice.score <= 0 ||
    mapping.plan.evidence.includes("runner_run_target_payoff:score_threat") ||
    semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
      "runner_hq_known_agenda",
      "runner_rnd_fresh_memory",
    ])
  ) {
    return false;
  }
  const overrideServerId = semanticRuntimeServerId(overrideChoice.action);
  return Boolean(overrideServerId && overrideServerId !== serverId);
}

function tacticalPlanNonPositiveProjectedRunShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (
    mapping.plan.side !== "runner" ||
    !semanticRuntimeChoiceIsProjectedRun(mappedChoice) ||
    mappedChoice.score > 0 ||
    overrideChoice.score <= 0
  ) {
    return false;
  }
  if (mapping.plan.evidence.includes("runner_run_target_payoff:score_threat")) {
    return false;
  }
  return !semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
    "runner_hq_known_agenda",
    "runner_rnd_fresh_memory",
    "runner_goal_fit_tactical_goal_run_target",
  ]);
}

function semanticRuntimeChoiceIsProjectedRun(
  choice: SemanticRuntimeChoice,
): boolean {
  const runScoreKeys = new Set([
    "runner_run_target_semantic_guidance",
    "runner_known_ice_path_no_access",
    "runner_visible_ice_path_cost",
  ]);
  return (
    choice.action.type === "start_run" ||
    choice.scoreBreakdown.some((component) =>
      runScoreKeys.has(component.key),
    ) ||
    semanticRuntimeChoiceHasAnyScoreComponent(choice, [
      "runner_run_target_semantic_guidance",
      "runner_known_ice_path_no_access",
      "runner_visible_ice_path_cost",
    ])
  );
}

function tacticalPlanLowValueRecoveryMappingShouldYield(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (scoreGap <= 0 || overrideChoice.score <= 0) return false;
  if (
    overrideChoice.action.type === "gain_credit" ||
    overrideChoice.action.type === "draw_card"
  )
    return false;
  return semanticRuntimeChoiceHasAnyScoreComponent(mappedChoice, [
    "runner_low_value_recovery_repeat",
    "runner_late_no_funding_credit_repeat",
    "runner_basic_setup_over_ready_pressure",
  ]);
}

function tacticalPlanRemoteContestMappingBlocksRunOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (mapping.plan.type !== "runner.contest_remote") return false;
  if (overrideChoice.action.type !== "start_run") return false;
  if (mappedChoice.score < -2200) return false;
  const planTarget =
    mapping.plan.target?.kind === "server" ? mapping.plan.target.id : undefined;
  if (!planTarget?.startsWith("remote_")) return false;
  const overrideTarget = semanticRuntimeServerId(overrideChoice.action);
  if (!overrideTarget || overrideTarget === planTarget) return false;
  if (
    !mapping.plan.evidence.includes("runner_run_target_payoff:score_threat")
  ) {
    return false;
  }
  return scoreGap <= 3000;
}

function tacticalPlanNonPositiveMappingStillProtected(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  if (mappedChoice.score < -500) return false;
  if (semanticRuntimeChoiceIsProjectedRun(mappedChoice)) return false;
  if (
    (mapping.plan.type !== "runner.develop_hand_card" &&
      mapping.plan.type !== "runner.play_best_hand_card") ||
    mapping.step.kind !== "install_development_card" ||
    mapping.plan.priority < 900 ||
    overrideChoice.action.type !== "gain_credit"
  ) {
    return false;
  }
  const route = mapping.plan.evidence.find((entry) =>
    entry.startsWith("economy_route:"),
  );
  return Boolean(
    route &&
    route !== "economy_route:unknown" &&
    route !== "economy_route:basic_credit_fallback",
  );
}

export function tacticalPlanMappingOverrideEvidence(
  result: TacticalPlanMappedChoiceResult,
): string[] {
  const mappedChoice = result.overriddenMappedChoice;
  if (!mappedChoice) return [];
  return [
    "tactical_plan_mapping_outcome:semantic_choice_selected",
    "tactical_plan_semantic_choice_selected:true",
    `tactical_plan_semantic_choice_reason:${result.overrideReason ?? "semantic_score_gap"}`,
    `tactical_plan_mapping_score_gap:${result.scoreGap ?? 0}`,
    ...(result.overrideThreshold !== undefined
      ? [
          `tactical_plan_mapping_score_gap_threshold:${result.overrideThreshold}`,
        ]
      : []),
  ];
}

export function tacticalPlanRuntimeAlignedToChoice(
  result: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice | undefined,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): TacticalPlanRuntimeResult {
  if (!choice) return tacticalPlanRuntimeWithoutSelectedMapping(result);
  const mapping = tacticalPlanMappingForChoice(
    result,
    choice,
    candidates,
    input,
  );
  if (!mapping) return tacticalPlanRuntimeWithoutSelectedMapping(result);
  return {
    ...result,
    selectedPlan: mapping.plan,
    selectedStep: mapping.step,
    selectedMapping: mapping,
  };
}

function tacticalPlanBlocksSemanticChoice(
  planRuntime: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice,
): boolean {
  if (choice.action.type !== "start_run") return false;
  const serverId = semanticRuntimeServerId(choice.action);
  if (!serverId) return false;
  return planRuntime.planAlternatives.some(
    (plan) =>
      (plan.status === "abandoned" ||
        plan.status === "blocked" ||
        plan.status === "failed" ||
        plan.status === "expired") &&
      plan.target?.kind === "server" &&
      plan.target.id === serverId,
  );
}

function tacticalPlanCoverageMappingBlocksRunOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  mappedActionIds: ReadonlySet<string>,
  scoreGap: number,
  threshold: number,
): boolean {
  if (coveragePlanRunOverrideHasUrgentPayoff(mapping, overrideChoice)) {
    return false;
  }
  if (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId) &&
    mappedChoice.action.type !== "gain_credit" &&
    mappedChoice.action.type !== "draw_card"
  ) {
    return mappedChoice.score > 0;
  }
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    !mappedActionIds.has(overrideChoice.action.actionId) &&
    scoreGap <= threshold
  );
}

function tacticalPlanCoverageProbeRunShouldYield(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  if (
    mapping.plan.type !== "runner.obtain_breaker_coverage" ||
    overrideChoice.action.type !== "start_run" ||
    mappedChoice.action.type !== "install_card" ||
    overrideChoice.score <= 0 ||
    scoreGap < 200 ||
    !semanticRuntimeChoiceHasScoreComponent(
      overrideChoice,
      "runner_free_server_path",
    )
  ) {
    return false;
  }
  return overrideChoice.scoreBreakdown.some(
    (component) =>
      component.key === "runner_run_target_semantic_guidance" &&
      (component.reason ?? "").includes("recommendation:run_if_free") &&
      (component.reason ?? "").includes("payoff:unknown") &&
      (component.reason ?? "").includes("path:reachable") &&
      (component.reason ?? "").includes(
        "unavoidable_visible_ice_hazard_count:0",
      ),
  );
}

function coveragePlanRunOverrideHasUrgentPayoff(
  mapping: PlanStepMappingResult,
  overrideChoice: SemanticRuntimeChoice,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    overrideChoice.action.type === "start_run" &&
    semanticRuntimeChoiceHasAnyScoreComponent(overrideChoice, [
      "runner_hq_known_agenda",
      "runner_rnd_fresh_memory",
      "runner_goal_fit_tactical_goal_run_target",
    ])
  );
}

function tacticalPlanCoverageMappingBlocksEconomyOverride(
  mapping: PlanStepMappingResult,
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
  threshold: number,
): boolean {
  return (
    mapping.plan.type === "runner.obtain_breaker_coverage" &&
    mappedChoice.action.type === "draw_card" &&
    overrideChoice.action.type === "gain_credit" &&
    scoreGap <= Math.max(threshold, 900)
  );
}

function tacticalPlanOverrideScoreGapThreshold(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
): { scoreGap: number; reason: string } {
  const mappedStrategic = semanticRuntimeChoiceStrategicFitLevel(mappedChoice);
  const overrideStrategic =
    semanticRuntimeChoiceStrategicFitLevel(overrideChoice);
  if (overrideStrategic !== "none" && mappedStrategic === "none") {
    return {
      scoreGap:
        overrideStrategic === "exact"
          ? STRATEGIC_EXACT_OVERRIDE_SCORE_GAP
          : STRATEGIC_KIND_OVERRIDE_SCORE_GAP,
      reason:
        overrideStrategic === "exact"
          ? "strategic_exact_score_gap"
          : "strategic_kind_score_gap",
    };
  }
  if (mappedStrategic !== "none" && overrideStrategic === "none") {
    return {
      scoreGap:
        mappedStrategic === "exact"
          ? STRATEGIC_EXACT_MAPPING_PROTECTION_SCORE_GAP
          : STRATEGIC_KIND_MAPPING_PROTECTION_SCORE_GAP,
      reason:
        mappedStrategic === "exact"
          ? "strategic_exact_mapping_protected"
          : "strategic_kind_mapping_protected",
    };
  }
  return {
    scoreGap: PLAN_MAPPED_CHOICE_MAX_SCORE_GAP,
    reason: "semantic_score_gap",
  };
}

function semanticRuntimeChoiceStrategicFitLevel(
  choice: SemanticRuntimeChoice,
): "exact" | "kind" | "generic" | "none" {
  if (
    !choice.evidence.some((entry) =>
      entry.startsWith("semantic_strategic_action_fit:true"),
    )
  ) {
    return "none";
  }
  const targetMatch = choice.evidence.find((entry) =>
    entry.startsWith("strategic_action_fit_target_match:"),
  );
  if (targetMatch === "strategic_action_fit_target_match:exact") return "exact";
  if (targetMatch === "strategic_action_fit_target_match:kind") return "kind";
  return "generic";
}

function tacticalPlanBlockedOverrideResult(params: {
  mappedChoice: SemanticRuntimeChoice;
  overrideChoice: SemanticRuntimeChoice;
  reason: string;
  scoreGap: number;
  threshold: number;
}): TacticalPlanMappedChoiceResult {
  return {
    outcome: "semantic_choice_blocked",
    choice: semanticRuntimeChoiceWithAddedEvidence(params.mappedChoice, [
      "tactical_plan_mapping_outcome:semantic_choice_blocked",
      "tactical_plan_mapping_override_blocked:true",
      `tactical_plan_override_blocked_reason:${params.reason}`,
      `tactical_plan_mapping_score_gap:${params.scoreGap}`,
      `tactical_plan_mapping_score_gap_threshold:${params.threshold}`,
    ]),
    overrideBlockedChoice: params.overrideChoice,
    overrideBlockedReason: params.reason,
    overrideThreshold: params.threshold,
    scoreGap: params.scoreGap,
  };
}

function semanticRuntimeChoiceWithAddedEvidence(
  choice: SemanticRuntimeChoice,
  evidence: readonly string[],
): SemanticRuntimeChoice {
  return {
    ...choice,
    evidence: [...choice.evidence, ...evidence],
  };
}

function tacticalPlanMappingForChoice(
  result: TacticalPlanRuntimeResult,
  choice: SemanticRuntimeChoice,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): PlanStepMappingResult | undefined {
  for (const plan of result.planAlternatives) {
    if (!tacticalPlanCanMapToCurrentAction(plan)) continue;
    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      input,
    );
    if (
      mapping.status === "matched" &&
      mapping.legalActions.some(
        (action) => action.actionId === choice.action.actionId,
      )
    ) {
      return mapping;
    }
  }
  return undefined;
}

function tacticalPlanCanMapToCurrentAction(plan: TacticalPlan): boolean {
  return (
    plan.status !== "abandoned" &&
    plan.status !== "expired" &&
    plan.status !== "failed" &&
    plan.status !== "satisfied"
  );
}

function tacticalPlanRuntimeWithoutSelectedMapping(
  result: TacticalPlanRuntimeResult,
): TacticalPlanRuntimeResult {
  const {
    selectedPlan: _selectedPlan,
    selectedStep: _selectedStep,
    selectedMapping: _selectedMapping,
    ...rest
  } = result;
  return rest;
}

function semanticRuntimeRecentRunnerStartRunsOnServer(
  input: AiDecisionInput,
  serverId: string,
): number {
  let count = 0;
  const history = mergedAiPublicHistory(input);
  let seenRunnerActions = 0;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    const actor =
      typeof event.publicPayload.actor === "string"
        ? event.publicPayload.actor
        : undefined;
    if (input.playerView.stateVersion - aiEventVersion(event) > 18) break;
    if (semanticRuntimeRunnerRunProgressEvent(actionType, actor)) break;
    if (actor !== "runner" || actionType !== "start_run") continue;
    seenRunnerActions += 1;
    const target = aiServerIdFromEvent(event);
    if (target === serverId) count += 1;
    if (seenRunnerActions >= 8) break;
  }
  return count;
}

function tacticalPlanCorpBoardTriageMismatchShouldYield(
  mappedChoice: SemanticRuntimeChoice,
  overrideChoice: SemanticRuntimeChoice,
  scoreGap: number,
): boolean {
  return (
    scoreGap > 0 &&
    ((semanticRuntimeChoiceHasScoreComponent(
      mappedChoice,
      "corp_board_triage_mismatch",
    ) &&
      !semanticRuntimeChoiceHasScoreComponent(
        overrideChoice,
        "corp_board_triage_mismatch",
      )) ||
      (semanticRuntimeChoiceHasScoreComponent(
        overrideChoice,
        "corp_board_triage_alignment",
      ) &&
        !semanticRuntimeChoiceHasScoreComponent(
          mappedChoice,
          "corp_board_triage_alignment",
        )))
  );
}

function semanticRuntimeChoiceHasScoreComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.evidence.includes(`semantic_score_component:${key}`);
}

function semanticRuntimeChoiceHasScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.scoreBreakdown.some((component) => component.key === key);
}

function semanticRuntimeChoiceHasAnyScoreComponent(
  choice: SemanticRuntimeChoice,
  keys: readonly string[],
): boolean {
  return keys.some((key) =>
    semanticRuntimeChoiceHasScoreComponent(choice, key),
  );
}

function mergedAiPublicHistory(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    byId.set(event.eventId, event);
  }
  return [...byId.values()].sort(
    (left, right) => aiEventVersion(left) - aiEventVersion(right),
  );
}

function semanticRuntimeRunnerRunProgressEvent(
  actionType: string,
  actor?: string,
): boolean {
  return (
    (actor === "runner" &&
      (actionType === "steal_agenda" ||
        actionType === "trash_accessed_card" ||
        actionType === "install_card")) ||
    actionType === "score_agenda"
  );
}

function aiServerIdFromEvent(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload;
  if (typeof payload.serverId === "string") return payload.serverId;
  if (typeof payload.server === "string") return payload.server;
  if (typeof payload.targetServerId === "string") return payload.targetServerId;
  if (typeof payload.attackedServerId === "string")
    return payload.attackedServerId;
  return undefined;
}

function aiEventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : 0;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
