import { hashGameState } from "@netgrid/engine";

import { FORBIDDEN_AI_INPUT_FIELDS } from "../../runtime/ai-decision-input";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
} from "./runtime-checkpoint";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointV1,
} from "./checkpoint-types";

export class AiDecisionCheckpointValidationError extends Error {
  constructor(
    readonly code:
      | "fixture_invalid"
      | "fixture_migration_required"
      | "fixture_redaction_violation",
    message: string,
  ) {
    super(message);
    this.name = "AiDecisionCheckpointValidationError";
  }
}

export function validateAiDecisionCheckpoint(
  fixture: AiDecisionCheckpointV1,
): AiDecisionCheckpointV1 {
  if (fixture.schemaVersion !== AI_DECISION_CHECKPOINT_SCHEMA_VERSION) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_migration_required",
      "Unsupported decision checkpoint schema",
    );
  }
  if (
    fixture.runtime.schemaVersion !== AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION ||
    fixture.compatibility.aiRuntimeCheckpointVersion !==
      AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION
  ) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_migration_required",
      "Unsupported runtime checkpoint schema",
    );
  }
  const state = fixture.engine.testOnlyGameState;
  if (
    state.matchId !== fixture.source.matchId ||
    state.stateVersion !== fixture.engine.stateVersion ||
    fixture.source.stateVersion !== fixture.engine.stateVersion ||
    hashGameState(state) !== fixture.engine.stateHash
  ) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_invalid",
      "Checkpoint state identity or hash mismatch",
    );
  }
  const serialized = JSON.stringify({
    deckSnapshot: fixture.deckSnapshot,
    eventPrefix: fixture.engine.eventPrefix,
    expectation: fixture.expectation,
  });
  const forbidden = FORBIDDEN_AI_INPUT_FIELDS.find((field) =>
    serialized.includes(`\"${field}\"`),
  );
  if (forbidden) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_redaction_violation",
      `Forbidden transport field in checkpoint surface: ${forbidden}`,
    );
  }
  if (
    !fixture.expectation.acceptableActions?.length &&
    !fixture.expectation.forbiddenActions?.length
  ) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_invalid",
      "Checkpoint has no behavioral expectation",
    );
  }
  return fixture;
}
