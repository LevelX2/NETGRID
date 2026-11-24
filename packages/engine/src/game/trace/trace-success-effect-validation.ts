import type { TraceSuccessEffect } from "@netgrid/shared";
import { traceCounterEffectDefinitionFor } from "./runner-counter-effects";

export function isSupportedTraceSuccessEffect(
  effect: TraceSuccessEffect,
  counterDefinitionFor: (
    counterType: unknown,
  ) => unknown = traceCounterEffectDefinitionFor,
): boolean {
  if (effect.type === "none") return true;
  if (effect.type === "add_counter") {
    return (
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      counterDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (effect.type === "add_tag_and_counter") {
    return (
      Number.isInteger(effect.tagAmount) &&
      effect.tagAmount >= 0 &&
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      counterDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (
    effect.type === "end_run_and_run_lock" ||
    effect.type === "end_run_trash_program_and_run_lock"
  ) {
    return Number.isInteger(effect.amount) && effect.amount > 0;
  }
  if (effect.type === "end_run_trash_hardware_and_unpreventable_meat_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  if (effect.type === "net_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  if (effect.type === "add_tags_by_trace_margin_over_runner_link") return true;
  if (effect.type === "trash_runner_resource_and_add_tag")
    return (
      typeof effect.targetCardInstanceId === "string" &&
      effect.targetCardInstanceId.length > 0
    );
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}
