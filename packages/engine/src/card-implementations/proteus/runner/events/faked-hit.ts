import type { CardImplementationDefinition } from "../../../types";

// card name: Faked Hit
// text: Give the Corp 1 Bad Publicity point. Take 2 brain damage. This damage cannot be prevented. If the Corp has 7 or more Bad Publicity points, it loses the game, even if it fulfills victory conditions at the same time.
export const proteusFakedHitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_108_faked-hit",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "add_bad_publicity",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "damage",
          recipient: "runner",
          damageType: "core",
          amount: 2,
          preventable: false,
          visibility: "public",
        },
      ],
    },
  ],
};
