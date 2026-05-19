import type { CardImplementationDefinition } from "../../../types";

// card name: Urban Renewal
// text: Play only if Runner is tagged. Do 5 meat damage.
export const urbanRenewalImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_307_urban-renewal",
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
          amount: 5,
          preventable: true,
          visibility: "public",
        },
      ],
    },
  ],
};
