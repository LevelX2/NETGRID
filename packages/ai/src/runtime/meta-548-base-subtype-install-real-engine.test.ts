import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { applyAction, createGameAfterSetup, getLegalActions, getPlayerView, hashState } from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "./ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

function deck(id: string): DeckDefinition {
  const d = catalog.decks.find((d) => d.standardDeckId === id)!;
  return { id, name: d.name, side: d.side as "corp" | "runner", identity: d.identityCardId, cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })) };
}
const corpDeck = deck("standard_proteus_corp_hidden_node_control_2026_05_25");
const runnerDeck = deck("standard_runner_rd_express_v2");
function apply(state: GameState, action: LegalAction): GameState {
  expect(action).toBeDefined();
  const r = applyAction(state, { matchId: state.matchId, side: action.side, actionId: action.actionId, clientKnownStateVersion: state.stateVersion });
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
function fixture(card: string, credits: number) {
  let s = createGameAfterSetup({ seed: "meta548-base-subtype", corpDeck, runnerDeck });
  s = apply(s, getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!);
  while (s.corp.clicks > 1) s = apply(s, getLegalActions(s, "corp").find((a) => a.type === "gain_credit")!);
  RealEngineFixtureBuilder.forState(s).withCorpHqSize(0).withCorpCredits(credits).withRunnerCredits(3)
    .withCorpCardInHq("onr_proteus_005_marked-accounts").withCorpCardInHq(card);
  return s;
}
function input(s: GameState) {
  return buildAiDecisionInput(s, "corp", { difficulty: "hard", ownDeckSnapshot: { deckSnapshotId: corpDeck.id, side: "corp", cards: corpDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })) } });
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([
  ["onr_proteus_017_credit-blocks", 6],
  ["onr_proteus_040_sumo-2008", 8],
] as const)("binds the minimum base-subtype installation, Defense plan and actual rez of %s", (card, cost) => {
  let s = fixture(card, cost);
  const before = hashState(s), i = input(s), serialized = JSON.stringify(i);
  const decision = chooseAiAction(i), pf = decision.decisionDebug!.planFirstDecision!;
  const install = i.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(install.type).toBe("install_card");
  expect(install.source).toContain(card);
  expect(["hq", "rd"]).toContain(install.payload?.serverId);
  const predicted = JSON.parse(install.payload!.postInstallEffectiveRunQuoteJson as string);
  expect(predicted.subroutines).toContainEqual(expect.objectContaining({ type: "end_the_run" }));
  expect(install.payload).toMatchObject({ postInstallRezQuoteVariableRezKind: "alternate_subtype", postInstallRezQuoteVariableBaseSubtypesFinalCredits: cost });
  expect(pf).toMatchObject({ rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio", selectedPlan: { moduleId: "corp.defend_servers" }, route: { actionId: install.actionId, stateVersion: i.playerView.stateVersion } });
  expect(decision.fallbackUsed).toBe(false);
  expect(JSON.stringify(i)).toBe(serialized);
  expect(hashState(s)).toBe(before);
  s = apply(s, install);
  expect(s.corp.credits).toBe(cost);
  s = apply(s, getLegalActions(s, "corp").find((a) => a.type === "end_turn")!);
  s = apply(s, getLegalActions(s, "runner").find((a) => a.type === "start_run" && a.payload?.serverId === install.payload?.serverId)!);
  const rez = getLegalActions(s, "corp").find((a) => a.type === "rez_ice" && a.source === install.source && a.payload?.variableRezValue === 0)!;
  expect(rez.payload?.selectedSubtypesAfterRez).toBe("sentry");
  s = apply(s, rez);
  expect(s.corp.credits).toBe(0);
  const actual = getPlayerView(s, "corp").servers.flatMap((server) => server.ice).find((ice) => ice.instanceId === install.source)!;
  expect(actual.subtypes).toEqual(["sentry"]);
  expect(actual.effectiveRunQuote).toEqual(predicted);
  expect(getPlayerView(s, "runner").opponent).not.toHaveProperty("gripOrHq");
});

it.each(["onr_proteus_025_homing-missile", "onr_proteus_036_sandstorm"])("does not invent an unbound variable projection for %s", (card) => {
  const s = fixture(card, 20), before = hashState(s), i = input(s);
  const installs = i.legalActions.filter((a) => a.type === "install_card" && a.source.includes(card));
  expect(installs.length).toBeGreaterThan(0);
  for (const a of installs) expect(a.payload?.postInstallEffectiveRunQuoteJson).toBeUndefined();
  expect(hashState(s)).toBe(before);
});
