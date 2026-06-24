import type { CardImplementationDefinition } from "../../../types";

// card name: Crybaby
// text: When Runner accesses Crybaby, give Runner a Crying counter. Each Crying counter reduces Runner's link by 2 during each trace attempt. Runner can remove a Crying counter by taking an action to pay [2].
export const crybabyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_354_crybaby",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed"],
      effects: [
        {
          kind: "add_runner_counter",
          counterType: "crying",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
      visibility: "hidden_info_barrier",
    },
  ],
  runnerCounterEffects: [
    {
      counterType: "crying",
      removeCost: 2,
    },
  ],
  remainingReplacementLongtail: {
    kind: "link_reduction_counter_upgrade",
    counterType: "crying",
    linkReductionPerCounter: 2,
    removeCost: 2,
    visibility: "public",
  },
};
