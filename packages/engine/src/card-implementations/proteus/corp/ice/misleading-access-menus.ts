import type { CardImplementationDefinition } from "../../../types";

// card name: Misleading Access Menus
// text: *End the run unless Runner pays [1]. Gain [3] when you rez Misleading Access Menus.
export const proteusMisleadingAccessMenusImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_032_misleading-access-menus",
    printedSubroutines: [
      {
        kind: "end_the_run_unless_runner_pays",
        amount: 1,
        text: "*End the run unless Runner pays [1].",
      },
    ],
    lifecycle: {
      on_rez: [
        {
          kind: "gain_credits",
          recipient: "corp",
          amount: 3,
          visibility: "public",
        },
      ],
    },
  };
