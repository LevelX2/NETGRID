import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

export function corpScorePreservesMandatoryDrawHorizon(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
): boolean {
  const mandatorySource = AI_HINTS_BY_CARD.get(
    agenda.definitionId!,
  )?.effects?.some(
    (e) =>
      e.kind === "draw" &&
      e.scope === "corp" &&
      e.timing === "start_of_turn" &&
      e.target === "draw.corp_draw",
  );
  if (!mandatorySource) return true;
  const action = input.legalActions.find(
    (a) => a.actionId === candidate.actionId,
  );
  const p = action?.payload;
  const valid =
    action?.type === "score_agenda" &&
    action.side === "corp" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    p?.cardId === agenda.instanceId &&
    p.corpScoreMandatoryDrawQuoteSchemaVersion ===
      "corp-score-mandatory-draw-horizon-v1" &&
    p.corpScoreMandatoryDrawQuoteStateVersion ===
      input.playerView.stateVersion &&
    [
      p.corpScoreMandatoryDrawCurrentBaseCount,
      p.corpScoreMandatoryDrawAddedCount,
      p.corpScoreMandatoryDrawAfterBaseCount,
      p.corpScoreAgendaPointsAfter,
    ].every(
      (n) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0,
    ) &&
    Number(p.corpScoreMandatoryDrawCurrentBaseCount) > 0 &&
    Number(p.corpScoreMandatoryDrawAddedCount) > 0 &&
    Number(p.corpScoreMandatoryDrawAfterBaseCount) ===
      Number(p.corpScoreMandatoryDrawCurrentBaseCount) +
        Number(p.corpScoreMandatoryDrawAddedCount);
  if (!valid)
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "A mandatory-draw agenda score requires its exact current Engine draw-horizon fact.",
    });
  if (
    Number(p!.corpScoreMandatoryDrawAfterBaseCount) <=
      input.playerView.own.stackOrRdCount ||
    Number(p!.corpScoreAgendaPointsAfter) >= input.playerView.agendaPointsToWin
  )
    return true;
  // Preserve a currently available zero-cost score sequence that wins now.
  const seen = new Set<string>();
  let availablePoints = input.playerView.own.agendaPoints;
  for (const a of input.legalActions) {
    const id = a.payload?.cardId;
    if (
      a.type !== "score_agenda" ||
      a.side !== "corp" ||
      a.expiresAtStateVersion !== input.playerView.stateVersion ||
      typeof id !== "string" ||
      seen.has(id) ||
      a.costs.some((c) => (c.clicks ?? 0) !== 0 || (c.credits ?? 0) !== 0)
    )
      continue;
    const card = input.playerView.servers
      .flatMap((s) => s.root)
      .find((c) => c.instanceId === id);
    if (
      card?.known &&
      card.type === "agenda" &&
      Number.isSafeInteger(card.agendaPoints) &&
      card.agendaPoints! >= 0
    ) {
      seen.add(id);
      availablePoints += card.agendaPoints!;
    }
  }
  return availablePoints >= input.playerView.agendaPointsToWin;
}
