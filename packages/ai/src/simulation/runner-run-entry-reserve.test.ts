import { afterEach, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  emptyRunnerGripForTest,
  installRunnerProgramForTest,
  moveRunnerCardToGrip,
  putCorpIceOnServer,
} from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput, chooseRunnerAction } from "../index";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const INSIDE_JOB = "onr_v1_094_inside-job";
const ZOMBIE = "onr_v1_280_zombie";
const HAND = [
  INSIDE_JOB,
  "onr_v1_052_raffles",
  "onr_v1_070_tinweasel",
  "onr_v1_106_private-ldl-access",
];
const PROGRAMS = [
  "onr_v1_031_hammer",
  "onr_v1_073_wizards-book",
  "onr_v1_072_wild-card",
];
afterEach(resetResidentPlanPortfolioMemory);

it.each([3, 4])(
  "quotes the entry card and credit costs with %i starting grip cards",
  (handCount) => {
    const input = runnerInput(fixture(handCount));
    const evaluations = evaluateRunnerRunTargets({ input });
    const event = evaluations.find(
      (e) =>
        e.targetServerId === "rd" &&
        input.legalActions.find((a) => a.actionId === e.actionId)?.type ===
          "play_event",
    );
    expect(event).toMatchObject({
      pathCost: 0,
      creditsAfterRun: 10,
      prerunReserveQuote: {
        knownPathCost: 0,
        requiredHandBuffer: 3,
        handBufferGap: handCount === 3 ? 1 : 0,
      },
    });
    expect(event?.evidence).toContain(`grip_after_run_action:${handCount - 1}`);
    const basic = evaluations.find(
      (e) =>
        e.targetServerId === "rd" &&
        input.legalActions.find((a) => a.actionId === e.actionId)?.type ===
          "start_run",
    );
    expect(basic?.prerunReserveQuote?.handBufferGap).toBe(0);
  },
);

it.each([3, 4])(
  "preserves the admitted event's plan after its expected card consumption (%i cards)",
  (handCount) => {
    let state = fixture(handCount);
    const initial = structuredClone(state);
    const input = runnerInput(state);
    // Isolate this real Engine route to verify its existing Central owner and continuation.
    input.legalActions = input.legalActions.filter(
      (a) =>
        a.type === "play_event" &&
        a.source.includes(INSIDE_JOB) &&
        a.payload?.serverId === "rd",
    );
    input.playerView.legalActions = input.legalActions;
    expect(input.legalActions).toHaveLength(1);
    const start = chooseRunnerAction(input);
    expect(start.reasonCode).toBe("plan_first.runner.pressure_central");
    expect(start.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
      start.actionId,
    );
    const root = start.decisionDebug?.planFirstDecision?.rootPlanInstanceId;
    state = applyMatching(state, (a) => a.actionId === start.actionId);
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.runner.credits).toBe(10);
    expect(state.runner.grip).toHaveLength(handCount - 1);
    const nextInput = runnerInput(state);
    const next = chooseRunnerAction(nextInput);
    expect(next.reasonCode).toBe("plan_first.runner.convert_run_window");
    expect(
      nextInput.legalActions.find((a) => a.actionId === next.actionId)?.type,
    ).toBe("continue_run");
    expect(next.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: root,
      selectedStep: { parentInstanceId: root },
      route: { actionId: next.actionId, stateVersion: state.stateVersion },
    });
    state = applyMatching(state, (a) => a.actionId === next.actionId);
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);

function fixture(handCount: number): GameState {
  const corp = [ZOMBIE, "onr_v1_279_wall-of-static"];
  const runner = [...HAND, ...PROGRAMS];
  let state = createGameAfterSetup({
    seed: "run-entry-reserve-cd482",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        ...runner.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (c) => !runner.includes(c.id),
        ),
      ],
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...corp.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => !corp.includes(c.id),
        ),
      ],
    },
  });
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  while (state.corp.hq.length > 5) {
    const id = state.corp.hq.pop()!;
    state.corp.rd.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
  }
  state.corp.clicks = 0;
  state = applyMatching(state, (a) => a.type === "end_turn");
  putCorpIceOnServer(state, "rd", corp[1]!);
  const zombie = putCorpIceOnServer(state, "rd", ZOMBIE);
  state.cardInstances[zombie]!.rezzed = true;
  state.cardInstances[zombie]!.faceup = true;
  for (const id of PROGRAMS) installRunnerProgramForTest(state, id);
  emptyRunnerGripForTest(state);
  for (const id of HAND.slice(0, handCount)) moveRunnerCardToGrip(state, id);
  state.runner.credits = 12;
  state.runner.clicks = 4;
  state.corp.credits = 15;
  return state;
}

function runnerInput(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "normal",
    eventTail: state.eventLog,
    ownDeckSnapshot: {
      deckSnapshotId: "run-entry-reserve-test",
      side: "runner",
      cards: Object.values(state.cardInstances)
        .filter((c) => c.owner === "runner")
        .map((c) => ({ cardId: c.definitionId, quantity: 1 })),
    },
    decisionId: `${state.matchId}:${state.stateVersion}:runner`,
    actionNumber: state.stateVersion,
  });
}

function applyMatching(
  state: GameState,
  matches: (a: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action) throw new Error(`No fixture action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `fixture:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
