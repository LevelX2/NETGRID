import type { CardImplementationDefinition } from "../../../types";

// card name: Terrorist Reprisal
// text: Play only if the Corp scored any Black Ops agendas during its last turn. The Corp discards five cards at random.
export const terroristReprisalImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_115_terrorist-reprisal",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      condition: {
        kind: "corp_scored_agenda_subtype_last_turn",
        subtype: "black_ops",
      },
      effects: [
        {
          kind: "corp_random_discard_from_hq",
          count: 5,
          visibility: "hidden_info_barrier",
        },
      ],
    },
  ],
};
