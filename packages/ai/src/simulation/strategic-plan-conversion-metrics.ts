import type { Side } from "@netgrid/shared";
import { hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  corpAdvanceConvertsToScoreOrProtectedWindow,
  corpEconomyConvertsToRezInstallScore,
  corpProtectionConvertsToScoreSafety,
  corpRemoteBuildConvertsToAdvanceProtectOrScore,
  isStrategicPlanDecision,
  planKindForConversion,
  runnerCentralPressureConvertsToStealOrFreshValue,
  runnerEconomyConvertsToRunOrRig,
  runnerProbeConvertsToUsefulInfoOrPivot,
  runnerRemoteContestConvertsToStealTrashOrAbort,
  runnerRigConvertsToRun,
  strategicPlanConvertsWithinOwnDecisions,
} from "./plan-conversion-predicates";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function summarizeStrategicPlanConversionMetrics(
  summaries: AiSimulationSummary[],
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
  isCorpRemoteAdvancementProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): Pick<
  AiMatchProgressionMetrics,
  | "strategicNoProgressActionChainLength"
  | "strategicLongestNoProgressChain"
  | "microActionNoProgressContribution"
  | "planContinuationOpportunities"
  | "planContinuationTaken"
  | "planContinuationRate"
  | "planAbortOpportunities"
  | "planAbortTaken"
  | "planAbortWithReason"
  | "planIntentConvertedWithin1OwnDecision"
  | "planIntentConvertedWithin2OwnDecisions"
  | "planIntentConvertedWithin3OwnDecisions"
  | "planIntentExpired"
  | "planIntentAbandonedWithoutReason"
  | "sameStrategicPlanRepeatedWithoutProgress"
  | "runnerEconomyConvertedToRunOrRig"
  | "runnerRigConvertedToRun"
  | "runnerProbeConvertedToUsefulInfoOrPivot"
  | "runnerCentralPressureConvertedToStealOrFreshValue"
  | "runnerRemoteContestConvertedToStealTrashOrCorrectAbort"
  | "corpRemoteBuildConvertedToAdvanceProtectOrScore"
  | "corpAdvanceConvertedToScoreOrProtectedWindow"
  | "corpEconomyConvertedToRezInstallScore"
  | "corpProtectionConvertedToScoreSafety"
