import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { runnerTerminalRemoteContestIsDirectlyMandatory } from "./remote-contest-admission";

const load = () =>
  JSON.parse(
    readFileSync(
      new URL("./test-fixtures/terminal-tag-cleanup.json", import.meta.url),
      "utf8",
    ),
  );
const root = "plan:runner.contest_remote:remote%3Aremote_1";
afterEach(resetResidentPlanPortfolioMemory);
function nativeInput() {
  const f = load(),
    input = f.checkpoint.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.checkpoint.runtime,
  );
  return { f, input };
}
it("replaces the fulfilled coverage need with the currently executable terminal contest", () => {
  const { f, input } = nativeInput();
  expect(f.provenance.checkedOriginalStates).toBe(121);
  expect(Object.values(f.checkpoint.validation).every((v) => v === true)).toBe(
    true,
  );
  expect(hashGameState(f.state)).toBe(f.checkpoint.stateHash);
  const before = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(decision.actionId).toBe("runner.start_run.remote_1");
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    root,
  );
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject(
    { moduleId: "runner.contest_remote", executionState: "executor" },
  );
  expect(
    input.legalActions.some(
      (a: { actionId: string }) => a.actionId === decision.actionId,
    ),
  ).toBe(true);
});
it("steals Tycho and clears the fixed tag through normal choices in the whole native turn", () => {
  const { f } = nativeInput();
  let state = f.state;
  const initial = state,
    startTurn = state.turnSerial;
  const actions: string[] = [];
  for (
    let n = 0;
    n < 60 && state.turnSerial === startTurn && !state.winner;
    n++
  ) {
    const side = (["runner", "corp"] as const).find(
      (s) => getLegalActions(state, s).length > 0,
    )!;
    const input =
      n === 0
        ? f.checkpoint.input
        : buildAiDecisionInput(state, side, {
            difficulty: "hard",
            eventTail: state.eventLog,
            ownDeckSnapshot: f.deckSnapshots[side],
          });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    const before = JSON.stringify(input),
      decision = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    if (n === 0)
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toBe(root);
    const action = input.legalActions.find(
      (a: { actionId: string }) => a.actionId === decision.actionId,
    )!;
    expect(action).toBeDefined();
    actions.push(action.type);
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
  }
  expect(actions[0]).toBe("start_run");
  expect(actions).toContain("steal_agenda");
  expect(actions).toContain("remove_tag");
  expect(getPlayerView(state, "runner").own).toMatchObject({
    agendaPoints: 5,
    tags: 0,
    credits: 2,
  });
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok) throw Error("Replay failed");
  expect(hashState(replay.state)).toBe(hashState(state));
});
it("admits the fully financed fixed tag cleanup from the native quote", () => {
  const { input } = nativeInput();
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(target.routeQuote).toMatchObject({
    reachability: "guaranteed_access",
    knownCost: 4,
    fundingGap: 0,
    unknownIceCount: 0,
  });
  expect(target.visibleIceRunHazards).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        kind: "trace_tag",
        expectedTags: 1,
        unavoidable: true,
      }),
    ]),
  );
  expect(runnerTerminalRemoteContestIsDirectlyMandatory(input, target)).toBe(
    true,
  );
});
it.each([
  "last_click",
  "insufficient_cash",
  "lost_click",
  "unknown_ice",
  "persistent_counter",
  "damage",
  "access_damage",
  "unknown_tag_amount",
])("keeps %s outside the fixed tag cleanup admission", (kind) => {
  const { input } = nativeInput();
  const target = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  if (kind === "last_click") input.playerView.own.clicks = 1;
  if (kind === "insufficient_cash") input.playerView.own.credits = 5;
  if (kind === "lost_click") target.futureClicksLost = 1;
  if (kind === "unknown_ice") target.routeQuote!.unknownIceCount = 1;
  if (kind === "persistent_counter")
    target.visibleIceRunHazards![0]!.kind = "trace_tag_counter";
  if (kind === "damage") target.visibleIceRunHazards![0]!.kind = "trace_damage";
  if (kind === "access_damage")
    target.routeQuote!.effects.push({
      kind: "net_damage",
      timing: "on_access",
      amount: 1,
      preventsAccess: false,
      canEndGameBeforeAccess: false,
      evidence: [],
    } as never);
  if (kind === "unknown_tag_amount")
    delete target.visibleIceRunHazards![0]!.expectedTags;
  expect(runnerTerminalRemoteContestIsDirectlyMandatory(input, target)).toBe(
    false,
  );
});
