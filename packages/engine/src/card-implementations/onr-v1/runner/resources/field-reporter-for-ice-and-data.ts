import type { CardImplementationDefinition } from "../../../types";

// card name: Field Reporter for Ice and Data
// text: At the end of each of your turns, gain [1] for each piece of ice the Corp rezzed during that turn.
export const fieldReporterForIceAndDataImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_162_field-reporter-for-ice-and-data",
  runnerUtilityLongtail: {
    kind: "field_reporter_end_turn_rezzed_ice_payout",
    amountPerRezzedIce: 1,
    visibility: "public",
  },
};