> {
  let strategicLongestNoProgressChain = 0;
  let microActionNoProgressContribution = 0;
  let planContinuationOpportunities = 0;
  let planContinuationTaken = 0;
  let planAbortOpportunities = 0;
  let planAbortTaken = 0;
  let planAbortWithReason = 0;
  let planIntentConvertedWithin1OwnDecision = 0;
  let planIntentConvertedWithin2OwnDecisions = 0;
  let planIntentConvertedWithin3OwnDecisions = 0;
  let planIntentExpired = 0;
  let planIntentAbandonedWithoutReason = 0;
  let sameStrategicPlanRepeatedWithoutProgress = 0;
  let runnerEconomyConvertedToRunOrRig = 0;
  let runnerRigConvertedToRun = 0;
  let runnerProbeConvertedToUsefulInfoOrPivot = 0;
  let runnerCentralPressureConvertedToStealOrFreshValue = 0;
  let runnerRemoteContestConvertedToStealTrashOrCorrectAbort = 0;
  let corpRemoteBuildConvertedToAdvanceProtectOrScore = 0;
  let corpAdvanceConvertedToScoreOrProtectedWindow = 0;
  let corpEconomyConvertedToRezInstallScore = 0;
  let corpProtectionConvertedToScoreSafety = 0;
  const strategicChains: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    let strategicChain = 0;
    for (const entry of sequence) {
      const hasProgress = isMeaningfulBoardProgress(entry);
      if (!isStrategicPlanDecision(entry)) {
        if (!hasProgress) microActionNoProgressContribution += 1;
        continue;
      }
      if (hasProgress) {
        if (strategicChain > 0) strategicChains.push(strategicChain);
        strategicLongestNoProgressChain = Math.max(
          strategicLongestNoProgressChain,
          strategicChain,
        );
        strategicChain = 0;
      } else {
        strategicChain += 1;
      }
      if (hasEvidenceFlag(entry, "plan_continuation_opportunity:true"))
        planContinuationOpportunities += 1;
      if (hasEvidenceFlag(entry, "plan_continuation_taken:true"))
        planContinuationTaken += 1;
      if (hasEvidenceFlag(entry, "plan_abort_opportunity:true"))
        planAbortOpportunities += 1;
      if (hasEvidenceFlag(entry, "plan_abort_taken:true")) planAbortTaken += 1;
      if (
        hasEvidenceFlag(entry, "plan_abort_taken:true") &&
        entry.evidence.some((value) => value.startsWith("plan_abort_reason:"))
      )
        planAbortWithReason += 1;
      if (hasEvidenceFlag(entry, "plan_intent_expired:true"))
        planIntentExpired += 1;
    }
    if (strategicChain > 0) {
      strategicChains.push(strategicChain);
      strategicLongestNoProgressChain = Math.max(
        strategicLongestNoProgressChain,
        strategicChain,
      );
    }

    const strategicEntries = sequence.filter(isStrategicPlanDecision);
    const lastPlanBySide: Partial<
      Record<Side, { planKind: string; progressSince: boolean }>
    > = {};
    strategicEntries.forEach((entry, index) => {
      const planKind = planKindForConversion(entry);
      if (!planKind) return;
      const lastPlan = lastPlanBySide[entry.side];
      if (lastPlan?.planKind === planKind && !lastPlan.progressSince) {
        sameStrategicPlanRepeatedWithoutProgress += 1;
      }
      const planConvertsWithinOwnDecisions = (ownDecisions: number) =>
        strategicPlanConvertsWithinOwnDecisions(
          strategicEntries,
          index,
          ownDecisions,
          isMeaningfulBoardProgress,
        );
      if (planConvertsWithinOwnDecisions(1))
        planIntentConvertedWithin1OwnDecision += 1;
      if (planConvertsWithinOwnDecisions(2))
        planIntentConvertedWithin2OwnDecisions += 1;
      if (planConvertsWithinOwnDecisions(3))
        planIntentConvertedWithin3OwnDecisions += 1;
      else if (
        !hasEvidenceFlag(entry, "plan_abort_taken:true") &&
        !hasEvidenceFlag(entry, "plan_intent_expired:true")
      )
        planIntentAbandonedWithoutReason += 1;

      if (entry.side === "runner" && planKind.includes("recover_economy")) {
        if (
          runnerEconomyConvertsToRunOrRig(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerEconomyConvertedToRunOrRig += 1;
      }
      if (entry.side === "runner" && planKind.includes("rig")) {
        if (
          runnerRigConvertsToRun(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerRigConvertedToRun += 1;
      }
      if (entry.side === "runner" && planKind.includes("safe_probe")) {
        if (
          runnerProbeConvertsToUsefulInfoOrPivot(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerProbeConvertedToUsefulInfoOrPivot += 1;
      }
      if (entry.side === "runner" && planKind.includes("pressure")) {
        if (
          runnerCentralPressureConvertsToStealOrFreshValue(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerCentralPressureConvertedToStealOrFreshValue += 1;
      }
      if (entry.side === "runner" && planKind.includes("contest_remote")) {
        if (
          runnerRemoteContestConvertsToStealTrashOrAbort(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
          )
        )
          runnerRemoteContestConvertedToStealTrashOrCorrectAbort += 1;
      }
      if (entry.side === "corp" && planKind.includes("remote_build")) {
        if (
          corpRemoteBuildConvertsToAdvanceProtectOrScore(
            strategicEntries,
            index,
            isMeaningfulBoardProgress,
            isCorpRemoteAdvancementProgress,
          )
        )
          corpRemoteBuildConvertedToAdvanceProtectOrScore += 1;
      }
      if (entry.side === "corp" && planKind.includes("advance")) {
        if (
          corpAdvanceConvertsToScoreOrProtectedWindow(strategicEntries, index)
        )
          corpAdvanceConvertedToScoreOrProtectedWindow += 1;
      }
      if (entry.side === "corp" && planKind.includes("economy")) {
        if (corpEconomyConvertsToRezInstallScore(strategicEntries, index))
          corpEconomyConvertedToRezInstallScore += 1;
      }
      if (
        entry.side === "corp" &&
        (planKind.includes("protect_hq") || planKind.includes("protect_rnd"))
      ) {
        if (corpProtectionConvertsToScoreSafety(strategicEntries, index))
          corpProtectionConvertedToScoreSafety += 1;
      }

      lastPlanBySide[entry.side] = { planKind, progressSince: false };
      if (isMeaningfulBoardProgress(entry)) {
        for (const side of Object.keys(lastPlanBySide) as Side[]) {
          const last = lastPlanBySide[side];
          if (last) last.progressSince = true;
        }
      }
    });
  }

  return {
    strategicNoProgressActionChainLength: averageNumber(strategicChains),
    strategicLongestNoProgressChain,
    microActionNoProgressContribution,
    planContinuationOpportunities,
    planContinuationTaken,
    planContinuationRate:
      planContinuationOpportunities > 0
        ? round(planContinuationTaken / planContinuationOpportunities)
        : 0,
    planAbortOpportunities,
    planAbortTaken,
    planAbortWithReason,
    planIntentConvertedWithin1OwnDecision,
    planIntentConvertedWithin2OwnDecisions,
    planIntentConvertedWithin3OwnDecisions,
    planIntentExpired,
    planIntentAbandonedWithoutReason,
    sameStrategicPlanRepeatedWithoutProgress,
    runnerEconomyConvertedToRunOrRig,
    runnerRigConvertedToRun,
    runnerProbeConvertedToUsefulInfoOrPivot,
    runnerCentralPressureConvertedToStealOrFreshValue,
    runnerRemoteContestConvertedToStealTrashOrCorrectAbort,
    corpRemoteBuildConvertedToAdvanceProtectOrScore,
    corpAdvanceConvertedToScoreOrProtectedWindow,
    corpEconomyConvertedToRezInstallScore,
    corpProtectionConvertedToScoreSafety,
  };
}
