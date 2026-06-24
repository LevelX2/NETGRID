import type { CardImplementationDefinition } from "../../../types";

// card name: Dedicated Response Team
// text: When Runner accesses Dedicated Response Team, it does 3 meat damage. Ignore this effect unless Runner is tagged.
export const taggedRunnerMeatDamageUpgradeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_356_dedicated-response-team",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      condition: { kind: "runner_is_tagged" },
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "meat",
          amount: 3,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
