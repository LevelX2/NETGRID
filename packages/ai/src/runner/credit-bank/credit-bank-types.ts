import type { RunnerCreditBankProspectivePlan } from "./credit-bank-prospective-planning";
import type { RunnerFundingRouteAssessment } from "../../plans/runner-funding-contracts";

export type RunnerCreditBankSignal = {
  bankId: string;
  phase: "install" | "build" | "cash_out" | "hold";
  actionIds: string[];
  rejectedActionIds?: string[];
  priorityClass: "P2" | "P4" | "P5";
  currentStoredCredits: number;
  portfolioStoredCredits: number;
  estimatedPayout: number;
  prospectivePlan?: RunnerCreditBankProspectivePlan;
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
