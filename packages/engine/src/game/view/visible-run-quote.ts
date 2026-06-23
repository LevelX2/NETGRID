import {
  DEMO_CARDS_BY_ID,
  type CardInstanceId,
  type GameState,
  type SubroutineDefinition,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import {
  additionalSubroutinesForIce,
  copiedRunSubroutinesForIceAfterOriginal,
  currentEncounterAdditionalSubroutinesForIce,
  dynamicSubroutineAttributionFor,
} from "../../ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";

export function visibleEffectiveIceRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
): VisibleEffectiveIceRunQuote | undefined {
  if (!visibleIce.known || visibleIce.rezzed !== true || !visibleIce.definitionId)
    return undefined;
  const definition = DEMO_CARDS_BY_ID[visibleIce.definitionId];
  if (!definition || definition.type !== "ice") return undefined;
  const printedSubroutines =
    printedSubroutinesForCardImplementation(definition) ??
    definition.subroutines ??
    [];
  const subroutines = [
    ...printedSubroutines.flatMap((subroutine) => [
      subroutine,
      ...copiedRunSubroutinesForIceAfterOriginal(state, iceId, subroutine.id),
    ]),
    ...runDurationAdditionalSubroutinesForIce(state, iceId),
    ...currentEncounterAdditionalSubroutinesForIce(state, iceId),
    ...additionalSubroutinesForIce(state, iceId),
  ].map(visibleEffectiveSubroutine);
  const breakCostQuote = quoteBreakSubroutineCostModifiers(state, iceId, 1);
  const runBreakCost = iceIsOnCurrentRunServer(state, iceId)
    ? Math.max(0, Math.floor(state.run?.breakSubroutineAdditionalCost ?? 0))
    : 0;
  const breakSubroutineAdditionalCostPerSubroutine =
    runBreakCost + breakCostQuote.perSubroutineAdditionalCost;

  return {
    iceInstanceId: visibleIce.instanceId,
    iceDefinitionId: visibleIce.definitionId,
    effectiveStrength: Math.max(0, Math.floor(visibleIce.strength ?? 0)),
    subroutines,
    ...(breakSubroutineAdditionalCostPerSubroutine > 0
      ? { breakSubroutineAdditionalCostPerSubroutine }
      : {}),
    ...(breakCostQuote.modifiers.length > 0
      ? {
          breakSubroutineCostSourceDefinitionIds: breakCostQuote.modifiers.map(
            (modifier) => modifier.sourceDefinitionId,
          ),
          breakSubroutineCostSourceTitles: breakCostQuote.modifiers.map(
            (modifier) => modifier.sourceTitle,
          ),
        }
      : {}),
  };
}

function runDurationAdditionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const sourceIceId = state.run?.futureEncounterEndTheRunSourceIceId;
  if (!sourceIceId || sourceIceId === iceId) return [];
  if (!iceIsOnCurrentRunServer(state, iceId)) return [];
  const sourceDefinitionId = state.cardInstances[sourceIceId]?.definitionId;
  const sourceTitle = sourceDefinitionId
    ? DEMO_CARDS_BY_ID[sourceDefinitionId]?.title
    : undefined;
  return [
    {
      id: "v1922_tutor_future_end_the_run",
      type: "end_the_run",
      ...(sourceDefinitionId
        ? {
            dynamicSubroutine: {
              internalId: `run_duration.${sourceDefinitionId}.additional_subroutine.${sourceIceId}`,
              publicId: `run_duration.${sourceDefinitionId}.additional_subroutine`,
              sourceCardInstanceId: sourceIceId,
              sourceDefinitionId,
              sourceTitle: sourceTitle ?? sourceDefinitionId,
              modifierKind: "additional_subroutine",
              subroutineKind: "end_the_run",
            },
          }
        : {}),
    } as SubroutineDefinition,
  ];
}

function iceIsOnCurrentRunServer(
  state: GameState,
  iceId: CardInstanceId,
): boolean {
  const run = state.run;
  const zone = state.cardInstances[iceId]?.zone;
  return (
    Boolean(run) &&
    zone?.side === "corp" &&
    zone.zone === "serverIce" &&
    zone.serverId === run?.attackedServerId
  );
}

function visibleEffectiveSubroutine(
  subroutine: SubroutineDefinition,
): VisibleEffectiveSubroutine {
  const dynamic = dynamicSubroutineAttributionFor(subroutine);
  const unbrokenRunEffect = visibleUnbrokenRunEffectForSubroutine(subroutine);
  return {
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.amount !== undefined ? { amount: subroutine.amount } : {}),
    ...(subroutine.baseTraceStrength !== undefined
      ? { baseTraceStrength: subroutine.baseTraceStrength }
      : {}),
    ...(subroutine.traceSuccessEffect
      ? { traceSuccessEffect: subroutine.traceSuccessEffect }
      : {}),
    ...(subroutine.breakTags ? { breakTags: subroutine.breakTags.slice() } : {}),
    ...(dynamic
      ? {
          sourceDefinitionId: dynamic.sourceDefinitionId,
          sourceTitle: dynamic.sourceTitle,
          dynamicSourceKind:
            subroutine.id === "v1922_tutor_future_end_the_run"
              ? "run_duration_additional_subroutine"
              : "additional_subroutine",
        }
      : {}),
    ...(unbrokenRunEffect ? { unbrokenRunEffect } : {}),
  };
}

function visibleUnbrokenRunEffectForSubroutine(
  subroutine: SubroutineDefinition,
): VisibleEffectiveSubroutine["unbrokenRunEffect"] | undefined {
  const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
  switch (subroutine.type) {
    case "set_run_future_end_the_run_subroutine":
      return { addsFutureEndTheRunSubroutines: 1 };
    case "set_run_break_subroutine_cost_modifier":
      return amount > 0
        ? { increasesFutureBreakCostPerSubroutine: amount }
        : undefined;
    case "set_run_future_strength_bonus":
      return amount > 0 ? { increasesFutureIceStrength: amount } : undefined;
    case "set_next_encounter_no_break_subroutines":
      return { preventsFutureBreaking: true };
    case "set_run_encounter_tax":
      return amount > 0 ? { addsFutureEncounterCost: amount } : undefined;
    case "set_run_jack_out_lock":
    case "set_next_encounter_lock":
      return { preventsJackOut: true };
    case "set_next_encounter_unless_fully_break_damage":
    case "set_run_pass_rezzed_ice_program_trash":
    case "set_run_viral_15":
    case "do_damage":
    case "trash_installed_program":
    case "trash_installed_program_unless_runner_pays":
      return { causesDamageOrProgramTrash: true };
    case "set_runner_run_lock_actions":
      return { createsRunLockOrActionTax: Math.max(1, amount) };
    case "set_runner_forgo_next_action":
      return { createsRunLockOrActionTax: 1 };
    default:
      return undefined;
  }
}
