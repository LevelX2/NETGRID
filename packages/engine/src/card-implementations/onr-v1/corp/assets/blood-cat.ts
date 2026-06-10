import { traceTagEffect } from "../../../helpers";
import type { CardImplementationDefinition } from "../../../types";

// card name: Blood Cat
// text: A:Trace 5 -If trace is successful, give Runner a tag.
export const bloodCatImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_310_blood-cat",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      label: "Blood Cat: Trace 5 starten",
      effects: [traceTagEffect(5)],
    },
  ],
};
