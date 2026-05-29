import type { CardImplementationDefinition } from "../../../types";

export const proteusLucidrineDripFeedImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_144_lucidrinetm-drip-feed",
    uniqueDirectLongtail: {
      kind: "runner_start_turn_drip_counter_action_or_core_damage",
      counterType: "drip",
      threshold: 2,
      visibility: "public",
    },
  };
