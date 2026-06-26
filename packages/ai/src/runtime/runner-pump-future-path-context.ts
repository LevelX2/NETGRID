import type { AiDecisionInput } from "@netgrid/shared";

import type { assessKnownRezzedIcePath } from "../visible-run-analysis";

type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;
type VisibleServer = AiDecisionInput["playerView"]["servers"][number];

export type RunnerPumpFuturePathContextDependencies = {
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  knownIcePathReason: (
    assessment: KnownIcePathAssessment,
    serverId: string,
  ) => string;
};

export function createRunnerPumpFuturePathContext(
  dependencies: RunnerPumpFuturePathContextDependencies,
): {
  encounterFuturePathAfterPumpBreakAssessment: (
    input: AiDecisionInput,
    server: VisibleServer,
    creditsAfterPumpAndBreak: number,
  ) => { blocksPump: boolean; creditsAfterPath: number; evidence: string[] };
} {
  const encounterFuturePathAfterPumpBreakAssessment = (
    input: AiDecisionInput,
    server: VisibleServer,
    creditsAfterPumpAndBreak: number,
  ): { blocksPump: boolean; creditsAfterPath: number; evidence: string[] } => {
    const run = input.playerView.run;
    if (run?.position?.kind !== "ice")
      return {
        blocksPump: false,
        creditsAfterPath: creditsAfterPumpAndBreak,
        evidence: [],
      };
    const futureIce = server.ice.slice(0, Math.max(0, run.position.iceIndex));
    if (futureIce.length <= 0)
      return {
        blocksPump: false,
        creditsAfterPath: creditsAfterPumpAndBreak,
        evidence: [],
      };
    const pathAssessment = dependencies.assessKnownRezzedIcePath(
      futureIce,
      input.playerView.own.rig ?? [],
      creditsAfterPumpAndBreak,
      server.root,
    );
    const pathEvidence = dependencies.knownIcePathReason(
      pathAssessment,
      server.id,
    );
    if (
      pathAssessment.assessedKnownIceCount > 0 &&
      !pathAssessment.canReachAccess
    )
      return {
        blocksPump: true,
        creditsAfterPath: pathAssessment.creditsAfterPath,
        evidence: ["pump_future_path_blocked_after_cost:true", pathEvidence],
      };
    return {
      blocksPump: false,
      creditsAfterPath: pathAssessment.creditsAfterPath,
      evidence: [pathEvidence],
    };
  };

  return { encounterFuturePathAfterPumpBreakAssessment };
}
