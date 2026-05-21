import type { CardImplementationDefinition } from "../../../types";

// card name: Corporate Downsizing
// text: When you score Corporate Downsizing, show to Runner any number of agenda cards stored in HQ. Gain bits equal to twice the combined agenda points of these cards; then shuffle them into R&D.
export const corporateDownsizingImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_194_corporate-downsizing",
  scoredAgenda: {
    kind: "corporate_downsizing_hq_agendas",
    creditPerAgendaPoint: 2,
    shuffleSelectedIntoRnd: true,
    visibility: "hidden_info_barrier",
  },
};
