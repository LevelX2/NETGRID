import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

/** Facts and valuation for the existing corp.defend_servers owner. */
export function assessCorpPaidEncounterDefense(
  input: AiDecisionInput,
  action: LegalAction,
) {
  if (
    action.side !== "corp" ||
    action.type !== "activated_card_ability" ||
    action.timingPoint !== "run.encounter_ice"
  )
    return undefined;
  const run = input.playerView.run;
  const source = input.playerView.servers
    .find((server) => server.id === run?.attackedServerId)
    ?.ice.find((card) => card.instanceId === action.source);
  const quote = source?.currentEncounterDefenseQuotes?.find(
    (entry) => entry.actionId === action.actionId,
  );
  if (
    !run ||
    run.phase !== "encounter_ice" ||
    run.encounteredIce?.instanceId !== action.source ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    !quote ||
    quote.exchange.expiresAtStateVersion !== input.playerView.stateVersion ||
    quote.exchange.cardId !== action.source ||
    quote.exchange.targetServerId !== run.attackedServerId ||
    quote.creditCost !==
      action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0)
  ) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((entry) => entry.type),
      unresolvedActionIds: [action.actionId],
      owner: "plan_module",
      planInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      removalCondition:
        "Bind the exact legal paid encounter ability to its current Engine defense quote in corp.defend_servers.",
    });
  }
  const result = (productive: boolean, reason: string, value = 0) => ({
    productive,
    serverId: run.attackedServerId,
    value,
    evidenceCode: `${reason}:${run.attackedServerId}:${action.actionId}`,
  });
  if (quote.existingUnbrokenEndTheRunCount > 0)
    return result(false, "corp_paid_encounter_existing_unbroken_etr");
  const exchange = quote.exchange;
  if (!exchange.complete)
    return result(
      false,
      `corp_paid_encounter_exchange_unresolved:${exchange.reason}`,
    );
  if (
    exchange.runnerBreakUnavailable ||
    !exchange.runnerBreak.canPayFromCurrentCredits
  )
    return result(
      true,
      "corp_paid_encounter_stops_current_visible_break_route",
      1000,
    );
  if (
    exchange.runnerBreak.normalCreditsRequired >= quote.creditCost ||
    exchange.runnerBreak.consumedCards.length > 0
  )
    return result(
      true,
      "corp_paid_encounter_productive_visible_resource_exchange",
      100 + exchange.runnerBreak.normalCreditsRequired,
    );
  return result(false, "corp_paid_encounter_break_cheaper_than_activation");
}
