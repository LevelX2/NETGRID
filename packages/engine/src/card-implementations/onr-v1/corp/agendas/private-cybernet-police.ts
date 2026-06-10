import { traceTagEffect } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Private Cybernet Police
// text: A:Trace 5 -If trace is successful, give Runner a tag.
export const privateCybernetPoliceImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_v1_213_private-cybernet-police",
    abilities: [
      {
        kind: "activated",
        timing: "corp_main",
        costs: [{ kind: "action", amount: 1 }],
        label: "Private Cybernet Police: Trace 5 starten",
        effects: [traceTagEffect(5)],
      },
    ],
  };
