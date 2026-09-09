import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import { type GameState } from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseCorpAction } from "../index";
import { buildAiDecisionInput } from "./ai-decision-input";
import { withDecisionLocalCorpPunishRouteQuotes } from "./corp-punish-route-quote-input";
beforeEach(() => resetResidentPlanPortfolioMemory());
const BEL = "onr_proteus_054_bel-digmo-antibody",
  MAN = "onr_proteus_050_manhunt";
const entry = standardDeckCatalog.decks.find(
  (d) =>
    d.standardDeckId === "standard_proteus_corp_hidden_node_control_2026_05_25",
)!;
const deck = {
  id: entry.standardDeckId,
  name: entry.name,
  side: "corp" as const,
  identity: entry.identityCardId,
  cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
};
function initial(seed: string, definitionId: string) {
  let s = createGameAfterSetup({ seed, corpDeck: deck });
  s = apply(
    s,
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(s)
    .withCorpHqSize(0)
    .withCorpCardInHq(definitionId)
    .withCorpCredits(12)
    .withRunnerTags(0)
    .withRunnerGripSize(5);
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "corp", {
    decisionId: s.matchId + ":" + s.stateVersion,
    profileId: "four-card-review",
    ownDeckSnapshot: {
      deckSnapshotId: deck.id,
      side: "corp",
      cards: deck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })),
    },
  });
}
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
it("recycles a legally installed R&D access source without a remote damage claim", () => {
  let s = initial("bel-free-recycle", BEL);
  const install = getLegalActions(s, "corp").find(
    (a) => a.type === "install_card" && a.payload?.serverId === "new_remote",
  )!;
  s = apply(s, install.actionId);
  const before = s.corp.rd.length;
  const i = input(s);
  const d = chooseCorpAction(i);
  const a = i.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(a.type).toBe("rez_card");
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.ambush_and_bluff",
  );
  expect(d.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: a.actionId,
    stateVersion: s.stateVersion,
    capabilityId: "ambush_recycle_rd",
  });
  expect(d.fallbackUsed).toBe(false);
  s = apply(s, a.actionId);
  expect(s.corp.rd.length).toBe(before + 1);
});
it("quotes a standalone trace without treating optional tag clearing as guaranteed credit loss", () => {
  const s = initial("manhunt-pressure", MAN);
  s.runner.credits = 0;
  s.runnerTurnFlags!.runAttemptsLastTurn = 1;
  const i = withDecisionLocalCorpPunishRouteQuotes(input(s), (r) =>
    quoteCorpPunishRoute(s, r),
  );
  expect(i.playerView.corpPunishRouteQuoteSet?.routes.length).toBeGreaterThan(
    0,
  );
  const d = chooseCorpAction(i, {
    quoteCorpPunishRoute: (r) => quoteCorpPunishRoute(s, r),
  });
  expect(d.fallbackUsed).toBe(false);
  expect(i.playerView.corpPunishRouteQuoteSet?.routes[0]).toMatchObject({
    responsePaymentEnvelope: {
      totalCorpCredits: { minimum: 4, maximum: 4 },
      runnerResponseCredits: { maximum: 0 },
    },
    tagOutcomeEnvelope: { addedTags: { minimum: 6, maximum: 6 } },
  });
  expect(d.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.execute_punish_sequence",
  );
});
