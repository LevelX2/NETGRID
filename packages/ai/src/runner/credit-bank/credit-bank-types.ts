import type { RunnerCreditBankProspectivePlan } from "./credit-bank-prospective-planning";

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
  value: number;
  evidenceCodes: string[];
};

export type CreditBankState = {
  kind: "credit_bank";
  phase: RunnerCreditBankSignal["phase"];
  signal: RunnerCreditBankSignal;
};
