/**
 * Converts declarative CardImplementation trace success effects to the
 * existing engine TraceState payload.
 *
 * This module only describes trace outcomes. The actual bid flow, link math,
 * payments, and hidden-info-safe public payloads remain owned by index.ts.
 */
import type { TraceSuccessEffect } from "@netgrid/shared";
import type { CardTraceSuccessEffectImplementation } from "./definition-types";

export function traceSuccessEffectForCardImplementation(
  effects: readonly CardTraceSuccessEffectImplementation[],
): TraceSuccessEffect {
  const tagEffects = effects.filter((effect) => effect.kind === "add_tags");
  const counterEffects = effects.filter(
    (effect) => effect.kind === "add_counter",
  );
  const endRunEffects = effects.filter((effect) => effect.kind === "end_run");
  const runLockEffects = effects.filter(
    (effect) => effect.kind === "runner_run_lock_until_action_paid",
  );
  const trashProgramEffects = effects.filter(
    (effect) => effect.kind === "trash_program",
  );
  if (
    tagEffects.length === 1 &&
    counterEffects.length === 0 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0
  ) {
    const amount = tagEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace tag success effect requires a positive amount.");
    return { type: "add_tag", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 1 &&
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0
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
    endRunEffects.length === 0 &&
    runLockEffects.length === 0 &&
    trashProgramEffects.length === 0
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
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 0
  ) {
    const amount = runLockEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace run-lock success effect requires a positive amount.");
    return { type: "end_run_and_run_lock", amount };
  }
  if (
    tagEffects.length === 0 &&
    counterEffects.length === 0 &&
    endRunEffects.length === 1 &&
    runLockEffects.length === 1 &&
    trashProgramEffects.length === 1
  ) {
    const amount = runLockEffects[0]?.amount ?? 0;
    if (!Number.isInteger(amount) || amount <= 0)
      throw new Error("Trace run-lock success effect requires a positive amount.");
    return { type: "end_run_trash_program_and_run_lock", amount };
  }
  throw new Error("Unsupported CardImplementation trace success effect sequence.");
}
