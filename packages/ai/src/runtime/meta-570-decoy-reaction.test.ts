import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { projectRunnerRunActions } from "../actions/run-action-projection";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);
it("exposes the current ICE without projecting another run, then completes the same native run", () => {
  const saved = JSON.parse(
    readFileSync(
      new URL("./test-fixtures/meta-570-decoy-reaction.json", import.meta.url),
      "utf8",
    ),
  );
  expect(saved.provenance.checkedStates).toBe(148);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  let state: GameState = saved.state;
  const initial = state;
  const runId = saved.checkpoint.input.playerView.run.runId;
  const heads: string[] = [];
  for (let n = 0; n < 80; n++) {
    const side = state.activeSide;
    const input =
      n === 0
        ? structuredClone(saved.checkpoint.input)
        : buildAiDecisionInput(state, side, {
            difficulty: "hard",
            eventTail: state.eventLog,
            ownDeckSnapshot: saved.deckSnapshots[side],
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    if (n === 0) {
      expect(projectRunnerRunActions({ input })).toEqual([]);
      expect(
        input.playerView.servers.find((s: any) => s.id === "remote_2").ice[
          input.playerView.run.position.iceIndex
        ].definitionId,
      ).toBeUndefined();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        saved.checkpoint.runtime,
      );
      // This fixture resumes the uninterrupted live window. A process restart
      // intentionally invalidates the lease and has a separate contract.
      restoreResidentPlanPortfolioMemorySnapshot(
        input,
        structuredClone(saved.checkpoint.runtime.residentPlanPortfolio),
      );
    }
    const before = JSON.stringify(input);
    const decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === decision.actionId,
    );
    expect(action).toBeDefined();
    heads.push(action.type);
    if (n === 0) {
      expect(action.payload.approachIceExposeDecision).toBe("expose");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.expose_information");
    }
    expect(getPlayerView(state, side).run?.runId).toBe(runId);
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
    if (!getPlayerView(state, "runner").run) break;
  }
  expect(heads).not.toContain("start_run");
  expect(getPlayerView(state, "runner").run).toBeUndefined();
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});
