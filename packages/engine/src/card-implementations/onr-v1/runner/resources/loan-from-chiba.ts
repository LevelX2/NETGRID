import type { CardImplementationDefinition } from "../../../types";

// card name: Loan from Chiba
// text: Gain [12] when Loan from Chiba is installed. At the start of each of your turns, lose [1]. If Loan from Chiba leaves play, pay [10] or lose the game. You may trash Loan from Chiba at the end of any of your turns.
export const loanFromChibaImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_168_loan-from-chiba",
  lifecycle: {
    on_install: [
      {
        kind: "gain_credits",
        recipient: "controller",
        amount: 12,
        visibility: "public",
      },
    ],
    start_of_runner_turn: [
      {
        effects: [
          {
            kind: "lose_credits",
            recipient: "controller",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
    on_leave_play: [
      {
        kind: "pay_credits_or_lose_game",
        payer: "controller",
        amount: 10,
        loseSide: "controller",
        reason: "source_left_play",
        visibility: "public",
      },
    ],
    end_of_runner_turn: [
      {
        effects: [
          {
            kind: "trash_source",
            visibility: "public",
          },
        ],
      },
    ],
  },
};
