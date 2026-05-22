import type { CardImplementationDefinition } from "../../../types";

// card name: Databroker
// text: A, [T], 1 agenda point: Gain [10].
export const databrokerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_159_databroker",
  uniqueDirectLongtail: {
    kind: "databroker_agenda_point_credits",
    agendaPointCost: 1,
    gainCredits: 10,
    trashSource: true,
    visibility: "public",
  },
};
