import type { CardImplementationDefinition } from "../../../types";

// card name: Hacker Tracker Central
// text: After each trace attempt, whether successful or not, put [1] from the bank on Hacker Tracker Central. During a trace attempt, each bit you spend from Hacker Tracker Central increases by 1 both your trace strength and your trace limit.
export const hackerTrackerCentralImplementation: CardImplementationDefinition = {
  cardDefinitionId: "onr_v1_325_hacker-tracker-central",
  remainingReplacementLongtail: {
    kind: "hacker_tracker_trace_bits",
    counterType: "bit",
    addAfterTrace: 1,
    traceStrengthAndLimitPerBit: 1,
    visibility: "public",
  },
};
