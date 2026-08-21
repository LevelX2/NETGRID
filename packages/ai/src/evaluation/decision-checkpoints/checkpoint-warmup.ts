import type { AiDecision, AiDecisionInput, Side } from "@netgrid/shared";

export type AiDecisionCheckpointWarmupPolicy = "strict" | "rebase";

export type AiDecisionCheckpointWarmupRow = {
  stateVersion: number;
  decisionIndex: number;
  side: Side;
  selectedActionId: string;
};

export type AiDecisionCheckpointWarmupDrift = {
  decisionIndex: number;
  stateVersion: number;
  expectedActionId: string;
  actualActionId: string;
};

export function replayAiDecisionCheckpointWarmup(params: {
  rows: readonly AiDecisionCheckpointWarmupRow[];
  policy: AiDecisionCheckpointWarmupPolicy;
  inputForStateVersion: (stateVersion: number) => AiDecisionInput;
  choose: (
    input: AiDecisionInput,
    persistTacticalPlanMemory: boolean,
  ) => AiDecision;
  resetMemory: () => void;
}): {
  warmupDecisions: number;
  warmupDrifts: AiDecisionCheckpointWarmupDrift[];
  compatibleSuffixDecisions: number;
} {
  const warmupDrifts: AiDecisionCheckpointWarmupDrift[] = [];
  let compatibleSuffixDecisions = 0;
  for (const row of params.rows) {
    const input = params.inputForStateVersion(row.stateVersion);
    if (input.side !== row.side) {
      throw new Error(
        `warmup_input_side_mismatch:decision=${row.decisionIndex}:expected=${row.side}:actual=${input.side}`,
      );
    }
    if (input.playerView.stateVersion !== row.stateVersion) {
      throw new Error(
        `warmup_input_state_version_mismatch:decision=${row.decisionIndex}:expected=${row.stateVersion}:actual=${input.playerView.stateVersion}`,
      );
    }
    const preview = params.choose(input, false);
    if (preview.selectionKind && preview.selectionKind !== "direct") {
      throw new Error(
        `warmup_requires_applied_engine_randomized_decision:decision=${row.decisionIndex}`,
      );
    }
    if (preview.actionId !== row.selectedActionId) {
      if (params.policy === "strict") {
        throw new Error(
          `warmup_behavior_drift:decision=${row.decisionIndex}:expected=${row.selectedActionId}:actual=${preview.actionId}`,
        );
      }
      params.resetMemory();
      compatibleSuffixDecisions = 0;
      warmupDrifts.push({
        decisionIndex: row.decisionIndex,
        stateVersion: row.stateVersion,
        expectedActionId: row.selectedActionId,
        actualActionId: preview.actionId,
      });
      continue;
    }
    const persisted = params.choose(input, true);
    if (persisted.selectionKind && persisted.selectionKind !== "direct") {
      throw new Error(
        `warmup_requires_applied_engine_randomized_decision:decision=${row.decisionIndex}`,
      );
    }
    if (persisted.actionId !== preview.actionId) {
      throw new Error(
        `warmup_nondeterministic_choice:decision=${row.decisionIndex}:preview=${preview.actionId}:persisted=${persisted.actionId}`,
      );
    }
    compatibleSuffixDecisions += 1;
  }
  return {
    warmupDecisions: params.rows.length,
    warmupDrifts,
    compatibleSuffixDecisions,
  };
}
