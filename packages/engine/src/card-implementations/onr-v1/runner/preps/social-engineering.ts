import type { CardImplementationDefinition } from "../../../types";

// card name: Social Engineering
// text: Hide at least 2 from your pool in your hand; the Corp then guesses how many bits you hid. If the Corp guesses correctly, lose that many bits. Otherwise, choose a data fort and a piece of ice on that fort. Then make a run on that fort, during which you automatically pass that piece of ice.
export const socialEngineeringImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_111_social-engineering",
  hiddenReplacementLongtail: {
    kind: "social_engineering_secret_guess_run",
    visibility: "hidden_info_barrier",
  },
};
