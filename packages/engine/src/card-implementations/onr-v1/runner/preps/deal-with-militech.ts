import type { CardImplementationDefinition } from "../../../types";

// card name: Deal with Militech
// text: Play only if you liberated any Research agendas this turn. Put a Militech counter on each of your icebreakers. A Militech counter gives the icebreaker it is on +1 strength.
export const dealWithMilitechImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_082_deal-with-militech",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "runner_liberated_agenda_subtype_this_turn",
        subtype: "research",
      },
      effects: [
        {
          kind: "add_counter_to_all_installed_runner_icebreakers",
          counterType: "militech",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
