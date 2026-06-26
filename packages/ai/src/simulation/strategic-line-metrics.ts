import { isRemoteServerTarget } from "../runtime/server-target";
import { evidenceValue, hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  isRunnerRigProgressAction,
  isStrategicPlanDecision,
  nextEntries,
  ownStrategicWindow,
} from "./plan-conversion-predicates";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";

export function summarizeStrategicLineMetrics(
  summaries: AiSimulationSummary[],
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): Pick<
  AiMatchProgressionMetrics,
  | "strategicLineSelected"
  | "strategicLineSelectedBySideRunner"
  | "strategicLineSelectedBySideCorp"
  | "strategicLineSelectedBySeed"
  | "strategicLineCommitmentTurns"
  | "strategicLineContinuationTaken"
  | "strategicLineAborted"
  | "strategicLineOverriddenByTacticalUrgency"
  | "strategicLineConvertedToProgress"
  | "strategicLineRepeatedWithoutProgress"
  | "strategicLineVarianceAcrossSeeds"
  | "runnerStrategicLineEarlyHqPressure"
  | "runnerStrategicLineEarlyRndPressure"
  | "runnerStrategicLineRemoteContest"
  | "runnerStrategicLineEconomyFirst"
  | "runnerStrategicLineRigFirst"
  | "runnerStrategicLineBreakerSearchFirst"
  | "runnerStrategicLineInterfacePressure"
  | "runnerStrategicLineCloseoutPressure"
  | "corpStrategicLineCentralStabilize"
  | "corpStrategicLineRemoteScoringBuild"
  | "corpStrategicLineIceTaxGlacier"
  | "corpStrategicLineEconomyRezReserve"
  | "corpStrategicLineFastAdvanceOrCounterOps"
  | "corpStrategicLineTagTracePunish"
  | "corpStrategicLineBaitAndPunish"
  | "corpStrategicLineScoreCloseout"
  | "lineCommitmentLedToScore"
  | "lineCommitmentLedToSteal"
  | "lineCommitmentLedToRemoteTrash"
  | "lineCommitmentLedToRigProgress"
  | "lineCommitmentLedToScoreWindow"
  | "lineCommitmentLedToNoProgressChain"
