import type { CardImplementationDefinition } from "../../../types";

// card name: Ice and Data Special Report
// text: Expose up to five cards installed in or on a single data fort.
export const proteusIceAndDataSpecialReportImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_111_ice-and-data-special-report",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "expose_installed_cards",
          targets: "chosen_installed_corp_cards",
          scope: "single_data_fort",
          min: 0,
          max: 5,
          visibility: "public",
        },
      ],
    },
  ],
};
