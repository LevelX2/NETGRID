import type { CardImplementationDefinition } from "../../../types";

// card name: Lucidrine Booster Drug
// text: Make a run, and gain [9], which you may use only during that run. After that run is completed, suffer 1 brain damage; this damage cannot be prevented. Then, return to the bank any of the [9] not spent.
export const lucidrineBoosterDrugImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_098_lucidrine-booster-drug",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "make_run",
          target: { kind: "chosen_server" },
          runTemporaryCredits: {
            side: "runner",
            amount: 9,
            usableFor: "any_runner_cost_during_this_run",
            returnUnusedAtRunEnd: true,
          },
          afterRunCompletedUnpreventableCoreDamage: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
