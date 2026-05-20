import type { CardImplementationDefinition } from "../../../types";

// card name: Expert Schedule Analyzer
// text: After you access cards from HQ, look at all cards stored in HQ.
export const expertScheduleAnalyzerImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_024_expert-schedule-analyzer",
  accessHooks: [
    {
      kind: "post_access_private_look",
      afterAccessServer: "hq",
      lookZone: "hq",
      count: "all",
      visibility: "hidden_info_barrier",
    },
  ],
};
