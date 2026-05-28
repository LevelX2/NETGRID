import type { CardImplementationDefinition } from "../../../types";

// card name: Executive Boot Camp
// text: Discard a card at random: Gain [2]. Use only during a run. At the end of the run, return to the bank any of the [2] not spent.
export const proteusExecutiveBootCampImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_058_executive-boot-camp",
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [{ kind: "corp_random_discard_hq", amount: 1 }],
      label: "Executive Boot Camp: 2 Run-Credits nehmen",
      effects: [
        {
          kind: "gain_temporary_corp_run_credits",
          recipient: "corp",
          amount: 2,
          usableFor: "corp_costs_during_this_run",
          cleanup: "run_end",
          visibility: "public",
        },
      ],
    },
  ],
};
