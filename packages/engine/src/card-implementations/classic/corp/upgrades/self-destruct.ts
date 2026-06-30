import type { CardImplementationDefinition } from "../../../types";

// card name: Self-Destruct
// text: Install only in a subsidiary data fort. [T]. Trash all other cards installed in or on this data fort. Do 1 Net damage for each card successfully trashed in this way. Use only when accessed.
export const classicSelfDestructImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_022_self-destruct",
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
          include: "root_and_ice",
          damageType: "net",
          amountPerTrashed: 1,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
