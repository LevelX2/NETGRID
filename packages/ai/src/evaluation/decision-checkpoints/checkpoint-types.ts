import type {
  AiDecisionChainDebug,
  AiDifficulty,
  AiDecisionSelectionRoute,
  GameState,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";

import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import type {
  StrategicIntentFamily,
  StrategicTargetVector,
} from "../../strategic-intent-state";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type {
  RunnerPathPassability,
  RunnerRunTargetRecommendation,
} from "../../runner-run-target-evaluation";

export const AI_DECISION_CHECKPOINT_SCHEMA_VERSION =
  "ai-decision-checkpoint-v1" as const;

export type AiDecisionCheckpointActionMatcher = {
  actionId?: string;
  type?: string;
  sourceDefinitionId?: string;
  runnerAbility?: string;
  targetCardInstanceId?: string;
  targetDefinitionId?: string;
  targetServerId?: string;
};

export type AiDecisionCheckpointRunTargetExpectation = {
  actionId?: string;
  targetServerId?: string;
  pathPassability?: RunnerPathPassability;
  pathCost?: number;
  creditsAfterRun?: number;
  recommendation?: RunnerRunTargetRecommendation;
  requiredEvidence?: string[];
  forbiddenEvidence?: string[];
};

export type AiDecisionCheckpointPlanExecutionExpectation = {
  acceptablePlanIds?: string[];
  forbiddenPlanIds?: string[];
  acceptablePlanKinds?: string[];
  forbiddenPlanKinds?: string[];
  acceptableCapabilities?: string[];
  forbiddenCapabilities?: string[];
  requiredAssessmentEvidence?: string[];
  forbiddenAssessmentEvidence?: string[];
};

export type AiDecisionCheckpointExpectationV1 = {
  contractKind?: "correctness" | "equivalence_only";
  acceptableActions?: AiDecisionCheckpointActionMatcher[];
  forbiddenActions?: AiDecisionCheckpointActionMatcher[];
  choice?: {
    mustSelectOptionIds?: string[];
    mustNotSelectOptionIds?: string[];
    selectedOptionIdsPrefix?: string[];
    mustSelectValues?: Array<string | number | boolean>;
    mustNotSelectValues?: Array<string | number | boolean>;
  };
  discardChoice?: {
    mustRetainDefinitionIds?: string[];
    mustDiscardDefinitionIds?: string[];
  };
  strategicIntent?: {
    acceptablePrimaryStrategyIds?: string[];
    forbiddenPrimaryStrategyIds?: string[];
    acceptableFamilies?: StrategicIntentFamily[];
    forbiddenTargetKinds?: StrategicTargetVector["kind"][];
  };
  selectedScoreBreakdown?: {
    requiredComponentKeys?: string[];
    forbiddenComponentKeys?: string[];
  };
  planExecution?: AiDecisionCheckpointPlanExecutionExpectation;
  runTargets?: AiDecisionCheckpointRunTargetExpectation[];
  decisionChain?: {
    selectionRoute?: AiDecisionSelectionRoute;
    rawScoreWinner?: AiDecisionCheckpointActionMatcher;
    planMappedAction?: AiDecisionCheckpointActionMatcher;
    arbitrationOutcome?: NonNullable<
      AiDecisionChainDebug["planArbitration"]
    >["outcome"];
    requiredAdjustmentKinds?: Array<
      AiDecisionChainDebug["adjustments"][number]["kind"]
    >;
  };
};

export type AiDecisionCheckpointV1 = {
  schemaVersion: typeof AI_DECISION_CHECKPOINT_SCHEMA_VERSION;
  checkpointId: string;
  source: {
    kind: "captured_match" | "captured_selfplay" | "synthetic_companion";
    findingId: string;
    capturedAt: string;
    matchId?: string;
    decisionScopeId?: string;
    decisionIndex?: number;
    stateVersion?: number;
  };
  compatibility: {
    engineSchemaVersion: string;
    aiRuntimeCheckpointVersion: string;
  };
  actor: Side;
  difficulty: AiDifficulty;
  profileId: string;
  deckSnapshot: AiDeckStrategyDeckSnapshot;
  engine: {
    stateVersion: number;
    stateHash: string;
    testOnlyGameState: GameState;
    eventPrefix: PublicGameEvent[];
  };
  runtime: AiRuntimeCheckpointV1;
  expectation: AiDecisionCheckpointExpectationV1;
};

export type AiDecisionCheckpointErrorCode =
  | "behavior_regression"
  | "engine_legality_drift"
  | "runtime_state_drift"
  | "fixture_migration_required"
  | "fixture_redaction_violation"
  | "fixture_invalid";
