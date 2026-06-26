import { DEMO_CARDS_BY_ID, type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { isRemoteServerTarget } from "../runtime/server-target";
import { iceHasEndTheRun } from "../visible-run-analysis";

export type RunnerSetupMissingCoverageType =
  | "wall"
  | "code_gate"
  | "sentry"
  | "universal"
  | "special";

export function runnerMissingBreakerRolesForMetrics(
  definitionId: string,
): string[] {
  const definition =
    RUNTIME_CARDS[definitionId] ?? DEMO_CARDS_BY_ID[definitionId];
  const subtypes = definition?.subtypes ?? [];
  const roles = new Set<string>();
  if (
    subtypes.some((subtype) => runnerSubtypeKeyForMetrics(subtype) === "wall")
  )
    roles.add("breaker_fracter");
  if (
    subtypes.some(
      (subtype) => runnerSubtypeKeyForMetrics(subtype) === "code_gate",
    )
  )
    roles.add("breaker_decoder");
  if (
    subtypes.some((subtype) => runnerSubtypeKeyForMetrics(subtype) === "sentry")
  )
    roles.add("breaker_killer");
  if (roles.size === 0) roles.add("breaker_generic");
  return [...roles].sort();
}

export function runnerSubtypeKeyForMetrics(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function runnerStrategicBreakerTargetForMetrics(
  server: AiDecisionInput["playerView"]["servers"][number],
): boolean {
  if (server.id === "rd" || server.id === "hq") return true;
  return isRemoteServerTarget(server.id) && server.root.length > 0;
}

export function runnerVisibleIceCreatesCoverageNeedForMetrics(
  ice: Pick<VisibleCard, "definitionId" | "effectiveRunQuote">,
): boolean {
  if (!ice.definitionId) return false;
  if (iceHasEndTheRun(ice.definitionId)) return true;
  return (
    ice.effectiveRunQuote?.subroutines.some((subroutine) => {
      const effect = subroutine.unbrokenRunEffect;
      return (
        effect?.addsFutureEndTheRunSubroutines !== undefined ||
        effect?.increasesFutureBreakCostPerSubroutine !== undefined ||
        effect?.preventsFutureBreaking === true ||
        effect?.causesDamageOrProgramTrash === true ||
        effect?.createsRunLockOrActionTax !== undefined
      );
    }) === true
  );
}
