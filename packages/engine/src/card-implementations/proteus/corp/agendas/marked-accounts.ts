import type { CardImplementationDefinition } from "../../../types";

export const markedAccountsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_005_marked-accounts",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      effects: [
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  ],
};
