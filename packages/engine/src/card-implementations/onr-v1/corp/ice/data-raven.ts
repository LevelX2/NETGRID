import type { CardImplementationDefinition } from "../../../types";

// card name: Data Raven
// text: *Trace 5 -If trace is successful, give Runner a tag and a Data Raven counter. Each Data Raven counter gives Runner a tag at the start of each of his or her turns. Runner may remove a Data Raven counter by taking an action to pay [1].
export const dataRavenImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_236_data-raven",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5 -If trace is successful, give Runner a tag and a Data Raven counter.",
      onSuccess: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "add_counter",
          recipient: "runner",
          counterType: "trace_tag_counter",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
  runnerCounterEffects: [
    {
      counterType: "trace_tag_counter",
      removeCost: 1,
      startOfRunnerTurn: {
        kind: "add_tags",
        amountPerCounter: 1,
        visibility: "public",
      },
    },
  ],
};
