import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  replayEvents,
} from "../../index";
import {
  choiceRequest,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";

describe("ChoiceView projection", () => {
  it("exposes pendingChoice only to the owning side and resolves it through LegalActions", () => {
    const state = toRunnerTurn(createGameAfterSetup({ seed: "v093-choice" }));
    state.pendingChoice = choiceRequest(state, "runner");

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    const runnerActions = getLegalActions(state, "runner");

    expect(runnerView.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(runnerView.pendingChoice?.options[0]?.label).toBe(
      "Keep private option",
    );
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Keep private option");
    expect(runnerActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(
      runnerActions.some((action) => action.type === "trigger_ability"),
    ).toBe(false);

    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["illegal"],
      },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("ERR_INVALID_CHOICE");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: runnerActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: "choice_v093_runner",
        selectedOptionIds: ["keep"],
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.pendingChoice).toBeUndefined();
    expect(result.event.visibilityClass).toBe("private_to_side");
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "Keep private option",
    );
    expect(JSON.stringify(result.event.publicPayload)).not.toContain(
      "private prompt",
    );
    expect(replayEvents(state, [result.event]).ok).toBe(true);
  });

});
