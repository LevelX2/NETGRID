import type { CardImplementationDefinition } from "../../../types";

// card name: Virus Test Site
// text: You may advance Virus Test Site before and after you rez it. When Runner accesses Test Site, it does 2 Net damage per advancement counter on it, or 1 Net damage if it has no counters, even if it is not installed or rezzed. Ignore this effect if Runner accesses it from the Archives. If Test Site is accessed from R&D, Runner must show it to you.
export const virusTestSiteImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_348_virus-test-site",
  advanceable: { while: "installed_before_and_after_rez" },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "damage_from_source_advancement_counters",
          recipient: "runner",
          damageType: "net",
          amountPerCounter: 2,
          minimumAmount: 1,
          preventable: true,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
