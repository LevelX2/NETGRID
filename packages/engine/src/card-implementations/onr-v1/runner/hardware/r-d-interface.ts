import type { CardImplementationDefinition } from "../../../types";

// card name: R&D Interface
// text: Whenever you access cards from R&D, access an additional card from R&D.
export const rAndDInterfaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_139_r-and-d-interface",
  modifiers: [
    {
      kind: "access_count",
      sourceZone: "runner_installed",
      activeWhile: "installed",
      server: "rd",
      amount: 1,
      visibility: "public",
    },
  ],
};
