import type { CardImplementationDefinition } from "../../../types";

// card name: Tesseract Fort Construction
// text: All ice on this fort has an additional subroutine, "*End the run unless Runner pays [1]," after all other subroutines.
export const tesseractFortConstructionImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_370_tesseract-fort-construction",
    modifiers: [
      {
        kind: "additional_subroutine",
        activeWhile: "rezzed",
        sourceZone: "corp_root",
        visibility: "public",
        appliesTo: {
          side: "corp",
          cardType: "ice",
          sameServerAsSource: true,
        },
        append: "after_existing",
        subroutine: {
          kind: "end_the_run_unless_runner_pays",
          amount: 1,
          text: "*End the run unless Runner pays [1].",
          visibility: "public",
        },
      },
    ],
  };
