import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "../../runtime/current-encounter";
import { breakSubroutineIndexesForAction } from "../../runtime/subroutine-indexes";
import { nonNegativeActionCreditCost } from "../../runtime/action-cost";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";

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
    !actionMatchesCurrentDecision(input, action) ||
    !input.legalActions.some((offered) => offered === action) ||
    action.type !== "break_subroutine" ||
    nonNegativeActionCreditCost(action) <= 0 ||
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
      actionMatchesCurrentDecision(input, a) &&
      a.type === "continue_run" &&
      a.payload?.encounterContinue === true &&
      a.payload.encounterWillEndRun === false &&
      a.payload.encounterSourceWillTrashAtEndOfTurn === false &&
      a.payload.encounterFullBreakDamage === 0 &&
      !a.choiceRequirements?.length &&
      a.costs.length === 0,
  );
  if (!continuation) return false;
  const harmless = new Set<number>();
  for (const offered of input.legalActions) {
    if (
      !actionMatchesCurrentDecision(input, offered) ||
      offered.type !== "break_subroutine" ||
      offered.payload?.iceId !== ice.instanceId ||
      offered.payload.breakSubroutinePurpose !==
        "zero_damage_no_secondary_effect"
    ) {
      continue;
    }
    const indexes = breakSubroutineIndexesForAction(offered);
    if (indexes.size === 1) {
      for (const index of indexes) harmless.add(index);
    }
  }
  return [...next].every((index) => harmless.has(index));
}
