import { hasEvidenceFlag } from "../runtime/evidence-value";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export function summarizeEncounterEffectMetrics(
  summaries: readonly AiSimulationSummary[],
): Pick<
  AiMatchProgressionMetrics,
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
> {
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

  for (const summary of summaries) {
    for (const entry of summary.actionSequence) {
      if (entry.side !== "runner") continue;
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
    }
  }

  return {
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
  };
}
