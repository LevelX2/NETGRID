/**
 * Converts declarative printed ICE subroutines into engine SubroutineDefinitions.
 *
 * This module is the bridge for migrated ICE card text only. It must not append
 * dynamic subroutines, execute subroutine effects, or contain concrete ICE ids.
 */
import type { CardDefinition, SubroutineDefinition } from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import type { CardPrintedSubroutineImplementation } from "./definition-types";
import { traceSuccessEffectForCardImplementation } from "./trace-implementations";

function printedSubroutineId(
  definition: CardDefinition,
  index: number,
  subroutine: CardPrintedSubroutineImplementation,
): string {
  return `card_implementation.${definition.id}.printed_subroutine.${index + 1}.${subroutine.kind === "damage" ? `${subroutine.damageType}_damage` : subroutine.kind}`;
}

function printedSubroutineDefinitionForImplementation(
  definition: CardDefinition,
  subroutine: CardPrintedSubroutineImplementation,
  index: number,
): SubroutineDefinition {
  if (subroutine.visibility !== "public")
    throw new Error("Unsupported printed subroutine visibility.");
  if (subroutine.kind === "end_the_run") {
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "end_the_run",
    };
  }
  if (subroutine.kind === "trash_program") {
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "trash_installed_program",
    };
  }
  if (
    subroutine.kind === "prohibit_break_next_ice" ||
    subroutine.kind === "prohibit_break_and_jack_out_next_ice"
  ) {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type:
        subroutine.kind === "prohibit_break_next_ice"
          ? "set_next_encounter_no_break_subroutines"
          : "set_next_encounter_lock",
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  if (subroutine.kind === "run_duration_ice_strength") {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    const amount = Math.max(0, Math.floor(subroutine.amount));
    if (amount <= 0)
      throw new Error("Run-duration ICE-strength subroutines require a positive amount.");
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "set_run_future_strength_bonus",
      amount,
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  if (subroutine.kind === "run_duration_additional_subroutine") {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    if (
      subroutine.append !== "after_existing" ||
      subroutine.subroutine.kind !== "end_the_run"
    )
      throw new Error("Unsupported run-duration additional subroutine.");
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "set_run_future_end_the_run_subroutine",
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  if (subroutine.kind === "run_duration_break_subroutine_cost") {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    const amount = Math.max(0, Math.floor(subroutine.amount));
    if (amount <= 0)
      throw new Error("Run-duration break-cost subroutines require a positive amount.");
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "set_run_break_subroutine_cost_modifier",
      amount,
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  if (subroutine.kind === "run_duration_cannot_jack_out") {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "set_run_jack_out_lock",
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  if (subroutine.kind === "damage") {
    if (subroutine.preventable !== true)
      throw new Error("Unsupported unpreventable printed damage subroutine.");
    const amount = Math.max(0, Math.floor(subroutine.amount));
    if (amount <= 0)
      throw new Error("Printed damage subroutines require a positive amount.");
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "do_damage",
      damageType: subroutine.damageType === "brain" ? "core" : "net",
      amount,
    };
  }
  if (subroutine.kind === "trace") {
    const breakTags = subroutine.breakTags ? [...subroutine.breakTags] : [];
    const baseTraceStrength = Math.max(
      0,
      Math.floor(subroutine.baseTraceStrength),
    );
    return {
      id: printedSubroutineId(definition, index, subroutine),
      type: "initiate_trace",
      baseTraceStrength,
      traceSuccessEffect: traceSuccessEffectForCardImplementation(
        subroutine.onSuccess,
      ),
      ...(breakTags.length ? { breakTags } : {}),
    };
  }
  throw new Error(`Unsupported printed subroutine: ${JSON.stringify(subroutine)}`);
}

/**
 * Returns CardImplementation-provided printed subroutines for migrated ICE.
 *
 * Undefined means the card is not migrated for printed subroutines and the
 * caller should keep using the legacy/shared card-definition list.
 */
export function printedSubroutinesForCardImplementation(
  definition: CardDefinition,
): SubroutineDefinition[] | undefined {
  const implementation = cardImplementationForDefinitionId(definition.id);
  if (!implementation?.printedSubroutines) return undefined;
  if (definition.type !== "ice")
    throw new Error("Printed subroutines can only be declared for ICE.");
  return implementation.printedSubroutines.map((subroutine, index) =>
    printedSubroutineDefinitionForImplementation(definition, subroutine, index),
  );
}
