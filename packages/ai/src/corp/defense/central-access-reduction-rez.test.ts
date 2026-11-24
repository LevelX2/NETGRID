import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  moveCorpCardToHq,
  moveRunnerCardToGrip,
  removeEverywhere,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput, chooseCorpAction } from "../../index";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessCentralAccessReductionRez } from "./central-access-reduction-rez";

afterEach(resetResidentPlanPortfolioMemory);
type Variant =
  | "ordinary"
  | "empty_hq"
  | "already_covered"
  | "replacement"
  | "private_ldl";

function play(
  state: GameState,
  choose: (action: LegalAction) => boolean,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(choose);
  if (!action) throw Error(`Missing action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    clientKnownStateVersion: state.stateVersion,
    actionId: action.actionId,
    idempotencyKey: `central-reduction-${state.stateVersion}`,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}

function centralWindow(variant: Variant) {
  const serverId = variant === "private_ldl" ? "rd" : "hq";
  const event =
    variant === "private_ldl"
      ? 318
      : variant === "replacement"
        ? 296
        : undefined;
  const corpDeckCards = [
    { id: 66, quantity: 1 },
    { id: 131, quantity: 2 },
    ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
      (c) => c.id !== 66 && c.id !== 131,
    ),
  ];
  let state = createGameAfterSetup({
    seed: "central-reduction-final-window",
    traceRulesProfile: "modern_open",
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: corpDeckCards,
    },
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        { id: 296, quantity: 1 },
        { id: 318, quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (c) => c.id !== 296 && c.id !== 318,
        ),
      ],
    },
  });
  state = play(state, (a) => a.type === "mandatory_draw");
  for (const id of [...state.corp.hq]) {
    removeEverywhere(state, id);
    state.corp.rd.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
  }
  if (variant !== "empty_hq") moveCorpCardToHq(state, 66);
  const reducers = Object.values(state.cardInstances).filter(
    (card) => card.definitionId === 131,
  );
  const mounted =
    variant === "already_covered" ? reducers : reducers.slice(0, 1);
  const source = mounted[0]!.instanceId;
  for (const card of mounted) {
    removeEverywhere(state, card.instanceId);
    state.corp.servers
      .find((s) => s.id === serverId)!
      .root.push(card.instanceId);
    card.zone = { side: "corp", zone: "serverRoot", serverId };
    card.rezzed = card.instanceId !== source;
    card.faceup = card.rezzed;
  }
  if (event !== undefined) moveRunnerCardToGrip(state, event);
  state.corp.credits = 10;
  state.corp.clicks = 0;
  state = play(state, (a) => a.type === "end_turn");
  state = play(state, (a) =>
    event !== undefined
      ? a.type === "play_event" &&
        !!a.source &&
        state.cardInstances[a.source]?.definitionId === event
      : a.type === "start_run" && a.payload?.serverId === "hq",
  );
  for (
    let i = 0;
    i < 10 &&
    !(
      state.timingPoint === "run.movement_rez_window" &&
      state.run?.position.kind === "server"
    );
    i++
  ) {
    state = play(
      state,
      (a) => a.type === "continue_run" || a.type === "decline_rez",
    );
  }
  expect(state.timingPoint).toBe("run.movement_rez_window");
  const input = buildAiDecisionInput(state, "corp", {
    eventTail: state.eventLog,
    difficulty: "hard",
    decisionId: "central-reduction",
    actionNumber: state.stateVersion,
    ownDeckSnapshot: {
      deckSnapshotId: "central-reduction",
      side: "corp",
      cards: corpDeckCards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const card = input.playerView.servers
    .find((s) => s.id === serverId)!
    .root.find((c) => c.instanceId === source)!;
  const action = input.legalActions.find(
    (a) => a.source === source && a.type === "rez_card",
  )!;
  expect(action).toBeDefined();
  return { state, input, card, action };
}

it("protects the stored HQ agenda through the defense owner and the real access queue", () => {
  const { state, input, action } = centralWindow("ordinary");
  const decision = chooseCorpAction(input);
  expect(decision.actionId).toBe(action.actionId);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
  let next = play(state, (a) => a.actionId === decision.actionId);
  expect(next.corp.credits).toBe(7);
  expect(next.timingPoint).toBe("access.resolve_card");
  next = play(next, (a) => a.type === "access_card");
  expect(next.run!.breach!.queue.map((e) => [e.zone, e.status])).toEqual([
    ["remote_root", "accessed"],
    ["hq", "skipped"],
  ]);
  expect(getPlayerView(next, "runner").own.agendaPoints).toBe(0);
  const replay = replayEvents(
    state,
    next.eventLog.slice(state.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(next));
});

it("uses the R&D destination of a regular access through HQ", () => {
  const { input, card, action } = centralWindow("private_ldl");
  expect(input.playerView.run).toMatchObject({
    attackedServerId: "hq",
    accessServerOverride: "rd",
  });
  expect(assessCentralAccessReductionRez(input, card, "rd")?.productive).toBe(
    true,
  );
  expect(chooseCorpAction(input).actionId).toBe(action.actionId);
});

it.each(["empty_hq", "already_covered", "replacement"] as const)(
  "preserves the rez cost for %s",
  (variant) => {
    const { input, card, action } = centralWindow(variant);
    expect(assessCentralAccessReductionRez(input, card, "hq")?.productive).toBe(
      false,
    );
    expect(chooseCorpAction(input).actionId).not.toBe(action.actionId);
  },
);

it("requires the actual access destination and current access quote", () => {
  const { input, card } = centralWindow("ordinary");
  input.playerView.run!.accessServerOverride = "rd";
  expect(assessCentralAccessReductionRez(input, card, "hq")?.productive).toBe(
    false,
  );
  delete input.playerView.run!.accessServerOverride;
  input.playerView.corpCentralAccessQuotes!.find((q) => q.serverId === "hq")!
    .stateVersion--;
  expect(assessCentralAccessReductionRez(input, card, "hq")?.productive).toBe(
    false,
  );
});
