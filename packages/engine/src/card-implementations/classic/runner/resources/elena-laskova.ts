import type { CardImplementationDefinition } from "../../../types";

// card name: Elena Laskova
// text: Whenever you play a prep, gain an additional [1] the first time you gain bits from its effect. Only one unique card...
export const classicElenaLaskovaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_045_elena-laskova",
  unique: { kind: "unique_by_title", controller: "runner" },
  runnerUtilityLongtail: {
    kind: "first_prep_credit_gain_bonus",
    amount: 1,
    limit: "once_per_prep",
    visibility: "public",
  },
};
