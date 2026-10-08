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
  // Both funding and continuation belong to the committed payment window.
  // The cost-continuation owner validates original action/plan/window bindings;
  // this window offers no fresh encounter-continue damage quote.
  if (
    input.legalActions.length > 0 &&
    input.legalActions.every(
      (action) =>
        action.side === "runner" &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.timingPoint === input.playerView.timingPoint &&
        (action.payload?.runnerCostPenaltySupportContinuation === true ||
          (action.type === "activated_card_ability" &&
            typeof action.payload?.costPenaltySupportWindowId === "string" &&
            action.payload.costPenaltySupportWindowId.length > 0 &&
            typeof action.payload.costPenaltySupportOriginalActionId ===
              "string" &&
            action.payload.costPenaltySupportOriginalActionId.length > 0)),
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
      // Possible free breaks are actions still to perform, not prevention
      // already applied. The mitigation owner assesses their exact payment.
      assumeUnbrokenSubroutines: true,
      requiredHandFloor,
    }) !== undefined
  );
}
