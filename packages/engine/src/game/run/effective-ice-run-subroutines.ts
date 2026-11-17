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
  type DynamicSubroutineDefinition,
} from "../../ability-engine/additional-subroutine-modifiers";
import { printedSubroutinesForCardImplementation } from "../../ability-engine/printed-subroutine-implementations";
import { cardCounter } from "../state/turn-flags-counters";
import { publicIceRunSubroutineDerivation } from "./public-ice-run-derivation";
import {
  requireSubroutineProvenance,
  subroutineProvenanceKey,
} from "../../ability-engine/subroutine-provenance";

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
  // ICE-owned and encounter-scoped additions become part of the current ICE
  // before external modifiers. Run-duration "after all other" contributions
  // are deliberately last; run-scoped copies remain adjacent to their source.
  const orderedBaseSubroutines = [
    ...publicDerivation.printedSubroutines.flatMap((subroutine, index) =>
      repeatSelfProvidedSubroutine(
        { ...subroutine, provenance: ["p", definition.id, index] },
        transmutationCopies,
      ),
    ),
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
    ...runDurationAdditionalSubroutinesForIce(state, iceId),
  ];
  return orderedBaseSubroutines
    .flatMap((subroutine) =>
      subroutineWithRunScopedCopies(state, iceId, subroutine, new Set()),
    )
    .map((subroutine, index) => ({
      ...subroutine,
      id: index.toString(36),
    }));
}

function repeatSelfProvidedSubroutine(
  subroutine: SubroutineDefinition,
  copies: number,
): SubroutineDefinition[] {
  return [
    subroutine,
    ...Array.from({ length: copies }, (_, index) => ({
      ...subroutine,
      id: `m${index.toString(36)}`,
      provenance: [
        "m",
        requireSubroutineProvenance(subroutine),
        index,
      ] as const,
    })),
  ];
}

function subroutineWithRunScopedCopies(
  state: GameState,
  iceId: CardInstanceId,
  subroutine: SubroutineDefinition,
  ancestorIds: ReadonlySet<string>,
): SubroutineDefinition[] {
  const provenance = requireSubroutineProvenance(subroutine);
  const originKey = subroutineProvenanceKey(provenance);
  if (ancestorIds.has(originKey))
    throw new Error("runtime_copied_subroutine_cycle");
  const nextAncestors = new Set(ancestorIds);
  nextAncestors.add(originKey);
  return [
    subroutine,
    ...copiedRunSubroutinesForIceAfterOriginal(
      state,
      iceId,
      provenance,
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
  return modifiers.flatMap((modifier, index) => {
    if (modifier.sourceCardInstanceId === iceId) return [];
    const sourceDefinition =
      CARD_DEFINITIONS_BY_ID[modifier.sourceDefinitionId];
    if (!sourceDefinition)
      throw new Error("runtime_run_subroutine_source_missing");
    const sourceTitle = sourceDefinition.title;
    return [
      {
        id: `r${index.toString(36)}`,
        provenance: [
          "r",
          modifier.sourceDefinitionId,
          modifier.sourceCardInstanceId,
          index,
        ],
        type: "end_the_run",
        dynamicSubroutine: {
          sourceCardInstanceId: modifier.sourceCardInstanceId,
          sourceDefinitionId: modifier.sourceDefinitionId,
          sourceTitle,
          modifierKind: "additional_subroutine",
          runDuration: true,
          subroutineKind: "end_the_run",
        },
      } satisfies DynamicSubroutineDefinition,
    ];
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
