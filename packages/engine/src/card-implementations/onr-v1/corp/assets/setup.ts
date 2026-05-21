import type { CardImplementationDefinition } from "../../../types";

// card name: Setup!
// text: When Runner accesses Setup!, it does 2 Net damage, even if it is not installed. Ignore this effect if Runner accesses it from the Archives. If Setup! is accessed from R&D, Runner must show it to you.
export const setupImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_340_setup",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "net",
          amount: 2,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
