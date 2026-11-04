import { readFileSync } from "node:fs";
import type { GameState, PlayerAction, CardInstanceId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  hashGameState,
  validateGameState,
} from "../../index";
const fixture = JSON.parse(
  readFileSync(
    new URL(
      "./test-fixtures/meta592-r2-g39-trace-run-end.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  state: GameState;
  action: PlayerAction;
  stateHash: string;
  checkedStates: number;
};
const rent = "runner_onr_classic_031_rent-i-con_2" as CardInstanceId;
function bid(state: GameState) {
  const result = applyAction(state, fixture.action);
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.error));
  expect(validateGameState(result.state)).toEqual({ ok: true, errors: [] });
  return result;
}
describe("trace-triggered run end retains the executing action", () => {
  it.each([
    "runner_onr_proteus_134_cortical-cybermodem_1",
    "runner_onr_v1_139_r-and-d-interface_1",
  ] as const)(
    "finishes the native Cinderella trace and the Corp hardware choice for %s",
    (hardware) => {
      const state = structuredClone(fixture.state),
        before = JSON.stringify(state);
      expect(fixture.checkedStates).toBe(350);
      expect(hashGameState(state)).toBe(fixture.stateHash);
      expect(getLegalActions(state, "runner").map((a) => a.actionId)).toContain(
        fixture.action.actionId,
      );
      const result = bid(state),
        next = result.state;
      expect(JSON.stringify(state)).toBe(before);
      expect(next.run).toBeUndefined();
      expect(next.trace).toBeUndefined();
      expect(next.runner.rig.programs).not.toContain(rent);
      expect(next.runner.heap.filter((id) => id === rent)).toHaveLength(1);
      expect(next.pendingChoice?.source).toMatch(
        /^trace_success.hardware_wrecker:/,
      );
      expect(next.pendingChoice?.side).toBe("corp");
      const legal = getLegalActions(next, "corp").find(
        (a) => a.type === "resolve_choice",
      );
      if (!legal || !next.pendingChoice)
        throw Error("Native Corp hardware choice missing");
      const resolved = applyAction(next, {
        matchId: next.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: next.stateVersion,
        selectedChoices: {
          choiceId: next.pendingChoice.choiceId,
          selectedOptionIds: ["hardware_" + hardware],
        },
      });
      expect(resolved.ok).toBe(true);
      if (!resolved.ok) throw Error(JSON.stringify(resolved.error));
      expect(validateGameState(resolved.state)).toEqual({
        ok: true,
        errors: [],
      });
      expect(resolved.state.runner.rig.hardware).not.toContain(hardware);
      expect(
        resolved.state.runner.heap.filter((id) => id === hardware),
      ).toHaveLength(1);
      expect(resolved.state.runner.grip.length).toBe(
        next.runner.grip.length - 2,
      );
      expect(
        resolved.state.pendingTraceHardwareWreckerContinuation,
      ).toBeUndefined();
      expect(resolved.state.pendingRunEndTrashContinuation).toBeUndefined();
      expect(hashGameState(bid(structuredClone(fixture.state)).state)).toBe(
        hashGameState(next),
      );
    },
  );
  it("keeps the same breaker when the run contains no actual break usage", () => {
    const state = structuredClone(fixture.state);
    state.run!.runEndTrashUsedBreakerIdsThisRun = [];
    const next = bid(state).state;
    expect(next.runner.rig.programs).toContain(rent);
    expect(next.runner.heap).not.toContain(rent);
    expect(next.pendingChoice?.side).toBe("corp");
  });
  it("rejects a stale trace choice without changing the original state", () => {
    const state = structuredClone(fixture.state),
      before = JSON.stringify(state);
    const result = applyAction(state, {
      ...fixture.action,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });
});
