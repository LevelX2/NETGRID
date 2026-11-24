import type { CardDefinitionId, CardInstanceId, Side } from "@netgrid/shared";
import type { RunnerRunRouteReachability } from "../run-analysis/runner-run-route-quote";
import type {
  RunnerRunPlanServerId,
  RunnerRunObjective,
  RunnerRunAccessIntent,
  RunnerRunBudget,
  RunnerRunReserve,
  RunnerRunPathQuote,
  RunnerRunEncounterActionSequence,
} from "./runner-run-plan-types";

/** Persisted shape for the optional historical run plan in decision checkpoints. */
export type RunnerRunPlanLifecycle =
  | "created"
  | "active"
  | "adjusted"
  | "abort_recommended"
  | "invalid"
  | "completed"
  | "discarded";

export type RunnerRunPlanOrigin =
  | "basic_start_run"
  | "card_initiated_run"
  | "forced_run"
  | "followup_run"
  | "redirected_run";

export type RunnerRunEncounterStateRef = {
  server: RunnerRunPlanServerId;
  iceInstanceId?: CardInstanceId;
  iceIndex?: number;
  phase: "approach_ice" | "encounter_ice" | "movement" | "access";
};

export type RunnerRunEncounterObligation = {
  kind:
    | "pump_for_required_break"
    | "break_required_subroutine"
    | "continue_after_obligations"
    | "allow_plan_compatible_subroutines"
    | "jack_out"
    | "access";
  reason: string;
  requiredSequence?: RunnerRunEncounterActionSequence;
};

export type RunnerRunPlanRevalidationStatus =
  | "valid"
  | "adjusted"
  | "abort_recommended"
  | "invalid"
  | "objective_satisfied";

export type RunnerRunPlanRevalidationState = {
  status: RunnerRunPlanRevalidationStatus;
  reasons: string[];
  checkedAtStateVersion: number;
};

export type RunnerRunAbortPolicy = {
  allowJackOutWhenLegal: boolean;
  abortBelowCredits: number;
  abortReasons: string[];
};

export type RunnerRunVisibleEvidenceRef = {
  kind:
    | "player_view"
    | "legal_action"
    | "visible_card"
    | "public_event"
    | "action_semantic_candidate"
    | "deck_strategy"
    | "deck_capability";
  ref: string;
};

export type RunnerRunPlanDebugInfo = {
  summary: string;
  items: string[];
};

export type RunnerRunDecisionFingerprint = {
  schemaVersion: 1;
  value: string;
  evidence: string[];
};

export type RunnerRunCommitment = {
  targetServer: RunnerRunPlanServerId;
  goal: RunnerRunObjective["kind"];
  route: {
    reachability: RunnerRunRouteReachability;
    knownCost: number;
    guaranteedKnownCost: number;
    unknownIceCount: number;
    conditionalReasons: string[];
  };
  costs: {
    runAction: number;
    path: number;
    access: number;
  };
  reserves: {
    creditsAfterRun: number;
    gripAfterRun: number;
    stealOrTrash: number;
  };
  acceptedRisks: string[];
  expectedUtility: number;
  terminalConditions: {
    runnerAgendaPoints: number;
    agendaPointsToWin: number;
    pointsNeeded: number;
    objectiveCanEndGame: boolean;
  };
  decisionFingerprint: RunnerRunDecisionFingerprint;
  evidence: string[];
};

export type RunnerRunPlan = {
  id: string;
  side: Extract<Side, "runner">;
  lifecycle: RunnerRunPlanLifecycle;
  origin: RunnerRunPlanOrigin;
  objective: RunnerRunObjective;
  targetServer: { id: RunnerRunPlanServerId };
  accessIntent?: RunnerRunAccessIntent;
  runStartActionId: string;
  sourceTacticalGoalIds: string[];
  sourceStrategyEvidence: string[];
  budget: RunnerRunBudget;
  reserve: RunnerRunReserve;
  pathQuote: RunnerRunPathQuote;
  currentEncounter?: RunnerRunEncounterStateRef;
  currentObligation?: RunnerRunEncounterObligation;
  revalidation: RunnerRunPlanRevalidationState;
  abortPolicy: RunnerRunAbortPolicy;
  visibilityEvidence: RunnerRunVisibleEvidenceRef[];
  commitment?: RunnerRunCommitment;
  debug: RunnerRunPlanDebugInfo;
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
};
