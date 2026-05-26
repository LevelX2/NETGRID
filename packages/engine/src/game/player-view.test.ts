import { describe, expect, it } from "vitest";
import { getPlayerView as engineGetPlayerView } from "../index";
import { createGame } from "./create-game";
import { legalActionsFor } from "./legal-actions";
import { playerViewFor } from "./player-view";

describe("game player-view facade", () => {
  it("matches the public Engine API for Corp and Runner perspectives", () => {
    const state = createGame({
      seed: "arch-57-player-view-perspectives",
      setupMode: "completed",
    });

    expect(playerViewFor(state, "corp")).toEqual(
      engineGetPlayerView(state, "corp"),
    );
    expect(playerViewFor(state, "runner")).toEqual(
      engineGetPlayerView(state, "runner"),
    );
  });

  it("embeds LegalActions from the game legal-actions facade without mutating state", () => {
    const state = createGame({
      seed: "arch-57-player-view-legal-actions",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);
    const view = playerViewFor(state, "corp");

    expect(view.legalActions).toEqual(legalActionsFor(state, "corp"));
    expect(JSON.stringify(state)).toBe(before);
  });

  it("keeps pending-choice visibility and resolve actions stable", () => {
    const state = createGame({
      seed: "arch-57-player-view-pending-choice",
      setupMode: "completed",
    });
    state.pendingChoice = {
      choiceId: "arch_57_choice",
      side: "runner",
      source: "arch_57.choice",
      kind: "select_option",
      prompt: "ARCH-57 Test Choice",
      options: [{ id: "ok", label: "OK" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };

    const runnerView = playerViewFor(state, "runner");
    const corpView = playerViewFor(state, "corp");

    expect(runnerView.pendingChoice?.choiceId).toBe("arch_57_choice");
    expect(runnerView.legalActions).toEqual(legalActionsFor(state, "runner"));
    expect(corpView.pendingChoice).toBeUndefined();
    expect(corpView.legalActions).toEqual([]);
  });

  it("does not expose hidden hand identities across sides", () => {
    const state = createGame({
      seed: "arch-57-player-view-hidden-info",
      setupMode: "completed",
    });
    const hiddenCorpDefinitionId =
      state.cardInstances[state.corp.hq[0]!]!.definitionId;
    const hiddenRunnerDefinitionId =
      state.cardInstances[state.runner.grip[0]!]!.definitionId;
    const runnerView = playerViewFor(state, "runner");
    const corpView = playerViewFor(state, "corp");

    expect(JSON.stringify(runnerView)).not.toContain(hiddenCorpDefinitionId);
    expect(JSON.stringify(corpView)).not.toContain(hiddenRunnerDefinitionId);
    expect(
      corpView.own.gripOrHq.some(
        (card) => card.definitionId === hiddenCorpDefinitionId,
      ),
    ).toBe(true);
    expect(
      runnerView.own.gripOrHq.some(
        (card) => card.definitionId === hiddenRunnerDefinitionId,
      ),
    ).toBe(true);
  });
});
