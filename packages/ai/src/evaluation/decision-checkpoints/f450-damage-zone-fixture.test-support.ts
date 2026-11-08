import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

/** Current expectation companion; the immutable historical fixture is unchanged. */
export function withCurrentF450DamageZoneExpectation(
  checkpoint: AiDecisionCheckpointV1,
): AiDecisionCheckpointV1 {
  checkpoint.source.kind = "synthetic_companion";
  checkpoint.source.findingId = "F450-10311-04-CURRENT-DAMAGE-ZONES";
  checkpoint.expectation = {
    acceptableActions: [{ type: "start_run", targetServerId: "rd" }],
    planExecution: {
      acceptablePlanKinds: ["runner.pressure_central"],
      acceptableCapabilities: ["pressure_rd_access"],
    },
    runTargets: [{ targetServerId: "rd", pathPassability: "reachable" }],
  };
  return checkpoint;
}
