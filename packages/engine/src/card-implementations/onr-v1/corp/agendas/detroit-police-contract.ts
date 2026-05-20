import type { CardImplementationDefinition } from "../../../types";

// card name: Detroit Police Contract
// text: Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.
export const detroitPoliceContractImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_198_detroit-police-contract",
  lifecycle: {
    on_score: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      },
    ],
    start_of_corp_turn: [
      {
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 2,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
        ],
      },
    ],
  },
};
