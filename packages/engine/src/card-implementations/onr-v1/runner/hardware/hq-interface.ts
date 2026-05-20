import type { CardImplementationDefinition } from "../../../types";

// card name: HQ Interface
// text: Whenever you access cards from HQ, access an additional card from HQ.
export const hqInterfaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_129_hq-interface",
  modifiers: [
    {
      kind: "access_count",
      sourceZone: "runner_installed",
      activeWhile: "installed",
      server: "hq",
      amount: 1,
      visibility: "public",
    },
  ],
};
