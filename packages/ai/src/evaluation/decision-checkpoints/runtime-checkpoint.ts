import type { AiDecisionInput } from "@netgrid/shared";

import {
  getPlanPortfolioMemorySnapshot,
  restorePlanPortfolioMemorySnapshot,
} from "../../plans/plan-portfolio-memory";
import type { PlanPortfolioSnapshot } from "../../plans/plan-portfolio";
import {
  getTacticalPlanMemorySnapshot,
  restoreTacticalPlanMemorySnapshot,
} from "../../plans/plan-memory";
import type { TacticalPlanMemorySnapshot } from "../../plans/tactical-plan-types";
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

export const AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION =
  "ai-runtime-checkpoint-v1" as const;

export type AiRuntimeCheckpointV1 = {
  schemaVersion: typeof AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION;
  tacticalPlan?: TacticalPlanMemorySnapshot;
  planPortfolio?: PlanPortfolioSnapshot;
  strategicIntent?: StrategicIntentMemorySnapshot;
  runnerRunPlan?: RunnerRunPlan;
};

export function exportAiRuntimeCheckpoint(
  input: AiDecisionInput,
  deckSnapshotId: string,
): AiRuntimeCheckpointV1 {
  const tacticalPlan = getTacticalPlanMemorySnapshot(input);
  const planPortfolio = getPlanPortfolioMemorySnapshot(input);
  const strategicIntent = getStrategicIntentMemorySnapshot(
    input,
    deckSnapshotId,
  );
  const runnerRunPlan = getRunnerRunPlanMemorySnapshot(input);
  return {
    schemaVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    ...(tacticalPlan ? { tacticalPlan: structuredClone(tacticalPlan) } : {}),
    ...(planPortfolio
      ? { planPortfolio: structuredClone(planPortfolio) }
      : {}),
    ...(strategicIntent
      ? { strategicIntent: structuredClone(strategicIntent) }
      : {}),
    ...(runnerRunPlan
      ? { runnerRunPlan: structuredClone(runnerRunPlan) }
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
  restoreTacticalPlanMemorySnapshot(input, checkpoint.tacticalPlan);
  restorePlanPortfolioMemorySnapshot(input, checkpoint.planPortfolio);
  restoreStrategicIntentMemorySnapshot(
    input,
    checkpoint.strategicIntent,
    deckSnapshotId,
  );
  restoreRunnerRunPlanMemorySnapshot(input, checkpoint.runnerRunPlan);
}
