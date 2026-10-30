import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

afterEach(resetResidentPlanPortfolioMemory);
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-zero-cost-preparation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
it("publishes assessed zero break cost and installs the decoder under its actual remote parent", () => {
  const saved = original();
  expect(saved.provenance.checkedStates).toBe(332);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  const view = saved.checkpoint.input.playerView;
  const server = view.servers.find((s: any) => s.id === "remote_1");
  const decoder = view.own.gripOrHq.find(
    (c: any) => c.definitionId === "onr_v1_014_codecracker",
  );
  const beforePath = assessKnownRezzedIcePath(
    server.ice,
    view.own.rig,
    Number.MAX_SAFE_INTEGER,
    server.root,
    view.opponent.credits,
  );
  const afterPath = assessKnownRezzedIcePath(
    server.ice,
    [...view.own.rig, decoder],
    Number.MAX_SAFE_INTEGER,
    server.root,
    view.opponent.credits,
  );
  expect(beforePath.visibleBreakCost).toBe(4);
  expect(afterPath).toMatchObject({
    canReachAccess: true,
    assessedKnownIceCount: 2,
    visibleBreakCost: 0,
  });
  let state = saved.state;
  const initial = state;
  const turn = view.turnSerial;
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
    if (n === 0)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        saved.checkpoint.runtime,
      );
    const unchanged = JSON.stringify(input);
    const decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(unchanged);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    const action = input.legalActions.find(
      (a: any) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    if (n < 2) heads.push(action.type);
    if (n === 0) {
      expect(action.source).toContain("codecracker");
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.rig_and_coverage");
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe("plan:runner.contest_remote:remote%3Aremote_1");
    }
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
    if (state.winner || getPlayerView(state, "runner").turnSerial !== turn)
      break;
  }
  expect(heads).toEqual(["install_card", "start_run"]);
  expect(getPlayerView(state, "runner").own).toMatchObject({
    agendaPoints: 4,
    credits: 8,
    memoryUsed: 4,
  });
  expect(state.winner).toBeNull();
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});
it("keeps an unassessed all-unknown path distinct from an assessed free path", () => {
  const view = original().checkpoint.input.playerView;
  const server = view.servers.find((s: any) => s.id === "remote_1");
  const path = assessKnownRezzedIcePath(
    server.ice.filter((c: any) => !c.known),
    view.own.rig,
    Number.MAX_SAFE_INTEGER,
    server.root,
    view.opponent.credits,
  );
  expect(path.assessedKnownIceCount).toBe(0);
  expect(path.visibleBreakCost).toBeUndefined();
});
