import type { CardImplementationDefinition } from "../../../types";

export const proteusArmageddonImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_078_armageddon",
  successfulRunFollowups: [
    {
      kind: "skip_rd_access_add_purgeable_runner_virus_counter",
      counterType: "doom",
      amount: 1,
      cost: "none",
      visibility: "public",
    },
  ],
};
