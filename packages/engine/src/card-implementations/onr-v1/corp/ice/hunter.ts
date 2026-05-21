import type { CardImplementationDefinition } from "../../../types";

// card name: Hunter
// text: *Trace 5-If trace is successful, give Runner a tag.
export const hunterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_249_hunter",
  printedSubroutines: [
    {
      kind: "trace",
      baseTraceStrength: 5,
      text: "*Trace 5-If trace is successful, give Runner a tag.",
      onSuccess: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
