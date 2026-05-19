import type { CardImplementationDefinition } from "../../../types";

// card name: Punitive Counterstrike
// text: Play only if Runner is tagged. Do 2 meat damage.
export const punitiveCounterstrikeImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_301_punitive-counterstrike",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
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
