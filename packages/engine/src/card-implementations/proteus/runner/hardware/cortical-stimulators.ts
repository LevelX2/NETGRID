import type { CardImplementationDefinition } from "../../../types";

// card name: Cortical Stimulators
// text: Prevents 1 Net or brain damage each turn.
export const proteusCorticalStimulatorsImplementation: CardImplementationDefinition =
  {
    cardDefinitionId: "onr_proteus_135_cortical-stimulators",
    damagePreventionSources: [
      {
        kind: "damage_prevention",
        damageTypes: ["net", "core"],
        amount: 1,
        limit: { kind: "per_turn", amount: 1 },
        cost: { kind: "none" },
        priority: 124,
        visibility: "public",
      },
    ],
  };
