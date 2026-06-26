import type { Side } from "@netgrid/shared";

import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { isMeaningfulBoardProgress } from "./meaningful-board-progress";
import { summarizeOutcomeFollowupMetrics } from "./outcome-followup-metrics";
import {
  actionsUntil,
  advanceConvertsToScore,
  centralPressureConvertsToSteal,
  economyActionConvertsToRun,
  hasMeaningfulProgressWithin,
  planKindForConversion,
  planIntentConvertedWithin,
  remoteBuildConvertsToAdvanceOrScore,
  remoteContestConvertsToStealOrTrash,
  rigActionConvertsToRun,
  setupActionConvertsToRun,
} from "./plan-conversion-predicates";
import {
  isCorpRemoteAdvancementProgress,
  progressionEntriesWithRunTargets,
} from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";
import { summarizeStrategicPlanConversionMetrics } from "./strategic-plan-conversion-metrics";

type BasicPlanConversionMetrics = Pick<
  AiMatchProgressionMetrics,
  | "actionLedToProgressWithin1"
  | "actionLedToProgressWithin2"
  | "actionLedToProgressWithin3"
  | "planIntentConverted"
  | "planIntentAbandoned"
  | "samePlanRepeatedWithoutProgress"
  | "setupActionConvertedToRun"
  | "economyActionConvertedToRun"
  | "rigActionConvertedToRun"
  | "remoteBuildConvertedToAdvanceOrScore"
  | "advanceConvertedToScore"
  | "remoteContestConvertedToStealOrTrash"
  | "centralPressureConvertedToSteal"
  | "noProgressActionChainLength"
  | "longestNoProgressChain"
  | "turnsWithNoProgress"
  | "actionsUntilNextScoreOrSteal"
  | "actionsUntilNextMeaningfulBoardProgress"
>;

type PlanConversionMetrics = BasicPlanConversionMetrics &
  ReturnType<typeof summarizeStrategicPlanConversionMetrics> &
  ReturnType<typeof summarizeOutcomeFollowupMetrics>;

