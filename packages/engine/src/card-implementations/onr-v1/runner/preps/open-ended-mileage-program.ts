import type { CardImplementationDefinition } from "../../../types";

// card name: Open-Ended Mileage Program
// text: Remove a tag, at no cost. You may pay [1] when you play Open-Ended(R) Mileage Program to take it back into your hand instead of trashing it.
export const openEndedMileageProgramImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_102_open-ended-mileage-program",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: { kind: "runner_is_tagged" },
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "amount",
          amount: 1,
          visibility: "public",
        },
        {
          kind: "return_source_to_grip_if_paid",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
