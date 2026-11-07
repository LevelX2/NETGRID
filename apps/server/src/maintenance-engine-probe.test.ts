import { describe, expect, it } from "vitest";
import {
  createGame,
  createGameAfterSetup,
  getLegalActions,
  hashState,
} from "@netgrid/engine";
import { probeHistoricalEngineState } from "./maintenance-engine-probe";

function checkpoint() {
  const state = createGameAfterSetup({ seed: "maintenance-engine-probe" });
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.activeSide = "corp";
  state.corp.clicks = 3;
  return state;
}

describe("read-only historical Engine probes", () => {
  it("requires complete Choice values and preserves the exact RNG checkpoint", () => {
    const state = createGame({ seed: "historical-probe-mulligan" });
    const action = getLegalActions(state, "runner")[0]!;
    const before = hashState(state);
    const request = {
      state,
      expectedStateHash: before,
      actor: "runner" as const,
      actions: [{ actionId: action.actionId }],
    };
    expect(probeHistoricalEngineState(request)).toMatchObject({
      status: "rejected",
      reason: "engine_rejected_invocation",
      rejectedStep: 1,
    });
    const complete = {
      ...request,
      actions: [
        {
          actionId: action.actionId,
          selectedChoices: {
            choiceId: state.pendingChoice!.choiceId,
            selectedOptionIds: ["mulligan"],
          },
        },
      ],
    };
    const result = probeHistoricalEngineState(complete);
    expect(result.status).toBe("completed");
    expect(result.sourceRandomCounter).toBe(state.randomCounter);
    expect(result.steps![0]!.randomCounter).toBeGreaterThan(
      state.randomCounter,
    );
    expect(probeHistoricalEngineState(complete)).toEqual(result);
    expect(hashState(state)).toBe(before);
  });
  it("executes a legal alternative from the exact snapshot without changing the source", () => {
    const state = checkpoint(),
      before = hashState(state);
    const request = {
      state,
      expectedStateHash: before,
      actor: "corp" as const,
      actions: [
        { actionId: "corp.gain_credit" },
        { actionId: "corp.gain_credit" },
      ],
    };
    const result = probeHistoricalEngineState(request);
    expect(result.status).toBe("completed");
    expect(result.steps).toHaveLength(2);
    expect(result.steps?.at(-1)?.own).toMatchObject({
      credits: state.corp.credits + 2,
      clicks: 1,
    });
    expect(hashState(state)).toBe(before);
    expect(probeHistoricalEngineState(request)).toEqual(result);
    const serialized = JSON.stringify(result);
    for (const id of state.runner.grip) expect(serialized).not.toContain(id);
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("gameState");
  });

  it("fails closed for a mismatched snapshot, illegal action or an excessive horizon", () => {
    const state = checkpoint(),
      before = hashState(state);
    expect(
      probeHistoricalEngineState({
        state,
        expectedStateHash: "wrong",
        actor: "corp",
        actions: [{ actionId: "corp.gain_credit" }],
      }),
    ).toMatchObject({
      status: "unavailable",
      reason: "snapshot_binding_mismatch",
    });
    expect(
      probeHistoricalEngineState({
        state,
        expectedStateHash: before,
        actor: "corp",
        actions: [{ actionId: "runner.gain_credit" }],
      }),
    ).toMatchObject({
      status: "rejected",
      reason: "action_not_legal",
      rejectedStep: 1,
    });
    expect(
      probeHistoricalEngineState({
        state,
        expectedStateHash: before,
        actor: "corp",
        actions: Array.from({ length: 9 }, () => ({
          actionId: "corp.gain_credit",
        })),
      }),
    ).toMatchObject({ status: "rejected", reason: "invalid_probe_actions" });
    expect(hashState(state)).toBe(before);
  });
});
