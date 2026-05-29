import type { CardImplementationDefinition } from "../../../types";

// card name: Emergency Rig
// text: Rez a piece of ice, at no cost. Put X Kludge counters on that piece of ice.
export const proteusEmergencyRigImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_049_emergency-rig",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "free_rez_installed_ice_with_counters",
          target: "chosen_installed_ice",
          counterType: "kludge",
          amount: { kind: "bounded_x_by_rez_cost_min_one" },
          lifecycle: "remove_one_counter_start_corp_turn_trash_on_last",
          visibility: "public",
        },
      ],
    },
  ],
};
