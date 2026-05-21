import type { CardImplementationDefinition } from "../../../types";

// card name: Umbrella Policy
// text: [T]: Prevent an installed program or hardware card from being trashed.
export const umbrellaPolicyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_186_umbrella-policy",
  trashPreventionSources: [
    {
      kind: "prevent_installed_card_trash",
      protectsCardTypes: ["program", "hardware"],
      mode: "one_card",
      cost: { kind: "trash_source" },
      priority: 120,
      visibility: "public",
    },
  ],
};
