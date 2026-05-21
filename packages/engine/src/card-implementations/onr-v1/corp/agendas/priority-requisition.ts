import type { CardImplementationDefinition } from "../../../types";

// card name: Priority Requisition
// text: You may rez a piece of ice, at no cost, when you score Priority Requisition.
export const priorityRequisitionImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_212_priority-requisition",
  scoredAgenda: {
    kind: "priority_requisition_rez_ice_at_no_cost",
    visibility: "hidden_info_barrier",
  },
};
