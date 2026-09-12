import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { effectiveIceRunSubroutines } from "./effective-ice-run-subroutines";

/** Corp-private rule facts for the ICE offered by a temporary HQ encounter.
 * This exposes effect kinds, not a preferred choice or a utility score.
 */
export function temporaryEncounterOptionFacts(
  state: GameState,
  iceId: CardInstanceId,
  definition: CardDefinition,
) {
  const instance = state.cardInstances[iceId];
  if (
    !state.run ||
    !instance ||
    instance.definitionId !== definition.id ||
    definition.type !== "ice" ||
    !state.corp.hq.includes(iceId)
  ) {
    throw new Error(
      "Temporary encounter facts require current run and own HQ ICE.",
    );
  }
  // Match the temporary encounter's zone and current-ICE binding. Existing
  // encounter additions belong to the ICE already passed, not the new one.
  const run = {
    ...state.run,
    phase: "encounter_ice" as const,
    encounteredIceId: iceId,
  };
  delete run.encounterAdditionalSubroutines;
  const projected: GameState = {
    ...state,
    run,
    cardInstances: {
      ...state.cardInstances,
      [iceId]: {
        ...instance,
        faceup: true,
        rezzed: false,
        zone: { side: "special", zone: "set_aside", visibility: "public" },
      },
    },
  };
  const implementation = cardImplementationForDefinitionId(definition.id);
  return {
    temporaryEncounterSubroutineTypes: effectiveIceRunSubroutines(
      projected,
      iceId,
      definition,
    ).map((s) => s.type),
    // Non-printed mechanical families can contribute separate effects. They
    // must not be discarded merely because the printed subroutines are future-only.
    temporaryEncounterHasAdditionalMechanics:
      implementation === undefined ||
      Object.keys(implementation).some((key) => {
        if (key === "cardDefinitionId" || key === "printedSubroutines")
          return false;
        // Temporary HQ ICE is neither installed nor rezzed. These hooks
        // cannot contribute an effect to this encounter (e.g. rez income).
        if (key === "lifecycle")
          return Object.keys(implementation.lifecycle ?? {}).some(
            (timing) => timing !== "on_rez" && timing !== "on_install",
          );
        return true;
      }),
  };
}
