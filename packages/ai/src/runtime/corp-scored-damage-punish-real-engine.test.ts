import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import { afterEach, expect, it } from "vitest";
import type { GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildBoundedCorpPunishRouteRequests } from "../corp/punish/punish-route-quote-input";
import { buildAiDecisionInput } from "./ai-decision-input";

const SOLO = "onr_v1_208_on-call-solo-team",
  URBAN = "onr_v1_307_urban-renewal";
const entry = catalog.decks.find(
  (d) => d.standardDeckId === "standard_corp_shadoe_tag_bag",
)!;
const deck = {
  id: entry.standardDeckId,
  name: entry.name,
  side: "corp" as const,
  identity: entry.identityCardId,
  cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
};
afterEach(resetResidentPlanPortfolioMemory);
function apply(s: GameState, actionId: string) {
  const r = applyAction(s, {
    matchId: s.matchId,
    side: "corp",
    actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!r.ok) throw Error(r.error.message);
  return r.state;
}
function fixture(hand = 0, scored = true) {
  let s = createGameAfterSetup({ seed: "scored-damage-owner", corpDeck: deck });
  s = apply(
    s,
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(SOLO)
    .withCorpCredits(8)
    .withRunnerTags(1);
  if (scored) {
    const id = s.corp.hq.find(
      (id) => s.cardInstances[id]!.definitionId === SOLO,
    )!;
    s.corp.hq = s.corp.hq.filter((x) => x !== id);
    s.corp.scoreArea.push(id);
    Object.assign(s.cardInstances[id]!, {
      zone: { side: "corp", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    });
  }
  for (const id of s.runner.grip.splice(hand)) {
    s.runner.heap.push(id);
    s.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  s.corp.clicks = 2;
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "corp",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
function decide(s: GameState) {
  const i = input(s),
    decision = chooseCorpAction(i, {
      quoteCorpPunishRoute: (r) => quoteCorpPunishRoute(s, r),
      persistTacticalPlanMemory: false,
    });
  expect(decision.fallbackUsed).toBe(false);
  return {
    i,
    decision,
    action: i.legalActions.find((a) => a.actionId === decision.actionId)!,
  };
}
it("quotes and executes scored damage through the existing punish owner", () => {
  const s = fixture(),
    { decision, action } = decide(s);
  expect(action).toMatchObject({
    type: "activated_card_ability",
    payload: { cardId: s.corp.scoreArea[0] },
  });
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.rootPlanInstanceId).toContain("corp.punish_campaign");
  expect(pf.executionOrigin?.leafPlanInstanceId).toContain(
    "corp.execute_punish_sequence",
  );
  expect(pf.route).toBeDefined();
  expect(apply(s, action.actionId).winner).toBe("corp");
});
it("requotes the reusable source after a nonlethal activation", () => {
  let s = fixture(1);
  const first = decide(s);
  expect(first.action.type).toBe("activated_card_ability");
  s = apply(s, first.action.actionId);
  expect(s.runner.grip).toHaveLength(0);
  expect(s.winner).toBeNull();
  const second = decide(s);
  expect(second.action.type).toBe("activated_card_ability");
  expect(apply(s, second.action.actionId).winner).toBe("corp");
});
it("includes the scored payoff in a real mixed lethal route", () => {
  const s = fixture(5);
  RealEngineFixtureBuilder.forState(s).withCorpCardInHq(URBAN);
  const quotes = buildBoundedCorpPunishRouteRequests(input(s)).map((r) =>
    quoteCorpPunishRoute(s, r),
  );
  expect(
    quotes.some(
      (r) =>
        r.ok &&
        r.quote.complete &&
        r.quote.damageEnvelope.effectiveDamage.minimum === 6,
    ),
  ).toBe(true);
  const first = decide(s),
    next = apply(s, first.action.actionId),
    second = decide(next);
  expect(apply(next, second.action.actionId).winner).toBe("corp");
});
it("does not treat an agenda in HQ as an activated damage source", () => {
  const s = fixture(0, false);
  expect(buildBoundedCorpPunishRouteRequests(input(s))).toEqual([]);
});
it("keeps an untagged runner outside the damage route", () => {
  const s = fixture();
  const request = buildBoundedCorpPunishRouteRequests(input(s))[0]!;
  s.runner.tags = 0;
  const quoted = quoteCorpPunishRoute(s, request);
  expect(quoted.ok && quoted.quote.complete).toBe(false);
  expect(buildBoundedCorpPunishRouteRequests(input(s))).toEqual([]);
  expect(
    getLegalActions(s, "corp").some((a) => a.type === "activated_card_ability"),
  ).toBe(false);
});
