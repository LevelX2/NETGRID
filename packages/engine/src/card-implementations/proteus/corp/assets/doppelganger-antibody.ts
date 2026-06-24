import type { CardImplementationDefinition } from "../../../types";

// card name: Doppelganger Antibody
// text: When Runner accesses Doppelganger Antibody, you may pay [2] to give Runner a Doppelganger counter, even if Doppelganger is not installed. Ignore this effect if Runner accesses Doppelganger from the Archives. Each Doppelganger counter causes Runner to lose [1] at the start of each of his or her turns. Runner may take an action to pay [4] to remove a Doppelganger counter. If Doppelganger is accessed from R&D, Runner must show it to you.
export const doppelgangerAntibodyImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_057_doppelganger-antibody",
  accessEffects: [
    {
      kind: "on_access",
      sourceZones: ["installed", "hq", "rd", "archives"],
      ignoreIfAccessedFrom: ["archives"],
      revealIfAccessedFrom: ["rd"],
      cost: { kind: "corp_may_pay_credits", amount: 2 },
      visibility: "hidden_info_barrier",
      effects: [
        {
          kind: "add_runner_counter",
          counterType: "link_reduction_counter",
          amount: 1,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
  runnerCounterEffects: [
    {
      counterType: "link_reduction_counter",
      removeCost: 4,
      startOfRunnerTurn: {
        kind: "lose_credits",
        amountPerCounter: 1,
        visibility: "public",
      },
    },
  ],
};
