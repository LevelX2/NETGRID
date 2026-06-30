import type { CardImplementationDefinition } from "../../../types";

// card name: Street Enforcer
// text: At the start of each run on this data fort, Runner loses [X], where X is equal to the number of tags Runner has.
export const classicStreetEnforcerImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_026_street-enforcer",
    corpUtility: {
      kind: "run_start_tax_runner_tags",
      visibility: "public",
    },
  };
