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
      for (; nextIndex >= 0; nextIndex -= 1) {
        const next = ice?.[nextIndex];
        if (!next) throw missingBreakRestrictionBinding(input, "next");
        prohibitBreakingIceInstanceIds.push(next.instanceId);
        // An unrezzed layer may be passed without beginning an encounter.
        // Keep every possible next target until a public guaranteed encounter.
        if (
          next.known &&
          next.rezzed === true &&
          next.effectiveRunQuote &&
          !next.effectiveRunQuote.conditionalEncounterEffects?.some(
            (effect) => effect.kind === "random_strength_or_derez_auto_pass",
          )
        )
          break;
      }
    }
  }
  return {
    ...(input.playerView.own.runnerTraceSupportQuote
      ? {
          runnerTraceSupportQuote: input.playerView.own.runnerTraceSupportQuote,
        }
      : {}),
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
