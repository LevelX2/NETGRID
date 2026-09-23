import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import { DEMO_DECKS, type GameState } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
const NETWATCH = "onr_v1_207_netwatch-operations-office",
  URBAN = "onr_v1_307_urban-renewal";
const deck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "scored-trace-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    ...[NETWATCH, URBAN].map((id) => ({ id, quantity: 1 })),
  ],
};
afterEach(resetResidentPlanPortfolioMemory);
function fixture() {
  let state = createGameAfterSetup({
    seed: "scored-trace-conversion",
    corpDeck: deck,
  });
  const draw = getLegalActions(state, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const applied = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!applied.ok) throw Error(applied.error.message);
  state = applied.state;
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(NETWATCH)
    .withCorpCardInHq(URBAN)
    .withCorpCredits(8)
    .withRunnerCredits(1)
    .withRunnerTags(0);
  const id = state.corp.hq.find(
    (id) => state.cardInstances[id]!.definitionId === NETWATCH,
  )!;
  state.corp.hq = state.corp.hq.filter((x) => x !== id);
  state.corp.scoreArea.push(id);
  state.cardInstances[id]!.zone = { side: "corp", zone: "scoreArea" };
  state.cardInstances[id]!.faceup = true;
  state.cardInstances[id]!.rezzed = true;
  state.corp.clicks = 2;
  for (const id of state.runner.grip.splice(4)) {
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  return state;
}
function decide(state: GameState) {
  const input = buildAiDecisionInput(state, "corp", {
    decisionId: `scored-trace:${state.stateVersion}`,
    profileId: "scored-trace-corp",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "corp",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
  return {
    input,
    decision: chooseCorpAction(input, {
      quoteCorpPunishRoute: (r) => quoteCorpPunishRoute(state, r),
      persistTacticalPlanMemory: false,
    }),
  };
}
it("selects the actual scored trace head for an affordable lethal payoff", () => {
  const state = fixture(),
    { input, decision } = decide(state);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId),
  ).toMatchObject({
    type: "activated_card_ability",
    payload: {
      cardImplementationAbilityId:
        NETWATCH + ":abilities_activated_corp_main_trace",
    },
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
  ).toContain("corp.punish_campaign");
});
it("does not claim a forced trace through a richer Runner's full response", () => {
  const state = fixture();
  state.runner.credits = 10;
  const { input, decision } = decide(state);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
  ).not.toBe("activated_card_ability");
  expect(decision.fallbackUsed).toBe(false);
});
