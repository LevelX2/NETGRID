import type { CardImplementationDefinition } from "../../../types";

// card name: Corruption
// text: Play only if you scored any agendas this turn. Lose all agenda points you scored this turn, and the Corp scores that many agenda points. Gain [10] per agenda point lost in this way, and the Corp gives you a tag.
export const classicCorruptionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_classic_035_corruption",
  runnerEventLongtail: {
    kind: "runner_corruption_agenda_point_transfer",
    creditsPerAgendaPoint: 10,
    tagRunner: 1,
    visibility: "public",
  },
};
