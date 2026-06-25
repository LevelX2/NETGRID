import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

export function currentEncounteredIceCard(
  input: AiDecisionInput,
): VisibleCard | undefined {
  const run = input.playerView.run;
  if (!run) return undefined;
  if (run.encounteredIce?.effectiveRunQuote) return run.encounteredIce;
  if (run.position?.kind !== "ice") return run.encounteredIce;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  return server?.ice[run.position.iceIndex] ?? run.encounteredIce;
}

export function encounterHasImmediateUnbrokenThreat(
  input: AiDecisionInput,
): boolean {
  const quote = currentEncounteredIceCard(input)?.effectiveRunQuote;
  return Boolean(
    quote?.subroutines.some((subroutine) => {
      const type = subroutine.type.toLowerCase();
      return (
        type === "end_the_run" ||
        type === "end_the_run_unless_runner_pays" ||
        type ===
          "secret_spend_compare_end_run_unless_corp_spent_at_least_runner" ||
        type === "do_damage" ||
        type === "give_runner_tag" ||
        type === "initiate_trace" ||
        type === "trash_installed_program" ||
        subroutine.unbrokenRunEffect?.causesDamageOrProgramTrash === true ||
        subroutine.unbrokenRunEffect?.preventsJackOut === true ||
        (subroutine.unbrokenRunEffect?.createsRunLockOrActionTax ?? 0) > 0
      );
    }),
  );
}

export function currentRunRemainingIce(input: AiDecisionInput): VisibleCard[] {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return [];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  return server?.ice.slice(0, Math.max(0, run.position.iceIndex)) ?? [];
}

export function currentRunHasFutureVisibleIce(input: AiDecisionInput): boolean {
  return currentRunRemainingIce(input).some(
    (ice) => ice.known && ice.rezzed === true,
  );
}
