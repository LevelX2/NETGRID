import type { CardImplementationDefinition } from "../../../types";

// card name: Forgotten Backup Chip
// text: Search your trash for a program and bring it into your hand.
export const forgottenBackupChipImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_087_forgotten-backup-chip",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "search_trash_to_grip",
          filter: "program",
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
