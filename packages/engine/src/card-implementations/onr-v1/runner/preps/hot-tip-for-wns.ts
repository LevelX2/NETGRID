import type { CardImplementationDefinition } from "../../../types";

// card name: Hot Tip for WNS
// text: Score 1 agenda point if you liberated any Black Ops agendas this turn.
export const hotTipForWnsImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_090_hot-tip-for-wns",
  abilities: [
    {
      kind: "on_play",
      costs: "printed",
      effects: [
        {
          kind: "gain_runner_event_agenda_point_if_liberated_agenda_subtype",
          subtype: "black_ops",
          amount: 1,
          visibility: "public",
        },
      ],
    },
  ],
};
