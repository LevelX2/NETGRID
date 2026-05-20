import type { CardImplementationDefinition } from "../../../types";

// card name: Mastiff
// text: *Do 1 brain damage. *Do 1 Net damage. *For the remainder of the run, all ice is encountered at +1 strength. *-If trace is successful, give Runner a Mastiff counter. Each Mastiff counter does 1 brain damage at the start of each run. Runner may remove a Mastiff counter by taking an action to spend [4]. *End the run.
// implementation note: The original spoiler omits the printed trace strength; project legacy behavior treats this as Trace 5.
export const mastiffImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_255_mastiff",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "brain",
      amount: 1,
      preventable: true,
      text: "*Do 1 brain damage.",
      visibility: "public",
    },
    {
      kind: "damage",
      damageType: "net",
      amount: 1,
      preventable: true,
      text: "*Do 1 Net damage.",
      visibility: "public",
    },
    {
      kind: "run_duration_ice_strength",
      amount: 1,
      text: "*For the remainder of the run, all ice is encountered at +1 strength.",
      visibility: "public",
    },
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5-If trace is successful, give Runner a Mastiff counter.",
      visibility: "public",
      onSuccess: [
        {
          kind: "add_counter",
          recipient: "runner",
          counterType: "mastiff",
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
      counterType: "mastiff",
      removeCost: 4,
      runStart: {
        kind: "damage",
        damageType: "brain",
        amountPerCounter: 1,
        preventable: true,
        visibility: "public",
      },
    },
  ],
};
