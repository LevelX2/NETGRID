import type { CardImplementationDefinition } from "../../../types";

// card name: Razor Wire
// text: *Do 2 Net damage. *End the run.
export const razorWireImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_262_razor-wire",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 2,
      preventable: true,
      text: "*Do 2 Net damage.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
