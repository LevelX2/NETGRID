import type { CardImplementationDefinition } from "../../../types";

// card name: Raymond Ellison
// text: Install Raymond Ellison only in a subsidiary data fort. [T]: Remove any number of advancement counters from cards installed in this data fort. Gain [3] for each advancement counter removed. Use this ability only during a run. At the end of the run, return to the bank any of the bits gained that you did not spend.
export const proteusRaymondEllisonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_071_raymond-ellison",
  installCapabilities: [
    {
      kind: "install_only_inside_subsidiary_data_fort",
      visibility: "public",
    },
  ],
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [{ kind: "tap_source", amount: 1 }],
      effects: [
        {
          kind: "remove_same_fort_advancement_counters_for_run_credits",
          creditsPerCounter: 3,
          maxAmount: "all",
          cleanup: "run_end",
          visibility: "public",
        },
      ],
    },
  ],
};
