import { describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions as engineGetLegalActions,
  getPlayerView,
} from "../index";
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

  it("characterizes public action revalidation, latest event projection and hidden choice redaction", () => {
    const state = createGame({
      seed: "remaining-architecture-public-contract",
      setupMode: "completed",
    });
    const legalAction = engineGetLegalActions(state, "corp").find(
      (action) => action.type === "mandatory_draw",
    );
    if (!legalAction) throw new Error("Missing mandatory draw action.");

    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legalAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    const result = applyAction(
      state,
      {
        matchId: state.matchId,
        side: "corp",
        actionId: legalAction.actionId,
        clientKnownStateVersion: state.stateVersion,
      },
      { publicEventsMode: "latest" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.publicEvents).toHaveLength(1);
    expect(result.publicEvents[0]?.publicPayload).toMatchObject({
      actionType: "mandatory_draw",
      actor: "corp",
    });
    expect(JSON.stringify(result.publicEvents[0])).not.toContain(
      "privatePayload",
    );
    expect(JSON.stringify(result.publicEvents[0])).not.toContain(
      "cardInstances",
    );

    const hiddenHqCardId = state.corp.hq[0];
    if (!hiddenHqCardId) throw new Error("Missing hidden HQ card fixture.");
    const choiceState = {
      ...state,
      pendingChoice: {
        choiceId: "remaining_architecture_hidden_choice",
        side: "corp" as const,
        source: "remaining_architecture.hidden_choice",
        prompt: "Secret HQ card choice",
        kind: "select_cards" as const,
        options: [
          {
            id: "hidden_hq_1",
            label: "Secret HQ Agenda",
            value: hiddenHqCardId,
          },
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: state.stateVersion,
        visibility: "hidden_info_barrier" as const,
      },
    };
    const corpView = getPlayerView(choiceState, "corp");
    const runnerViewJson = JSON.stringify(getPlayerView(choiceState, "runner"));

    expect(corpView.pendingChoice?.options[0]?.label).toBe("Secret HQ Agenda");
    expect(runnerViewJson).not.toContain("Secret HQ Agenda");
    expect(runnerViewJson).not.toContain(hiddenHqCardId);
    expect(engineGetLegalActions(choiceState, "runner")).toEqual([]);
  });
});
