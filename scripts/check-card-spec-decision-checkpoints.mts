import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointV1,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-types";
import {
  AiDecisionCheckpointValidationError,
  validateAiDecisionCheckpoint,
} from "../packages/ai/src/evaluation/decision-checkpoints/checkpoint-validation";
import { assertTurnPlanCommitment } from "../packages/ai/src/plans/turn-plan-commitment";

const directory = fileURLToPath(
  new URL("../data/scenarios/ai-decision-checkpoints/", import.meta.url),
);
const files = readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();
const invalid: Array<{ file: string; code: string; message: string }> = [];
let checkpointCount = 0;
let commitmentCount = 0;

for (const file of files) {
  let code = "invalid_json";
  try {
    const record = JSON.parse(readFileSync(join(directory, file), "utf8")) as {
      schemaVersion?: unknown;
      engine?: { testOnlyGameState?: unknown };
    } | null;
    if (
      record?.schemaVersion !== AI_DECISION_CHECKPOINT_SCHEMA_VERSION &&
      !record?.engine?.testOnlyGameState
    ) {
      continue;
    }

    checkpointCount++;
    code = "fixture_invalid";
    const checkpoint = validateAiDecisionCheckpoint(record as AiDecisionCheckpointV1);
    const commitment = checkpoint.runtime.residentPlanPortfolio?.turnPlanCommitment;
    if (commitment !== undefined) {
      commitmentCount++;
      code = "invalid_turn_plan_commitment";
      assertTurnPlanCommitment(commitment);
    }
  } catch (error) {
    invalid.push({
      file,
      code: error instanceof AiDecisionCheckpointValidationError ? error.code : code,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

process.stdout.write(`${JSON.stringify({ checkpointCount, commitmentCount, invalid }, null, 2)}\n`);
if (checkpointCount === 0 || invalid.length > 0) process.exitCode = 1;
