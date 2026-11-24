import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { createGameAfterSetup } from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  putCorpRootInRemote,
  scoreCorpAgendaForTest,
  scoreRunnerAgendaForTest,
  toRunnerTurn,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { quoteRunnerRunTarget } from "../../runner-run-target-evaluation";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const fetalAi = 62;
const priorityRequisition = 424;
const runnerDeck = ORIGINALSET_DEFAULT_DECKS.runner;
const corpDeck = {
  ...ORIGINALSET_DEFAULT_DECKS.corp,
  cards: [
    ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
      ({ id }) => id !== fetalAi && id !== priorityRequisition,
    ),
    { id: fetalAi, quantity: 1 },
    { id: priorityRequisition, quantity: 3 },
  ],
};

function checkpoint(clicks: number, damageObserved = true) {
  const state = toRunnerTurn(createGameAfterSetup({
    seed: `terminal-contest-hand-buffer-${clicks}-${damageObserved}`,
    runnerDeck,
    corpDeck,
  }));
  const root = putCorpRootInRemote(state, fetalAi);
  state.cardInstances[root]!.advancementCounters = 1;
  scoreCorpAgendaForTest(state, priorityRequisition);
  scoreRunnerAgendaForTest(state, priorityRequisition);
  scoreRunnerAgendaForTest(state, priorityRequisition);
  state.runner.credits = 0;
  state.runner.clicks = clicks;
  state.runner.stack.push(...state.runner.grip.splice(1));
  for (const id of state.runner.stack) {
    state.cardInstances[id]!.zone = { side: "runner", zone: "stack" };
  }
  const turnSerial = state.turnSerial;
  if (turnSerial === undefined) throw new Error("Missing Runner turn");
  const observedDamage: PublicGameEvent = {
    eventId: state.stateVersion + 2,
    type: "access_card",
    stateVersionBefore: state.stateVersion - 1,
    stateVersionAfter: state.stateVersion,
    stateHashAfter: "fnv1a:10f84158",
    turnSerial,
    visibilityClass: "private_to_side",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
      cardDefinitionId: 552,
      damageResolved: true,
      damageType: "net",
      damageAmount: 2,
    },
  };
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: "terminal-contest-hand-buffer",
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
    ...(damageObserved ? { eventTail: [observedDamage] } : {}),
  });
  const run = input.legalActions.find(
    (action) => action.type === "start_run" && action.payload?.serverId === "r1",
  )!;
  const draw = input.legalActions.find((action) => action.type === "draw_card")!;
  expect(input.playerView.opponent.agendaPoints).toBe(3);
  expect(input.playerView.servers.find(({ id }) => id === "r1")?.root[0]).toMatchObject({
    known: false,
    advancementCounters: 1,
  });
  const target = quoteRunnerRunTarget({
    input,
    runActionId: run.actionId,
    targetServerId: "r1",
  })!.target;
  return { input, draw, target };
}

describe("open terminal remote preparation under visible damage pressure", () => {
  it("binds the existing draw before the same free contest when both fit", () => {
    const { input, draw, target } = checkpoint(4);
    expect(target.prerunReserveQuote).toMatchObject({
      status: "blocked",
      requiredHandBuffer: 2,
      handBufferGap: 1,
      creditGap: 0,
    });
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(draw.actionId);
    expect(decision.decisionDebug?.planKind).toBe("runner.defense_and_recovery");
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  });

  it.each([[1, true], [4, false]] as const)(
    "keeps the reserve open with %s action(s) and observed damage=%s",
    (clicks, observed) => {
      const { target } = checkpoint(clicks, observed);
      expect(target.prerunReserveQuote).toMatchObject({
        status: "not_required",
        handBufferGap: 0,
      });
    },
  );
});
