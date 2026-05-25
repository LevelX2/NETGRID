import type { CardImplementationDefinition } from "../../../types";

// card name: Skullcap
// text: T: Prevent any amount of Net or brain damage.
export const proteusSkullcapImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_096_skullcap",
  damagePreventionSources: [
    {
      kind: "damage_prevention",
      damageTypes: ["net", "core"],
      amount: "all",
      cost: { kind: "trash_source" },
      priority: 102,
      visibility: "public",
    },
  ],
};
