import type { CardImplementationDefinition } from "../../../types";

// card name: Bel-Digmo Antibody
// text: Shuffle Bel-Digmo Antibody into R&D when it is rezzed. When Runner accesses Bel-Digmo Antibody from R&D, do 1 Net damage, and Runner must show it to you.
export const belDigmoAntibodyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_054_bel-digmo-antibody",
  lifecycle: {
    on_rez: [
      {
        kind: "shuffle_source_into_corp_rd",
        visibility: "hidden_info_barrier",
      },
    ],
  },
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["rd"],
      revealIfAccessedFrom: ["rd"],
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
