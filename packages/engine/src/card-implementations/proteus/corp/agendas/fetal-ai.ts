import type { CardImplementationDefinition } from "../../../types";

export const fetalAiImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_004_fetal-ai",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
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
      visibility: "hidden_info_barrier",
    },
  ],
  selfStealCosts: [
    {
      kind: "current_access_self_steal_cost",
      amount: 2,
      sourceZones: ["installed", "hq", "rd"],
      ignoreIfAccessedFrom: ["archives"],
      visibility: "hidden_info_barrier",
    },
  ],
};
