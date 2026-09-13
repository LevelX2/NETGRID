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
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  installRunnerProgramForTest,
  moveCorpCardToHq,
  putCorpRootInRemote,
  putCorpIceOnServer,
  removeEverywhere,
  scoreCorpAgendaForTest,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput, chooseCorpAction } from "../../index";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessCorpEconomyAssetPayback } from "../../corp/economy/economy-asset-payback";

afterEach(() => resetResidentPlanPortfolioMemory());

it.each([
  [1, "data-wall"],
  [4, "wall-of-static"],
  [6, "data-wall"],
] as const)(
  "compares pure ETR choices against %s remaining runner credits",
  (credits, expected) => {
    let state = choiceState(credits);
    const initial = structuredClone(state);
    const eventStart = state.eventLog.length;
    const input = corpInput(state);
    const decision = chooseCorpAction(input);
    const option = input.playerView.pendingChoice!.options.find(
      (o) => o.id === selectedOptionId(decision),
    )!;
    expect(String(option.value)).toContain(expected);
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe("plan:corp.defend_servers:server-defense-portfolio");
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    state = applyMatching(
      state,
      (a) => a.actionId === decision.actionId,
      option.id,
    );
    expect(state.run?.encounteredIceId).toBe(option.value);
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
    expect(getPlayerView(initial, "runner").pendingChoice).toBeUndefined();
  },
);

it.each(["missing", "stale", "foreign_run", "malformed"])(
  "rejects a %s temporary break quote",
  (variant) => {
    const input = corpInput(choiceState(4));
    const option = input.playerView.pendingChoice!.options.find((o) =>
      o.id.startsWith("ice_"),
    )!;
    const quote = JSON.parse(
      option.metadata!.temporaryEncounterBreakQuoteJson as string,
    );
    if (variant === "missing")
      delete option.metadata!.temporaryEncounterBreakQuoteJson;
    if (variant === "malformed")
      option.metadata!.temporaryEncounterBreakQuoteJson = "{";
    if (variant === "stale")
      option.metadata!.temporaryEncounterBreakQuoteJson = JSON.stringify({
        ...quote,
        stateVersion: quote.stateVersion - 1,
      });
    if (variant === "foreign_run")
      option.metadata!.temporaryEncounterBreakQuoteJson = JSON.stringify({
        ...quote,
        runId: "other",
      });
    expect(() => chooseCorpAction(input)).toThrow("window_origin_missing");
  },
);

it("does not turn an explicitly unmodeled option into a proven access block", () => {
  const input = corpInput(choiceState(4));
  const option = input.playerView.pendingChoice!.options.find((o) =>
    String(o.value).includes("wall-of-static"),
  )!;
  const quote = JSON.parse(
    option.metadata!.temporaryEncounterBreakQuoteJson as string,
  );
  option.metadata!.temporaryEncounterBreakQuoteJson = JSON.stringify({
    ...quote,
    status: "unmodeled",
    reason: "visible_runner_break_projection_unknown",
  });
  const decision = chooseCorpAction(input);
  expect(selectedOptionId(decision)).toContain("data-wall");
});

it("does not spend more solely to make an unthreatened fort harder", () => {
  const input = corpInput(choiceState(4));
  const remote = input.playerView.servers.find(
    (server) => server.id === "remote_1",
  )!;
  remote.root = remote.root.filter((card) => card.type !== "agenda");
  expect(selectedOptionId(chooseCorpAction(input))).toContain("data-wall");
});

it("includes current run-only credits in the visible break response", () => {
  const state = choiceState(4, 2);
  const decision = chooseCorpAction(corpInput(state));
  expect(selectedOptionId(decision)).toContain("data-wall");
});

it("already values a BBS pool more highly behind effective protection", () => {
  const state = choiceState(1);
  delete state.run;
  delete state.pendingChoice;
  state.corp.clicks = 3;
  for (const id of [...state.runner.rig.programs]) {
    removeEverywhere(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  state.runner.memoryUsed = 0;
  const open = corpInput(state);
  const payback = (input: ReturnType<typeof corpInput>) =>
    assessCorpEconomyAssetPayback({
      input,
      serverId: "remote_1",
      cadence: "finite_pool",
      baselineHorizonTurns: 3,
      finitePoolCredits: 16,
      payoutCreditsPerExecution: 2,
      payoutActionCost: 1,
      setupCreditCost: 0,
      setupActionCost: 1,
    });
  const ice =
    state.cardInstances[
      putCorpIceOnServer(state, "remote_1", "onr_v1_279_wall-of-static")
    ]!;
  ice.rezzed = true;
  ice.faceup = true;
  const protectedQuote = payback(corpInput(state))!;
  const openQuote = payback(open)!;
  expect(openQuote.protectionState).toBe("unprotected");
  expect(openQuote.projectedCredits).toBe(4);
  expect(protectedQuote.protectionState).toBe("protected_not_contestable");
  expect(protectedQuote.projectedCredits).toBe(8);
  expect(protectedQuote.projectedNetCredits).toBeGreaterThan(
    openQuote.projectedNetCredits,
  );
});

it.each([true, false])(
  "already converts an available score after the defended run before extra economy (terminal=%s)",
  (terminal) => {
    let state = choiceState(1, 0, true, terminal);
    const decision = chooseCorpAction(corpInput(state));
    state = applyMatching(
      state,
      (a) => a.actionId === decision.actionId,
      selectedOptionId(decision),
    );
    for (let i = 0; state.run && i < 15; i++)
      state = applyMatching(state, (a) => a.type === "continue_run");
    expect(state.run).toBeUndefined();
    state = applyMatching(state, (a) => a.type === "end_turn");
    state = applyMatching(state, (a) => a.type === "mandatory_draw");
    const initial = structuredClone(state);
    const eventStart = state.eventLog.length;
    const bbsActions = getLegalActions(state, "corp").filter((a) =>
      a.source?.includes("bbs-whispering-campaign"),
    );
    expect(bbsActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "activated_card_ability",
          payload: expect.objectContaining({
            gainCreditsAmount: 2,
            cardImplementationTakesHostedCredits: true,
          }),
        }),
      ]),
    );
    for (let i = 0; !state.winner && i < 4; i++) {
      const input = corpInput(state);
      const next = chooseCorpAction(input);
      const action = input.legalActions.find(
        (a) => a.actionId === next.actionId,
      )!;
      expect(["advance_card", "score_agenda"]).toContain(action.type);
      expect(
        next.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("corp.score_agenda");
      state = applyMatching(state, (a) => a.actionId === next.actionId);
    }
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(
      terminal ? 8 : 5,
    );
    expect(state.winner).toBe(terminal ? "corp" : null);
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);

function corpInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "normal",
    eventTail: state.eventLog,
    ownDeckSnapshot: {
      deckSnapshotId: "dreff-budget-test",
      side: "corp",
      cards: Object.values(state.cardInstances)
        .filter((c) => c.owner === "corp")
        .map((c) => ({ cardId: c.definitionId, quantity: 1 })),
    },
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    actionNumber: state.stateVersion,
  });
}

function selectedOptionId(
  decision: ReturnType<typeof chooseCorpAction>,
): string {
  const ids = decision.selectedChoices?.selectedOptionIds;
  if (!Array.isArray(ids) || ids.length !== 1 || typeof ids[0] !== "string")
    throw new Error("Expected one bound option");
  return ids[0];
}

function choiceState(
  credits: number,
  badPublicity = 0,
  scoring = false,
  terminal = true,
): GameState {
  const corpCards = [
    "onr_v1_237_data-wall",
    "onr_v1_279_wall-of-static",
    "onr_v1_358_dr-dreff",
    "onr_v1_199_employee-empowerment",
    "onr_proteus_008_project-zurich",
    "onr_v1_205_main-office-relocation",
    "onr_v1_309_bbs-whispering-campaign",
  ];
  let state = createGameAfterSetup({
    seed: "dreff-visible-budget",
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...corpCards.map((id) => ({ id, quantity: 1 })),
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => !corpCards.includes(c.id),
        ),
      ],
    },
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: [
        { id: "onr_v1_039_krash", quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.runner.cards.filter(
          (c) => c.id !== "onr_v1_039_krash",
        ),
      ],
    },
  });
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  for (const id of [...state.corp.hq]) {
    removeEverywhere(state, id);
    state.corp.rd.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
  }
  const dreff =
    state.cardInstances[putCorpRootInRemote(state, "onr_v1_358_dr-dreff")]!;
  dreff.faceup = true;
  dreff.rezzed = true;
  state.cardInstances[
    putCorpRootInRemote(state, "onr_v1_199_employee-empowerment")
  ]!.advancementCounters = 1;
  if (scoring) {
    scoreCorpAgendaForTest(state, "onr_proteus_008_project-zurich");
    if (terminal)
      scoreCorpAgendaForTest(state, "onr_v1_205_main-office-relocation");
    const bbsId = putCorpRootInRemote(
      state,
      "onr_v1_309_bbs-whispering-campaign",
    );
    state = applyMatching(
      state,
      (a) => a.type === "rez_card" && a.source === bbsId,
    );
  }
  for (const id of corpCards.slice(0, 2)) moveCorpCardToHq(state, id);
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  state.runner.credits = credits;
  state.corp.credits = 10;
  state.corp.clicks = 0;
  const end = chooseCorpAction(corpInput(state));
  expect(
    getLegalActions(state, "corp").find((a) => a.actionId === end.actionId)
      ?.type,
  ).toBe("end_turn");
  state = applyMatching(state, (a) => a.actionId === end.actionId);
  state.corp.badPublicity = badPublicity;
  state = applyMatching(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "remote_1",
  );
  for (let step = 0; !state.pendingChoice && step < 10; step++)
    state = applyMatching(
      state,
      (a) => a.type === "continue_run" || a.type === "decline_rez",
    );
  expect(state.pendingChoice?.source).toContain("p3_54.delayed_success");
  return state;
}

function applyMatching(
  state: GameState,
  matches: (action: LegalAction) => boolean,
  optionId?: string,
): GameState {
  const action = getLegalActions(state, state.activeSide).find(matches);
  if (!action) throw new Error(`Missing action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `dreff-test:${state.stateVersion}`,
    ...(optionId
      ? {
          selectedChoices: {
            choiceId: state.pendingChoice?.choiceId,
            selectedOptionIds: [optionId],
          },
        }
      : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
