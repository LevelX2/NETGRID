import { referencesDefaultDeckCard } from "../evaluation/decision-checkpoints/compact-card-reference.test-support";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  validateGameState,
} from "@netgrid/engine";
import type {
  CardInstanceId,
  GameState,
  PlayerAction,
  Side,
} from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import {
  putRunnerCardOnTopOfStack,
  removeEverywhere,
} from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

type Fixture = {
  gameNumber: number;
  options: Parameters<typeof createGame>[0];
  initialHash: string;
  setupArrangement: {
    runnerGrip: CardInstanceId[];
    runnerStack: CardInstanceId[];
    corpHq: CardInstanceId[];
    corpRd: CardInstanceId[];
  };
  commands: {
    side: Side;
    applied: Pick<PlayerAction, "actionId" | "selectedChoices">;
    hash: string;
  }[];
  checkpoint: {
    stateVersion: number;
    stateHash: string;
    decisionId: string;
    actionNumber: number;
    profileId: string;
    ownDeckSnapshot: NonNullable<
      Parameters<typeof buildAiDecisionInput>[2]
    >["ownDeckSnapshot"];
    legalActionIds: string[];
    runtime: AiRuntimeCheckpointV1;
  };
};
const fixtures = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/meta-524-original-prefixes.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Fixture[];
afterEach(resetResidentPlanPortfolioMemory);

function arrangeAfterSetup(state: GameState, fixture: Fixture) {
  const arrangement = fixture.setupArrangement;
  expect(
    [...arrangement.runnerGrip, ...arrangement.runnerStack].sort(),
  ).toEqual([...state.runner.grip, ...state.runner.stack].sort());
  expect([...arrangement.corpHq, ...arrangement.corpRd].sort()).toEqual(
    [...state.corp.hq, ...state.corp.rd].sort(),
  );
  state.runner.grip = [...arrangement.runnerGrip];
  state.runner.stack = [...arrangement.runnerStack];
  state.corp.hq = [...arrangement.corpHq];
  state.corp.rd = [...arrangement.corpRd];
  for (const [zone, ids] of [
    [{ side: "runner", zone: "grip" }, state.runner.grip],
    [{ side: "runner", zone: "stack" }, state.runner.stack],
    [{ side: "corp", zone: "hq" }, state.corp.hq],
    [{ side: "corp", zone: "rd" }, state.corp.rd],
  ] as const) {
    for (const id of ids) state.cardInstances[id]!.zone = { ...zone };
  }
  expect(validateGameState(state)).toEqual({ ok: true, errors: [] });
  state.eventLog.at(-1)!.stateHashAfter = hashGameState(state);
}

function replay(gameNumber: number) {
  const fixture = fixtures.find((f) => f.gameNumber === gameNumber)!;
  let state = createGame(fixture.options);
  expect(hashGameState(state)).toBe(fixture.initialHash);
  for (const [index, command] of fixture.commands.entries()) {
    const result = applyAction(state, {
      matchId: state.matchId,
      side: command.side,
      clientKnownStateVersion: state.stateVersion,
      ...command.applied,
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
    if (index === 1) arrangeAfterSetup(state, fixture);
    expect(hashGameState(state)).toBe(command.hash);
  }
  const cp = fixture.checkpoint;
  expect(state.stateVersion).toBe(cp.stateVersion);
  expect(hashGameState(state)).toBe(cp.stateHash);
  const input = {
    ...buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: cp.ownDeckSnapshot,
      eventTail: state.eventLog,
    }),
    decisionId: cp.decisionId,
    actionNumber: cp.actionNumber,
    profileId: cp.profileId,
  };
  // The fixture binds the exact multiset of current offered commands.
  expect(input.legalActions.map((a) => a.actionId).sort()).toEqual(
    [...cp.legalActionIds].sort(),
  );
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return { state, input };
}

