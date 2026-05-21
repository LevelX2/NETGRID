import type { CardImplementationDefinition } from "../../../types";

// card name: False Echo
// text: [2]: The Corp must rez as much ice as possible on a fort, beginning with the outermost ice and working in. Use this ability only after a successful run on that fort.
export const falseEchoImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_026_false-echo",
  successfulRunFollowups: [
    {
      kind: "force_rez_ice_outermost_inward_after_successful_run",
      cost: { kind: "credit", amount: 2 },
      visibility: "hidden_info_barrier",
    },
  ],
};
