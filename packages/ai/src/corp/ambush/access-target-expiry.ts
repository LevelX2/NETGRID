import type { RunId } from "@netgrid/shared";
import { isRunId } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";

export type CorpAccessTargetExpiry = {
  runId: RunId;
  targetProgramInstanceIds: string[];
};

type AccessChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

export function currentPaidAccessEffect(
  choice: AccessChoice,
  creditCost: number,
) {
  const parts = choice.source.split(":");
  const [family, instanceId, index, zone, version] = parts;
  if (
    parts.length !== 5 ||
    family !== "p3_35.access_payment" ||
    !instanceId ||
    instanceId !== choice.sourceCardInstanceId ||
    !choice.sourceCardDefinitionId ||
    !index ||
    !/^(0|[1-9]\d*)$/.test(index) ||
    !Number.isSafeInteger(Number(index)) ||
    version !== String(choice.stateVersion)
  )
    return undefined;
  const effect = cardImplementationForDefinitionId(
    choice.sourceCardDefinitionId,
  )?.accessEffects?.[Number(index)];
  if (
    effect?.cost?.kind !== "corp_may_pay_credits" ||
    effect.cost.amount !== creditCost ||
    !effect.sourceZones.some((sourceZone) => sourceZone === zone) ||
    effect.ignoreIfAccessedFrom?.some((ignoredZone) => ignoredZone === zone)
  )
    return undefined;
  return effect;
}

/** A strength penalty cannot survive the Engine's already bound Run-end
 * disposal of every target. Limit the proof to the last access card. */
export function accessStrengthTargetsExpireBeforeNextEncounter(
  input: AiDecisionInput,
  access: NonNullable<ReturnType<typeof currentPaidAccessEffect>>,
): CorpAccessTargetExpiry | undefined {
  const run = input.playerView.run;
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "access.resolve_card" ||
    run?.phase !== "access" ||
    !isRunId(run.runId) ||
    run.successful !== true ||
    run.breach?.remainingCount !== 0 ||
    !run.runEndTrashUsedBreakerIdsThisRun?.length
  )
    return undefined;
  const counter = access.effects.length === 1 ? access.effects[0] : undefined;
  if (
    access.kind !== "on_access" ||
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
