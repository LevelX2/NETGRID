import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { RunnerCreditBankProspectivePlan } from "./credit-bank-prospective-planning";
import type {
  RunnerFundingNeedSignal,
  RunnerFundingRouteAssessment,
} from "../../plans/runner-funding-contracts";
import type { RunnerDefenseSignals } from "../defense-recovery/defense-types";

export type RunnerCreditBankSignal = {
  bankId: string;
  phase: "install" | "build" | "cash_out" | "hold";
  actionIds: string[];
  rejectedActionIds?: string[];
  priorityClass: "P2" | "P4" | "P5" | "P6";
  currentStoredCredits: number;
  portfolioStoredCredits: number;
  estimatedPayout: number;
  investment?: {
    desiredLiquidity: number;
    additionalLoadExecutions: number;
    incrementalCreditsOverAlternative: number;
  };
  prospectivePlan?: RunnerCreditBankProspectivePlan;
  defenseFunding?: NonNullable<RunnerDefenseSignals["tagClearFundingNeed"]>;
  coverageFunding?: NonNullable<RunnerCoverageGapSignal["bankFunding"]>;
  liquidityFunding?: {
    parentPlanInstanceId: string;
    needId: string;
    stateVersion: number;
    need: Extract<RunnerFundingNeedSignal, { kind: "develop_liquidity" }>;
  };
  runFunding?: {
    parentPlanInstanceId: string;
    needId: string;
    runActionId: string;
    stateVersion: number;
    gap: number;
    routeAssessment: RunnerFundingRouteAssessment;
  };
  value: number;
  evidenceCodes: string[];
};

export type CreditBankState = {
  kind: "credit_bank";
  phase: RunnerCreditBankSignal["phase"];
  signal: RunnerCreditBankSignal;
};
