import { hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { hasMeaningfulProgressWithin } from "./plan-conversion-predicates";

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function summarizeOutcomeFollowupMetrics(
  summaries: AiSimulationSummary[],
  isMeaningfulBoardProgress: (
    entry: AiSimulationActionSequenceEntry,
  ) => boolean,
): Pick<
  AiMatchProgressionMetrics,
  | "runnerCentralSuccessFollowedByValue"
  | "runnerCentralSuccessFollowedByRepeatNoValue"
  | "runnerCentralNoValuePivoted"
  | "runnerRemoteSuccessFollowedByValue"
  | "runnerRemoteEmptyOrLowValuePivoted"
  | "runnerJackOutRepeatedSameServerWithoutNewInfo"
  | "runnerJackOutFollowedByEconomyOrRig"
  | "runnerAccessNoValueRepeated"
  | "runnerAccessNoValuePivoted"
  | "runnerEconomyConvertedAfterOutcome"
  | "runnerRigConvertedAfterOutcome"
  | "corpRemoteStealFollowupProtectOrPivot"
  | "corpRemoteStealFollowupRepeatedUnsafeLine"
  | "corpCentralStealFollowupProtectCentral"
  | "corpRunnerFailedRunFollowupScoreOrAdvance"
  | "corpRunnerSuccessfulRunFollowupProtect"
  | "corpAdvanceFollowupScore"
  | "corpAdvanceFollowupProtect"
  | "corpRemoteBuildFollowupAdvanceProtectScore"
  | "corpRemoteBuildFollowupNoop"
  | "outcomeFollowupOpportunities"
  | "outcomeFollowupTaken"
  | "outcomeFollowupRate"
  | "outcomeFollowupApplied"
  | "outcomeFollowupSuppressedByProgressionCost"
  | "outcomeFollowupSuppressedByBetterImmediateValue"
  | "outcomeFollowupLedToProgressWithin3"
  | "outcomeFollowupLedToNoProgressChain"
  | "outcomeFollowupDelayedScoreWindow"
  | "outcomeFollowupPreservedScoreWindow"
  | "outcomeFollowupDelayedStealOrTrash"
  | "outcomeFollowupPreservedContestReserve"
  | "runnerOutcomePivotConverted"
  | "runnerOutcomePivotStalled"
  | "corpOutcomePivotConverted"
  | "corpOutcomePivotStalled"
  | "corpScoreWindowOverriddenByFollowup"
  | "scoreNowProtectedFromFollowup"
  | "stealTrashProtectedFromFollowup"
  | "effectiveRunQuoteBlockedFollowupRun"
  | "unbrokenRunEffectChangedBreakDecision"
  | "futureEffectSubroutinesEncountered"
  | "futureEffectSubroutinesWithRemainingIce"
  | "futureEffectSubroutinesWithoutRemainingIce"
  | "futureEffectBreaksTaken"
  | "futureEffectBreaksSkippedNoRemainingIce"
  | "futureEffectBreaksTakenWithoutRemainingIce"
  | "pumpActionsBeforeFutureEffectBreak"
  | "pumpActionsThatCouldNotLeadToBreak"
  | "pumpActionsThatDestroyedAccessReserve"
  | "breakSkippedToPreserveTrashReserve"
  | "unbrokenRunEffectIgnoredBecauseNoRemainingIce"
  | "unbrokenRunEffectAppliedToRemainingPath"
  | "badOutcomeRepeatedWithoutNewInfo"
  | "goodOutcomeConverted"
  | "outcomePivotWithReason"
  | "outcomeIgnored"
> {
  let runnerCentralSuccessFollowedByValue = 0;
  let runnerCentralSuccessFollowedByRepeatNoValue = 0;
  let runnerCentralNoValuePivoted = 0;
  let runnerRemoteSuccessFollowedByValue = 0;
  let runnerRemoteEmptyOrLowValuePivoted = 0;
  let runnerJackOutRepeatedSameServerWithoutNewInfo = 0;
  let runnerJackOutFollowedByEconomyOrRig = 0;
  let runnerAccessNoValueRepeated = 0;
  let runnerAccessNoValuePivoted = 0;
  let runnerEconomyConvertedAfterOutcome = 0;
  let runnerRigConvertedAfterOutcome = 0;
  let corpRemoteStealFollowupProtectOrPivot = 0;
  let corpRemoteStealFollowupRepeatedUnsafeLine = 0;
  let corpCentralStealFollowupProtectCentral = 0;
  let corpRunnerFailedRunFollowupScoreOrAdvance = 0;
  let corpRunnerSuccessfulRunFollowupProtect = 0;
  let corpAdvanceFollowupScore = 0;
  let corpAdvanceFollowupProtect = 0;
  let corpRemoteBuildFollowupAdvanceProtectScore = 0;
  let corpRemoteBuildFollowupNoop = 0;
  let outcomeFollowupOpportunities = 0;
  let outcomeFollowupTaken = 0;
  let outcomeFollowupApplied = 0;
  let outcomeFollowupSuppressedByProgressionCost = 0;
  let outcomeFollowupSuppressedByBetterImmediateValue = 0;
  let outcomeFollowupLedToProgressWithin3 = 0;
  let outcomeFollowupLedToNoProgressChain = 0;
  let outcomeFollowupDelayedScoreWindow = 0;
  let outcomeFollowupPreservedScoreWindow = 0;
  let outcomeFollowupDelayedStealOrTrash = 0;
  let outcomeFollowupPreservedContestReserve = 0;
  let runnerOutcomePivotConverted = 0;
  let runnerOutcomePivotStalled = 0;
  let corpOutcomePivotConverted = 0;
  let corpOutcomePivotStalled = 0;
  let corpScoreWindowOverriddenByFollowup = 0;
  let scoreNowProtectedFromFollowup = 0;
  let stealTrashProtectedFromFollowup = 0;
  let effectiveRunQuoteBlockedFollowupRun = 0;
  let unbrokenRunEffectChangedBreakDecision = 0;
  let futureEffectSubroutinesEncountered = 0;
  let futureEffectSubroutinesWithRemainingIce = 0;
  let futureEffectSubroutinesWithoutRemainingIce = 0;
  let futureEffectBreaksTaken = 0;
  let futureEffectBreaksSkippedNoRemainingIce = 0;
  let futureEffectBreaksTakenWithoutRemainingIce = 0;
  let pumpActionsBeforeFutureEffectBreak = 0;
  let pumpActionsThatCouldNotLeadToBreak = 0;
  let pumpActionsThatDestroyedAccessReserve = 0;
  let breakSkippedToPreserveTrashReserve = 0;
  let unbrokenRunEffectIgnoredBecauseNoRemainingIce = 0;
  let unbrokenRunEffectAppliedToRemainingPath = 0;
  let badOutcomeRepeatedWithoutNewInfo = 0;
  let goodOutcomeConverted = 0;
  let outcomePivotWithReason = 0;
  let outcomeIgnored = 0;

  for (const summary of summaries) {
    for (const [index, entry] of summary.actionSequence.entries()) {
      if (hasEvidenceFlag(entry, "outcome_followup_opportunity:true"))
        outcomeFollowupOpportunities += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_taken:true"))
        outcomeFollowupTaken += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_applied:true")) {
        outcomeFollowupApplied += 1;
        const progressedWithin3 = hasMeaningfulProgressWithin(
          summary.actionSequence,
          index,
          3,
          isMeaningfulBoardProgress,
        );
        if (progressedWithin3) {
          outcomeFollowupLedToProgressWithin3 += 1;
          if (entry.side === "runner") runnerOutcomePivotConverted += 1;
          if (entry.side === "corp") corpOutcomePivotConverted += 1;
        } else {
          outcomeFollowupLedToNoProgressChain += 1;
          if (entry.side === "runner") runnerOutcomePivotStalled += 1;
          if (entry.side === "corp") corpOutcomePivotStalled += 1;
        }
      }
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_suppressed_by_progression_cost:true",
        )
      )
        outcomeFollowupSuppressedByProgressionCost += 1;
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_suppressed_by_better_immediate_value:true",
        )
      )
        outcomeFollowupSuppressedByBetterImmediateValue += 1;
      if (hasEvidenceFlag(entry, "outcome_followup_delayed_score_window:true"))
        outcomeFollowupDelayedScoreWindow += 1;
      if (
        hasEvidenceFlag(entry, "outcome_followup_preserved_score_window:true")
      )
        outcomeFollowupPreservedScoreWindow += 1;
      if (
        hasEvidenceFlag(entry, "outcome_followup_delayed_steal_or_trash:true")
      )
        outcomeFollowupDelayedStealOrTrash += 1;
      if (
        hasEvidenceFlag(
          entry,
          "outcome_followup_preserved_contest_reserve:true",
        )
      )
        outcomeFollowupPreservedContestReserve += 1;
      if (
        hasEvidenceFlag(entry, "corp_score_window_overridden_by_followup:true")
      )
        corpScoreWindowOverriddenByFollowup += 1;
      if (hasEvidenceFlag(entry, "score_now_protected_from_followup:true"))
        scoreNowProtectedFromFollowup += 1;
      if (hasEvidenceFlag(entry, "steal_trash_protected_from_followup:true"))
        stealTrashProtectedFromFollowup += 1;
      if (
        hasEvidenceFlag(entry, "effective_run_quote_blocked_followup_run:true")
      )
        effectiveRunQuoteBlockedFollowupRun += 1;
      if (hasEvidenceFlag(entry, "run_remainder_effect_must_break:true"))
        unbrokenRunEffectChangedBreakDecision += 1;
      if (hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")) {
        futureEffectSubroutinesEncountered += 1;
        if (
          hasEvidenceFlag(
            entry,
            "unbroken_run_effect_applied_to_remaining_path:true",
          )
        ) {
          futureEffectSubroutinesWithRemainingIce += 1;
          unbrokenRunEffectAppliedToRemainingPath += 1;
        }
        if (
          hasEvidenceFlag(
            entry,
            "unbroken_run_effect_ignored_because_no_remaining_ice:true",
          )
        ) {
          futureEffectSubroutinesWithoutRemainingIce += 1;
          unbrokenRunEffectIgnoredBecauseNoRemainingIce += 1;
        }
      }
      if (
        entry.actionType === "break_subroutine" &&
        hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")
      )
        futureEffectBreaksTaken += 1;
      if (
        entry.actionType === "continue_run" &&
        hasEvidenceFlag(
          entry,
          "unbroken_run_effect_ignored_because_no_remaining_ice:true",
        )
      )
        futureEffectBreaksSkippedNoRemainingIce += 1;
      if (
        entry.actionType === "break_subroutine" &&
        hasEvidenceFlag(
          entry,
          "unbroken_run_effect_ignored_because_no_remaining_ice:true",
        )
      )
        futureEffectBreaksTakenWithoutRemainingIce += 1;
      if (
        entry.actionType === "pump_breaker" &&
        hasEvidenceFlag(entry, "run_remainder_subroutine_effect:true")
      )
        pumpActionsBeforeFutureEffectBreak += 1;
      if (hasEvidenceFlag(entry, "pump_cannot_lead_to_useful_break:true"))
        pumpActionsThatCouldNotLeadToBreak += 1;
      if (hasEvidenceFlag(entry, "pump_would_destroy_access_reserve:true"))
        pumpActionsThatDestroyedAccessReserve += 1;
      if (
        hasEvidenceFlag(entry, "break_skipped_to_preserve_trash_reserve:true")
      )
        breakSkippedToPreserveTrashReserve += 1;
      if (hasEvidenceFlag(entry, "bad_outcome_repeated_without_new_info:true"))
        badOutcomeRepeatedWithoutNewInfo += 1;
      if (hasEvidenceFlag(entry, "good_outcome_converted:true"))
        goodOutcomeConverted += 1;
      if (hasEvidenceFlag(entry, "outcome_pivot_with_reason:true"))
        outcomePivotWithReason += 1;
      if (hasEvidenceFlag(entry, "outcome_ignored:true")) outcomeIgnored += 1;
      if (
        hasEvidenceFlag(entry, "runner_central_success_followed_by_value:true")
      )
        runnerCentralSuccessFollowedByValue += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_central_success_followed_by_repeat_no_value:true",
        )
      )
        runnerCentralSuccessFollowedByRepeatNoValue += 1;
      if (hasEvidenceFlag(entry, "runner_central_no_value_pivoted:true"))
        runnerCentralNoValuePivoted += 1;
      if (
        hasEvidenceFlag(entry, "runner_remote_success_followed_by_value:true")
      )
        runnerRemoteSuccessFollowedByValue += 1;
      if (
        hasEvidenceFlag(entry, "runner_remote_empty_or_low_value_pivoted:true")
      )
        runnerRemoteEmptyOrLowValuePivoted += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_jack_out_repeated_same_server_without_new_info:true",
        )
      )
        runnerJackOutRepeatedSameServerWithoutNewInfo += 1;
      if (
        hasEvidenceFlag(
          entry,
          "runner_jack_out_followed_by_economy_or_rig:true",
        )
      )
        runnerJackOutFollowedByEconomyOrRig += 1;
      if (hasEvidenceFlag(entry, "runner_access_no_value_repeated:true"))
        runnerAccessNoValueRepeated += 1;
      if (hasEvidenceFlag(entry, "runner_access_no_value_pivoted:true"))
        runnerAccessNoValuePivoted += 1;
      if (hasEvidenceFlag(entry, "runner_economy_converted_after_outcome:true"))
        runnerEconomyConvertedAfterOutcome += 1;
      if (hasEvidenceFlag(entry, "runner_rig_converted_after_outcome:true"))
        runnerRigConvertedAfterOutcome += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_steal_followup_protect_or_pivot:true",
        )
      )
        corpRemoteStealFollowupProtectOrPivot += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_steal_followup_repeated_unsafe_line:true",
        )
      )
        corpRemoteStealFollowupRepeatedUnsafeLine += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_central_steal_followup_protect_central:true",
        )
      )
        corpCentralStealFollowupProtectCentral += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_runner_failed_run_followup_score_or_advance:true",
        )
      )
        corpRunnerFailedRunFollowupScoreOrAdvance += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_runner_successful_run_followup_protect:true",
        )
      )
        corpRunnerSuccessfulRunFollowupProtect += 1;
      if (hasEvidenceFlag(entry, "corp_advance_followup_score:true"))
        corpAdvanceFollowupScore += 1;
      if (hasEvidenceFlag(entry, "corp_advance_followup_protect:true"))
        corpAdvanceFollowupProtect += 1;
      if (
        hasEvidenceFlag(
          entry,
          "corp_remote_build_followup_advance_protect_score:true",
        )
      )
        corpRemoteBuildFollowupAdvanceProtectScore += 1;
      if (hasEvidenceFlag(entry, "corp_remote_build_followup_noop:true"))
        corpRemoteBuildFollowupNoop += 1;
    }
  }

  return {
    runnerCentralSuccessFollowedByValue,
    runnerCentralSuccessFollowedByRepeatNoValue,
    runnerCentralNoValuePivoted,
    runnerRemoteSuccessFollowedByValue,
    runnerRemoteEmptyOrLowValuePivoted,
    runnerJackOutRepeatedSameServerWithoutNewInfo,
    runnerJackOutFollowedByEconomyOrRig,
    runnerAccessNoValueRepeated,
    runnerAccessNoValuePivoted,
    runnerEconomyConvertedAfterOutcome,
    runnerRigConvertedAfterOutcome,
    corpRemoteStealFollowupProtectOrPivot,
    corpRemoteStealFollowupRepeatedUnsafeLine,
    corpCentralStealFollowupProtectCentral,
    corpRunnerFailedRunFollowupScoreOrAdvance,
    corpRunnerSuccessfulRunFollowupProtect,
    corpAdvanceFollowupScore,
    corpAdvanceFollowupProtect,
    corpRemoteBuildFollowupAdvanceProtectScore,
    corpRemoteBuildFollowupNoop,
    outcomeFollowupOpportunities,
    outcomeFollowupTaken,
    outcomeFollowupRate:
      outcomeFollowupOpportunities > 0
        ? round(outcomeFollowupTaken / outcomeFollowupOpportunities)
        : 0,
    outcomeFollowupApplied,
    outcomeFollowupSuppressedByProgressionCost,
    outcomeFollowupSuppressedByBetterImmediateValue,
    outcomeFollowupLedToProgressWithin3,
    outcomeFollowupLedToNoProgressChain,
    outcomeFollowupDelayedScoreWindow,
    outcomeFollowupPreservedScoreWindow,
    outcomeFollowupDelayedStealOrTrash,
    outcomeFollowupPreservedContestReserve,
    runnerOutcomePivotConverted,
    runnerOutcomePivotStalled,
    corpOutcomePivotConverted,
    corpOutcomePivotStalled,
    corpScoreWindowOverriddenByFollowup,
    scoreNowProtectedFromFollowup,
    stealTrashProtectedFromFollowup,
    effectiveRunQuoteBlockedFollowupRun,
    unbrokenRunEffectChangedBreakDecision,
    futureEffectSubroutinesEncountered,
    futureEffectSubroutinesWithRemainingIce,
    futureEffectSubroutinesWithoutRemainingIce,
    futureEffectBreaksTaken,
    futureEffectBreaksSkippedNoRemainingIce,
    futureEffectBreaksTakenWithoutRemainingIce,
    pumpActionsBeforeFutureEffectBreak,
    pumpActionsThatCouldNotLeadToBreak,
    pumpActionsThatDestroyedAccessReserve,
    breakSkippedToPreserveTrashReserve,
    unbrokenRunEffectIgnoredBecauseNoRemainingIce,
    unbrokenRunEffectAppliedToRemainingPath,
    badOutcomeRepeatedWithoutNewInfo,
    goodOutcomeConverted,
    outcomePivotWithReason,
    outcomeIgnored,
  };
}
