export type ScoringConsumerDimensionId =
  | "goal_fit"
  | "target_fit"
  | "cost"
  | "timing"
  | "reachability"
  | "boardstate_need"
  | "risk"
  | "doctrine"
  | "plan_continuity"
  | "terminal_outcome"
  | "reserve"
  | "uncertainty";

export type ScoringConsumerImplementationStatus =
  | "active"
  | "partial"
  | "contract_only";

export type ScoringConsumerDimension = {
  id: ScoringConsumerDimensionId;
  owner: string;
  scale: {
    min: number;
    max: number;
    neutral: number;
  };
  implementationStatus: ScoringConsumerImplementationStatus;
  evidenceKeys: string[];
};

export const REQUIRED_SCORING_CONSUMER_DIMENSIONS = [
  "goal_fit",
  "target_fit",
  "cost",
  "timing",
  "reachability",
  "boardstate_need",
  "risk",
  "doctrine",
  "plan_continuity",
  "terminal_outcome",
  "reserve",
  "uncertainty",
] as const satisfies readonly ScoringConsumerDimensionId[];

export const SCORING_CONSUMER_DIMENSIONS = [
  {
    id: "goal_fit",
    owner: "decision/action-goal-fit.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "active",
    evidenceKeys: ["component:goal_fit", "utility_family:"],
  },
  {
    id: "target_fit",
    owner: "decision/action-goal-fit.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "active",
    evidenceKeys: ["component:target_fit", "target_choice_recommendation:"],
  },
  {
    id: "cost",
    owner: "decision/action-goal-fit.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "active",
    evidenceKeys: ["component:cost_fit", "semantic_credit_cost_penalty"],
  },
  {
    id: "timing",
    owner: "decision/action-goal-fit.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "active",
    evidenceKeys: ["component:timing_fit", "score_window:"],
  },
  {
    id: "reachability",
    owner: "runner-run-target-evaluation.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["run_target", "reachable", "path_passability"],
  },
  {
    id: "boardstate_need",
    owner: "runtime/semantic-runtime-corp-board-triage.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["corp_board_triage_primary:", "corp_board_triage_alignment"],
  },
  {
    id: "risk",
    owner: "decision/action-goal-fit.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "active",
    evidenceKeys: ["component:risk_adjustment", "high_risk_count:"],
  },
  {
    id: "doctrine",
    owner: "decision/doctrine-goal-synthesis.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["doctrine_v2:", "source:deck"],
  },
  {
    id: "plan_continuity",
    owner: "plans/tactical-plan-progression.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["previous_plan_continuity", "plan_progression:"],
  },
  {
    id: "terminal_outcome",
    owner: "runtime/semantic-runtime-corp-score-safety.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["terminalWindow", "corp_scoreline_safety_gate"],
  },
  {
    id: "reserve",
    owner: "runtime/semantic-runtime-corp-rez-floor.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "partial",
    evidenceKeys: ["remote_rez_floor:", "access_reserve_desired:"],
  },
  {
    id: "uncertainty",
    owner: "belief-state.ts",
    scale: { min: -100, max: 100, neutral: 0 },
    implementationStatus: "contract_only",
    evidenceKeys: ["beliefUncertainty", "unknown_payoff"],
  },
] as const satisfies readonly ScoringConsumerDimension[];

export function scoringConsumerDimensionById(
  id: ScoringConsumerDimensionId,
): ScoringConsumerDimension {
  const dimension = SCORING_CONSUMER_DIMENSIONS.find(
    (candidate) => candidate.id === id,
  );
  if (!dimension) {
    throw new Error(`Missing scoring consumer dimension: ${id}`);
  }
  return dimension;
}
