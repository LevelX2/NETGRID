import type { CardImplementationDefinition } from "../../../types";

// card name: Fetch 4.0.1
// text: *Trace 3-If trace is successful, give Runner a tag.
export const fetchFourPointZeroPointOneImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_243_fetch-4-0-1",
    printedSubroutines: [
      {
        kind: "trace",
        baseTraceStrength: 3,
        text: "*Trace 3-If trace is successful, give Runner a tag.",
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
