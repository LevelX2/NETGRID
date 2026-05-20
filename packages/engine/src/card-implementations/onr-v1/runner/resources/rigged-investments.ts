import type { CardImplementationDefinition } from "../../../types";

// card name: Rigged Investments
// text: Put [12] from the bank on Rigged Investments when it is installed. At the start of each of your turns, take [1] from Investments. When all the bits have been removed, trash Rigged Investments.
export const riggedInvestmentsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_174_rigged-investments",
  lifecycle: {
    on_install: [
      {
        kind: "add_hosted_credits",
        target: "source",
        amount: 12,
        visibility: "public",
      },
    ],
    start_of_runner_turn: [
      {
        condition: { kind: "source_has_hosted_credits" },
        effects: [
          {
            kind: "take_hosted_credits",
            source: "source",
            recipient: "controller",
            amount: 1,
            mode: "up_to_amount_if_available",
            visibility: "public",
          },
          {
            kind: "trash_source_when_empty",
            source: "source",
            visibility: "public",
          },
        ],
      },
    ],
  },
};
