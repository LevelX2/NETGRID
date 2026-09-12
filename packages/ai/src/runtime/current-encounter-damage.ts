import type { AiDecisionInput } from "@netgrid/shared";
import {
  runnerConfirmedDamageRequiredHandFloor,
  runnerVisibleLethalIceDamageAssessment,
} from "../runner-damage-threat-assessment";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "./current-encounter";

// Shared consequence fact for the run-window owner and its action guards.
// Individual subroutines cannot each spend the same entire hand buffer.
export function currentEncounterRequiresDamagePreservingBreak(
  input: AiDecisionInput,
  requiredHandFloor = runnerConfirmedDamageRequiredHandFloor(input),
): boolean {
  if (input.playerView.run?.phase !== "encounter_ice") return false;
  // A cost continuation resumes an already bound action; it is not a fresh
  // encounter choice and has no encounter-continue LegalAction.
  if (
    input.legalActions.some(
      (action) => action.payload?.runnerCostPenaltySupportContinuation === true,
    )
  )
    return false;
  if (currentEncounterRequiresFullBreak(input)) return true;
  const encounteredIce = currentEncounteredIceCard(input);
  if (!encounteredIce?.effectiveRunQuote) return false;
  if (
    !encounteredIce.effectiveRunQuote.subroutines.some(
      (subroutine) =>
        (subroutine.type === "do_damage" ||
          subroutine.type === "random_damage") &&
        typeof subroutine.amount === "number" &&
        subroutine.amount > 0,
    )
  )
    return false;
  const unbrokenIndexes = currentEncounterUnbrokenSubroutineIndexes(input);
  const remainingDamageIce = {
    ...encounteredIce,
    effectiveRunQuote: {
      ...encounteredIce.effectiveRunQuote,
      subroutines: encounteredIce.effectiveRunQuote.subroutines.filter(
        (_, index) => unbrokenIndexes.has(index),
      ),
    },
  };
  return (
    runnerVisibleLethalIceDamageAssessment(input, [remainingDamageIce], {
      // Deliberately leaving current damage unbroken. Exact action guards
      // separately assess payment for pumping and breaking.
      generalCredits: 0,
      requiredHandFloor,
    }) !== undefined
  );
}
