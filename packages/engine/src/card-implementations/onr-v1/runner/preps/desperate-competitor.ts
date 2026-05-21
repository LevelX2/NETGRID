import type { CardImplementationDefinition } from "../../../types";

// card name: Desperate Competitor
// text: Play only if you liberated any Gray Ops agendas this turn. Score 1 agenda point.
export const desperateCompetitorImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_083_desperate-competitor",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_liberated_agenda_subtype_this_turn",
        subtype: "gray_ops",
      },
      effects: [
        {
          kind: "gain_runner_event_agenda_point",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
