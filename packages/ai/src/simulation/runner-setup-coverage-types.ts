import { DEMO_CARDS_BY_ID, type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { isRemoteServerTarget } from "../runtime/server-target";
import { iceHasEndTheRun } from "../visible-run-analysis";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";

export type RunnerSetupMissingCoverageType =
  | "wall"
  | "code_gate"
  | "sentry"
  | "universal"
  | "special";

type RunnerSetupCoverageDependencies = {
  rolesForCardId: (definitionId: string | undefined) => string[];
  assessKnownRezzedIcePath: (
    iceCards: AiDecisionInput["playerView"]["servers"][number]["ice"],
    rigCards: NonNullable<AiDecisionInput["playerView"]["own"]["rig"]>,
    runnerCredits: number,
    rootCards: AiDecisionInput["playerView"]["servers"][number]["root"],
  ) => KnownRezzedIcePathAssessment;
};

export function runnerVisibleMissingBreakerCoverage(
  input: AiDecisionInput,
  dependencies: RunnerSetupCoverageDependencies,
): boolean {
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      dependencies.rolesForCardId(card.definitionId),
    ),
  );
  return input.playerView.servers.some((server) =>
    server.ice
      .filter(
        (ice): ice is typeof ice & { definitionId: string } =>
          ice.known && typeof ice.definitionId === "string",
      )
      .flatMap((ice) => runnerMissingBreakerRolesForMetrics(ice.definitionId))
      .some((role) => !rigRoles.has(role)),
  );
}

export function runnerMissingCoverageTypesForInput(
  input: AiDecisionInput,
  dependencies: RunnerSetupCoverageDependencies,
): RunnerSetupMissingCoverageType[] {
  const rigRoles = new Set(
    (input.playerView.own.rig ?? []).flatMap((card) =>
      dependencies.rolesForCardId(card.definitionId),
    ),
  );
  const missing = new Set<RunnerSetupMissingCoverageType>();
  for (const server of input.playerView.servers) {
    for (const ice of server.ice) {
      if (!ice.known || typeof ice.definitionId !== "string") continue;
      for (const role of runnerMissingBreakerRolesForMetrics(
        ice.definitionId,
      )) {
        if (rigRoles.has(role)) continue;
        if (role === "breaker_fracter") missing.add("wall");
        else if (role === "breaker_decoder") missing.add("code_gate");
        else if (role === "breaker_killer") missing.add("sentry");
        else missing.add("universal");
      }
      if (
        ice.effectiveRunQuote?.subroutines.some(
          (subroutine) =>
            String(subroutine.type).includes("trace") ||
            String(subroutine.type).includes("damage"),
        ) === true
      )
        missing.add("special");
    }
  }
  return [...missing].sort();
}

export function runnerHasKnownBlockedPathByCoverage(
  input: AiDecisionInput,
  dependencies: RunnerSetupCoverageDependencies,
): boolean {
  return input.playerView.servers.some(
    (server) =>
      dependencies.assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      ).blocked,
  );
}

export function createRunnerSetupCoverageContext(
  dependencies: RunnerSetupCoverageDependencies,
): {
  runnerVisibleMissingBreakerCoverage: (input: AiDecisionInput) => boolean;
  runnerMissingCoverageTypesForInput: (
    input: AiDecisionInput,
  ) => RunnerSetupMissingCoverageType[];
  runnerHasKnownBlockedPathByCoverage: (input: AiDecisionInput) => boolean;
} {
  return {
    runnerVisibleMissingBreakerCoverage: (input) =>
      runnerVisibleMissingBreakerCoverage(input, dependencies),
    runnerMissingCoverageTypesForInput: (input) =>
      runnerMissingCoverageTypesForInput(input, dependencies),
    runnerHasKnownBlockedPathByCoverage: (input) =>
      runnerHasKnownBlockedPathByCoverage(input, dependencies),
  };
}

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
