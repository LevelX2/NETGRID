import type { CardImplementationDefinition } from "../../../types";

// card name: Running Interference
// text: Make a run. During that run, the Corp must pay [X], in addition to the normal cost, to rez each piece of ice, where X is the rez cost of that piece of ice. Playing a double prep costs two consecutive actions this turn instead of one.
export const classicRunningInterferenceImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_043_running-interference",
    abilities: [
      {
        kind: "on_play",
        costs: { kind: "printed", additionalClicks: 1 },
        effects: [
          {
            kind: "make_run",
            target: { kind: "chosen_server" },
            corpRezCostSurcharge: {
              kind: "matching_printed_rez_cost",
            },
            visibility: "public",
          },
        ],
      },
    ],
  };
