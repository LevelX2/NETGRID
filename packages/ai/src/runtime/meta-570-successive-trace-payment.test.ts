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
import { buildAiDecisionInput } from "./ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
afterEach(resetResidentPlanPortfolioMemory);
function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-570-successive-trace-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
it("retains the contest owner through rez, two mandatory traces and the selected bid payment", () => {
  const saved = original();
  expect(saved.provenance.checkedStates).toBe(183);
  expect(hashState(saved.state)).toBe(saved.checkpoint.stateHash);
  expect(
    Object.values(saved.checkpoint.validation).every((v) => v === true),
  ).toBe(true);
  let state: GameState = saved.state;
  const initial = state;
  const actions: string[] = [];
  const bids: string[][] = [];
  let support = 0;
  for (let n = 0; n < 24; n++) {
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
        input.ownDeckSnapshot!.deckSnapshotId!,
        saved.checkpoint.runtime,
      );
    const before = JSON.stringify(input),
      d = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(d.fallbackUsed || d.timeoutUsed).toBe(false);
    const a = input.legalActions.find((x: any) => x.actionId === d.actionId)!;
    expect(a).toBeDefined();
    actions.push(a.type);
    if (side === "runner" && n === 0)
      expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
        stateVersion: 182,
        pendingRunnerCostPenaltySupportOrigin: {
          rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          executorInstanceId: "plan:runner.convert_run_window:run%3Arun_173",
          originalActionId: a.actionId,
          selectedAtStateVersion: 182,
        },
      });
    if (a.payload?.costPenaltySupportWindowId) {
      support++;
      expect(d.decisionDebug?.planFirstDecision?.executionOrigin).toMatchObject(
        {
          rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          leafPlanInstanceId: "plan:runner.convert_run_window:run%3Arun_173",
        },
      );
    }
    if (
      side === "runner" &&
      a.type === "resolve_choice" &&
      input.playerView.pendingChoice?.kind === "bid_amount"
    ) {
      const ids = d.selectedChoices!.selectedOptionIds;
      if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string"))
        throw Error("Invalid native bid options");
      bids.push(ids);
    }
    const r = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: a.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(d.selectedChoices ? { selectedChoices: d.selectedChoices } : {}),
    });
    if (!r.ok) throw Error(r.error.message);
    state = r.state;
    if (!getPlayerView(state, "runner").run) break;
  }
  expect(support).toBe(1);
  expect(bids.slice(0, 2)).toEqual([["bid_6"], ["bid_6"]]);
  expect(getPlayerView(state, "runner").own.tags).toBe(0);
  expect(
    getPlayerView(state, "runner").own.rig?.some(
      (c) => c.definitionId === "onr_proteus_133_chiba-bank-account",
    ),
  ).toBe(false);
  expect(actions).toContain("access_card");
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});
it.each(["gap", "wrong_server", "wrong_run", "foreign_executor"] as const)(
  "does not adopt an unbound mandatory encounter transition: %s",
  (boundary) => {
    const saved = original(),
      input = structuredClone(saved.checkpoint.input),
      runtime = structuredClone(saved.checkpoint.runtime);
    const p = runtime.residentPlanPortfolio;
    if (boundary === "gap")
      input.eventTail = input.eventTail.filter(
        (e: any) => e.stateVersionBefore !== 181,
      );
    if (boundary === "wrong_server")
      input.eventTail.find(
        (e: any) => e.stateVersionBefore === 181,
      ).publicPayload.serverId = "rd";
    if (boundary === "wrong_run") input.playerView.run.runId = "different_run";
    if (boundary === "foreign_executor")
      p.instances.find(
        (x: any) => x.instanceId === p.executorInstanceId,
      ).parentInstanceId = "foreign";
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId!,
      runtime,
    );
    try {
      chooseAiAction(input);
    } catch {
      return;
    }
    expect(
      residentPlanPortfolioSnapshot(input)
        ?.pendingRunnerCostPenaltySupportOrigin?.selectedAtStateVersion,
    ).not.toBe(182);
  },
);

it.each([
  "missing_completion",
  "wrong_trace",
  "wrong_choice",
  "wrong_step",
] as const)("does not adopt a foreign trace completion: %s", (boundary) => {
  const saved = original();
  let state: GameState = saved.state;
  for (let n = 0; n < 3; n++) {
    const side = state.activeSide,
      input =
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
        input.ownDeckSnapshot!.deckSnapshotId!,
        saved.checkpoint.runtime,
      );
    const d = chooseAiAction(input);
    if (!d.actionId) throw Error("Missing native chosen action");
    const r = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: d.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(d.selectedChoices ? { selectedChoices: d.selectedChoices } : {}),
    });
    if (!r.ok) throw Error(r.error.message);
    state = r.state;
  }
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    eventTail: state.eventLog,
    ownDeckSnapshot: saved.deckSnapshots.runner,
  });
  const event = input.eventTail!.find((e) => e.stateVersionBefore === 184)!;
  if (boundary === "missing_completion")
    delete event.publicPayload.traceSuccessful;
  if (boundary === "wrong_trace")
    event.publicPayload.traceId = "foreign_run.ice.trace";
  if (boundary === "wrong_choice")
    event.publicPayload.choiceId = "foreign_choice";
  if (boundary === "wrong_step") event.publicPayload.traceStep = "corp_bid";
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  chooseAiAction(input);
  expect(
    residentPlanPortfolioSnapshot(input)?.pendingRunnerCostPenaltySupportOrigin
      ?.selectedAtStateVersion,
  ).toBe(184);
});
