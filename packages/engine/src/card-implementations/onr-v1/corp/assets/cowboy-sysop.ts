import type { CardImplementationDefinition } from "../../../types";

// card name: Cowboy Sysop
// text: A: Choose one of your installed cards to be uninstalled. Store it in HQ.
export const cowboySysopImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_316_cowboy-sysop",
  corpUtility: {
    kind: "cowboy_sysop_uninstall_corp_card_to_hq",
    visibility: "hidden_info_barrier",
  },
};
