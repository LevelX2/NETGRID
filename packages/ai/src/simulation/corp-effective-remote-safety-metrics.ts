import { evidenceValue, hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";

export function summarizeCorpEffectiveRemoteSafetyMetrics(
  summaries: AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
  | "corpRemoteHasIceButRunnerPathCheap"
  | "corpAgendaInstalledInCheaplyContestableRemote"
  | "corpAdvanceInCheaplyContestableRemote"
  | "corpCheapRemoteContestIgnored"
  | "corpRemoteProtectionOverestimatedByIcePresence"
  | "corpRemoteEffectiveProtectionScore"
  | "runnerKnownPathCostToScoringRemote"
  | "runnerCanContestScoringRemoteForActionOnly"
  | "runnerCanContestScoringRemoteWithCredits"
  | "corpAgendaInstallDeferredDueToCheapContest"
  | "corpAdvanceDeferredDueToCheapContest"
  | "corpProtectionChosenBeforeUnsafeAgendaInstall"
  | "corpScoreLineContinuedWhenRemoteEffectivelyProtected"
  | "corpSameTurnScoreAllowedDespiteCheapContest"
  | "corpBaitRemoteNotCountedAsScoringProtection"
> {
  let corpRemoteHasIceButRunnerPathCheap = 0;
  let corpAgendaInstalledInCheaplyContestableRemote = 0;
  let corpAdvanceInCheaplyContestableRemote = 0;
  let corpCheapRemoteContestIgnored = 0;
  let corpRemoteProtectionOverestimatedByIcePresence = 0;
  let runnerCanContestScoringRemoteForActionOnly = 0;
  let runnerCanContestScoringRemoteWithCredits = 0;
  let corpAgendaInstallDeferredDueToCheapContest = 0;
  let corpAdvanceDeferredDueToCheapContest = 0;
  let corpProtectionChosenBeforeUnsafeAgendaInstall = 0;
  let corpScoreLineContinuedWhenRemoteEffectivelyProtected = 0;
  let corpSameTurnScoreAllowedDespiteCheapContest = 0;
  let corpBaitRemoteNotCountedAsScoringProtection = 0;
  const protectionScores: number[] = [];
  const knownPathCosts: number[] = [];

  for (const summary of summaries) {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    for (const entry of sequence) {
      if (entry.side !== "corp") continue;
      if (
        hasEvidenceFlag(entry, "corp_remote_has_ice_but_runner_path_cheap:true")
      )
        corpRemoteHasIceButRunnerPathCheap += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_installed_in_cheaply_contestable_remote:true",
        )
      )
        corpAgendaInstalledInCheaplyContestableRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_advance_in_cheaply_contestable_remote:true",
        )
      )
        corpAdvanceInCheaplyContestableRemote += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_protection_overestimated_by_ice_presence:true",
        )
      )
        corpRemoteProtectionOverestimatedByIcePresence += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_can_contest_scoring_remote_for_action_only:true",
        )
      )
        runnerCanContestScoringRemoteForActionOnly += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_can_contest_scoring_remote_with_credits:true",
        )
      )
        runnerCanContestScoringRemoteWithCredits += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_agenda_install_deferred_due_to_cheap_contest:true",
        )
      )
        corpAgendaInstallDeferredDueToCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_advance_deferred_due_to_cheap_contest:true",
        )
      )
        corpAdvanceDeferredDueToCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_protection_chosen_before_unsafe_agenda_install:true",
        )
      )
        corpProtectionChosenBeforeUnsafeAgendaInstall += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_score_line_continued_when_remote_effectively_protected:true",
        )
      )
        corpScoreLineContinuedWhenRemoteEffectivelyProtected += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_same_turn_score_allowed_despite_cheap_contest:true",
        )
      )
        corpSameTurnScoreAllowedDespiteCheapContest += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_bait_remote_not_counted_as_scoring_protection:true",
        )
      )
        corpBaitRemoteNotCountedAsScoringProtection += 1;
      const protectionScore = Number(
        evidenceValue(entry, "corp_remote_effective_protection_score:"),
      );
      if (Number.isFinite(protectionScore))
        protectionScores.push(protectionScore);
      const knownPathCost = Number(
        evidenceValue(entry, "runner_known_path_cost_to_scoring_remote:"),
      );
      if (Number.isFinite(knownPathCost)) knownPathCosts.push(knownPathCost);
    }
  }
  corpCheapRemoteContestIgnored =
    corpAgendaInstalledInCheaplyContestableRemote +
    corpAdvanceInCheaplyContestableRemote;
  return {
    corpRemoteHasIceButRunnerPathCheap,
    corpAgendaInstalledInCheaplyContestableRemote,
    corpAdvanceInCheaplyContestableRemote,
    corpCheapRemoteContestIgnored,
    corpRemoteProtectionOverestimatedByIcePresence,
    corpRemoteEffectiveProtectionScore: averageNumber(protectionScores),
    runnerKnownPathCostToScoringRemote: averageNumber(knownPathCosts),
    runnerCanContestScoringRemoteForActionOnly,
    runnerCanContestScoringRemoteWithCredits,
    corpAgendaInstallDeferredDueToCheapContest,
    corpAdvanceDeferredDueToCheapContest,
    corpProtectionChosenBeforeUnsafeAgendaInstall,
    corpScoreLineContinuedWhenRemoteEffectivelyProtected,
    corpSameTurnScoreAllowedDespiteCheapContest,
    corpBaitRemoteNotCountedAsScoringProtection,
  };
}
