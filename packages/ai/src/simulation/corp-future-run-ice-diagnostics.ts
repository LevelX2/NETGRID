import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import {
  assessCorpFutureRunIcePlacement,
  classifyCorpFutureRunIceDefinitionId,
} from "../legacy/legacy-planner-entrypoints";
import type { AiSimulationSummary } from "./ai-simulation-summary";

export type SourceDefinitionIdForSimulationAction = (
  input: AiDecisionInput,
  action: LegalAction,
) => string | undefined;

export function createCorpFutureRunIceDiagnosticsForSimulationAction(
  sourceDefinitionIdForSimulationAction: SourceDefinitionIdForSimulationAction,
) {
  return function corpFutureRunIceDiagnosticsForSimulationAction(
    input: AiDecisionInput,
    action: LegalAction,
  ): Partial<AiSimulationSummary["actionSequence"][number]> {
    if (input.side !== "corp" || action.side !== "corp") return {};
    const opportunity = input.legalActions.some(
      (candidate) =>
        candidate.side === "corp" &&
        candidate.type === "install_card" &&
        candidate.payload?.placement === "ice" &&
        Boolean(
          classifyCorpFutureRunIceDefinitionId(
            sourceDefinitionIdForSimulationAction(input, candidate),
          ),
        ),
    );
    const assessment = assessCorpFutureRunIcePlacement(input, action);
    if (!assessment) {
      return opportunity ? { corpFutureRunIceInstallOpportunity: true } : {};
    }
    return {
      ...(opportunity ? { corpFutureRunIceInstallOpportunity: true } : {}),
      corpFutureRunIceInstalled: true,
      corpFutureRunIceClass: assessment.futureRunIceClass,
      ...(assessment.installedOnEmptyServer
        ? {
            corpFutureRunIceInstalledOnEmptyServer: true,
            corpFutureRunIceInstalledFirstOnEmptyServer: true,
            corpFutureRunIceInstalledAsInnermost: true,
            corpFutureRunIceInstalledWithoutLaterIce: true,
            corpFutureRunIceInstalledAsDeadEffect: true,
            corpIceOrderFutureEffectDead: true,
          }
        : {
            corpFutureRunIceInstalledAfterInnerIceExists: true,
            corpFutureRunIceInstalledWithLaterIce: true,
            corpFutureRunIceInstalledAsLiveEffect: true,
            corpIceOrderFutureEffectLive: true,
          }),
      corpFutureRunIceInstalledAsOutermost: true,
      ...(assessment.deadEffect &&
      (assessment.futureRunIceClass === "bolter_or_data_darts" ||
        assessment.futureRunIceClass === "future_run_ice")
        ? { corpNextIceEffectInstalledLast: true }
        : {}),
      ...(assessment.futureRunIceClass === "ball_and_chain" &&
      assessment.deadEffect
        ? {
            corpBallAndChainInstalledInnermost: true,
            corpBallAndChainInstalledWithoutLaterIce: true,
          }
        : {}),
      ...(assessment.futureRunIceClass === "ball_and_chain" &&
      assessment.liveEffect
        ? { corpBallAndChainInstalledWithLaterIce: true }
        : {}),
      ...(assessment.futureRunIceClass === "canis" && assessment.deadEffect
        ? { corpCanisInstalledWithoutLaterIce: true }
        : {}),
      ...(assessment.futureRunIceClass === "bolter_or_data_darts" &&
      assessment.deadEffect
        ? { corpBolterOrDataDartsInstalledWithoutNextIce: true }
        : {}),
    };
  };
}
