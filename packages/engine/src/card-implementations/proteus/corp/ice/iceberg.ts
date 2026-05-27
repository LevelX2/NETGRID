import type { CardImplementationDefinition } from "../../../types";

// card name: Iceberg
// text: *Do 1 Net damage. *[2]: Iceberg has one "*End the run" subroutine for the present encounter. Use this ability only when Runner encounters Iceberg.
export const proteusIcebergImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_027_iceberg",
  printedSubroutines: [
    {
      kind: "damage",
      damageType: "net",
      amount: 1,
      preventable: true,
      text: "*Do 1 Net damage.",
    },
  ],
  abilities: [
    {
      kind: "activated",
      timing: "corp_encounter",
      costs: [{ kind: "credit", amount: 2 }],
      label: "Iceberg: Subroutine hinzufügen",
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
