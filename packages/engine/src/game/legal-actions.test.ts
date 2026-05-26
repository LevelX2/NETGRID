import { describe, expect, it } from "vitest";
import { getLegalActions as engineGetLegalActions } from "../index";
import { createGame } from "./create-game";
import { legalActionsFor } from "./legal-actions";

describe("game legal-actions facade", () => {
  it("matches the public Engine API for a Corp mandatory draw window", () => {
    const state = createGame({
      seed: "arch-56-corp-mandatory-draw",
      setupMode: "completed",
    });

    expect(legalActionsFor(state, "corp")).toEqual(
      engineGetLegalActions(state, "corp"),
    );
  });

  it("matches the public Engine API for a Runner main-action window", () => {
    const state = createGame({
      seed: "arch-56-runner-main",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 4;

    expect(legalActionsFor(state, "runner")).toEqual(
      engineGetLegalActions(state, "runner"),
    );
  });

  it("matches pending-choice resolve actions without mutating state", () => {
    const state = createGame({
      seed: "arch-56-pending-choice",
      setupMode: "completed",
    });
    state.pendingChoice = {
      choiceId: "arch_56_choice",
      side: "runner",
      source: "arch_56.choice",
      kind: "select_option",
      prompt: "ARCH-56 Test Choice",
      options: [{ id: "ok", label: "OK" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    const before = JSON.stringify(state);

    expect(legalActionsFor(state, "runner")).toEqual(
      engineGetLegalActions(state, "runner"),
    );
    expect(JSON.stringify(state)).toBe(before);
  });
});
