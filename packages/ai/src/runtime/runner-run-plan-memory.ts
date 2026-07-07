import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunPlan } from "./runner-run-plan-types";

const runnerRunPlanMemoryByKey = new Map<string, RunnerRunPlan>();

export class MissingRunnerRunPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingRunnerRunPlanError";
  }
}

export function runnerHasActiveRun(input: AiDecisionInput): boolean {
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

export function requireActiveRunnerRunPlan(
  input: AiDecisionInput,
): RunnerRunPlan | undefined {
  if (!runnerHasActiveRun(input)) return undefined;
  const plan = getRunnerRunPlanMemorySnapshot(input);
  if (!plan) {
    throw new MissingRunnerRunPlanError(
      [
        "active_runner_run_without_run_plan",
        `decision:${input.decisionId}`,
        `stateVersion:${input.playerView.stateVersion}`,
      ].join("|"),
    );
  }
  if (!runnerRunPlanIsActive(plan)) {
    throw new MissingRunnerRunPlanError(
      [
        "active_runner_run_without_active_run_plan",
        `decision:${input.decisionId}`,
        `stateVersion:${input.playerView.stateVersion}`,
        `plan:${plan.id}`,
        `lifecycle:${plan.lifecycle}`,
      ].join("|"),
    );
  }
  return plan;
}

export function rememberRunnerRunPlanMemorySnapshot(
  input: AiDecisionInput,
  plan: RunnerRunPlan,
): RunnerRunPlan {
  if (input.side !== "runner") {
    throw new Error("runner_run_plan_memory_requires_runner_side");
  }
  runnerRunPlanMemoryByKey.set(runnerRunPlanMemoryKey(input), plan);
  return plan;
}

export function clearRunnerRunPlanMemory(input: AiDecisionInput): void {
  runnerRunPlanMemoryByKey.delete(runnerRunPlanMemoryKey(input));
}

export function resetRunnerRunPlanMemory(): void {
  runnerRunPlanMemoryByKey.clear();
}

function runnerRunPlanIsActive(plan: RunnerRunPlan): boolean {
  return (
    plan.lifecycle === "created" ||
    plan.lifecycle === "active" ||
    plan.lifecycle === "adjusted" ||
    plan.lifecycle === "abort_recommended" ||
    plan.lifecycle === "invalid"
  );
}

function runnerRunPlanMemoryKey(input: AiDecisionInput): string {
  return `${runnerRunPlanMemoryContextId(input)}:${input.side}:${input.profileId}`;
}

function runnerRunPlanMemoryContextId(input: AiDecisionInput): string {
  const [decisionScope] = input.decisionId.split(":");
  if (decisionScope && decisionScope.length > 0) return decisionScope;
  return input.seed;
}
