import type { CardImplementationDefinition } from "../../../types";

// card name: Crash Everett, Inventive Fixer
// text: Whenever you draw one or more cards from your stack, draw an extra card; then choose one of the cards drawn and either trash it or return it to the top of your stack. Only one unique card of a particular name can be in play at a time. If for some reason more than one is in play, trash all but one.
export const crashEverettInventiveFixerImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_157_crash-everett-inventive-fixer",
    unique: {
      kind: "unique_by_title",
      controller: "runner",
    },
    remainingReplacementLongtail: {
      kind: "crash_everett_draw_extra_choose_trash_or_top",
      extraDraw: 1,
      visibility: "hidden_info_barrier",
    },
  };
