import type { AiDecisionInput } from "@netgrid/shared";

import {
  getPlanPortfolioMemorySnapshot,
  restorePlanPortfolioMemorySnapshot,
} from "../../plans/plan-portfolio-memory";
import type { PlanPortfolioSnapshot } from "../../plans/plan-portfolio";
import {
  getStrategicIntentMemorySnapshot,
  restoreStrategicIntentMemorySnapshot,
  type StrategicIntentMemorySnapshot,
} from "../../strategic-intent-memory";
import {
  getRunnerRunPlanMemorySnapshot,
  restoreRunnerRunPlanMemorySnapshot,
} from "../../runtime/runner-run-plan-memory";
import type { RunnerRunPlan } from "../../runtime/runner-run-plan-types";
import {
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { invalidateTurnPlanCommitmentForRestart } from "../../plans/turn-plan-commitment";

export const AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION =
  "ai-runtime-checkpoint-v1" as const;

export type AiRuntimeCheckpointV1 = {
  schemaVersion: typeof AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION;
  planPortfolio?: PlanPortfolioSnapshot;
  strategicIntent?: StrategicIntentMemorySnapshot;
  runnerRunPlan?: RunnerRunPlan;
  residentPlanPortfolio?: ResidentPlanPortfolio;
};

export function exportAiRuntimeCheckpoint(
  input: AiDecisionInput,
  deckSnapshotId: string,
): AiRuntimeCheckpointV1 {
  const planPortfolio = getPlanPortfolioMemorySnapshot(input);
  const strategicIntent = getStrategicIntentMemorySnapshot(
    input,
    deckSnapshotId,
  );
  const runnerRunPlan = getRunnerRunPlanMemorySnapshot(input);
  const residentPlanPortfolio = residentPlanPortfolioSnapshot(input);
  return {
    schemaVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    ...(planPortfolio ? { planPortfolio: structuredClone(planPortfolio) } : {}),
    ...(strategicIntent
      ? { strategicIntent: structuredClone(strategicIntent) }
      : {}),
    ...(runnerRunPlan ? { runnerRunPlan: structuredClone(runnerRunPlan) } : {}),
    ...(residentPlanPortfolio
      ? { residentPlanPortfolio: structuredClone(residentPlanPortfolio) }
      : {}),
  };
}

export function restoreAiRuntimeCheckpoint(
  input: AiDecisionInput,
  deckSnapshotId: string,
  checkpoint: AiRuntimeCheckpointV1,
): void {
  if (checkpoint.schemaVersion !== AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION) {
    throw new Error("fixture_migration_required:ai_runtime_checkpoint");
  }
  restorePlanPortfolioMemorySnapshot(input, checkpoint.planPortfolio);
  restoreStrategicIntentMemorySnapshot(
    input,
    checkpoint.strategicIntent,
    deckSnapshotId,
  );
  restoreRunnerRunPlanMemorySnapshot(input, checkpoint.runnerRunPlan);
  const residentPlanPortfolio = checkpoint.residentPlanPortfolio
    ? structuredClone(checkpoint.residentPlanPortfolio)
    : undefined;
  if (residentPlanPortfolio?.turnPlanCommitment) {
    residentPlanPortfolio.turnPlanCommitment =
      invalidateTurnPlanCommitmentForRestart(
        residentPlanPortfolio.turnPlanCommitment,
        "checkpoint-restored-runtime",
      ).commitment;
    delete residentPlanPortfolio.turnPlanExecutionLease;
  }
  restoreResidentPlanPortfolioMemorySnapshot(input, residentPlanPortfolio);
}
