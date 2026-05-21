import type { CardImplementationDefinition } from "../../../types";

// card name: Laser Wire
// text: *Do 1 Net damage. *End the run.
export const laserWireImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_253_laser-wire",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 1,
      preventable: true,
      text: "*Do 1 Net damage.",
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
    },
  ],
};
