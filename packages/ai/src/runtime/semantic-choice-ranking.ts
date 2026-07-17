import type { AiDecisionInput } from "@netgrid/shared";
import {
  type PlanStepMappingResult,
  type TacticalPlanRuntimeResult,
} from "../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "./semantic-runtime-types";
import {
  tacticalPlanCorpEconomyActivationBlocksOffPlanOverride,
  tacticalPlanCorpScoreConversionBlocksOffPlanOverride,
  tacticalPlanCorpScorelineSupportBlocksOffPlanOverride,
} from "./choice-ranking/corp-plan-overrides";
import {
  bestPlanCompatibleSemanticChoice,
  tacticalPlanBackgroundBankBuildShouldYield,
  tacticalPlanFundedDevelopmentContinuationBlocksOverride,
  tacticalPlanInferiorRunTargetMappingShouldYield,
  tacticalPlanLowValueRunEventMappingShouldYield,
  tacticalPlanMappingSelectedEvidence,
  tacticalPlanRunnerMappingBlocksOffPlanOverride,
  tacticalPlanStepPriorityKeepsMappedChoice,
} from "./choice-ranking/mapped-choice-policies";
import {
  mappedPlanHasImmediateVisibleRunPayoff,
  runnerUrgentRemoteContestRunCanInterruptPlan,
  semanticRuntimeChoiceHasPositiveDevelopmentCommitment,
  semanticRuntimeChoiceIsAcuteHandBufferDraw,
  semanticRuntimeChoiceIsDamagePressureHandBufferDraw,
  semanticRuntimeChoiceIsProjectedRun,
  tacticalPlanAcuteHandBufferShouldYield,
  tacticalPlanDamageReactionReserveShouldYield,
  tacticalPlanDeferredDevelopmentInstallShouldYield,
  tacticalPlanHandBufferMappingBlocksProbeRunOverride,
  tacticalPlanLowValueRecoveryMappingShouldYield,
  tacticalPlanMarginalDevelopmentInstallShouldYield,
  tacticalPlanNoNeedSearchShouldYield,
  tacticalPlanNonPositiveMappingStillProtected,
  tacticalPlanNonPositiveProjectedRunShouldYield,
  tacticalPlanRemoteContestMappingBlocksRunOverride,
  tacticalPlanRepeatedRunMappingShouldYield,
  tacticalPlanUrgentRunNowDevelopmentShouldYield,
  tacticalPlanUnconvertibleFundingShouldYieldToBank,
  tacticalPlanUrgentCoverageSearchInstallShouldYield,
} from "./choice-ranking/runner-plan-overrides";
import {
  roundScore,
  semanticRuntimeChoiceHasScoreBreakdownComponent,
  semanticRuntimeChoiceStrategicFitLevel,
  semanticRuntimeChoiceWithAddedEvidence,
  tacticalPlanBlockedOverrideResult,
  tacticalPlanBlocksSemanticChoice,
  tacticalPlanCorpBoardTriageMismatchShouldYield,
  tacticalPlanCoverageMappingBlocksEconomyOverride,
  tacticalPlanCoverageMappingBlocksRunOverride,
  tacticalPlanCoverageProbeRunShouldYield,
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanOverrideScoreGapThreshold,
} from "./choice-ranking/semantic-choice-ranking-support";

export {
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanRuntimeAlignedToChoice,
} from "./choice-ranking/semantic-choice-ranking-support";

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
    const unconvertibleFundingShouldYieldToBank =
      tacticalPlanUnconvertibleFundingShouldYieldToBank(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const urgentCoverageSearchInstallShouldYield =
      tacticalPlanUrgentCoverageSearchInstallShouldYield(
        mapping,
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
          unconvertibleFundingShouldYieldToBank,
          urgentCoverageSearchInstallShouldYield,
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
      deferredDevelopmentInstallShouldYield ||
      hardInterruptShouldYield ||
      noNeedSearchShouldYield ||
      coverageProbeRunShouldYield ||
      lowValueRunEventShouldYield ||
      urgentRunNowDevelopmentShouldYield ||
      unconvertibleFundingShouldYieldToBank ||
      urgentCoverageSearchInstallShouldYield ||
      scoreGap > threshold.scoreGap
    ) {
      const result = {
        outcome: "semantic_choice_selected" as const,
        overrideChoice,
        overriddenMappedChoice: mappedChoice,
        overrideReason: urgentRunNowDevelopmentShouldYield
          ? "urgent_run_now_development_yield"
          : unconvertibleFundingShouldYieldToBank
            ? "unconvertible_funding_bank_yield"
            : urgentCoverageSearchInstallShouldYield
              ? "urgent_coverage_search_install_yield"
              : noNeedSearchShouldYield
                ? "no_need_search_mapping_yield"
                : coverageProbeRunShouldYield
                  ? "coverage_probe_run_mapping_yield"
                  : lowValueRunEventShouldYield
                    ? "low_value_run_event_mapping_yield"
                    : mappedNonPositiveAgainstPositive
                      ? "mapped_nonpositive_against_positive"
                      : deferredDevelopmentInstallShouldYield
                        ? "deferred_development_mapping_yield"
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
