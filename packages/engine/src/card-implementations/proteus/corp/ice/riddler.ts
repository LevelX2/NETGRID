import type { CardImplementationDefinition } from "../../../types";

// card name: Riddler
// text: [2]: Riddler has one "*End the run" subroutine for the present encounter. Use this ability only when Runner encounters Riddler.
export const proteusRiddlerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_034_riddler",
  abilities: [
    {
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
      label: "Riddler: Subroutine hinzufügen",
      effects: [
        {
          kind: "add_current_encounter_additional_subroutine",
          target: "encountered_ice_self",
          append: "after_existing",
          subroutine: {
            kind: "end_the_run",
            text: "*End the run.",
            visibility: "public",
          },
          visibility: "public",
        },
      ],
    },
  ],
};
