import { currentRunPathContext } from "../run-analysis/current-run-path-context";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { currentEncounteredIceCard } from "./current-encounter";
import { runnerRigAfterEncounter } from "./runner-rig-after-encounter";
import {
  knownPathAfterDamageBudget,
  runnerConfirmedDamageRequiredHandFloor,
  runnerVisibleLethalIceDamageAssessment,
} from "../runner-damage-threat-assessment";

import type {
  assessKnownRezzedIcePath,
  RunnerRunPathCreditBudget,
} from "../visible-run-analysis";

type KnownIcePathAssessment = ReturnType<typeof assessKnownRezzedIcePath>;
type VisibleServer = AiDecisionInput["playerView"]["servers"][number];
type Subroutine = NonNullable<
  VisibleCard["effectiveRunQuote"]
>["subroutines"][number];

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
    creditBudgetAfterPumpAndBreak: number | RunnerRunPathCreditBudget,
    remainingCurrentSubroutines?: Subroutine[],
  ) => { blocksPump: boolean; creditsAfterPath: number; evidence: string[] };
} {
  const encounterFuturePathAfterPumpBreakAssessment = (
    input: AiDecisionInput,
    server: VisibleServer,
    creditBudgetAfterPumpAndBreak: number | RunnerRunPathCreditBudget,
    remainingCurrentSubroutines?: Subroutine[],
  ): { blocksPump: boolean; creditsAfterPath: number; evidence: string[] } => {
    const creditsAfterPumpAndBreak =
      typeof creditBudgetAfterPumpAndBreak === "number"
        ? creditBudgetAfterPumpAndBreak
        : creditBudgetAfterPumpAndBreak.credits;
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
    const futureRig = runnerRigAfterEncounter(input.playerView.own.rig ?? []);
    const rawPath = dependencies.assessKnownRezzedIcePath(
      futureIce,
      futureRig,
      creditBudgetAfterPumpAndBreak,
      server.root,
      input.playerView.opponent.credits,
      currentRunPathContext(input),
    );
    const currentIce = currentEncounteredIceCard(input);
    const damageIce =
      currentIce?.effectiveRunQuote && remainingCurrentSubroutines
        ? [
            ...futureIce,
            {
              ...currentIce,
              effectiveRunQuote: {
                ...currentIce.effectiveRunQuote,
                subroutines: remainingCurrentSubroutines,
              },
            },
          ]
        : futureIce;
    const pathAssessment = knownPathAfterDamageBudget(
      rawPath,
      rawPath.knownPathBlockedOnlyByDamage === true &&
        !runnerVisibleLethalIceDamageAssessment(
          {
            ...input,
            playerView: {
              ...input.playerView,
              own: { ...input.playerView.own, rig: futureRig },
            },
          },
          damageIce,
          {
            generalCredits: rawPath.creditsAfterPath,
            requiredHandFloor: runnerConfirmedDamageRequiredHandFloor(input),
            ...(rawPath.paidSubroutineBreaks
              ? { paidSubroutineBreaks: rawPath.paidSubroutineBreaks }
              : {}),
            ...(rawPath.fullyBrokenIceInstanceIds
              ? { fullyBrokenIceInstanceIds: rawPath.fullyBrokenIceInstanceIds }
              : {}),
          },
        ),
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
