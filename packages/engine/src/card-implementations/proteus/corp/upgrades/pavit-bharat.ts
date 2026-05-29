import type { CardImplementationDefinition } from "../../../types";

// card name: Pavit Bharat
// text: Install only in a subsidiary data fort. On rez, replace all cards in this fort from HQ.
export const proteusPavitBharatImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_069_pavit-bharat",
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  lifecycle: {
    on_rez: [
      {
        kind: "replace_source_fort_cards_from_hq",
        include: "root_and_ice",
        installCost: "free",
        visibility: "hidden_info_barrier",
      },
    ],
  },
};
