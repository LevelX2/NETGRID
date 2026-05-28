/**
 * Converts declarative CardImplementation trace success effects to the
 * existing engine TraceState payload.
 *
 * This module only describes trace outcomes. The actual bid flow, link math,
 * payments, and hidden-info-safe public payloads remain owned by index.ts.
 */
import type { CardInstanceId, TraceSuccessEffect } from "@netgrid/shared";
import type { CardTraceSuccessEffectImplementation } from "./definition-types";

type TraceTargetOptions = {
  targetCardInstanceId?: CardInstanceId;
};

export function traceSuccessEffectForCardImplementation(
  effects: readonly CardTraceSuccessEffectImplementation[],
  options: TraceTargetOptions = {},
): TraceSuccessEffect {
  const tagEffects = effects.filter((effect) => effect.kind === "add_tags");
  const counterEffects = effects.filter(
    (effect) => effect.kind === "add_counter",
  );
  const marginTagEffects = effects.filter(
    (effect) => effect.kind === "add_tags_by_trace_margin_over_runner_link",
  );
  const preventableDamageEffects = effects.filter(
    (effect) => effect.kind === "preventable_damage",
  );
  const endRunEffects = effects.filter((effect) => effect.kind === "end_run");
  const runLockEffects = effects.filter(
    (effect) => effect.kind === "runner_run_lock_until_action_paid",
  );
  const trashProgramEffects = effects.filter(
    (effect) => effect.kind === "trash_program",
  );
  const trashHardwareEffects = effects.filter(
    (effect) => effect.kind === "trash_hardware",
  );
  const unpreventableMeatEffects = effects.filter(
    (effect) => effect.kind === "unpreventable_meat_damage",
  );
  const trashResourceTagEffects = effects.filter(
    (effect) => effect.kind === "trash_runner_resource_and_add_tag",
  );
  if (
    tagEffects.length === 1 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const amount = tagEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace tag success effect requires a positive amount.");
    return { type: "add_tag", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 1 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const amount = counterEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace counter success effect requires a positive amount.");
    return {
      type: "add_counter",
      counterType: counterEffects[0]!.counterType,
      amount,
    };
  }
  if (
    tagEffects.length === 1 &&
    counterEffects.length === 1 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const tagAmount = tagEffects[0]?.amount ?? 0;
    const counterAmount = counterEffects[0]?.amount ?? 0;
    if (!Number.isInteger(tagAmount) || tagAmount <= 0)
      throw new Error("Trace tag success effect requires a positive amount.");
    if (!Number.isInteger(counterAmount) || counterAmount <= 0)
      throw new Error("Trace counter success effect requires a positive amount.");
    return {
      type: "add_tag_and_counter",
      tagAmount,
      counterType: counterEffects[0]!.counterType,
      amount: counterAmount,
    };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 1 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    return { type: "add_tags_by_trace_margin_over_runner_link" };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 1 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const effect = preventableDamageEffects[0]!;
    const amount = effect.amount;
    if (effect.damageType !== "net")
      throw new Error("Printed trace preventable damage supports Net damage only.");
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace Net damage success effect requires a positive amount.");
    return { type: "net_damage", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const amount = runLockEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace run-lock success effect requires a positive amount.");
    return { type: "end_run_and_run_lock", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 1 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 0
  ) {
    const amount = runLockEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace run-lock success effect requires a positive amount.");
    return { type: "end_run_trash_program_and_run_lock", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 1 &&
    unpreventableMeatEffects.length === 1 &&
    trashResourceTagEffects.length === 0
  ) {
    const amount = unpreventableMeatEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace unpreventable meat damage success effect requires a positive amount.");
    return {
      type: "end_run_trash_hardware_and_unpreventable_meat_damage",
      amount,
    };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    marginTagEffects.length === 0 &&
    preventableDamageEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0 &&
    trashHardwareEffects.length === 0 &&
    unpreventableMeatEffects.length === 0 &&
    trashResourceTagEffects.length === 1
  ) {
    if (!options.targetCardInstanceId)
      throw new Error(
        "Trace resource trash success effect requires a bound target card instance id.",
      );
    return {
      type: "trash_runner_resource_and_add_tag",
      targetCardInstanceId: options.targetCardInstanceId,
    };
  }
  throw new Error("Unsupported CardImplementation trace success effect sequence.");
}
