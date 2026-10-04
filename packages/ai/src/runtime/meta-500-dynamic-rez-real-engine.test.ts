import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

function deck(id: string): DeckDefinition {
  const d = standardDeckCatalog.decks.find((d) => d.standardDeckId === id)!;
  return {
    id,
    name: d.name,
    side: d.side as "corp" | "runner",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
}
const corpDeck = deck("standard_proteus_corp_variable_ice_gauntlet_2026_05_25");
const runnerDeck = deck("standard_runner_inside_forgery_loop");
function apply(state: GameState, action: LegalAction): GameState {
  expect(action).toBeDefined();
  const r = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `dynamic-rez:${state.stateVersion}`,
  });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function nativeFixture(outsideGate: boolean, credits = 9) {
  let state = createGameAfterSetup({
    matchId: "dynamic-rez",
    seed: "dynamic-rez",
    runnerDeck,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const b = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withRunnerCredits(6)
    .withRunnerProgramInstalled("onr_v1_039_krash")
    .withCorpRemoteRoot("remote_1", "onr_proteus_005_marked-accounts", 2)
    .withCorpIceOnServer("remote_1", "onr_proteus_031_minotaur");
  if (outsideGate)
    b.withRezzedCorpIceOnServer("remote_1", "onr_proteus_034_riddler");
  state.runner.memoryUsed = 1;
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "remote_1",
    )!,
  );
  for (let n = 0; n < 12; n++) {
    const ice = getPlayerView(state, "corp").servers.find(
      (s) => s.id === "remote_1",
    )!.ice[0]!;
    if (
      state.run?.approachedIceId === ice.instanceId &&
      getLegalActions(state, "corp").some((a) => a.type === "decline_rez")
    )
      return state;
    const pass = [
      ...getLegalActions(state, "corp"),
      ...getLegalActions(state, "runner"),
    ].find((a) => a.type === "continue_run");
    if (!pass) throw Error("Missing exact native outer-layer pass");
    state = apply(state, pass);
  }
  throw Error("Native Minotaur window not reached");
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: `dynamic-rez:${state.stateVersion}`,
    profileId: "dynamic-rez",
    ownDeckSnapshot: {
      deckSnapshotId: "dynamic-rez",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
afterEach(resetResidentPlanPortfolioMemory);

it("binds a real Engine dynamic stop to the existing Defense plan and actual rez", () => {
  const state = nativeFixture(true),
    before = hashState(state),
    input = inputFor(state);
  const ice = input.playerView.servers.find((s) => s.id === "remote_1")!
    .ice[0]!;
  expect(ice.effectiveRezResourceExchangeQuote).toMatchObject({
    complete: true,
    hardEndTheRunSubroutineCount: 1,
    runnerBreak: { requiredCredits: 10, canPayFromCurrentCredits: false },
  });
  const decision = chooseAiAction(input),
    action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.type).toBe("rez_ice");
  expect(action.source).toBe(ice.instanceId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    selectedStep: {
      stepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
    },
    route: {
      actionId: action.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  expect(hashState(state)).toBe(before);
  expect(
    getPlayerView(state, "runner").servers.find((s) => s.id === "remote_1")!
      .ice[0],
  ).not.toHaveProperty("effectiveRezResourceExchangeQuote");
  const next = apply(state, action);
  const actual = getPlayerView(next, "corp").servers.find(
    (s) => s.id === "remote_1",
  )!.ice[0]!;
  expect(
    actual.effectiveRunQuote!.subroutines.filter(
      (s) => s.type === "end_the_run",
    ),
  ).toHaveLength(1);
  expect(next.corp.credits).toBe(3);
});

it("holds the native Minotaur rez when no active outside wall or gate exists", () => {
  const input = inputFor(nativeFixture(false));
  expect(
    input.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!
      .effectiveRezResourceExchangeQuote,
  ).toMatchObject({
    complete: false,
    reason: "no_hard_end_the_run_subroutine",
  });
  const decision = chooseAiAction(input);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)!.type,
  ).toBe("decline_rez");
  expect(decision.fallbackUsed).toBe(false);
});

it.each([5, 6])(
  "keeps the actual six-credit rez affordability boundary at %i credits",
  (credits) => {
    const input = inputFor(nativeFixture(true, credits));
    expect(
      input.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!
        .effectiveRezResourceExchangeQuote,
    ).toMatchObject({ complete: true, hardEndTheRunSubroutineCount: 1 });
    expect(input.legalActions.some((a) => a.type === "rez_ice")).toBe(
      credits === 6,
    );
  },
);
