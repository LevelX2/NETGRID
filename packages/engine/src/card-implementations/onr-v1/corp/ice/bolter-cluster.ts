import type { CardImplementationDefinition } from "../../../types";

// card name: Bolter Cluster
// text: *Do 4 Net damage. *Runner cannot break any subroutines of the next piece of ice encountered during the run.
export const bolterClusterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_224_bolter-cluster",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 4,
      preventable: true,
      text: "*Do 4 Net damage.",
    },
    {
      kind: "prohibit_break_next_ice",
      text: "*Runner cannot break any subroutines of the next piece of ice encountered during the run.",
    },
  ],
};
