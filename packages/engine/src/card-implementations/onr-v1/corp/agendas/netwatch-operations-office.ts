import { traceTagEffect } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Netwatch Operations Office
// text: A:Trace 2 -If trace is successful, give Runner a tag.
export const netwatchOperationsOfficeImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_207_netwatch-operations-office",
    abilities: [
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        label: "Netwatch Operations Office: Trace 2 starten",
        effects: [traceTagEffect(2)],
      },
    ],
  };
