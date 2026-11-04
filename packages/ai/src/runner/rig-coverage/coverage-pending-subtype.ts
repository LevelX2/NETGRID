import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

/** Defer only the generic last-role purchase. This is not installed coverage
 * or a certificate for a run; its owner still quotes each actual path. */
export function runnerPendingFreeSubtypeCoverageRole(
  input: AiDecisionInput,
  capabilities: DeckCapabilityProfile,
): RunnerCoverageGapSignal["requiredRole"] | undefined {
  const matrix = capabilities.runner?.breakerCoverageMatrix;
  if (!matrix || !matrix.wall || !matrix.code_gate || !matrix.sentry)
    return undefined;
  const missing = (["wall", "code_gate", "sentry"] as const).filter(
    (role) => !matrix[role].installed,
  );
  if (missing.length !== 1) return undefined;
  const role = missing[0]!;
  const available = input.playerView.own.rig?.some((card) => {
    if (
      card.known === false ||
      card.type !== "program" ||
      !card.definitionId ||
      card.selectedSubtype
    )
      return false;
    const selection = cardImplementationForDefinitionId(
      card.definitionId,
    )?.icebreakerSubtypeChange;
    return (
      selection?.timing === "during_run" &&
      selection.limit === "once_until_selected" &&
      selection.cost.credits === 0 &&
      selection.cost.clicks === 0 &&
      selection.choices.includes(role)
    );
  });
  return available ? `breaker_${role}` : undefined;
}
