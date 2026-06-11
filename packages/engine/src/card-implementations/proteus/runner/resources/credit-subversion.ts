import { hiddenSuccessfulRunBeforeAccessEffect } from "../../../../ability-engine/card-implementation-primitives";
import type { CardImplementationDefinition } from "../../../types";

export const proteusCreditSubversionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_136_credit-subversion",
  successfulRunFollowups: [
    hiddenSuccessfulRunBeforeAccessEffect({
      server: "hq",
      effect: { kind: "corp_lose_credits", amount: 3 },
    }),
  ],
};
