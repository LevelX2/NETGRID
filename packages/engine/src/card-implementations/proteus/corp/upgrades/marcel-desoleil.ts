import type { CardImplementationDefinition } from "../../../types";

// card name: Marcel DeSoleil
// text: [2], Trash the top two cards stored in R&D: Repeat one subroutine on this fort.
export const proteusMarcelDesoleilImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_064_marcel-desoleil",
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [
        { kind: "credit", amount: 2 },
        { kind: "trash_corp_rd_top", amount: 2 },
      ],
      label: "Marcel DeSoleil: Subroutine kopieren",
      effects: [
        {
          kind: "copy_same_fort_ice_subroutine_for_run",
          target: "chosen_same_fort_ice_subroutine",
          append: "immediately_after_original",
          cleanup: "run_end",
          visibility: "public",
        },
      ],
    },
  ],
};
