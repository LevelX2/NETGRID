import { hashGameState } from "@netgrid/engine";

import { FORBIDDEN_AI_INPUT_FIELDS } from "../../runtime/ai-decision-input";
import { AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION } from "./runtime-checkpoint";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointExpectationV1,
  type AiDecisionCheckpointV1,
} from "./checkpoint-types";

const EXPECTATION_FIELDS = {
  contractKind: true,
  acceptableActions: true,
  forbiddenActions: true,
  choice: true,
  discardChoice: true,
  strategicIntent: true,
  selectedScoreBreakdown: true,
  planExecution: true,
  runTargets: true,
  decisionChain: true,
} satisfies Record<keyof AiDecisionCheckpointExpectationV1, true>;

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
    Object.keys(fixture.expectation).some(
      (key) => !Object.hasOwn(EXPECTATION_FIELDS, key),
    )
  ) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_invalid",
      `Unsupported checkpoint expectation fields: ${Object.keys(
        fixture.expectation,
      )
        .filter((key) => !Object.hasOwn(EXPECTATION_FIELDS, key))
        .sort()
        .join(",")}`,
    );
  }
  if (
    !fixture.expectation.acceptableActions?.length &&
    !fixture.expectation.forbiddenActions?.length &&
    !fixture.expectation.choice &&
    !fixture.expectation.discardChoice &&
    !fixture.expectation.strategicIntent &&
    !fixture.expectation.selectedScoreBreakdown &&
    !fixture.expectation.planExecution &&
    !fixture.expectation.runTargets?.length &&
    !fixture.expectation.decisionChain
  ) {
    throw new AiDecisionCheckpointValidationError(
      "fixture_invalid",
      "Checkpoint has no behavioral expectation",
    );
  }
  return fixture;
}
