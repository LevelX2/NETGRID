import type { RunnerFundingRouteAssessment } from "./runner-funding-contracts";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { type CreateSideCreditDemandParams } from "./credit-demand";
export type RunnerExactFundingRouteRequest = Pick<
  CreateSideCreditDemandParams,
  | "demandId"
  | "sourcePlanId"
  | "purpose"
  | "priority"
  | "hardness"
  | "deadline"
  | "targetCredits"
  | "evidence"
> & {
  remainingClicks: number;
  allowIncrementalProgress?: boolean;
  allowStrategicExchange?: boolean;
  /** A prefix funding gap cannot certify conversion of a fully known run. */
  requireCompleteKnownPath?: boolean;
  /** A Defense-owned buffer that must remain when tags survive cleanup. */
  requiredEndTurnHandBuffer?: number;
  paymentWindowTarget?: RunnerRunTargetEvaluation;
  debtFinancingParent?: Readonly<{
    planInstanceId: string;
    runActionId: string;
    targetServerId: string;
    accessPayoff: RunnerRunTargetEvaluation["accessPayoff"];
    scoreThreat: boolean;
    score: number;
    pathPassability: RunnerRunTargetEvaluation["pathPassability"];
    creditsAfterRun: number;
    unknownUnrezzedIceCount: number;
    riskyUniversalCoverage: boolean;
    remainingClicksAfterRun: number;
  }>;
};

export type RunnerRunFundingSupport = {
  needId: string;
  gap: number;
  targetCredits: number;
  priorityClass: "P2" | "P4";
  parentPlanInstanceId: string;
  driver: {
    kind: "run" | "contest";
    targetId: string;
    reasonCode: string;
  };
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
  evidenceCode: string;
};