it("executes the ready Inside Job without borrowing the normal run's Wall support in the authored G6 scene", () => {
  const { state, input } = replay(6);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action).toMatchObject({
    type: "play_event",
    payload: { serverId: "r1", bypassFirstIce: true },
  });
  expect(referencesDefaultDeckCard(action.source, 306)).toBe(true);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.contest_remote");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.credits).toBe(20);
  expect(result.state.runner.clicks).toBe(1);
  expect(result.state.run?.attackedServerId).toBe("r1");
});

it("retains the unique just-drawn Gate answer for its exact coverage executor in the authored G18 scene", () => {
  const { state, input } = replay(18);
  const decision = chooseAiAction(input);
  expect(decision.selectedChoices).toEqual({
    choiceId: "p3_61_crash_draw_32",
    selectedOptionIds: ["trash_c2g1"],
  });
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: decision.selectedChoices!,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.grip).toContain("c1ea");
  expect(result.state.runner.heap).toContain("c2g1");
});

it("discards the newly drawn duplicate Gate breaker when another copy is installed", () => {
  const fixture = fixtures.find((candidate) => candidate.gameNumber === 18)!;
  let state = createGameAfterSetup({
    ...fixture.options,
    seed: "coverage-duplicate-gate-draw",
  });
  for (const type of ["mandatory_draw", "end_turn"] as const) {
    if (type === "end_turn")
      RealEngineFixtureBuilder.forState(state).withCorpHqSize(0);
    const action = getLegalActions(state, "corp").find(
      (candidate) => candidate.type === type,
    )!;
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!applied.ok) throw Error(applied.error.message);
    state = applied.state;
  }
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(4)
    .withRunnerClicks(1)
    .withRunnerProgramInstalled(226)
    .withRunnerResourceInstalled(369);
  state.runner.memoryUsed = 1;
  state.runnerTurnFlags!.runLockActionsPending = 1;
  state.runnerTurnFlags!.runnerRunLockCreditCost = 10;
  const installed = state.runner.rig.programs[0]!;
  const duplicate = Object.values(state.cardInstances).find(
    (card) => card.definitionId === 226 && card.instanceId !== installed,
  )!;
  removeEverywhere(state, duplicate.instanceId);
  duplicate.zone = { side: "runner", zone: "stack" };
  state.runner.stack.unshift(duplicate.instanceId);
  putRunnerCardOnTopOfStack(state, 396);
  const decide = (current: typeof state) =>
    chooseAiAction(
      buildAiDecisionInput(current, "runner", {
        difficulty: "hard",
        ownDeckSnapshot: fixture.checkpoint.ownDeckSnapshot,
      }),
    );
  const draw = decide(state);
  expect(draw.actionId).toBe("runner.draw_card");
  const drawn = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: draw.actionId!,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!drawn.ok) throw Error(drawn.error.message);
  const decision = decide(drawn.state);
  expect(decision.selectedChoices).toEqual({
    choiceId: drawn.state.pendingChoice?.choiceId,
    selectedOptionIds: ["trash_" + duplicate.instanceId],
  });
  if (!decision.selectedChoices)
    throw Error("Missing native draw replacement choice");
  const applied = applyAction(drawn.state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    clientKnownStateVersion: drawn.state.stateVersion,
    selectedChoices: decision.selectedChoices,
  });
  if (!applied.ok) throw Error(applied.error.message);
  expect(applied.state.runner.heap).toContain(duplicate.instanceId);
  expect(applied.state.runner.rig.programs).toContain(installed);
});

it("rejects a changed hidden-draw origin instead of protecting or choosing an unbound card", () => {
  const { input } = replay(18);
  const continuation = input.playerView.pendingChoice!.continuation!;
  if (continuation.family !== "runner_hidden_draw_keep_or_top_replacement")
    throw Error("wrong_native_family");
  continuation.originActionId = "runner.unbound_source";
  expect(() => chooseAiAction(input)).toThrow();
});
