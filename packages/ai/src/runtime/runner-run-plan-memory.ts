import type { AiDecisionInput } from "@netgrid/shared";
import { MatchRuntimeMemory } from "./match-runtime-memory";
import type { RunnerRunPlan } from "./runner-run-plan-snapshot";

// Imported checkpoint snapshots are still consumed by the trace-bid evaluator.
const runnerRunPlanMemoryByKey = new MatchRuntimeMemory<RunnerRunPlan>();

function runnerHasActiveRun(input: AiDecisionInput): boolean {
  return input.side === "runner" && input.playerView.run !== undefined;
}

export function getRunnerRunPlanMemorySnapshot(
  input: AiDecisionInput,
): RunnerRunPlan | undefined {
  const key = runnerRunPlanMemoryKey(input);
  if (!runnerHasActiveRun(input)) {
    runnerRunPlanMemoryByKey.delete(key);
    return undefined;
  }
  return runnerRunPlanMemoryByKey.get(key);
}

export function resetRunnerRunPlanMemory(): void {
  runnerRunPlanMemoryByKey.clear();
}

export function restoreRunnerRunPlanMemorySnapshot(
  input: AiDecisionInput,
  plan: RunnerRunPlan | undefined,
): void {
  const key = runnerRunPlanMemoryKey(input);
  if (!plan) {
    runnerRunPlanMemoryByKey.delete(key);
    return;
  }
  if (
    !runnerHasActiveRun(input) ||
    plan.updatedAtStateVersion > input.playerView.stateVersion
  ) {
    throw new Error("invalid_runner_run_plan_memory_checkpoint");
  }
  runnerRunPlanMemoryByKey.set(
    key,
    structuredClone(plan),
    runnerRunPlanMemoryContextId(input),
  );
}

function runnerRunPlanMemoryKey(input: AiDecisionInput): string {
  return `${runnerRunPlanMemoryContextId(input)}:${input.side}:${input.profileId}`;
}

// Simulation and replay callers own memory by the decision scope, even when
// they supply the original match id for reconstructing Engine state.
function runnerRunPlanMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}
