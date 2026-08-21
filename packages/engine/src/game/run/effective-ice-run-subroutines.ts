import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  SubroutineDefinition,
} from "@netgrid/shared";
import {
  additionalSubroutinesForIce,
  copiedRunSubroutinesForIceAfterOriginal,
  currentEncounterAdditionalSubroutinesForIce,
  dynamicSubroutineAttributionFor,
} from "../../ability-engine/additional-subroutine-modifiers";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";
import { cardCounter } from "../state/turn-flags-counters";
import { publicIceRunSubroutineDerivation } from "./public-ice-run-derivation";

/**
 * Derives the exact public subroutine sequence currently belonging to an ICE.
 * Encounter resolution, PlayerView quotes, and effects that select a current
 * subroutine must all consume this authority.
 */
export function effectiveIceRunSubroutines(
  state: GameState,
  iceId: CardInstanceId,
  definition: CardDefinition,
): SubroutineDefinition[] {
  if (definition.type !== "ice") return [];
  const printedSubroutines =
    printedSubroutinesForCardImplementation(definition) ??
    definition.subroutines ??
    [];
  const publicDerivation = publicIceRunSubroutineDerivation(
    state,
    iceId,
    printedSubroutines,
  );
  const transmutationCopies = cardCounter(state, iceId, "mark");
  const effectiveBase = [
    ...publicDerivation.printedSubroutines.flatMap((subroutine) =>
      repeatSelfProvidedSubroutine(subroutine, transmutationCopies),
    ),
    ...runDurationAdditionalSubroutinesForIce(state, iceId),
    ...publicDerivation.appendedSubroutines
      .filter((subroutine) => subroutine.type === "end_the_run")
      .flatMap((subroutine) =>
        repeatSelfProvidedSubroutine(subroutine, transmutationCopies),
      ),
    ...currentEncounterAdditionalSubroutinesForIce(state, iceId).flatMap(
      (subroutine) =>
        repeatSelfProvidedSubroutine(subroutine, transmutationCopies),
    ),
    ...publicDerivation.appendedSubroutines
      .filter((subroutine) => subroutine.type === "initiate_trace")
      .flatMap((subroutine) =>
        repeatSelfProvidedSubroutine(subroutine, transmutationCopies),
      ),
    ...additionalSubroutinesForIce(state, iceId).flatMap((subroutine) =>
      dynamicSubroutineAttributionFor(subroutine)?.sourceCardInstanceId ===
      iceId
        ? repeatSelfProvidedSubroutine(subroutine, transmutationCopies)
        : [subroutine],
    ),
  ];
  return effectiveBase.flatMap((subroutine) =>
    subroutineWithRunScopedCopies(state, iceId, subroutine, new Set()),
  );
}

function repeatSelfProvidedSubroutine(
  subroutine: SubroutineDefinition,
  copies: number,
): SubroutineDefinition[] {
  return [
    subroutine,
    ...Array.from({ length: copies }, (_, index) => ({
      ...subroutine,
      id: `${subroutine.id}.scored_rezzed_ice_mark_modifier.${index + 1}`,
    })),
  ];
}

function subroutineWithRunScopedCopies(
  state: GameState,
  iceId: CardInstanceId,
  subroutine: SubroutineDefinition,
  ancestorIds: ReadonlySet<string>,
): SubroutineDefinition[] {
  if (ancestorIds.has(subroutine.id))
    throw new Error("runtime_copied_subroutine_cycle");
  const nextAncestors = new Set(ancestorIds);
  nextAncestors.add(subroutine.id);
  return [
    subroutine,
    ...copiedRunSubroutinesForIceAfterOriginal(
      state,
      iceId,
      subroutine.id,
    ).flatMap((copy) =>
      subroutineWithRunScopedCopies(state, iceId, copy, nextAncestors),
    ),
  ];
}

function runDurationAdditionalSubroutinesForIce(
  state: GameState,
  iceId: CardInstanceId,
): SubroutineDefinition[] {
  const modifiers = state.run?.runDurationAdditionalSubroutineModifiers ?? [];
  if (modifiers.length === 0) return [];
  if (!iceIsOnCurrentRunServer(state, iceId)) return [];
  return modifiers
    .filter((modifier) => modifier.sourceCardInstanceId !== iceId)
    .map((modifier) => {
      const sourceTitle =
        CARD_DEFINITIONS_BY_ID[modifier.sourceDefinitionId]?.title ??
        modifier.sourceDefinitionId;
      return {
        id: `run_duration.${modifier.modifierId}.end_the_run`,
        type: "end_the_run",
        dynamicSubroutine: {
          internalId: `run_duration.${modifier.modifierId}.additional_subroutine`,
          publicId: `run_duration.${modifier.sourceDefinitionId}.additional_subroutine`,
          sourceCardInstanceId: modifier.sourceCardInstanceId,
          sourceDefinitionId: modifier.sourceDefinitionId,
          sourceTitle,
          modifierKind: "additional_subroutine",
          runDuration: true,
          subroutineKind: "end_the_run",
        },
      } as SubroutineDefinition;
    });
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
