import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

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
  if (currentEncounterRequiresFullBreak(input)) return true;
  return Boolean(
    quote?.subroutines.some((subroutine) => {
      // This obligation belongs to the following encounter and is assessed
      // together with its complete, payable alternative by the path owner.
      if (subroutine.type === "set_next_encounter_unless_fully_break_damage")
        return false;
      const type = subroutine.type.toLowerCase();
      const damageTypeValue = (subroutine as { damageType?: unknown })
        .damageType;
      const damageType =
        typeof damageTypeValue === "string"
          ? damageTypeValue.toLowerCase()
          : undefined;
      return (
        type === "end_the_run" ||
        type === "end_the_run_unless_runner_pays" ||
        type ===
          "secret_spend_compare_end_run_unless_corp_spent_at_least_runner" ||
        type === "do_damage" ||
        type === "random_damage" ||
        type === "brain_damage" ||
        type === "core_damage" ||
        type === "do_brain_damage" ||
        type === "do_core_damage" ||
        damageType === "brain" ||
        damageType === "core" ||
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

export function currentEncounterRequiresFullBreak(
  input: AiDecisionInput,
): boolean {
  return (
    input.playerView.run?.phase === "encounter_ice" &&
    input.legalActions.some(
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true &&
        typeof action.payload.encounterFullBreakDamage === "number" &&
        action.payload.encounterFullBreakDamage > 0,
    )
  );
}

export function currentEncounterUnbrokenSubroutineIndexes(
  input: AiDecisionInput,
): Set<number> {
  const action = input.legalActions.find(
    (candidate) =>
      candidate.type === "continue_run" &&
      candidate.payload?.encounterContinue === true,
  );
  const quotedIds = action?.payload?.encounterSubroutineIds;
  const ids =
    typeof quotedIds === "string" && quotedIds.length > 0
      ? quotedIds.split(",")
      : [];
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines;
  if (
    !subroutines ||
    typeof quotedIds !== "string" ||
    new Set(ids).size !== ids.length ||
    ids.length !== action?.payload?.unbrokenSubroutineCount ||
    ids.some((id) => !subroutines.some((subroutine) => subroutine.id === id))
  ) {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((candidate) => candidate.type),
      unresolvedActionIds: action ? [action.actionId] : [],
      owner: "rules_contract",
      removalCondition:
        "Full-break continuation requires the Engine's exact remaining subroutine IDs and count.",
    });
  }
  const remaining = new Set(ids);
  return new Set(
    subroutines.flatMap((subroutine, index) =>
      remaining.has(subroutine.id) ? [index] : [],
    ),
  );
}

export function currentRunRemainingIce(input: AiDecisionInput): VisibleCard[] {
  const run = input.playerView.run;
  if (!run || run.position?.kind !== "ice") return [];
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  const remainingIceCount =
    run.phase === "movement"
      ? run.position.iceIndex + 1
      : run.position.iceIndex;
  return (
    server?.ice
      .slice(0, Math.max(0, remainingIceCount))
      .filter((ice) => ice.instanceId !== run.pendingAutoPassIceId) ?? []
  );
}

export function currentRunHasPendingAutoPassIce(
  input: AiDecisionInput,
): boolean {
  const run = input.playerView.run;
  if (
    !run ||
    run.phase !== "movement" ||
    run.position?.kind !== "ice" ||
    !run.pendingAutoPassIceId
  ) {
    return false;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === run.position?.serverId,
  );
  return (
    server?.ice[run.position.iceIndex]?.instanceId === run.pendingAutoPassIceId
  );
}

export function currentRunHasFutureVisibleIce(input: AiDecisionInput): boolean {
  return currentRunRemainingIce(input).some(
    (ice) => ice.known && ice.rezzed === true,
  );
}

export function runnerReachedAccessMovement(input: AiDecisionInput): boolean {
  const run = input.playerView.run;
  return (
    input.playerView.timingPoint === "run.jack_out_window" &&
    run?.phase === "movement" &&
    run.position?.kind === "server"
  );
}
