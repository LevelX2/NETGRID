import type { CardImplementationDefinition } from "../../../types";

// card name: Strike Force Kali
// text: A: Do 2 meat damage. Use this ability only if Runner is tagged.
export const strikeForceKaliImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_217_strike-force-kali",
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
          amount: 2,
          preventable: true,
          visibility: "public",
        },
      ],
    },
  ],
};
