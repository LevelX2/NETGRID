import type { CardImplementationDefinition } from "../../../types";

// card name: Shock Treatment
// text: When Runner accesses Shock Treatment, trash all pieces of hardware and two programs. Ignore this effect unless Runner has four or more tags.
export const classicShockTreatmentImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_023_shock-treatment",
    accessEffects: [
      {
        kind: "on_access",
        sourceZones: ["installed"],
        condition: { kind: "runner_tags_at_least", amount: 4 },
        visibility: "hidden_info_barrier",
        effects: [
          {
            kind: "trash_installed_runner_hardware_and_programs",
            hardwareAmount: "all",
            programAmount: 2,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  };
