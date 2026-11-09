import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import { afterEach, expect, it } from "vitest";
import type {
  GameState,
  CardInstanceId,
  CardDefinitionId,
} from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildBoundedCorpPunishRouteRequests } from "../corp/punish/punish-route-quote-input";
import { buildAiDecisionInput } from "./ai-decision-input";
import { costProfileForAction } from "../actions/action-cost-timing";
import { buildAiDecisionInputDto } from "../input-dto";

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
const scoredDomainEntry = catalog.decks.find(
  (d) =>
    d.standardDeckId === "standard_proteus_corp_hidden_node_control_2026_05_25",
)!;
const scoredDomainDeck = {
  id: scoredDomainEntry.standardDeckId,
  name: scoredDomainEntry.name,
  side: "corp" as const,
  identity: scoredDomainEntry.identityCardId,
  cards: scoredDomainEntry.cards.map((c) => ({
    id: c.cardId,
    quantity: c.quantity,
  })),
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
function fixture(hand = 0, scored = true, source = SOLO) {
  let s = createGameAfterSetup({
    seed: "scored-damage-owner",
    corpDeck: source === SOLO ? deck : scoredDomainDeck,
  });
  s = apply(
    s,
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(source)
    .withCorpCredits(8)
    .withRunnerTags(1);
  if (scored) {
    const id = s.corp.hq.find(
      (id) => s.cardInstances[id]!.definitionId === source,
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
  const activeDeck = Object.values(s.cardInstances).some(
    (c) => c.definitionId === "onr_proteus_003_corporate-headhunters",
  )
    ? scoredDomainDeck
    : deck;
  return buildAiDecisionInput(s, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: activeDeck.id,
      side: "corp",
      cards: activeDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
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

it("projects the scored domain damage as damage with its exact capability, without credit income", () => {
  const state = fixture(0, true, "onr_proteus_003_corporate-headhunters");
  const sourceId = state.corp.scoreArea[0]!;
  const action = getLegalActions(state, "corp").find(
    (a) => a.source === sourceId,
  )!;
  expect(action.payload).toMatchObject({
    gainCreditsAmount: 0,
    damageType: "meat",
    damageRecipient: "runner",
    damageAmount: 1,
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityId:
      "onr_proteus_003_corporate-headhunters:tagged_runner_meat_damage_reduce_hand_size_on_success",
  });
  const projected = input(state).legalActions.find(
    (a) => a.actionId === action.actionId,
  )!;
  expect(projected.payload?.damageRecipient).toBe("runner");
  expect(costProfileForAction(projected).additionalCosts).toEqual([]);
  const malformed = structuredClone(input(state));
  malformed.legalActions.find(
    (a) => a.actionId === action.actionId,
  )!.payload!.damageRecipient = "unknown";
  expect(() => buildAiDecisionInputDto(malformed)).toThrow(
    "Invalid Engine damage recipient",
  );
});

it("discovers, quotes and executes the existing scored domain's immediate lethal route", () => {
  const state = fixture(0, true, "onr_proteus_003_corporate-headhunters");
  const before = JSON.stringify(state);
  const requests = buildBoundedCorpPunishRouteRequests(input(state));
  expect(requests).not.toHaveLength(0);
  expect(
    requests.map((request) => quoteCorpPunishRoute(state, request)),
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ok: true,
        quote: expect.objectContaining({
          complete: true,
          damageEnvelope: expect.objectContaining({
            effectiveDamage: { minimum: 1, maximum: 1 },
          }),
        }),
      }),
    ]),
  );
  expect(JSON.stringify(state)).toBe(before);
  const { decision, action } = decide(state);
  expect(action.source).toBe(state.corp.scoreArea[0]);
  expect(
    decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
  ).toContain("corp.punish_campaign");
  const finished = apply(state, action.actionId);
  expect(finished.winner).toBe("corp");
  expect(finished.corp.clicks).toBe(state.corp.clicks - 1);
});

it("requotes the scored domain after nonlethal damage while preserving its hand-size consequence", () => {
  let state = fixture(1, true, "onr_proteus_003_corporate-headhunters");
  const first = decide(state);
  expect(first.action.source).toBe(state.corp.scoreArea[0]);
  state = apply(state, first.action.actionId);
  expect(state.runner.grip).toHaveLength(0);
  expect(state.runner.maxHandSize).toBe(4);
  expect(state.winner).toBeNull();
  const second = decide(state);
  expect(apply(state, second.action.actionId).winner).toBe("corp");
});

it.each(["hq", "untagged"] as const)(
  "scored domain boundary: %s",
  (variant) => {
    const state = fixture(
      0,
      variant === "untagged",
      "onr_proteus_003_corporate-headhunters",
    );
    if (variant === "untagged") state.runner.tags = 0;
    expect(buildBoundedCorpPunishRouteRequests(input(state))).toEqual([]);
    expect(
      getLegalActions(state, "corp").some((a) => a.payload?.damageAmount === 1),
    ).toBe(false);
  },
);

it("keeps concealed response identities out of the scored domain's damage guarantee", () => {
  const left = fixture(0, true, "onr_proteus_003_corporate-headhunters");
  const hiddenId = "scored_domain_concealed_response" as CardInstanceId;
  left.runner.rig.resources.push(hiddenId);
  left.cardInstances[hiddenId] = {
    instanceId: hiddenId,
    definitionId: "onr_proteus_142_hq-mole" as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const right = structuredClone(left);
  right.cardInstances[hiddenId]!.definitionId =
    "onr_proteus_132_bolt-hole" as CardDefinitionId;
  expect(input(left)).toEqual(input(right));
  const request = buildBoundedCorpPunishRouteRequests(input(left))[0]!;
  const quote = quoteCorpPunishRoute(left, request);
  expect(quoteCorpPunishRoute(right, request)).toEqual(quote);
  expect(quote).toMatchObject({
    ok: true,
    quote: { guarantee: "conditional_on_runner_response" },
  });
});
