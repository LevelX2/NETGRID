import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyAction as publicApplyAction,
  createGame as publicCreateGame,
  getLegalActions as publicGetLegalActions,
  getPlayerView as publicGetPlayerView,
  hashState as publicHashState,
  replayEvents as publicReplayEvents,
} from "../index";
import {
  applyAction as runtimeApplyAction,
  createGame as runtimeCreateGame,
  getLegalActions as runtimeGetLegalActions,
  getPlayerView as runtimeGetPlayerView,
  hashState as runtimeHashState,
  replayEvents as runtimeReplayEvents,
} from "./engine-runtime";

describe("engine runtime boundary", () => {
  it("does not import the public index facade", () => {
    const source = readFileSync(
      new URL("./engine-runtime.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });

  it("keeps the index public API wired to the runtime exports", () => {
    expect(publicCreateGame).toBe(runtimeCreateGame);
    expect(publicApplyAction).toBe(runtimeApplyAction);
    expect(publicGetLegalActions).toBe(runtimeGetLegalActions);
    expect(publicGetPlayerView).toBe(runtimeGetPlayerView);
    expect(publicReplayEvents).toBe(runtimeReplayEvents);
    expect(publicHashState).toBe(runtimeHashState);
  });

  it("runs representative public API flows through both import paths", () => {
    const publicState = publicCreateGame({
      seed: "arch-102-runtime-boundary",
      setupMode: "completed",
    });
    const runtimeState = runtimeCreateGame({
      seed: "arch-102-runtime-boundary",
      setupMode: "completed",
    });
    const publicAction = publicGetLegalActions(publicState, "corp").find(
      (action) => action.type === "mandatory_draw",
    );
    const runtimeAction = runtimeGetLegalActions(runtimeState, "corp").find(
      (action) => action.type === "mandatory_draw",
    );

    expect(publicState).toEqual(runtimeState);
    expect(publicGetPlayerView(publicState, "corp")).toEqual(
      runtimeGetPlayerView(runtimeState, "corp"),
    );
    expect(publicHashState(publicState)).toBe(runtimeHashState(runtimeState));
    expect(publicReplayEvents(publicState, publicState.eventLog)).toEqual(
      runtimeReplayEvents(runtimeState, runtimeState.eventLog),
    );
    expect(publicAction).toEqual(runtimeAction);
    expect(publicAction).toBeDefined();
    if (!publicAction || !runtimeAction) return;

    const publicResult = publicApplyAction(publicState, {
      matchId: publicState.matchId,
      side: "corp",
      actionId: publicAction.actionId,
      clientKnownStateVersion: publicState.stateVersion,
    });
    const runtimeResult = runtimeApplyAction(runtimeState, {
      matchId: runtimeState.matchId,
      side: "corp",
      actionId: runtimeAction.actionId,
      clientKnownStateVersion: runtimeState.stateVersion,
    });

    expect(publicResult).toEqual(runtimeResult);
  });
});
