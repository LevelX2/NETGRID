import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Negotiating Center
// text: At the start of each of your turns, gain [1] for each agenda card stored in HQ that you show to Runner.
export const corporateNegotiatingCenterImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_314_corporate-negotiating-center",
  lifecycle: {
    start_of_corp_turn: [
      {
        effects: [
          {
            kind: "show_hq_agendas_for_credits",
            creditPerAgenda: 1,
            visibility: "hidden_info_barrier",
          },
        ],
      },
    ],
  },
};