> {
  let strategicLineSelected = 0;
  let strategicLineSelectedBySideRunner = 0;
  let strategicLineSelectedBySideCorp = 0;
  let strategicLineSelectedBySeed = 0;
  let strategicLineContinuationTaken = 0;
  let strategicLineAborted = 0;
  let strategicLineOverriddenByTacticalUrgency = 0;
  let strategicLineConvertedToProgress = 0;
  let strategicLineRepeatedWithoutProgress = 0;
  let runnerStrategicLineEarlyHqPressure = 0;
  let runnerStrategicLineEarlyRndPressure = 0;
  let runnerStrategicLineRemoteContest = 0;
  let runnerStrategicLineEconomyFirst = 0;
  let runnerStrategicLineRigFirst = 0;
  let runnerStrategicLineBreakerSearchFirst = 0;
  let runnerStrategicLineInterfacePressure = 0;
  let runnerStrategicLineCloseoutPressure = 0;
  let corpStrategicLineCentralStabilize = 0;
  let corpStrategicLineRemoteScoringBuild = 0;
  let corpStrategicLineIceTaxGlacier = 0;
  let corpStrategicLineEconomyRezReserve = 0;
  let corpStrategicLineFastAdvanceOrCounterOps = 0;
  let corpStrategicLineTagTracePunish = 0;
  let corpStrategicLineBaitAndPunish = 0;
  let corpStrategicLineScoreCloseout = 0;
  let lineCommitmentLedToScore = 0;
  let lineCommitmentLedToSteal = 0;
  let lineCommitmentLedToRemoteTrash = 0;
  let lineCommitmentLedToRigProgress = 0;
  let lineCommitmentLedToScoreWindow = 0;
  let lineCommitmentLedToNoProgressChain = 0;
  const ttlValues: number[] = [];
  const lineKindsBySide = new Map<string, Set<string>>();

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    const strategicEntries = sequence.filter(isStrategicPlanDecision);
    strategicEntries.forEach((entry, index) => {
      if (!hasEvidenceFlag(entry, "strategic_line_selected:true")) return;
      const kind = evidenceValue(entry, "strategic_line_kind:") ?? "unknown";
      strategicLineSelected += 1;
      if (entry.side === "runner") strategicLineSelectedBySideRunner += 1;
      if (entry.side === "corp") strategicLineSelectedBySideCorp += 1;
      if (hasEvidenceFlag(entry, "strategic_line_selected_by_seed:true"))
        strategicLineSelectedBySeed += 1;
      if (hasEvidenceFlag(entry, "strategic_line_continuation_taken:true"))
        strategicLineContinuationTaken += 1;
      if (hasEvidenceFlag(entry, "strategic_line_aborted:true"))
        strategicLineAborted += 1;
      if (
        hasEvidenceFlag(
          entry,
          "strategic_line_overridden_by_tactical_urgency:true",
        )
      )
        strategicLineOverriddenByTacticalUrgency += 1;
      const ttl = Number(
        evidenceValue(entry, "strategic_line_commitment_ttl:"),
      );
      if (Number.isFinite(ttl)) ttlValues.push(ttl);
      const lineSetKey = `${entry.side}`;
      if (!lineKindsBySide.has(lineSetKey))
        lineKindsBySide.set(lineSetKey, new Set());
      lineKindsBySide.get(lineSetKey)!.add(kind);

      if (entry.side === "runner") {
        if (kind === "early_hq_pressure")
          runnerStrategicLineEarlyHqPressure += 1;
        if (kind === "early_rnd_pressure")
          runnerStrategicLineEarlyRndPressure += 1;
        if (kind === "remote_contest") runnerStrategicLineRemoteContest += 1;
        if (kind === "economy_first") runnerStrategicLineEconomyFirst += 1;
        if (kind === "rig_first") runnerStrategicLineRigFirst += 1;
        if (kind === "breaker_search_first")
          runnerStrategicLineBreakerSearchFirst += 1;
        if (kind === "interface_pressure")
          runnerStrategicLineInterfacePressure += 1;
        if (kind === "closeout_pressure")
          runnerStrategicLineCloseoutPressure += 1;
      } else {
        if (kind === "central_stabilize")
          corpStrategicLineCentralStabilize += 1;
        if (kind === "remote_scoring_build")
          corpStrategicLineRemoteScoringBuild += 1;
        if (kind === "ice_tax_glacier") corpStrategicLineIceTaxGlacier += 1;
        if (kind === "economy_rez_reserve")
          corpStrategicLineEconomyRezReserve += 1;
        if (kind === "fast_advance_or_counter_ops")
          corpStrategicLineFastAdvanceOrCounterOps += 1;
        if (kind === "tag_trace_punish") corpStrategicLineTagTracePunish += 1;
        if (kind === "bait_and_punish") corpStrategicLineBaitAndPunish += 1;
        if (kind === "score_closeout") corpStrategicLineScoreCloseout += 1;
      }

      const nextOwn = ownStrategicWindow(strategicEntries, index, 3);
      const fullIndex = sequence.indexOf(entry);
      const nextAll =
        fullIndex >= 0 ? nextEntries(sequence, fullIndex, 6) : nextOwn;
      if (
        nextOwn.some(isMeaningfulBoardProgress) ||
        nextAll.some(isMeaningfulBoardProgress)
      )
        strategicLineConvertedToProgress += 1;
      if (nextAll.some((candidate) => candidate.actionType === "score_agenda"))
        lineCommitmentLedToScore += 1;
      if (nextAll.some((candidate) => candidate.actionType === "steal_agenda"))
        lineCommitmentLedToSteal += 1;
      if (
        nextAll.some(
          (candidate) =>
            candidate.side === "runner" &&
            candidate.actionType === "trash_accessed_card" &&
            isRemoteServerTarget(candidate.targetServerId),
        )
      )
        lineCommitmentLedToRemoteTrash += 1;
      if (nextOwn.some(isRunnerRigProgressAction))
        lineCommitmentLedToRigProgress += 1;
      if (
        nextOwn.some(
          (candidate) =>
            candidate.side === "corp" &&
            (candidate.actionType === "advance_card" ||
              candidate.actionType === "score_agenda" ||
              candidate.finalAdvance === true),
        )
      )
        lineCommitmentLedToScoreWindow += 1;
      if (
        nextOwn.length >= 3 &&
        !nextOwn.some(isMeaningfulBoardProgress) &&
        nextOwn.every(
          (candidate) =>
            evidenceValue(candidate, "strategic_line_kind:") === kind ||
            !hasEvidenceFlag(candidate, "strategic_line_selected:true"),
        )
      ) {
        strategicLineRepeatedWithoutProgress += 1;
        lineCommitmentLedToNoProgressChain += 1;
      }
    });
  }
  const strategicLineVarianceAcrossSeeds = [...lineKindsBySide.values()].reduce(
    (sum, set) => sum + Math.max(0, set.size - 1),
    0,
  );
  return {
    strategicLineSelected,
    strategicLineSelectedBySideRunner,
    strategicLineSelectedBySideCorp,
    strategicLineSelectedBySeed,
    strategicLineCommitmentTurns: averageNumber(ttlValues),
    strategicLineContinuationTaken,
    strategicLineAborted,
    strategicLineOverriddenByTacticalUrgency,
    strategicLineConvertedToProgress,
    strategicLineRepeatedWithoutProgress,
    strategicLineVarianceAcrossSeeds,
    runnerStrategicLineEarlyHqPressure,
    runnerStrategicLineEarlyRndPressure,
    runnerStrategicLineRemoteContest,
    runnerStrategicLineEconomyFirst,
    runnerStrategicLineRigFirst,
    runnerStrategicLineBreakerSearchFirst,
    runnerStrategicLineInterfacePressure,
    runnerStrategicLineCloseoutPressure,
    corpStrategicLineCentralStabilize,
    corpStrategicLineRemoteScoringBuild,
    corpStrategicLineIceTaxGlacier,
    corpStrategicLineEconomyRezReserve,
    corpStrategicLineFastAdvanceOrCounterOps,
    corpStrategicLineTagTracePunish,
    corpStrategicLineBaitAndPunish,
    corpStrategicLineScoreCloseout,
    lineCommitmentLedToScore,
    lineCommitmentLedToSteal,
    lineCommitmentLedToRemoteTrash,
    lineCommitmentLedToRigProgress,
    lineCommitmentLedToScoreWindow,
    lineCommitmentLedToNoProgressChain,
  };
}
