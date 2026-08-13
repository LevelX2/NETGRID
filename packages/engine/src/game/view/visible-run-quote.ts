import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import {
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type SubroutineDefinition,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleConditionalEncounterEffect,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { dynamicSubroutineAttributionFor } from "../../ability-engine/additional-subroutine-modifiers";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { effectiveIceRunSubroutines } from "../run/effective-ice-run-subroutines";
import { publicEncounterTemporaryTraceCreditsForIce } from "../run/public-ice-run-derivation";

export function visibleEffectiveIceRunQuote(
  state: GameState,
  iceId: CardInstanceId,
  visibleIce: VisibleCard,
): VisibleEffectiveIceRunQuote | undefined {
  const definitionId = visibleIce.definitionId;
  if (!visibleIce.known || visibleIce.rezzed !== true || !definitionId)
    return undefined;
  const definition = CARD_DEFINITIONS_BY_ID[definitionId];
  if (!definition || definition.type !== "ice") return undefined;
  const subroutines = effectiveIceRunSubroutines(state, iceId, definition).map(
    (subroutine) =>
      visibleEffectiveSubroutine(subroutine, {
        definitionId,
        title: definition.title,
      }),
  );
  const breakCostQuote = quoteBreakSubroutineCostModifiers(state, iceId, 1);
  const runBreakCost = iceIsOnCurrentRunServer(state, iceId)
    ? Math.max(0, Math.floor(state.run?.breakSubroutineAdditionalCost ?? 0))
    : 0;
  const breakSubroutineAdditionalCostPerSubroutine =
    runBreakCost + breakCostQuote.perSubroutineAdditionalCost;
  const encounterTemporaryTraceCredits =
    publicEncounterTemporaryTraceCreditsForIce(state, iceId);
  const conditionalEncounterEffects =
    visibleConditionalEncounterEffects(definitionId);

  return {
    iceInstanceId: visibleIce.instanceId,
    iceDefinitionId: definitionId,
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
    ...(encounterTemporaryTraceCredits
      ? {
          encounterTemporaryTraceCredits,
        }
      : {}),
    ...(conditionalEncounterEffects.length > 0
      ? { conditionalEncounterEffects }
      : {}),
  };
}

function visibleConditionalEncounterEffects(
  definitionId: VisibleCard["definitionId"],
): VisibleConditionalEncounterEffect[] {
  if (!definitionId) return [];
  const implementation = cardImplementationForDefinitionId(definitionId);
  if (!implementation) return [];
  const effects: VisibleConditionalEncounterEffect[] = [];
  for (const ability of implementation.abilities ?? []) {
    if (ability.kind !== "activated" || ability.timing !== "corp_encounter") {
      continue;
    }
    if (
      !ability.effects.some(
        (effect) =>
          effect.kind === "add_current_encounter_additional_subroutine" &&
          effect.subroutine.kind === "end_the_run" &&
          effect.visibility === "public",
      )
    ) {
      continue;
    }
    const creditCost = ability.costs.reduce(
      (sum, cost) =>
        sum +
        (cost.kind === "credit" ? Math.max(0, Math.floor(cost.amount)) : 0),
      0,
    );
    if (creditCost > 0) {
      effects.push({
        kind: "corp_paid_add_end_the_run_subroutine",
        creditCost,
      });
    }
  }
  const randomEncounter = implementation.iceEncounter;
  if (randomEncounter?.kind === "roll_die_strength_or_derez_auto_pass") {
    effects.push({
      kind: "random_strength_or_derez_auto_pass",
      dieFaces: randomEncounter.dieFaces,
      autoPassResult: randomEncounter.successValue,
      maxStrengthBonus: Math.max(0, randomEncounter.successValue - 1),
    });
  }
  return effects;
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
  source: { definitionId: CardDefinitionId; title: string },
): VisibleEffectiveSubroutine {
  const dynamic = dynamicSubroutineAttributionFor(subroutine);
  const unbrokenRunEffect = visibleUnbrokenRunEffectForSubroutine(subroutine);
  const sourceDefinitionId = dynamic?.sourceDefinitionId ?? source.definitionId;
  const sourceTitle = dynamic?.sourceTitle ?? source.title;
  return {
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.amount !== undefined ? { amount: subroutine.amount } : {}),
    ...(subroutine.traceLimit !== undefined
      ? { traceLimit: subroutine.traceLimit }
      : {}),
    ...(subroutine.traceLimit !== undefined
      ? { traceLimit: subroutine.traceLimit }
      : {}),
    ...(subroutine.runFutureStrengthCancelPaymentAmount !== undefined
      ? {
          runFutureStrengthCancelPaymentAmount:
            subroutine.runFutureStrengthCancelPaymentAmount,
        }
      : {}),
    ...(subroutine.traceSuccessEffect
      ? { traceSuccessEffect: subroutine.traceSuccessEffect }
      : {}),
    ...(subroutine.deflectorTarget
      ? { deflectorTarget: subroutine.deflectorTarget }
      : {}),
    ...(subroutine.deflectorCost !== undefined
      ? { deflectorCost: subroutine.deflectorCost }
      : {}),
    ...(subroutine.deflectorAutoBreakIfNoTarget !== undefined
      ? {
          deflectorAutoBreakIfNoTarget: subroutine.deflectorAutoBreakIfNoTarget,
        }
      : {}),
    ...(subroutine.breakTags
      ? { breakTags: subroutine.breakTags.slice() }
      : {}),
    sourceDefinitionId,
    sourceTitle,
    ...(dynamic
      ? {
          dynamicSourceKind:
            dynamic.runDuration === true
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
  const traceSuccessEffect =
    subroutine.type === "initiate_trace"
      ? visibleUnbrokenRunEffectForTraceSuccess(subroutine.traceSuccessEffect)
      : undefined;
  if (traceSuccessEffect) return traceSuccessEffect;
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
    case "set_run_active_ice_program_trash":
    case "do_damage":
    case "trash_installed_program":
      return { causesDamageOrProgramTrash: true };
    case "set_runner_run_lock_actions":
      return { createsRunLockOrActionTax: Math.max(1, amount) };
    case "set_runner_forgo_next_action":
    case "end_the_run_and_runner_forgoes_next_action":
      return { createsRunLockOrActionTax: 1 };
    default:
      return undefined;
  }
}

function visibleUnbrokenRunEffectForTraceSuccess(
  effect: TraceSuccessEffect | undefined,
): VisibleEffectiveSubroutine["unbrokenRunEffect"] | undefined {
  if (!effect || effect.type === "none") return undefined;
  switch (effect.type) {
    case "end_run_and_run_lock":
    case "end_run_trash_program_and_run_lock":
      return { createsRunLockOrActionTax: Math.max(1, effect.amount) };
    default:
      return undefined;
  }
}
