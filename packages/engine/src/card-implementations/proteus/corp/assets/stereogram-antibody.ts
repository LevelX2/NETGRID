import type { CardImplementationDefinition } from "../../../types";

// card name: Stereogram Antibody
// text: When Runner accesses Stereogram Antibody from the Archives, do 1 Net damage and shuffle Stereogram Antibody into R&D.
export const stereogramAntibodyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_075_stereogram-antibody",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["archives"],
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
        {
          kind: "shuffle_source_into_corp_rd",
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
