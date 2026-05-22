import type { CardImplementationDefinition } from "../../../types";

// card name: Rabbit
// text: Ice that attempts to trace you has its trace limit reduced by 1.
export const rabbitImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_051_rabbit",
  runnerUtilityLongtail: {
    kind: "rabbit_ice_trace_limit_reduction",
    amount: 1,
    visibility: "public",
  },
};
