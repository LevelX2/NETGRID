import type {
  CardInstanceId,
  GameState,
  SubroutineDefinition,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";

export type PublicIceRunSubroutineDerivation = {
  printedSubroutines: SubroutineDefinition[];
  appendedSubroutines: SubroutineDefinition[];
};

/**
 * Derives only public, deterministic changes to an ICE's printed encounter
 * subroutines. Both encounter resolution and PlayerView quotes consume this
 * source so a known rezzed ICE cannot advertise a different public path than
 * the one the engine will resolve.
 */
export function publicIceRunSubroutineDerivation(
  state: GameState,
  iceId: CardInstanceId,
  printedSubroutines: readonly SubroutineDefinition[],
): PublicIceRunSubroutineDerivation {
  const instance = state.cardInstances[iceId];
  const implementation = instance?.definitionId
    ? cardImplementationForDefinitionId(instance.definitionId)
    : undefined;
  const variableRez = implementation?.variableRez;
  const variableIceState = instance?.variableIceState;
  const relativeIce = implementation?.relativeIce;
  const rezzedIceOutsideThisIce = rezzedIceOutsideThisIceCount(state, iceId);

  const adjustedPrintedSubroutines = printedSubroutines.map((subroutine) => {
    if (subroutine.type === "initiate_trace") {
      if (
        variableRez?.kind === "x_strength" &&
        variableIceState?.family === "x_strength"
      ) {
        const value = Math.max(0, Math.floor(variableIceState.value));
        return {
          ...subroutine,
          ...(variableRez.traceBaseFromValue
            ? { baseTraceStrength: value }
            : {}),
          ...(variableRez.traceBidLimitFromValue
            ? { traceBidLimit: value }
            : {}),
        };
      }
    }
    if (
      subroutine.type === "do_damage" &&
      relativeIce?.dynamicDamageSubroutine?.visibility === "public" &&
      relativeIce.dynamicDamageSubroutine.subroutineId === subroutine.id
    ) {
      return {
        ...subroutine,
        amount:
          rezzedIceOutsideThisIce *
          relativeIce.dynamicDamageSubroutine.amountPerCount,
      };
    }
    return subroutine;
  });

  const appendedSubroutines: SubroutineDefinition[] = [];
  if (variableIceState?.family === "paid_end_the_run_subroutines") {
    const subroutineCount = Math.max(
      0,
      Math.floor(variableIceState.subroutineCount ?? 0),
    );
    for (let index = 0; index < subroutineCount; index += 1) {
      appendedSubroutines.push({
        id: `variable_ice_paid_end_the_run_${index + 1}`,
        type: "end_the_run",
      });
    }
  }
  if (relativeIce?.dynamicTraceSubroutines?.visibility === "public") {
    for (let index = 0; index < rezzedIceOutsideThisIce; index += 1) {
      appendedSubroutines.push({
        id: `relative_ice_outside_${instance?.definitionId}.trace.${index + 1}`,
        type: "initiate_trace",
        baseTraceStrength:
          relativeIce.dynamicTraceSubroutines.baseTraceStrength,
        traceSuccessEffect:
          relativeIce.dynamicTraceSubroutines.traceSuccessEffect,
      });
    }
  }

  return {
    printedSubroutines: adjustedPrintedSubroutines,
    appendedSubroutines,
  };
}

export function publicEncounterTemporaryTraceCreditsForIce(
  state: GameState,
  iceId: CardInstanceId,
): number | undefined {
  const definitionId = state.cardInstances[iceId]?.definitionId;
  const iceEncounter = definitionId
    ? cardImplementationForDefinitionId(definitionId)?.iceEncounter
    : undefined;
  if (
    iceEncounter?.kind !== "add_encounter_temporary_credits" ||
    iceEncounter.visibility !== "public" ||
    iceEncounter.side !== "corp" ||
    iceEncounter.usableFor !== "this_ice_printed_trace_subroutines"
  )
    return undefined;
  const amount = Math.max(0, Math.floor(iceEncounter.amount));
  return amount > 0 ? amount : undefined;
}

function rezzedIceOutsideThisIceCount(
  state: GameState,
  iceId: CardInstanceId,
): number {
  const instance = state.cardInstances[iceId];
  const zone = instance?.zone;
  if (!zone || zone.side !== "corp" || zone.zone !== "serverIce") return 0;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === zone.serverId,
  );
  if (!server) return 0;
  const iceIndex = server.ice.indexOf(iceId);
  if (iceIndex < 0) return 0;
  return server.ice
    .slice(iceIndex + 1)
    .filter((candidateId) => state.cardInstances[candidateId]?.rezzed === true)
    .length;
}
