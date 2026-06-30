import type { CardImplementationDefinition } from "../../../types";

// card name: Omnitech Wet Drive
// text: Your base MU is equal to the number of cards in your hand instead of 4.
export const classicOmnitechWetDriveImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_classic_049_omnitech-wet-drive",
    runnerUtilityLongtail: {
      kind: "base_memory_equals_grip_count",
      visibility: "public",
    },
  };
