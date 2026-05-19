import type { CardImplementationDefinition } from "../../../types";

// card name: Scorched Earth
// text: Play only if Runner is tagged. Do 4 meat damage.
export const scorchedEarthImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_302_scorched-earth",
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
          amount: 4,
          preventable: true,
          visibility: "public",
        },
      ],
    },
  ],
};
