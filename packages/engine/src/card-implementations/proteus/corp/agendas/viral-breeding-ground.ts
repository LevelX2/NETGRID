import type { CardImplementationDefinition } from "../../../types";

// card name: Viral Breeding Ground
// text: When scored, trash all cards installed in or on its fort. When accessed, the Corp chooses up to two installed Runner programs per advancement counter; Runner brings them into grip.
export const proteusViralBreedingGroundImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_009_viral-breeding-ground",
  lifecycle: {
    on_score: [
      {
        kind: "trash_corp_installed_cards_in_source_server",
        include: "root_and_ice",
        visibility: "hidden_info_barrier",
      },
    ],
  },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      revealIfAccessedFrom: ["rd"],
      effects: [
        {
          kind: "return_installed_runner_programs_to_grip",
          chooser: "corp",
          amount: {
            kind: "source_advancement_counter_count",
            multiplier: 2,
          },
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  ],
};
