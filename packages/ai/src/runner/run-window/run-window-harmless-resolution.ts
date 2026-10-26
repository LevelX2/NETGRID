import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "../../runtime/current-encounter";
import { breakSubroutineIndexesForAction } from "../../runtime/subroutine-indexes";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";

/** The next Engine continuation can resolve only a prefix of an encounter.
 * Do not pay for a later group before an exactly certified harmless prefix.
 * The owner requotes the later group from its real subsequent LegalActions.
 */
export function paidBreakPrecedesHarmlessResolution(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    action.type !== "break_subroutine" ||
    legalActionCreditCost(action) <= 0 ||
    action.payload?.runnerCostPenaltySupportContinuation === true ||
    currentEncounterRequiresFullBreak(input)
  )
    return false;
  const ice = currentEncounteredIceCard(input);
  if (!ice?.effectiveRunQuote || action.payload?.iceId !== ice.instanceId)
    return false;
  const next = currentEncounterUnbrokenSubroutineIndexes(input);
  const targets = breakSubroutineIndexesForAction(action);
  if (!next.size || !targets.size || [...targets].some((i) => next.has(i)))
    return false;
  const continuation = input.legalActions.find(
    (a) =>
      a.type === "continue_run" &&
      a.payload?.encounterContinue === true &&
      a.payload.encounterWillEndRun === false &&
      a.payload.encounterSourceWillTrashAtEndOfTurn === false &&
      a.payload.encounterFullBreakDamage === 0 &&
      !a.choiceRequirements?.length &&
      a.costs.length === 0,
  );
  if (!continuation) return false;
  return [...next].every((index) =>
    input.legalActions.some(
      (a) =>
        a.type === "break_subroutine" &&
        a.payload?.iceId === ice.instanceId &&
        a.payload.breakSubroutinePurpose ===
          "zero_damage_no_secondary_effect" &&
        breakSubroutineIndexesForAction(a).size === 1 &&
        breakSubroutineIndexesForAction(a).has(index),
    ),
  );
}
