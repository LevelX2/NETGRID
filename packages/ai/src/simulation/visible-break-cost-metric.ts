import type { AiDecisionInput } from "@netgrid/shared";
import { currentRunPathContext } from "../run-analysis/current-run-path-context";
import { runnerRunPathCreditBudgetAfterEncounter } from "../run-analysis/visible-run-credit-budget";
import { runnerEncounterCreditBudgetForInput } from "../runtime/runner-encounter-credit-budget";
import { assessEngineCertifiedPostRezIcePath } from "../visible-run-analysis";

/** Record a conditional break price only while the Engine exposes this ICE. */
export function visibleBreakCostForExposedIce(
  input: AiDecisionInput,
): number | undefined {
  const run = input.playerView.run;
  const ice = run?.approachedIce;
  if (
    input.side !== "runner" ||
    run?.phase !== "approach_ice" ||
    ice?.known !== true ||
    ice.rezzed !== false ||
    ice.effectivePostRezRunQuote?.complete !== true
  )
    return undefined;
  const server = input.playerView.servers.find(
    (entry) => entry.id === run.attackedServerId,
  );
  if (!server) return undefined;
  const path = assessEngineCertifiedPostRezIcePath(
    [ice],
    server.id,
    input.playerView.stateVersion,
    new Set([ice.instanceId]),
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetAfterEncounter(
      runnerEncounterCreditBudgetForInput(input),
    ),
    server.root,
    input.playerView.opponent.credits,
    currentRunPathContext(input),
  );
  if (!path.canReachAccess || path.assessedKnownIceCount !== 1)
    return undefined;
  return path.visibleBreakCost ?? 0;
}
