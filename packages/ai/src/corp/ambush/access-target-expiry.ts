import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";

export type CorpAccessTargetExpiry = {
  runId: string;
  targetProgramInstanceIds: string[];
};

/** A strength penalty cannot survive the Engine's already bound Run-end
 * disposal of every target. Limit the proof to the last access card. */
export function accessStrengthTargetsExpireBeforeNextEncounter(
  input: AiDecisionInput,
  sourceDefinitionId: string,
  accessZone: string,
  creditCost: number,
): CorpAccessTargetExpiry | undefined {
  const run = input.playerView.run;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    run?.phase !== "access" ||
    typeof run.runId !== "string" ||
    run.runId.length === 0 ||
    run.successful !== true ||
    run.breach?.remainingCount !== 0 ||
    !run.runEndTrashUsedBreakerIdsThisRun?.length
  )
    return undefined;
  const spec = cardSpecPlanningCardByDefinitionId(sourceDefinitionId);
  const effects = spec?.planning.engine.accessEffects?.filter(
    (effect) =>
      effect.sourceZones.some((zone) => zone === accessZone) &&
      !effect.ignoreIfAccessedFrom?.some((zone) => zone === accessZone),
  );
  const access = effects?.length === 1 ? effects[0] : undefined;
  const counter = access?.effects.length === 1 ? access.effects[0] : undefined;
  if (
    access?.kind !== "on_access" ||
    access.cost?.kind !== "corp_may_pay_credits" ||
    access.cost.amount !== creditCost ||
    counter?.kind !== "add_counter_to_all_installed_runner_icebreakers" ||
    counter.counterEffect?.kind !==
      "icebreaker_strength_modifier_per_counter" ||
    counter.counterEffect.amountPerCounter >= 0 ||
    !Number.isSafeInteger(counter.amount) ||
    counter.amount <= 0
  )
    return undefined;
  const rig = input.playerView.opponent.rig;
  if (!rig || rig.some((card) => !card.known)) return undefined;
  const targets = rig.filter(
    (card) => card.type === "program" && card.subtypes?.includes("icebreaker"),
  );
  if (
    !targets.length ||
    targets.some(
      (card) =>
        !run.runEndTrashUsedBreakerIdsThisRun!.includes(card.instanceId),
    )
  )
    return undefined;
  return {
    runId: run.runId,
    targetProgramInstanceIds: targets.map((card) => card.instanceId).sort(),
  };
}

/** Payload resolution validates the owner's bound facts without selecting a
 * different option or reopening the payment strategy. */
export function accessTargetExpiryMatchesCurrentInput(
  input: AiDecisionInput,
  expiry: CorpAccessTargetExpiry,
): boolean {
  const run = input.playerView.run,
    rig = input.playerView.opponent.rig;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    run?.runId !== expiry.runId ||
    run.phase !== "access" ||
    run.successful !== true ||
    run.breach?.remainingCount !== 0 ||
    !rig ||
    rig.some((c) => !c.known) ||
    !expiry.targetProgramInstanceIds.length ||
    new Set(expiry.targetProgramInstanceIds).size !==
      expiry.targetProgramInstanceIds.length
  )
    return false;
  const targets = rig.filter(
    (c) => c.type === "program" && c.subtypes?.includes("icebreaker"),
  );
  return (
    targets.length === expiry.targetProgramInstanceIds.length &&
    targets.every(
      (c) =>
        expiry.targetProgramInstanceIds.includes(c.instanceId) &&
        run.runEndTrashUsedBreakerIdsThisRun?.includes(c.instanceId),
    )
  );
}
