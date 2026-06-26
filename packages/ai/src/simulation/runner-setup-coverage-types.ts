import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

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
