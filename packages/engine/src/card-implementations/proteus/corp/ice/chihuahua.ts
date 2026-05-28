import type { CardImplementationDefinition } from "../../../types";

// card name: Chihuahua
// text: *Trace 1-If trace is successful, do 1 Net damage. Gain [2] when you rez Chihuahua.
export const proteusChihuahuaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_014_chihuahua",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 1,
      onSuccess: [
        {
          kind: "preventable_damage",
          recipient: "runner",
          damageType: "net",
          amount: 1,
          visibility: "public",
        },
      ],
      text: "*Trace 1-If trace is successful, do 1 Net damage.",
    },
  ],
  lifecycle: {
    on_rez: [{ kind: "gain_credits", recipient: "corp", amount: 2, visibility: "public" }],
  },
};
