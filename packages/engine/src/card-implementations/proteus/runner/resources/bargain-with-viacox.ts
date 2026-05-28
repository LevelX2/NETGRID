import type { CardImplementationDefinition } from "../../../types";

export const proteusBargainWithViacoxImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_131_bargain-with-viacox",
    uniqueDirectLongtail: {
      kind: "runner_start_turn_forced_random_action",
      startsTurnAfterInstall: true,
      visibility: "hidden_info_barrier",
    },
  };
