import standardDeckCatalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { applyAction, createGameAfterSetup, getLegalActions } from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { expect, it } from "vitest";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildRunnerEconomyPosture } from "../../runner-economy-posture";
import { currentAccessWindowCommitment } from "./run-window-access";

function deck(id: string): DeckDefinition {
  const d = standardDeckCatalog.decks.find((d) => d.standardDeckId === id);
  if (!d) throw new Error(`Missing deck ${id}`);
  return { id, name: d.name, side: d.side as "runner" | "corp", identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })) };
}
function step(state: GameState, type: string): GameState {
  const actions = getLegalActions(state, state.activeSide).filter((a) => a.type === type &&
    (type !== "start_run" || a.payload?.serverId === "hq"));
  expect(actions).toHaveLength(1);
  const action = actions[0]!;
  const result = applyAction(state, { matchId: state.matchId, side: action.side,
    actionId: action.actionId, clientKnownStateVersion: state.stateVersion });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function access(free: boolean) {
  let state = createGameAfterSetup({ matchId: "access-reserve", seed: "access-reserve",
    runnerDeck: deck("standard_proteus_runner_breaker_lab_2026_05_25"),
    corpDeck: deck("standard_corp_tycho_ice_stack") });
  state = step(state, "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0)
    .withCorpCardInHq(free ? "onr_v1_244_filter" : "onr_v1_318_department-of-truth-enhancement");
  state = step(state, "end_turn");
  if (free) {
    RealEngineFixtureBuilder.forState(state).withRunnerProgramInstalled("onr_proteus_084_crumble");
    state.purgeableRunnerVirusCounters = { corp: { crumble: 2 } };
  }
  state = step(state, "start_run");
  state = step(state, "access_card");
  RealEngineFixtureBuilder.forState(state).withRunnerCredits(free ? 0 : 1);
  const runnerDeck = deck("standard_proteus_runner_breaker_lab_2026_05_25");
  const input = buildAiDecisionInput(state, "runner", { difficulty: "hard", decisionId: "access-reserve",
    ownDeckSnapshot: { deckSnapshotId: runnerDeck.id, side: "runner",
      cards: runnerDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })) } });
  return { input, economy: { ...buildRunnerEconomyPosture({ input }), desiredCreditReserve: 10 } };
}
it("does not label a zero-credit native virus trash as unaffordable when its impact is declined", () => {
  const { input, economy } = access(true);
  expect(input.legalActions.find((a) => a.type === "trash_accessed_card")?.costs).toEqual([]);
  expect(currentAccessWindowCommitment(input, economy, undefined)).toMatchObject({
    payoff: "known_low_value", intendedAction: "decline", evidenceCode: "access_window_visible_impact_below_cost" });
});
it("retains the reserve reason when a paid native trash would increase its deficit", () => {
  const { input, economy } = access(false);
  expect(input.legalActions.find((a) => a.type === "trash_accessed_card")?.costs).toEqual([{ credits: 1 }]);
  expect(currentAccessWindowCommitment(input, economy, undefined)).toMatchObject({
    payoff: "trash_unaffordable", intendedAction: "decline", evidenceCode: "access_window_trash_deferred_by_bound_reserve" });
});
