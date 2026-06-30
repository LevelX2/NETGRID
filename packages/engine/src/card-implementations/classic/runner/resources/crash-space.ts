import type { CardImplementationDefinition } from "../../../types";

// card name: Crash Space
// text: Gain [1] at the start of each of your turns. All trace attempts are automatically successful, and give you a tag in addition to their other effects. If Crash Space leaves play, lose [2]. A: Trash Crash Space. Only one unique card...
export const classicCrashSpaceImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_044_crash-space",
  unique: { kind: "unique_by_title", controller: "runner" },
  lifecycle: {
    start_of_runner_turn: [
      {
        effects: [
          {
            kind: "gain_credits",
            recipient: "runner",
            amount: 1,
            visibility: "public",
          },
        ],
      },
    ],
    on_leave_play: [
      {
        kind: "lose_credits",
        recipient: "runner",
        amount: 2,
        visibility: "public",
      },
    ],
  },
  abilities: [
    {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "trash_source", amount: 1 },
      ],
      label: "Crash Space trashen",
      effects: [],
    },
  ],
  runnerUtilityLongtail: {
    kind: "trace_attempts_auto_success_add_tag",
    visibility: "public",
  },
};
