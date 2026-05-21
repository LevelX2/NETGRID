import type { CardImplementationDefinition } from "../../../types";

// card name: Dieter Esslin
// text: When Runner accesses Dieter Esslin, Dieter does 1 Net damage.
export const dieterEsslinImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_357_dieter-esslin",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "net",
          amount: 1,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
