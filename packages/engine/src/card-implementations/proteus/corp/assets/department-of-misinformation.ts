import type { CardImplementationDefinition } from "../../../types";

// card name: Department of Misinformation
// text: You may rez Department of Misinformation when Runner attempts to expose a card. [1]: Prevent a card from being exposed.
export const proteusDepartmentOfMisinformationImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_056_department-of-misinformation",
  corpUtility: {
    kind: "expose_prevention",
    cost: { kind: "credit", amount: 1 },
    timing: "during_expose_attempt",
    visibility: "public",
  },
};
