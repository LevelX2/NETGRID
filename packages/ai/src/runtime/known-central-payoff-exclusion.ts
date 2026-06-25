import type { AiDecisionInput } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type KnownCentralPayoffForExclusion = {
  payoff: string;
  knownNoCurrentPayoff: boolean;
  reasons: string[];
  evidence: string[];
};

export type KnownCentralPayoffExclusionDependencies = {
  evaluatePayoff: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => KnownCentralPayoffForExclusion;
};

export function knownCentralPayoffExclusion(
  input: AiDecisionInput,
  serverId: string | undefined,
  dependencies: KnownCentralPayoffExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  if (serverId !== "hq" && serverId !== "rd") return undefined;
  const payoff = dependencies.evaluatePayoff(input, serverId);
  if (!payoff.knownNoCurrentPayoff) return undefined;
  const serverLabel = serverId === "hq" ? "HQ" : "R&D";
  return {
    key: "known_central_no_current_payoff",
    label:
      payoff.payoff === "trash_unaffordable"
        ? `${serverLabel}-Trash nicht bezahlbar`
        : serverId === "hq"
          ? "HQ-Hand bekannt ohne aktuellen Nutzen"
          : "R&D-Topkarte bekannt ohne aktuellen Nutzen",
    reason: sortedUnique([
      `server:${serverId}`,
      `payoff:${payoff.payoff}`,
      ...payoff.reasons.slice(0, 3),
      ...payoff.evidence
        .filter(
          (entry) =>
            entry === "rd_run_suppressed_by_known_low_value_top:true" ||
            entry === "hq_run_suppressed_by_fully_known_low_value_hand:true" ||
            entry === "hq_run_suppressed_by_known_unaffordable_trash:true" ||
            entry.startsWith("central_memory_payoff:"),
        )
        .slice(0, 3),
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
