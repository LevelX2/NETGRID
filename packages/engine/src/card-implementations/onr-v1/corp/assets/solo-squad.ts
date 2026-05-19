import type { CardImplementationDefinition } from "../../../types";

// card name: Solo Squad
// text: A: Do 1 meat damage. Use this ability only if Runner is tagged.
export const soloSquadImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_342_solo-squad",
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
