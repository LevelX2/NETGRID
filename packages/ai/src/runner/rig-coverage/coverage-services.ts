import type {
  RunnerExactFundingRouteRequest,
  RunnerRunFundingSupport,
} from "../../plans/runner-funding-service-contract";
import type { RunnerFundingRouteAssessment } from "../../plans/runner-funding-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
export type RunnerCoverageServices = {
  runnerRemoteHasCurrentContestMaterial: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash: (
    input: AiDecisionInput,
    serverId: string,
  ) => boolean;
  runnerRunTargetCanConvertNow: (
    input: AiDecisionInput,
    economy: RunnerEconomyPosture,
    evaluation: RunnerRunTargetEvaluation,
    candidates: readonly ActionSemanticCandidate[],
  ) => boolean;
  runnerRunFundingSupport: (
    input: AiDecisionInput,
    economy: RunnerEconomyPosture,
    evaluation: RunnerRunTargetEvaluation,
    runTargets: readonly RunnerRunTargetEvaluation[],
    candidates: readonly ActionSemanticCandidate[],
  ) => RunnerRunFundingSupport | undefined;
  runnerCentralPressureHasMaterialMarginalValue: (
    input: AiDecisionInput,
    evaluation: RunnerRunTargetEvaluation,
  ) => boolean;
  runnerCentralPressureCadence: (
    input: AiDecisionInput,
    serverId: "hq" | "rd" | "archives",
  ) => { routeAvailable: boolean; evidenceCode: string };
  runnerExactFundingRouteContract: (
    input: AiDecisionInput,
    candidates: readonly ActionSemanticCandidate[],
    request: RunnerExactFundingRouteRequest,
  ) => {
    routeActionIds: string[];
    routeAssessment: RunnerFundingRouteAssessment;
  };
};
