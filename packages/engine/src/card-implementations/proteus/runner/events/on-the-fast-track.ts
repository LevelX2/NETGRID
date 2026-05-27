import type { CardImplementationDefinition } from "../../../types";

// card name: On the Fast Track
// text: Gain [8] if you trashed an advertisement card this turn, or gain [6] if you trashed a transactions card this turn.
export const proteusOnTheFastTrackImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_proteus_114_on-the-fast-track",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_credits_for_runner_trash_history",
          recipient: "controller",
          advertisementAmount: 8,
          transactionsAmount: 6,
          visibility: "public",
        },
      ],
    },
  ],
};
