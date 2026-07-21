import type { AiDecisionInput } from "@netgrid/shared";
import {
  type PlanStepMappingResult,
  type TacticalPlanRuntimeResult,
} from "../../tactical-plans";
import type {
  SemanticRuntimeChoice,
  TacticalPlanMappedChoiceResult,
} from "../semantic-runtime-types";
import {
  tacticalPlanCorpEconomyActivationBlocksOffPlanOverride,
  tacticalPlanCorpStrategyReserveBlocksNegativeOverride,
  tacticalPlanCorpScoreConversionBlocksOffPlanOverride,
  tacticalPlanCorpScorelineSupportBlocksOffPlanOverride,
  tacticalPlanSoftFundingShouldYieldToFiniteEconomy,
} from "./corp-plan-overrides";
import { initialMappedChoiceOverride } from "./mapped-choice-initial-overrides";
import {
  bestPlanCompatibleSemanticChoice,
  tacticalPlanBackgroundBankBuildShouldYield,
  tacticalPlanCommittedBankBuildShouldYield,
  tacticalPlanFundedDevelopmentContinuationBlocksOverride,
  tacticalPlanInferiorRunTargetMappingShouldYield,
  tacticalPlanLowValueRunEventMappingShouldYield,
  tacticalPlanMappingSelectedEvidence,
  tacticalPlanRunnerMappingBlocksOffPlanOverride,
  tacticalPlanStepPriorityKeepsMappedChoice,
} from "./mapped-choice-policies";
import {
  tacticalPlanAcuteHandBufferShouldYield,
  tacticalPlanDamageReactionReserveShouldYield,
  tacticalPlanDeferredDevelopmentInstallShouldYield,
  tacticalPlanHardInterruptShouldYield,
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
} from "./runner-plan-overrides";
import {
  roundScore,
  semanticRuntimeChoiceWithAddedEvidence,
  tacticalPlanBlockedOverrideResult,
  tacticalPlanBlocksSemanticChoice,
  tacticalPlanCorpBoardTriageMismatchShouldYield,
  tacticalPlanCoverageMappingBlocksEconomyOverride,
  tacticalPlanCoverageMappingBlocksRunOverride,
  tacticalPlanCoverageProbeRunShouldYield,
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanOverrideReason,
  tacticalPlanOverrideScoreGapThreshold,
} from "./semantic-choice-ranking-support";

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
  const initialOverride = initialMappedChoiceOverride(
    input,
    choices,
    mapping,
    mappedChoice,
    overrideChoice,
  );
  if (initialOverride.terminalResult) return initialOverride.terminalResult;
  overrideChoice = initialOverride.overrideChoice;
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
        mappedChoice,
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
        mappedChoice,
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
    if (
      tacticalPlanCorpStrategyReserveBlocksNegativeOverride(
        mapping,
        mappedChoice,
        overrideChoice,
        mappedActionIds,
      )
    ) {
      return tacticalPlanBlockedOverrideResult({
        mappedChoice,
        overrideChoice,
        reason: "corp_strategy_reserve_plan_controller",
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
        mapping,
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
    const softFundingShouldYieldToFiniteEconomy =
      tacticalPlanSoftFundingShouldYieldToFiniteEconomy(
        mapping,
        mappedChoice,
        overrideChoice,
      );
    const backgroundBankBuildShouldYield =
      tacticalPlanBackgroundBankBuildShouldYield(
        mapping,
        mappedChoice,
        overrideChoice,
        scoreGap,
      );
    const committedBankBuildShouldYield =
      tacticalPlanCommittedBankBuildShouldYield(
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
    const hardInterruptShouldYield = tacticalPlanHardInterruptShouldYield(
      mapping,
      overrideChoice,
    );
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
          committedBankBuildShouldYield,
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
      softFundingShouldYieldToFiniteEconomy ||
      backgroundBankBuildShouldYield ||
      committedBankBuildShouldYield ||
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
        overrideReason: tacticalPlanOverrideReason({
          urgentRunNowDevelopmentShouldYield,
          unconvertibleFundingShouldYieldToBank,
          urgentCoverageSearchInstallShouldYield,
          noNeedSearchShouldYield,
          coverageProbeRunShouldYield,
          lowValueRunEventShouldYield,
          mappedNonPositiveAgainstPositive,
          deferredDevelopmentInstallShouldYield,
          repeatedRunShouldYield,
          acuteHandBufferShouldYield,
          damageReactionReserveShouldYield,
          lowValueRecoveryShouldYield,
          inferiorRunTargetShouldYield,
          corpBoardTriageMismatchShouldYield,
          softFundingShouldYieldToFiniteEconomy,
          backgroundBankBuildShouldYield,
          committedBankBuildShouldYield,
          hardInterruptShouldYield,
          thresholdReason: threshold.reason,
        }),
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
