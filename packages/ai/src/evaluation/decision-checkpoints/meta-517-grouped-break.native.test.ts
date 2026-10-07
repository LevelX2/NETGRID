import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState } from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import { runnerRunWindowCreditBudget } from "../../runtime/runner-fort-pass-toll";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-517-grouped-break/${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
const cp = fixture("g7d247-native");
function native() {
  const state = fixture("g7d247-engine-state") as GameState;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(hashGameState(state)).toBe(cp.stateHash);
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: cp.input.difficulty,
    profileId: cp.input.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:runner`,
    actionNumber: state.stateVersion + 1,
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { state, input };
}
afterEach(resetResidentPlanPortfolioMemory);

it("matches Redecorator's one-credit group against real positive Mastermind core damage", () => {
  const mastermind = "onr_proteus_030_mastermind";
  const coyote = "onr_proteus_016_coyote";
  const redecorator = "onr_proteus_093_redecorator";
  let state = createGameAfterSetup({
    seed: "meta-517-redecorator-group-control",
    corpDeck: {
      ...DEMO_DECKS.demo_corp_001,
      cards: [
        ...DEMO_DECKS.demo_corp_001.cards,
        { id: mastermind, quantity: 1 },
        { id: coyote, quantity: 1 },
      ],
    },
    runnerDeck: {
      ...DEMO_DECKS.demo_runner_001,
      cards: [
        ...DEMO_DECKS.demo_runner_001.cards,
        { id: redecorator, quantity: 1 },
      ],
    },
  });
  const apply = (action: ReturnType<typeof getLegalActions>[number]) => {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: action.side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
  };
  apply(
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
  apply(getLegalActions(state, "corp").find((a) => a.type === "end_turn")!);
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(1)
    .withRunnerProgramInstalled(redecorator)
    .withRezzedCorpIceOnServer("rd", mastermind)
    .withRezzedCorpIceOnServer("rd", coyote);
  apply(
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "rd",
    )!,
  );
  for (let i = 0; i < 30; i++) {
    const encountered = state.run?.encounteredIceId;
    if (
      state.run?.phase === "encounter_ice" &&
      encountered &&
      state.cardInstances[encountered]!.definitionId === mastermind
    )
      break;
    const legal = [
      ...getLegalActions(state, "runner"),
      ...getLegalActions(state, "corp"),
    ].filter((a) => a.type === "continue_run" || a.type === "decline_rez");
    expect(legal).toHaveLength(1);
    apply(legal[0]!);
  }
  const view = getPlayerView(state, "runner");
  const ice = view.servers
    .find((s) => s.id === "rd")!
    .ice.find((c) => c.definitionId === mastermind)!;
  expect(
    ice.effectiveRunQuote!.subroutines.find((s) => s.type === "do_damage")!
      .amount,
  ).toBe(1);
  const path = assessKnownRezzedIcePath([ice], view.own.rig!, 1);
  expect(path).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 1,
    creditsAfterPath: 0,
  });
  const groups = getLegalActions(state, "runner").filter(
    (a) =>
      a.type === "break_subroutine" && a.payload?.subroutineIndexes === "0,1",
  );
  expect(groups).toHaveLength(1);
  expect(groups[0]!.costs.reduce((n, c) => n + (c.credits ?? 0), 0)).toBe(1);
  const initial = structuredClone(state);
  apply(groups[0]!);
  expect(state.run!.brokenSubroutineIndexes).toEqual([0, 1]);
  expect(state.runner.credits).toBe(0);
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});

it("prices the native combined ETR and damage group once, including its real recurring pool", () => {
  const { input } = native();
  const ice = currentRunRemainingIce(input);
  const path = assessKnownRezzedIcePath(
    ice,
    input.playerView.own.rig!,
    runnerRunWindowCreditBudget(input),
    [],
    0,
    currentRunPathContext(input),
  );
  expect(path).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 6,
    creditsAfterPath: 4,
    fullyBrokenIceInstanceIds: [ice[0]!.instanceId],
  });
  expect(path.visibleIceRunHazards ?? []).toEqual([]);
});

it.each([
  [6, true],
  [5, false],
])(
  "requires the complete six-credit group with a %i-credit cash budget",
  (credits, access) => {
    const { input } = native();
    const rig = input.playerView.own.rig!.filter(
      (c) => c.definitionId === "onr_proteus_079_big-frackin-gun",
    );
    expect(
      assessKnownRezzedIcePath(currentRunRemainingIce(input), rig, credits)
        .canReachAccess,
    ).toBe(access);
  },
);

it.each([
  [12, true],
  [11, false],
])(
  "keeps two independent encounter groups independent at %i credits",
  (credits, access) => {
    const { input } = native(),
      ice = currentRunRemainingIce(input)[0]!;
    const inner = {
      ...ice,
      instanceId: "inner-independent-bug",
      effectiveRunQuote: {
        ...ice.effectiveRunQuote!,
        iceInstanceId: "inner-independent-bug",
      },
    };
    const rig = input.playerView.own.rig!.filter(
      (c) => c.definitionId === "onr_proteus_079_big-frackin-gun",
    );
    const path = assessKnownRezzedIcePath([inner, ice], rig, credits);
    expect(path.canReachAccess).toBe(access);
    if (access)
      expect(path).toMatchObject({ visibleBreakCost: 12, creditsAfterPath: 0 });
  },
);

it("charges the Engine per-subroutine tax for both members of a full group", () => {
  const { input } = native(),
    ice = currentRunRemainingIce(input)[0]!;
  const taxed = {
    ...ice,
    effectiveRunQuote: {
      ...ice.effectiveRunQuote!,
      breakSubroutineAdditionalCostPerSubroutine: 2,
    },
  };
  const rig = input.playerView.own.rig!.filter(
    (c) => c.definitionId === "onr_proteus_079_big-frackin-gun",
  );
  expect(assessKnownRezzedIcePath([taxed], rig, 10)).toMatchObject({
    canReachAccess: true,
    visibleBreakCost: 10,
    creditsAfterPath: 0,
  });
});

it("does not invent Sentry coverage or ignore a current breaking prohibition", () => {
  const { input } = native(),
    ice = currentRunRemainingIce(input)[0]!;
  const rig = input.playerView.own.rig!.filter(
    (c) => c.definitionId !== "onr_proteus_079_big-frackin-gun",
  );
  expect(assessKnownRezzedIcePath([ice], rig, 20).canReachAccess).toBe(false);
  expect(
    assessKnownRezzedIcePath([ice], input.playerView.own.rig!, 20, [], 0, {
      prohibitBreakingIceInstanceIds: [ice.instanceId!],
    }).canReachAccess,
  ).toBe(false);
});

it("keeps the native continuation under the bound run-window owner and applies its exact legal action", () => {
  const { state, input } = native(),
    before = hashGameState(state),
    decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).not.toBe(true);
  expect(action.type).toBe("continue_run");
  expect(action.expiresAtStateVersion).toBe(state.stateVersion);
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  expect(pf.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: state.stateVersion,
    stepId: pf.selectedStep!.stepId,
    planInstanceId: pf.leafExecutorInstanceId,
  });
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(hashGameState(state)).toBe(before);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(result.error.message);
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
});

it("matches the real native Engine group, reaches access without damage and replays deterministically", () => {
  const initial = fixture("manual-group-prebreak-state") as GameState;
  let state = initial;
  const apply = (action: ReturnType<typeof getLegalActions>[number]) => {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: action.side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
  };
  const groups = getLegalActions(state, "runner").filter(
    (a) =>
      a.type === "break_subroutine" && a.payload?.subroutineIndexes === "0,1",
  );
  expect(groups).toHaveLength(1);
  expect(
    groups[0]!.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0),
  ).toBe(6);
  apply(groups[0]!);
  for (let i = 0; i < 12 && state.run?.phase !== "access"; i++) {
    const actions = [
      ...getLegalActions(state, "runner").filter(
        (a) => a.type === "continue_run",
      ),
      ...getLegalActions(state, "corp").filter((a) => a.type === "decline_rez"),
    ];
    expect(actions).toHaveLength(1);
    apply(actions[0]!);
  }
  expect(state.run?.phase).toBe("access");
  expect(state.runner.credits).toBe(4);
  expect(state.runner.grip).toEqual(initial.runner.grip);
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});
