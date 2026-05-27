import type { CardImplementationDefinition } from "../../../types";

// card name: Disgruntled Ice Technician
// text: Make a run. After passing a piece of ice during this run, you may derez that ice and end your run if you broke all the subroutines of that ice.
export const proteusDisgruntledIceTechnicianImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_106_disgruntled-ice-technician",
    abilities: [
      {
        kind: "on_play",
        costs: "printed",
        effects: [
          {
            kind: "make_run",
            target: { kind: "chosen_server" },
            visibility: "public",
          },
        ],
      },
    ],
    runnerUtilityLongtail: {
      kind: "derez_fully_broken_passed_ice_and_end_run",
      cost: { kind: "credit", amount: 0 },
      timing: "after_passing_fully_broken_ice",
      target: "that_ice",
      visibility: "public",
    },
  };
