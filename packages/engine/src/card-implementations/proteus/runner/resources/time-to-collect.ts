import type { CardImplementationDefinition } from "../../../types";

export const proteusTimeToCollectImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_153_time-to-collect",
  trashPreventionSources: [
    {
      kind: "prevent_installed_card_trash",
      protectsCardTypes: ["resource"],
      excludesSelf: true,
      activeOnlyDuring: "corp_turn",
      mode: "one_or_more_simultaneous",
      cost: { kind: "trash_source" },
      priority: 30,
      visibility: "public",
    },
  ],
};
