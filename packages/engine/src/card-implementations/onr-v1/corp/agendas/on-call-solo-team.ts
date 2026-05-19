import type { CardImplementationDefinition } from "../../../types";

// card name: On-Call Solo Team
// text: A: Do 1 meat damage. Use this ability only if Runner is tagged.
export const onCallSoloTeamImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_208_on-call-solo-team",
  abilities: [
    {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "meat",
          amount: 1,
          preventable: true,
          visibility: "public",
        },
      ],
    },
  ],
};
