import { describe, expect, it, vi } from "vitest";
import type { AiDecision, AiDecisionInput } from "@netgrid/shared";

import { replayAiDecisionCheckpointWarmup } from "./checkpoint-warmup";

describe("decision checkpoint warmup", () => {
  it("fails closed on historical behavior drift in strict mode", () => {
    expect(() =>
      replayAiDecisionCheckpointWarmup({
        rows: [row(7, "historical")],
        policy: "strict",
        inputForStateVersion: input,
        choose: () => decision("current"),
        resetMemory: vi.fn(),
      }),
    ).toThrow(
      "warmup_behavior_drift:decision=7:expected=historical:actual=current",
    );
  });

  it("rebases memory and preserves only the compatible suffix", () => {
    const resetMemory = vi.fn();
    const persisted: number[] = [];
    const result = replayAiDecisionCheckpointWarmup({
      rows: [row(1, "same"), row(2, "historical"), row(3, "same")],
      policy: "rebase",
      inputForStateVersion: input,
      choose: (value, persist) => {
        if (persist) persisted.push(value.playerView.stateVersion);
        return decision(value.playerView.stateVersion === 2 ? "current" : "same");
      },
      resetMemory,
    });

    expect(result).toEqual({
      warmupDecisions: 3,
      warmupDrifts: [
        {
          decisionIndex: 2,
          stateVersion: 2,
          expectedActionId: "historical",
          actualActionId: "current",
        },
      ],
      compatibleSuffixDecisions: 1,
    });
    expect(resetMemory).toHaveBeenCalledOnce();
    expect(persisted).toEqual([1, 3]);
  });

  it("rejects a choice that changes while persistence is enabled", () => {
    expect(() =>
      replayAiDecisionCheckpointWarmup({
        rows: [row(4, "same")],
        policy: "rebase",
        inputForStateVersion: input,
        choose: (_value, persist) => decision(persist ? "changed" : "same"),
        resetMemory: vi.fn(),
      }),
    ).toThrow(
      "warmup_nondeterministic_choice:decision=4:preview=same:persisted=changed",
    );
  });

  it("rejects a warmup input for a different actor side", () => {
    expect(() =>
      replayAiDecisionCheckpointWarmup({
        rows: [row(4, "same")],
        policy: "rebase",
        inputForStateVersion: (stateVersion) => ({
          ...input(stateVersion),
          side: "runner",
        }),
        choose: () => decision("same"),
        resetMemory: vi.fn(),
      }),
    ).toThrow(
      "warmup_input_side_mismatch:decision=4:expected=corp:actual=runner",
    );
  });

  it("rejects an input projected for a different state version", () => {
    expect(() =>
      replayAiDecisionCheckpointWarmup({
        rows: [row(4, "same")],
        policy: "rebase",
        inputForStateVersion: () => input(5),
        choose: () => decision("same"),
        resetMemory: vi.fn(),
      }),
    ).toThrow(
      "warmup_input_state_version_mismatch:decision=4:expected=4:actual=5",
    );
  });
});

function row(decisionIndex: number, selectedActionId: string) {
  return {
    stateVersion: decisionIndex,
    decisionIndex,
    side: "corp" as const,
    selectedActionId,
  };
}

function decision(actionId: string): AiDecision {
  return {
    actionId,
    reasonCode: "test",
    explanation: "test",
    consideredActionIds: [],
    fallbackUsed: false,
    evidence: [],
    timeoutUsed: false,
    profileId: "test",
    difficulty: "hard",
    reason: "test",
  };
}

function input(stateVersion: number): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      stateVersion,
    },
  } as AiDecisionInput;
}
