import type { CardImplementationDefinition } from "../../../types";

// card name: Schematics Search Engine
// text: Whenever you access cards from HQ, expose all of the Corp's installed cards.
export const classicSchematicsSearchEngineImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_032_schematics-search-engine",
    runnerUtilityLongtail: {
      kind: "hq_access_expose_all_installed_corp_cards",
      visibility: "public",
    },
  };
