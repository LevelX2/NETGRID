import type { CardImplementationDefinition } from "../../../types";

// card name: Cerberus
// text: *Do 3 Net damage. *Trace 5-If trace is successful, give Runner a Cerberus counter. Each Cerberus counter does 2 Net damage at the start of each run. Runner may remove a Cerberus counter by taking an action to spend [4]. *End the run.
export const cerberusImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_227_cerberus",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 3,
      preventable: true,
      text: "*Do 3 Net damage.",
      visibility: "public",
    },
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5-If trace is successful, give Runner a Cerberus counter.",
      visibility: "public",
      onSuccess: [
        {
          kind: "add_counter",
          recipient: "runner",
          counterType: "cerberus",
          amount: 1,
          visibility: "public",
        },
      ],
    },
    {
      kind: "end_the_run",
      text: "*End the run.",
      visibility: "public",
    },
  ],
  runnerCounterEffects: [
    {
      counterType: "cerberus",
      removeCost: 4,
      runStart: {
        kind: "damage",
        damageType: "net",
        amountPerCounter: 2,
        preventable: true,
        visibility: "public",
      },
    },
  ],
};
