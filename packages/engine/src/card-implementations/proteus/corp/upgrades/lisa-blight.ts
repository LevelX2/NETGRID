import type { CardImplementationDefinition } from "../../../types";

// card name: Lisa Blight
// text: [1], Discard a card at random: Repeat one subroutine on a piece of ice on this fort until end of run. Treat the copied subroutine as if it appeared immediately after the original.
export const proteusLisaBlightImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_063_lisa-blight",
  abilities: [
    {
      kind: "activated",
      timing: "corp_during_run",
      costs: [
        { kind: "credit", amount: 1 },
        { kind: "corp_random_discard_hq", amount: 1 },
      ],
      label: "Lisa Blight: Subroutine kopieren",
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
