import standardDeckCatalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { applyAction, createGameAfterSetup, getLegalActions, getPlayerView } from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory, residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { corpFundedCentralProtectionReserve } from "../defense/corp-server-protection-reserve";

function deck(id: string): DeckDefinition {
  const current = standardDeckCatalog.decks.find((d) => d.standardDeckId === id);
  if (!current) throw new Error(`Missing canonical deck ${id}`);
  return { id, name: current.name, side: current.side as "runner" | "corp", identity: current.identityCardId,
    cards: current.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })) };
}
const runnerDeck = deck("standard_proteus_runner_breaker_lab_2026_05_25");
const corpDeck = deck("standard_corp_tycho_ice_stack");
function apply(state: GameState, action: LegalAction): GameState {
  const result = applyAction(state, { matchId: state.matchId, side: action.side, actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function step(state: GameState, predicate: (a: LegalAction) => boolean): GameState {
  const actions = getLegalActions(state, state.activeSide).filter(predicate);
  expect(actions).toHaveLength(1);
  return apply(state, actions[0]!);
}
function fixture(credits: number, clicks: number, terminal = false): GameState {
  let state = createGameAfterSetup({ matchId: "obligation-reserve", seed: "obligation-reserve",
    agendaPointsToWin: 7, runnerDeck, corpDeck });
  state = step(state, (a) => a.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteRoot("remote_1", "onr_v1_220_tycho-extension", 4)
    .withCorpRemoteRoot("remote_2", "onr_v1_308_acme-savings-and-loan")
    .withCorpHqSize(0)
    .withCorpCardInHq(terminal ? "onr_v1_193_corporate-coup" : "onr_v1_215_security-net-optimization");
  state = step(state, (a) => a.type === "score_agenda");
  const loan = getLegalActions(state, "corp").find((a) => a.type === "rez_card" && a.source.includes("acme-savings-and-loan"));
  expect(loan).toBeDefined();
  state = apply(state, loan!);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(3);
  if (terminal) {
    RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot("remote_3", "onr_v1_215_security-net-optimization", 5);
    state = step(state, (a) => a.type === "score_agenda" && a.payload?.selectedServerId === "archives");
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(6);
  }
  state = step(state, (a) => a.type === "end_turn");
  state = step(state, (a) => a.type === "start_run" && a.payload?.serverId === "hq");
  state = step(state, (a) => a.type === "access_card");
  state = step(state, (a) => a.type === "steal_agenda");
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(terminal ? 2 : 3);
  state = step(state, (a) => a.type === "end_turn");
  state = step(state, (a) => a.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(0)
    .withCorpCardInHq(terminal ? "onr_v1_374_washington-d-c-city-grid" : "onr_v1_193_corporate-coup")
    .withCorpIceOnServer("rd", "onr_v1_245_fire-wall")
    .withCorpCredits(credits).withRunnerCredits(5)
    .withRunnerProgramInstalled("onr_proteus_079_big-frackin-gun")
    .withRunnerProgramInstalled("onr_proteus_095_skeleton-passkeys");
  state.corp.clicks = clicks;
  state.runner.memoryUsed = 2;
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", { difficulty: "hard", decisionId: `obligation:${state.stateVersion}`,
    profileId: "obligation-reserve", ownDeckSnapshot: { deckSnapshotId: "obligation-reserve", side: "corp",
      cards: corpDeck.cards.map((c) => ({ cardId: c.id, quantity: c.quantity })) } });
}
function signalFor(input: ReturnType<typeof inputFor>): CorpScoreProjectSignal {
  const instance = residentPlanPortfolioSnapshot(input)?.instances.find((p) => p.dedupeKey === "obligation-debt-removal");
  expect(instance).toBeDefined();
  return (instance!.moduleState as { kind: "score"; signal: CorpScoreProjectSignal }).signal;
}
beforeEach(resetResidentPlanPortfolioMemory);

it("binds the exact native obligation conversion cost and credit horizon before admission", () => {
  const input = inputFor(fixture(17, 1));
  const action = input.legalActions.find((a) => a.payload?.obligationDebtAbility === "remove_obligation")!;
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toContain("plan_step_id:plan:corp.score_agenda:obligation-debt-removal:convert_agenda");
  expect(signalFor(input)).toMatchObject({ sameTurnConversionProof: "engine_quoted_path",
    sameTurnConversionResourceCost: { stateVersion: input.playerView.stateVersion, credits: 12, clicks: 1 },
    sameTurnConversionCreditHorizon: { stateVersion: input.playerView.stateVersion, creditsBeforeScorePayout: 5 } });
});

it("blocks a nonterminal repayment one credit below the existing funded defense reserve", () => {
  const input = inputFor(fixture(16, 1));
  expect(corpFundedCentralProtectionReserve(input)).toBe(5);
  const removal = input.legalActions.find((a) => a.payload?.obligationDebtAbility === "remove_obligation")!;
  const decision = chooseAiAction(input);
  expect(decision.actionId).not.toBe(removal.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(signalFor(input)).toMatchObject({ feasible: false,
    routeAssessment: "corp_same_turn_score_consumes_funded_defense_reserve" });
});

it("admits the same repayment exactly at the reserve boundary and preserves native points", () => {
  const state = fixture(17, 1), input = inputFor(state);
  expect(corpFundedCentralProtectionReserve(input)).toBe(5);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.payload?.obligationDebtAbility).toBe("remove_obligation");
  const end = apply(state, action);
  expect(end.corp.credits).toBe(5);
  expect(getPlayerView(end, "corp").own.agendaPoints).toBe(4);
});

it("funds one missing reserve credit under the same score parent before native repayment", () => {
  let state = fixture(16, 2);
  const firstInput = inputFor(state), first = chooseAiAction(firstInput);
  const gain = firstInput.legalActions.find((a) => a.actionId === first.actionId)!;
  expect(gain.type).toBe("gain_credit");
  expect(first.evidence).toContain("plan_first_root:plan:corp.score_agenda:obligation-debt-removal");
  expect(signalFor(firstInput)).toMatchObject({ feasible: true, fundingGap: 1 });
  state = apply(state, gain);
  const nextInput = inputFor(state), next = chooseAiAction(nextInput);
  const removal = nextInput.legalActions.find((a) => a.actionId === next.actionId)!;
  expect(removal.payload?.obligationDebtAbility).toBe("remove_obligation");
  expect(next.evidence).toContain("plan_first_root:plan:corp.score_agenda:obligation-debt-removal");
  state = apply(state, removal);
  expect(state.corp.credits).toBe(5);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(4);
});

it("keeps a native terminal obligation conversion at P1 even below the reserve", () => {
  const state = fixture(16, 1, true), input = inputFor(state), decision = chooseAiAction(input);
  expect(decision.evidence).toContain("plan_priority_class:P1");
  const action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.payload?.obligationDebtAbility).toBe("remove_obligation");
  const end = apply(state, action);
  expect(end.corp.credits).toBe(4);
  expect(end.winner).toBe("corp");
});
