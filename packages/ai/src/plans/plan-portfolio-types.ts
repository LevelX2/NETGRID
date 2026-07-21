import type { Side } from "@netgrid/shared";
import type {
  PlanStepKind,
  PlanTarget,
  TacticalPlanType,
} from "./plan-contract-types";
import type { CreditDemand } from "./credit-demand";
import type { FundingRoute } from "./funding-route";

export const PLAN_PORTFOLIO_SCHEMA_VERSION = "plan-portfolio-v1" as const;

export type PlanExecutionClass =
  | "reactive_interrupt"
  | "bounded_sequence"
  | "recurring_cycle"
  | "development_project";

export type PlanPortfolioRole =
  | "reactive_interrupt"
  | "foreground"
  | "background";

export type PlanPortfolioLifecycle =
  | "active"
  | "dormant"
  | "blocked"
  | "suspended"
  | "ready"
  | "completed"
  | "abandoned";

export type PlanPortfolioPlanType = TacticalPlanType;

export type PlanPortfolioEntry = {
  portfolioEntryId: string;
  sourcePlanId: string;
  planType: PlanPortfolioPlanType;
  side: Side;
  executionClass: PlanExecutionClass;
  role: PlanPortfolioRole;
  lifecycle: PlanPortfolioLifecycle;
  priority: number;
  target?: PlanTarget;
  parentEntryId?: string;
  supportsEntryIds: string[];
  milestone: string;
  progress: number;
  selectedStepKind?: PlanStepKind;
  actionCandidateIds: string[];
  creditDemands?: CreditDemand[];
  fundingRoutes?: FundingRoute[];
  selectedFundingRoute?: FundingRoute;
  fundingCoverageResolvesHardBlocker?: boolean;
  cadence: {
    turnKey: string;
    maxActionsPerTurn: number;
    actionsUsedThisTurn: number;
    lastProgressTurnKey?: string;
  };
  resourceReservation: {
    credits: number;
    requestedCredits?: number;
    shortfallCredits?: number;
    clicks: number;
  };
  updatedAtStateVersion: number;
  evidence: string[];
};

export type PlanPortfolioSnapshot = {
  schemaVersion: typeof PLAN_PORTFOLIO_SCHEMA_VERSION;
  side: Side;
  profileId: string;
  stateVersion: number;
  turnKey: string;
  interrupt?: PlanPortfolioEntry;
  foreground?: PlanPortfolioEntry;
  backgrounds: PlanPortfolioEntry[];
  unallocatedCredits?: number;
  rejectedEntryIds: string[];
  evidence: string[];
};

export type PlanActionContributionKind =
  | "progress"
  | "enable"
  | "fund"
  | "protect"
  | "convert"
  | "complete";

export type PlanActionContribution = {
  actionId: string;
  portfolioEntryId: string;
  contributionKind: PlanActionContributionKind;
  value: number;
  milestoneAfter?: string;
  evidence: string[];
};

export type PlanActionContributionScore = {
  actionId: string;
  totalValue: number;
  interruptValue: number;
  foregroundValue: number;
  backgroundValue: number;
  multiPlanBonus: number;
  contributionCount: number;
  portfolioEntryIds: string[];
  evidence: string[];
};
