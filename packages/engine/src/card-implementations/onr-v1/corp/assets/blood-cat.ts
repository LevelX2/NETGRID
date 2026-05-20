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
      effects: [
        {
          kind: "trace",
          baseTraceStrength: 5,
          visibility: "public",
          onSuccess: [
            {
              kind: "add_tags",
              recipient: "runner",
              amount: 1,
              visibility: "public",
            },
          ],
        },
      ],
    },
  ],
};
