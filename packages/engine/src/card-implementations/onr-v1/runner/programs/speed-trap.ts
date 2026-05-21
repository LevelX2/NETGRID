import type { CardImplementationDefinition } from "../../../types";

// card name: Speed Trap
// text: [0]: Jack out before an upgrade or node takes effect. Use this ability only immediately after the Corp has rezzed that upgrade or node.
export const speedTrapImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_067_speed-trap",
  runEncounterInterventions: [
    {
      kind: "jack_out_after_corp_rezzes_upgrade_or_node_before_effect",
      timing: "after_corp_rezzes_upgrade_or_node_before_effect",
      cost: { kind: "credit", amount: 0 },
      visibility: "public",
    },
  ],
};
