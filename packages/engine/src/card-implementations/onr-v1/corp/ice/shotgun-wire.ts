import type { CardImplementationDefinition } from "../../../types";

// card name: Shotgun Wire
// text: *Do 2 Net damage. *End the run.
export const shotgunWireImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_269_shotgun-wire",
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
