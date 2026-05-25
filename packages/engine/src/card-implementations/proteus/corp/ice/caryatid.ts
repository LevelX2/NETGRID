import type { CardImplementationDefinition } from "../../../types";

// card name: Caryatid
// text: *End the run. When you rez Caryatid, you may pay [1], above the rez cost, to make it a code gate instead of a wall.
export const proteusCaryatidImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_013_caryatid",
  variableRez: {
    kind: "alternate_subtype",
    additionalCost: 1,
    baseSubtypes: ["wall"],
    alternateSubtypes: ["code_gate"],
    visibility: "public",
  },
};
