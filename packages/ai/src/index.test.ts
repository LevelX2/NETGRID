import { describe, expect, it } from "vitest";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netrunner/engine";
import { assertAiInputIsSideSafe, chooseCorpAction } from "./index";

describe("Corp AI MVP 0.1", () => {
  it("chooses only a legal action", () => {
    const state = createGame({ seed: "ai-legal" });
    const legalActions = getLegalActions(state, "corp");
    const decision = chooseCorpAction({
      side: "corp",
      playerView: getPlayerView(state, "corp"),
      publicEventLog: state.eventLog,
      legalActions,
      difficulty: "easy",
      seed: state.seed
    });

    expect(legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  });

  it("does not need full GameState or hidden Runner stack titles", () => {
    const state = createGame({ seed: "ai-visibility" });
    const input = {
      side: "corp" as const,
      playerView: getPlayerView(state, "corp"),
      publicEventLog: state.eventLog,
      legalActions: getLegalActions(state, "corp"),
      difficulty: "easy" as const,
      seed: state.seed
    };
    const serialized = JSON.stringify(input);

    expect(serialized).not.toContain("Simple Fracter");
    expect(serialized).not.toContain("Simple Decoder");
    expect(serialized).not.toContain("Simple Killer");
    expect(assertAiInputIsSideSafe(input)).toBe(true);
  });

  it("keeps applying legal fallback actions over a long smoke run", () => {
    let state = createGame({ seed: "ai-smoke" });
    for (let step = 0; step < 100 && !state.winner; step += 1) {
      const side = state.activeSide;
      const legalActions = getLegalActions(state, side);
      if (legalActions.length === 0) break;
      const action =
        side === "corp"
          ? legalActions.find((candidate) => candidate.actionId === chooseCorpAction({
              side: "corp",
              playerView: getPlayerView(state, "corp"),
              publicEventLog: state.eventLog,
              legalActions,
              difficulty: "easy",
              seed: state.seed
            }).actionId)
          : legalActions.find((candidate) => candidate.type === "end_turn") ?? legalActions[0];
      expect(action).toBeDefined();
      if (!action) break;
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `ai-smoke-${step}`
      });
      expect(result.ok).toBe(true);
      if (!result.ok) break;
      state = result.state;
    }
  });
});
