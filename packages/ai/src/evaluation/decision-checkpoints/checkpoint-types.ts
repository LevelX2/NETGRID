import type {
  AiDifficulty,
  GameState,
  PublicGameEvent,
  Side,
} from "@netgrid/shared";

import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

export const AI_DECISION_CHECKPOINT_SCHEMA_VERSION =
  "ai-decision-checkpoint-v1" as const;

export type AiDecisionCheckpointActionMatcher = {
  actionId?: string;
  type?: string;
  sourceDefinitionId?: string;
  targetServerId?: string;
};

export type AiDecisionCheckpointExpectationV1 = {
  acceptableActions?: AiDecisionCheckpointActionMatcher[];
  forbiddenActions?: AiDecisionCheckpointActionMatcher[];
};

export type AiDecisionCheckpointV1 = {
  schemaVersion: typeof AI_DECISION_CHECKPOINT_SCHEMA_VERSION;
  checkpointId: string;
  source: {
    kind: "captured_match" | "synthetic_companion";
    findingId: string;
    capturedAt: string;
    matchId?: string;
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
