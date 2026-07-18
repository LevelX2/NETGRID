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
  semanticRuntimeChoiceHasPositiveDevelopmentCommitment,
  semanticRuntimeChoiceIsAcuteHandBufferDraw,
  semanticRuntimeChoiceIsDamagePressureHandBufferDraw,
  semanticRuntimeChoiceIsProjectedRun,
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
  tacticalPlanOverrideReason,
  tacticalPlanOverrideScoreGapThreshold,
} from "./choice-ranking/semantic-choice-ranking-support";

export {
  tacticalPlanMappingOverrideEvidence,
  tacticalPlanRuntimeAlignedToChoice,
} from "./choice-ranking/semantic-choice-ranking-support";

const CORP_ACTIVE_REMOTE_ADVANCE_RUNNER_CREDIT_CEILING = 20;

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
  const urgentCorpChoice = urgentCorpSemanticChoice(input, choices);
  if (
    urgentCorpChoice &&
    urgentCorpChoice.action.actionId !== mappedChoice.action.actionId
  ) {
    const reason =
      urgentCorpChoice.action.type === "score_agenda"
        ? "corp_scoreable_agenda_controller"
        : semanticRuntimeChoiceHasScoreBreakdownComponent(
              urgentCorpChoice,
              "corp_matchpoint_hq_protection_alignment",
            )
          ? "corp_matchpoint_central_protection_controller"
          : "corp_active_remote_agenda_advance_controller";
    const scoreGap = roundScore(urgentCorpChoice.score - mappedChoice.score);
    return {
      outcome: "semantic_choice_selected",
      choice: semanticRuntimeChoiceWithAddedEvidence(urgentCorpChoice, [
        "tactical_plan_mapping_outcome:semantic_choice_selected",
        `tactical_plan_mapping_override_reason:${reason}`,
        `tactical_plan_mapping_score_gap:${scoreGap}`,
      ]),
      overrideChoice: urgentCorpChoice,
      overriddenMappedChoice: mappedChoice,
      overrideReason: reason,
      overrideThreshold: Number.NEGATIVE_INFINITY,
      scoreGap,
    };
  }
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
          backgroundBankBuildShouldYield,
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

function urgentCorpSemanticChoice(
  input: AiDecisionInput,
  choices: readonly SemanticRuntimeChoice[],
): SemanticRuntimeChoice | undefined {
  if (input.side !== "corp") return undefined;
  const viableChoices = choices.filter((choice) => !choice.exclusion);
  const scoreableAgenda = viableChoices
    .filter((choice) => choice.action.type === "score_agenda")
    .sort((left, right) => right.score - left.score)[0];
  if (scoreableAgenda) return scoreableAgenda;
  const matchpointProtection = viableChoices
    .filter(
      (choice) =>
        semanticRuntimeChoiceHasPositiveScoreBreakdownComponent(
          choice,
          "corp_matchpoint_hq_protection_alignment",
        ) &&
        !semanticRuntimeChoiceHasScoreBreakdownComponent(
          choice,
          "corp_matchpoint_hq_protection_mismatch",
        ),
    )
    .sort((left, right) => right.score - left.score)[0];
  if (matchpointProtection) return matchpointProtection;

  const visibleRunnerCredits = input.playerView.opponent?.credits ?? 0;
  if (
    visibleRunnerCredits >=
    CORP_ACTIVE_REMOTE_ADVANCE_RUNNER_CREDIT_CEILING
  ) {
    return undefined;
  }

  return viableChoices
    .filter(
      (choice) =>
        choice.action.type === "advance_card" &&
        choice.scoreBreakdown.some(
          (component) =>
            component.key === "corp_active_remote_agenda_advance_clock" &&
            component.value > 0 &&
            component.reason?.includes(
              "runner_cannot_contest_before_score:true",
            ) === true,
        ) &&
        !semanticRuntimeChoiceHasAnyScoreBreakdownComponent(choice, [
          "corp_active_remote_agenda_unsafe_advance",
          "corp_active_remote_agenda_underfunded_advance",
          "corp_contestable_remote_score_penalty",
          "corp_board_triage_mismatch",
        ]),
    )
    .sort((left, right) => right.score - left.score)[0];
}

function semanticRuntimeChoiceHasPositiveScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  key: string,
): boolean {
  return choice.scoreBreakdown.some(
    (component) => component.key === key && component.value > 0,
  );
}

function semanticRuntimeChoiceHasAnyScoreBreakdownComponent(
  choice: SemanticRuntimeChoice,
  keys: readonly string[],
): boolean {
  return keys.some((key) =>
    semanticRuntimeChoiceHasScoreBreakdownComponent(choice, key),
  );
}
