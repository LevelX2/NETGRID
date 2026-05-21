import type { CardImplementationDefinition } from "../../../types";

// card name: TRAP!
// text: If you pay [4] when Runner accesses TRAP!, it does 3 Net damage and gives Runner a tag, even if TRAP! is not installed. Ignore this effect if Runner accesses it from the Archives. If TRAP! is accessed from R&D, Runner must show it to you.
export const trapImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_345_trap",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      cost: { kind: "corp_may_pay_credits", amount: 4 },
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage",
          recipient: "runner",
          damageType: "net",
          amount: 3,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
        {
          kind: "add_tags",
          recipient: "runner",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
