import type { CardImplementationDefinition } from "../../../types";

// card name: Restrictive Net Zoning
// text: Choose a data fort when Restrictive Net Zoning is installed. The Corp must pay [2], in addition to the normal cost, to install ice on that fort.
export const restrictiveNetZoningImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_173_restrictive-net-zoning",
  installTargetBinding: {
    kind: "choose_data_fort_on_install",
    stores: "selectedServerId",
    visibility: "public",
  },
  modifiers: [
    {
      kind: "install_cost",
      operation: "increase",
      amount: 2,
      activeWhile: "installed",
      sourceZone: "runner_installed",
      visibility: "public",
      appliesTo: {
        side: "corp",
        cardType: "ice",
        selectedServerAsSource: true,
      },
    },
  ],
};
