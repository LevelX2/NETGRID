import type { CardImplementationDefinition } from "../../../types";

// card name: Hunting Pack
// text: For each rezzed piece of ice installed outside Hunting Pack, Hunting Pack has one "*Trace 5-If trace is successful, give Runner a tag" subroutine.
export const proteusHuntingPackImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_026_hunting-pack",
  relativeIce: {
    kind: "rezzed_ice_outside_this_ice",
    dynamicTraceSubroutines: {
      baseTraceStrength: 5,
      traceSuccessEffect: { type: "add_tag", amount: 1 },
      visibility: "public",
    },
  },
};
