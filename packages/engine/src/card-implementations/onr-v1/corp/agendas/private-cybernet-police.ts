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
