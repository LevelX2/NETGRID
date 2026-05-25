import type { CardImplementationDefinition } from "../../../types";

// card name: Precision Bribery
// text: The Corp cannot create any new data forts. The Corp may trash Precision Bribery by taking an action to pay [4].
export const proteusPrecisionBriberyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_146_precision-bribery",
  modifiers: [
    {
      kind: "new_data_fort_creation_lock",
      activeWhile: "installed",
      sourceZone: "runner_installed",
      side: "corp",
      visibility: "public",
      blocks: "corp_new_remote_installs",
      corpTrashSourceCost: {
        clicks: 1,
        credits: 4,
      },
    },
  ],
};
