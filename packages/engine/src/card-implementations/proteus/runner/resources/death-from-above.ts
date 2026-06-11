import { hiddenSuccessfulRunBeforeAccessEffect } from "../../../../ability-engine/card-implementation-primitives";
import type { CardImplementationDefinition } from "../../../types";

export const proteusDeathFromAboveImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_137_death-from-above",
  successfulRunFollowups: [
    hiddenSuccessfulRunBeforeAccessEffect({
      server: "remote",
      effect: { kind: "trash_remote_fort", include: "root_and_ice" },
    }),
  ],
};
