import { readFileSync } from "node:fs";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  type CorpPunishRouteQuoteRequest,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildBoundedCorpPunishRouteRequests } from "../corp/punish/punish-route-quote-input";
import { chooseCorpAction } from "../index";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const SQUAD = "onr_v1_342_solo-squad";
const CAPABILITY = `${SQUAD}:abilities_activated_corp_main_damage`;
const entry = catalog.decks.find(
  (d) => d.standardDeckId === "standard_corp_neon_guillotine",
)!;
const deck = {
  id: entry.standardDeckId,
  name: entry.name,
  side: "corp" as const,
  identity: entry.identityCardId,
  cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
};
afterEach(resetResidentPlanPortfolioMemory);

function apply(s: GameState, action: LegalAction) {
  const result = applyAction(s, {
    matchId: s.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: s.stateVersion,
  });
  if (!result.ok) throw Error(JSON.stringify(result.error));
  return result.state;
}
function fixture() {
  let s = createGameAfterSetup({
    seed: "meta-494-installed-payoff",
    corpDeck: deck,
  });
  s = apply(
    s,
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(SQUAD)
    .withCorpCredits(1)
    .withRunnerCredits(0)
    .withRunnerTags(1)
    .withRunnerGripSize(2);
  s = apply(
    s,
    getLegalActions(s, "corp").find(
      (a) => a.type === "install_card" && a.payload?.serverId === "new_remote",
    )!,
  );
  s = apply(s, getLegalActions(s, "corp").find((a) => a.type === "rez_card")!);
  s.corp.clicks = 3;
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
function request(s: GameState): CorpPunishRouteQuoteRequest {
  const source = s.corp.servers
    .flatMap((v) => v.root)
    .find((id) => s.cardInstances[id]!.definitionId === SQUAD)!;
  return {
    schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
    matchId: s.matchId,
    side: "corp",
    stateVersion: s.stateVersion,
    timingPoint: s.timingPoint,
    campaignId: "installed-damage",
    routeId: "installed-damage:single",
    steps: [
      {
        stepId: "installed-damage:single:0",
        order: 0,
        kind: "meat_damage",
        sourceCardInstanceId: source,
        sourceCapabilityBindingKind: "card_spec_capability_key",
        sourceCapabilityId: CAPABILITY,
      },
    ],
  };
}

it("discovers the exact installed payoff from native meta-494 G16 D72", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../data/scenarios/ai-decision-checkpoints/cp-meta-494-r3-g16-d72.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(cp.input.playerView.opponent).toMatchObject({ tags: 1, handCount: 2 });
  expect(cp.input.playerView.own).toMatchObject({ credits: 1, clicks: 3 });
  const action = cp.input.legalActions.find(
    (a: LegalAction) =>
      a.type === "activated_card_ability" &&
      a.payload?.cardImplementationAbilityId === CAPABILITY,
  );
  expect(action).toBeDefined();
  expect(buildBoundedCorpPunishRouteRequests(cp.input)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        steps: expect.arrayContaining([
          expect.objectContaining({
            kind: "meat_damage",
            sourceCardInstanceId: action.source,
            sourceCapabilityId: CAPABILITY,
          }),
        ]),
      }),
    ]),
  );
});
it("certifies the installed source through its current Engine LegalAction", () => {
  const s = fixture(),
    r = request(s),
    before = JSON.stringify(s),
    result = quoteCorpPunishRoute(s, r);
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(result.error.message);
  expect(result.quote).toMatchObject({
    complete: true,
    incompleteReasons: [],
    damageEnvelope: { effectiveDamage: { minimum: 1, maximum: 1 } },
    steps: [
      expect.objectContaining({
        clicks: 1,
        credits: 0,
        currentLegalAction: expect.objectContaining({
          type: "activated_card_ability",
          source: r.steps[0]!.sourceCardInstanceId,
          expiresAtStateVersion: s.stateVersion,
        }),
      }),
    ],
  });
  expect(JSON.stringify(s)).toBe(before);
});
it("requotes each normal activation and closes the three-click damage line", () => {
  let s = fixture();
  for (let n = 0; n < 3; n++) {
    const i = input(s),
      before = JSON.stringify([i.playerView, i.legalActions]);
    const decision = chooseCorpAction(i, {
      quoteCorpPunishRoute: (r) => quoteCorpPunishRoute(s, r),
      persistTacticalPlanMemory: false,
    });
    const action = i.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toMatchObject({
      type: "activated_card_ability",
      payload: { cardImplementationAbilityId: CAPABILITY },
    });
    expect(decision.fallbackUsed).toBe(false);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.rootPlanInstanceId).toContain("corp.punish_campaign");
    expect(pf.executionOrigin?.leafPlanInstanceId).toContain(
      "corp.execute_punish_sequence",
    );
    expect(pf.selectedStep?.stepId).toBeTruthy();
    expect(pf.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: s.stateVersion,
    });
    expect(JSON.stringify([i.playerView, i.legalActions])).toBe(before);
    s = apply(s, action);
    expect(s.winner).toBe(n === 2 ? "corp" : null);
    expect(s.runner.grip).toHaveLength(Math.max(0, 1 - n));
  }
});
it("does not discover unrezzed or untagged installed sources", () => {
  const s = fixture(),
    r = request(s),
    source = r.steps[0]!.sourceCardInstanceId;
  s.cardInstances[source]!.rezzed = false;
  expect(buildBoundedCorpPunishRouteRequests(input(s))).toEqual([]);
  expect(quoteCorpPunishRoute(s, r)).toMatchObject({
    ok: true,
    quote: { complete: false },
  });
  s.cardInstances[source]!.rezzed = true;
  s.runner.tags = 0;
  expect(buildBoundedCorpPunishRouteRequests(input(s))).toEqual([]);
  expect(quoteCorpPunishRoute(s, r)).toMatchObject({
    ok: true,
    quote: { complete: false },
  });
});
it("does not discover a source in HQ or a virtual Archives root", () => {
  const s = fixture(),
    r = request(s),
    source = r.steps[0]!.sourceCardInstanceId;
  RealEngineFixtureBuilder.forState(s).withCorpCardInHq(SQUAD);
  expect(buildBoundedCorpPunishRouteRequests(input(s))).toEqual([]);
  expect(quoteCorpPunishRoute(s, r)).toMatchObject({
    ok: true,
    quote: { complete: false },
  });
  s.corp.hq = s.corp.hq.filter((id) => id !== source);
  s.corp.archives.push(source);
  Object.assign(s.cardInstances[source]!, {
    zone: { side: "corp", zone: "archives" },
    faceup: true,
    rezzed: true,
  });
  const i = input(s);
  expect(i.playerView.servers.find((v) => v.id === "archives")?.root).toEqual(
    expect.arrayContaining([expect.objectContaining({ instanceId: source })]),
  );
  expect(buildBoundedCorpPunishRouteRequests(i)).toEqual([]);
  expect(quoteCorpPunishRoute(s, r)).toMatchObject({
    ok: true,
    quote: { complete: false },
  });
});
it("rejects a root that no longer belongs to its recorded server", () => {
  const s = fixture(),
    r = request(s);
  for (const server of s.corp.servers)
    server.root = server.root.filter(
      (id) => id !== r.steps[0]!.sourceCardInstanceId,
    );
  expect(quoteCorpPunishRoute(s, r)).toMatchObject({
    ok: true,
    quote: { complete: false },
  });
});
