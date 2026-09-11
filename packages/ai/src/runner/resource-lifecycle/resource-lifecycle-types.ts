import type {
  RunnerFundingRouteAssessment,
  RunnerFundingRouteContract,
} from "../../plans/runner-funding-contracts";
import type { CreateSideCreditDemandParams } from "../../plans/credit-demand";

export type RunnerResourceLifecycleSignal = {
  lifecycleId: string;
  sourceCardInstanceId: string;
  definitionId: string;
  phase: "retain" | "leave_play";
  actionIds: string[];
  rejectedActionIds?: string[];
  supportNeedId?: string;
  marginalValue?: number;
  leavePlayPaymentAmount?: number;
  fundingGap?: number;
  fundingRouteActionIds?: string[];
  fundingRouteAssessment?: RunnerFundingRouteAssessment;
  priorityClass: "P5";
  value: number;
  evidenceCodes: string[];
};

export type ResourceLifecycleState = {
  kind: "resource_lifecycle";
  phase: RunnerResourceLifecycleSignal["phase"];
  signal: RunnerResourceLifecycleSignal;
};

export type ResourceLifecycleFundingRequest = Pick<
  CreateSideCreditDemandParams,
  | "demandId"
  | "sourcePlanId"
  | "purpose"
  | "priority"
  | "hardness"
  | "deadline"
  | "targetCredits"
  | "evidence"
> & { remainingClicks: number };

export type ResourceLifecycleFundingSearch = (
  request: ResourceLifecycleFundingRequest,
) => RunnerFundingRouteContract;
