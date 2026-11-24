import { type CardInstanceId, type GameState } from "@netgrid/shared";
import { corpServerIdForInstalledCard } from "../payment";
import { definitionFor, mustInstance, mustRun, scoredCorpAgendaIds } from "../state/card-server-lookup";
import { cardCounter } from "../state/turn-flags-counters";
import { quoteBreakSubroutineCostModifiers } from "../../ability-engine/break-subroutine-cost-modifiers";
import { iceStrengthModifierBonusFor } from "../../ability-engine/ice-strength-modifiers";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type {
  BreakSubroutineCostBreakdown,
  RuntimeDeps,
} from "./runtime-shared";

export function createCardStrengthCostRuntimeServices(
  deps: RuntimeDeps,
  runtime: Pick<
    import("./lookup-runtime-port").LookupRuntimePort,
    "relativeIceStrengthBonusFor"
  >,
): import("./card-strength-cost-runtime-port").CardStrengthCostRuntimePort {
  function iceStrengthBonusFor(
    state: GameState,
    iceId: CardInstanceId,
  ): number {
    const iceServerId = corpServerIdForInstalledCard(state, iceId);
    let bonus = 0;
    for (const agendaId of scoredCorpAgendaIds(state)) {
      const agendaDefinition = definitionFor(state, agendaId);
      const scoredAgenda =
        deps.scoredAgendaImplementationForDefinition(agendaDefinition);
      if (scoredAgenda?.kind === "choose_fort_ice_strength_bonus") {
        if (
          iceServerId &&
          mustInstance(state.cardInstances, agendaId).selectedServerId ===
            iceServerId
        )
          bonus += scoredAgenda.amount;
      }
    }
    bonus += iceStrengthModifierBonusFor(state, iceId);
    bonus += cardCounter(state, iceId, "mark");
    return bonus;
  }

  function iceStrengthFor(state: GameState, iceId: CardInstanceId): number {
    const definition = definitionFor(state, iceId);
    const instance = mustInstance(state.cardInstances, iceId);
    const runEncounterBonus =
      state.run?.encounteredIceId === iceId
        ? Math.max(
            0,
            Math.floor(state.run.futureEncounterIceStrengthBonus ?? 0),
          )
        : 0;
    const pattelsReduction = cardCounter(state, iceId, "pattel");
    const baseStrength =
      instance.variableIceState?.family === "x_strength" &&
      typeof instance.variableIceState.strength === "number"
        ? instance.variableIceState.strength
        : (definition.strength ?? 0);
    const total =
      baseStrength +
      instance.strengthModifier +
      iceStrengthBonusFor(state, iceId) +
      runtime.relativeIceStrengthBonusFor(state, iceId) +
      runEncounterBonus -
      pattelsReduction;
    return Math.max(0, total);
  }

  function runRemainderStrengthBonusForBreaker(
    run: GameState["run"],
    breakerId: CardInstanceId,
  ): number {
    if (!run) return 0;
    const genericBonus = (
      (run.breakerState?.strengthModifiersByBreakerInstanceId ?? {})[
        breakerId
      ] ?? []
    ).reduce(
      (total, modifier) =>
        modifier.duration === "current_run"
          ? total + Math.max(0, Math.floor(modifier.amount))
          : total,
      0,
    );
    return (
      genericBonus +
      Math.max(
        0,
        Math.floor(run.remainderStrengthBonusByBreaker?.[breakerId] ?? 0),
      )
    );
  }

  function runBreakSubroutineAdditionalCost(run: GameState["run"]): number {
    if (!run) return 0;
    return Math.max(0, Math.floor(run.breakSubroutineAdditionalCost ?? 0));
  }

  function runnerHardwareBreakSubroutineAdditionalCost(
    state: GameState,
  ): number {
    return state.runner.rig.hardware.some(
      (cardId) =>
        cardImplementationForDefinitionId(definitionFor(state, cardId).id)
          ?.runnerUtilityLongtail?.kind === "access_point_subroutine_modifier",
    )
      ? 1
      : 0;
  }

  function breakSubroutineCostBreakdown(
    state: GameState,
    baseCost: number,
    subroutineCount = 1,
    breakerId?: CardInstanceId,
  ): BreakSubroutineCostBreakdown {
    const run = mustRun(state);
    const encounteredIceId = run.encounteredIceId;
    if (!encounteredIceId)
      throw new Error("Break-Subroutine-Kosten brauchen ein encountered ICE.");
    const legacyRunAdditionalCost = runBreakSubroutineAdditionalCost(run);
    const runnerHardwareAdditionalCost =
      runnerHardwareBreakSubroutineAdditionalCost(state);
    const cardImplementationQuote = quoteBreakSubroutineCostModifiers(
      state,
      encounteredIceId,
      subroutineCount,
      breakerId,
    );
    const cardImplementationAdditionalCost =
      cardImplementationQuote.totalAdditionalCost;
    const additionalCost =
      legacyRunAdditionalCost +
      runnerHardwareAdditionalCost +
      cardImplementationAdditionalCost;
    const totalCost = baseCost + additionalCost;
    return {
      baseCost,
      legacyRunAdditionalCost,
      runnerHardwareAdditionalCost,
      cardImplementationAdditionalCost,
      additionalCost,
      totalCost,
      publicPayload: {
        breakSubroutineBaseCost: baseCost,
        ...(additionalCost > 0
          ? {
              breakSubroutineAdditionalCost: additionalCost,
              breakSubroutineTotalCost: totalCost,
              ...(legacyRunAdditionalCost > 0
                ? { v1922CorpIceAbility: "virizz_break_cost_modifier" }
                : {}),
              ...(runnerHardwareAdditionalCost > 0
                ? {
                    runnerHardwareAbility:
                      "runner_hardware_break_cost_modifier",
                  }
                : {}),
              ...cardImplementationQuote.publicPayload,
            }
          : {}),
      },
    };
  }

  return {
    iceStrengthBonusFor,
    iceStrengthFor,
    runRemainderStrengthBonusForBreaker,
    runBreakSubroutineAdditionalCost,
    runnerHardwareBreakSubroutineAdditionalCost,
    breakSubroutineCostBreakdown,
  };
}