export function summarizePlanConversionMetrics(
  summaries: AiSimulationSummary[],
): PlanConversionMetrics {
  let actionLedToProgressWithin1 = 0;
  let actionLedToProgressWithin2 = 0;
  let actionLedToProgressWithin3 = 0;
  let planIntentConverted = 0;
  let planIntentAbandoned = 0;
  let samePlanRepeatedWithoutProgress = 0;
  let setupActionConvertedToRun = 0;
  let economyActionConvertedToRun = 0;
  let rigActionConvertedToRun = 0;
  let remoteBuildConvertedToAdvanceOrScore = 0;
  let advanceConvertedToScore = 0;
  let remoteContestConvertedToStealOrTrash = 0;
  let centralPressureConvertedToSteal = 0;
  let longestNoProgressChain = 0;

  const noProgressChains: number[] = [];
  const scoreOrStealDistances: number[] = [];
  const boardProgressDistances: number[] = [];
  const turnsWithActions = new Set<string>();
  const turnsWithProgress = new Set<string>();

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const lastPlanBySide: Partial<
      Record<Side, { planKind: string; progressSince: boolean }>
    > = {};
    let noProgressChain = 0;

    sequence.forEach((entry, index) => {
      const turnKey = `${summary.seed}|${entry.turnNumber ?? 0}`;
      turnsWithActions.add(turnKey);
      const hasProgress = isMeaningfulBoardProgress(entry);
      if (hasProgress) turnsWithProgress.add(turnKey);

      if (hasProgress) {
        if (noProgressChain > 0) noProgressChains.push(noProgressChain);
        longestNoProgressChain = Math.max(
          longestNoProgressChain,
          noProgressChain,
        );
        noProgressChain = 0;
      } else {
        noProgressChain += 1;
      }

      if (
        hasMeaningfulProgressWithin(
          sequence,
          index,
          1,
          isMeaningfulBoardProgress,
        )
      )
        actionLedToProgressWithin1 += 1;
      if (
        hasMeaningfulProgressWithin(
          sequence,
          index,
          2,
          isMeaningfulBoardProgress,
        )
      )
        actionLedToProgressWithin2 += 1;
      if (
        hasMeaningfulProgressWithin(
          sequence,
          index,
          3,
          isMeaningfulBoardProgress,
        )
      )
        actionLedToProgressWithin3 += 1;

      const planKind = planKindForConversion(entry);
      if (planKind) {
        const lastPlan = lastPlanBySide[entry.side];
        if (
          lastPlan?.planKind === planKind &&
          lastPlan.progressSince === false
        ) {
          samePlanRepeatedWithoutProgress += 1;
        }
        const converted = planIntentConvertedWithin(
          sequence,
          index,
          planKind,
          isMeaningfulBoardProgress,
          isCorpRemoteAdvancementProgress,
        );
        if (converted) planIntentConverted += 1;
        else if (
          !hasMeaningfulProgressWithin(
            sequence,
            index,
            3,
            isMeaningfulBoardProgress,
          )
        )
          planIntentAbandoned += 1;
        lastPlanBySide[entry.side] = { planKind, progressSince: false };
      }

      if (setupActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        setupActionConvertedToRun += 1;
      if (economyActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        economyActionConvertedToRun += 1;
      if (rigActionConvertsToRun(sequence, index, isMeaningfulBoardProgress))
        rigActionConvertedToRun += 1;
      if (
        remoteBuildConvertsToAdvanceOrScore(
          sequence,
          index,
          isCorpRemoteAdvancementProgress,
        )
      )
        remoteBuildConvertedToAdvanceOrScore += 1;
      if (
        advanceConvertsToScore(
          sequence,
          index,
          isCorpRemoteAdvancementProgress,
        )
      )
        advanceConvertedToScore += 1;
      if (remoteContestConvertsToStealOrTrash(sequence, index))
        remoteContestConvertedToStealOrTrash += 1;
      if (centralPressureConvertsToSteal(sequence, index))
        centralPressureConvertedToSteal += 1;

      const scoreOrStealDistance = actionsUntil(
        sequence,
        index,
        (candidate) =>
          candidate.actionType === "score_agenda" ||
          candidate.actionType === "steal_agenda",
      );
      if (scoreOrStealDistance !== undefined)
        scoreOrStealDistances.push(scoreOrStealDistance);
      const boardProgressDistance = actionsUntil(
        sequence,
        index,
        isMeaningfulBoardProgress,
      );
      if (boardProgressDistance !== undefined)
        boardProgressDistances.push(boardProgressDistance);

      if (hasProgress) {
        for (const side of Object.keys(lastPlanBySide) as Side[]) {
          const lastPlan = lastPlanBySide[side];
          if (lastPlan) lastPlan.progressSince = true;
        }
      }
    });

    if (noProgressChain > 0) {
      noProgressChains.push(noProgressChain);
      longestNoProgressChain = Math.max(
        longestNoProgressChain,
        noProgressChain,
      );
    }
  }

  return {
    actionLedToProgressWithin1,
    actionLedToProgressWithin2,
    actionLedToProgressWithin3,
    planIntentConverted,
    planIntentAbandoned,
    samePlanRepeatedWithoutProgress,
    setupActionConvertedToRun,
    economyActionConvertedToRun,
    rigActionConvertedToRun,
    remoteBuildConvertedToAdvanceOrScore,
    advanceConvertedToScore,
    remoteContestConvertedToStealOrTrash,
    centralPressureConvertedToSteal,
    noProgressActionChainLength: averageNumber(noProgressChains),
    longestNoProgressChain,
    turnsWithNoProgress: [...turnsWithActions].filter(
      (turnKey) => !turnsWithProgress.has(turnKey),
    ).length,
    actionsUntilNextScoreOrSteal: averageNumber(scoreOrStealDistances),
    actionsUntilNextMeaningfulBoardProgress: averageNumber(
      boardProgressDistances,
    ),
    ...summarizeStrategicPlanConversionMetrics(
      summaries,
      isMeaningfulBoardProgress,
      isCorpRemoteAdvancementProgress,
    ),
    ...summarizeOutcomeFollowupMetrics(summaries, isMeaningfulBoardProgress),
  };
}
