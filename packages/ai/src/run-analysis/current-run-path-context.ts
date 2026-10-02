import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import type { VisibleDeflectorContext } from "./visible-run-analysis-contracts";

/** Facts of the active run, for quotes of its current encounter and remaining ICE. */
export function currentRunPathContext(
  input: AiDecisionInput,
): VisibleDeflectorContext {
  const run = input.playerView.run;
  if (!run) return {};
  const prohibitBreakingIceInstanceIds: string[] = [];
  if (run.position?.kind === "ice") {
    const ice = input.playerView.servers.find(
      (server) => server.id === run.position?.serverId,
    )?.ice;
    const currentIndex = run.position.iceIndex;
    if (run.phase === "encounter_ice" && run.noBreakSubroutinesActive) {
      const current = ice?.[currentIndex];
      if (!current) throw missingBreakRestrictionBinding(input, "current");
      prohibitBreakingIceInstanceIds.push(current.instanceId);
    }
    if (run.nextEncounterNoBreakSubroutines) {
      let nextIndex = currentIndex - (run.phase === "encounter_ice" ? 1 : 0);
      if (
        run.pendingAutoPassIceId &&
        ice?.[nextIndex]?.instanceId === run.pendingAutoPassIceId
      )
        nextIndex -= 1;
      if (nextIndex >= 0) {
        const next = ice?.[nextIndex];
        if (!next) throw missingBreakRestrictionBinding(input, "next");
        prohibitBreakingIceInstanceIds.push(next.instanceId);
      }
    }
  }
  return {
    ...(run.encounterTaxForFutureIce
      ? {
          encounterEntryTax: {
            amount: run.encounterTaxForFutureIce,
            ...(run.encounteredIce?.instanceId
              ? { paidIceInstanceId: run.encounteredIce.instanceId }
              : {}),
          },
        }
      : {}),
    ...(prohibitBreakingIceInstanceIds.length
      ? { prohibitBreakingIceInstanceIds }
      : {}),
  };
}

function missingBreakRestrictionBinding(
  input: AiDecisionInput,
  encounter: string,
) {
  return new PlanResolutionFailure("invalid_player_view_card_projection", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "rules_contract",
    removalCondition: `Public break restriction requires the ${encounter} actual encounter ICE binding.`,
  });
}
