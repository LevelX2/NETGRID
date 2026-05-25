import type { CardImplementationDefinition } from "../../../types";

// card name: Digiconda
// text: *Do 2 Net damage. *End the run. Pay X, above the rez cost, when you rez Digiconda. X is Digiconda's strength, and X cannot be greater than 6.
export const proteusDigicondaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_020_digiconda",
  variableRez: {
    kind: "x_strength",
    additionalCostPerValue: 1,
    minValue: 0,
    maxValue: 6,
    visibility: "public",
  },
};
