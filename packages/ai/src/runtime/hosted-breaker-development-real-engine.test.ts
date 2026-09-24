import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { evaluateRunnerHandDevelopment } from "../runner/hand-development/hand-development-evaluation";

import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInputDto } from "../input-dto";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";

const stockId = "onr_proteus_139_eurocorpse-tm-spin-chip",
  breakerId = "onr_v1_039_krash";
const runner = catalog.decks.find(
  (d) =>
    d.standardDeckId ===
    "standard_runner_krashkurs_clown_kreditmaschine_2026_07_11",
)!;
const corp = catalog.decks.find((d) => d.name === "Vom Tablet")!;
const snapshot = {
  deckSnapshotId: runner.standardDeckId,
  side: "runner" as const,
  cards: runner.cards,
};
afterEach(resetResidentPlanPortfolioMemory);
function apply(state: GameState, side: "runner" | "corp", id: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: id,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `stock:${state.stateVersion}:${id}`,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture() {
  const deck = (d: typeof runner): DeckDefinition => ({
    id: d.standardDeckId,
    name: d.name,
    side: d.side as "runner" | "corp",
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  });
  let s = createGameAfterSetup({
    seed: "run-strength-stock",
    matchId: "run-strength-stock",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
    agendaPointsToWin: 7,
  });
  s = apply(
    s,
    "corp",
    getLegalActions(s, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(s).withCorpHqSize(5);
  s = apply(
    s,
    "corp",
    getLegalActions(s, "corp").find((a) => a.type === "end_turn")!.actionId,
  );
  RealEngineFixtureBuilder.forState(s)
    .withRunnerCredits(20)
    .withRunnerClicks(4)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(breakerId)
    .withRunnerCardInGrip(stockId)
    .withRezzedCorpIceOnServer("rd", "onr_v1_245_fire-wall")
    .withRezzedCorpIceOnServer("hq", "onr_v1_252_keeper");
  s.runner.memoryUsed = 0;
  return s;
}

function inputFor(s: GameState) {
  return buildAiDecisionInput(s, "runner", {
    difficulty: "hard",
    decisionId: `host:${s.stateVersion}`,
    profileId: "host",
    ownDeckSnapshot: snapshot,
  });
}
function evaluate(s: GameState, id = stockId) {
  const input = inputFor(s);
  return {
    input,
    evaluation: evaluateRunnerHandDevelopment({ input }).find(
      (e) => e.definitionId === id,
    )!,
  };
}
function install(s: GameState, definitionId: string, hosted = false) {
  const action = getLegalActions(s, "runner").find(
    (a) =>
      a.type === "install_card" &&
      s.cardInstances[a.source]?.definitionId === definitionId &&
      Boolean(a.payload?.hostOnCardId) === hosted &&
      !a.payload?.runnerProgramTrashBeforeInstall,
  )!;
  expect(action).toBeDefined();
  return apply(s, "runner", action.actionId);
}
function addCopy(s: GameState, definitionId: string) {
  const id = s.runner.stack.find(
    (c) => s.cardInstances[c]!.definitionId === definitionId,
  )!;
  expect(id).toBeDefined();
  s.runner.stack = s.runner.stack.filter((c) => c !== id);
  s.runner.grip.push(id);
  s.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
}
function select(s: GameState) {
  const input = inputFor(s);
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.route?.actionId).toBe(decision.actionId);
  expect(pf.executionOrigin?.leafPlanInstanceId).toBe(
    pf.selectedPlan?.instanceId,
  );
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  return { action, decision, pf };
}

describe("hosted breaker investment through real Engine and plan owners", () => {
  it("builds the profitable host before the free breaker, then installs on it", () => {
    let s = fixture();
    const { evaluation } = evaluate(s);
    expect(evaluation.hostedBreakerDevelopment).toMatchObject({
      admitted: true,
    });
    expect(evaluation.hostedBreakerDevelopment!.evidenceCodes).toContain(
      "runner_hosted_breaker_saved_mu:1",
    );
    const first = select(s);
    expect(first.action.actionId).toBe(evaluation.legalActionId);
    expect(first.pf.selectedPlan?.moduleId).toBe(
      "runner.develop_board_and_hand",
    );
    s = apply(s, "runner", first.action.actionId);
    const next = select(s);
    expect(next.action.type).toBe("install_card");
    expect(next.action.payload?.hostOnCardId).toBe(evaluation.cardInstanceId);
    s = apply(s, "runner", next.action.actionId);
    expect(s.runner.memoryUsed).toBe(0);
    expect(s.runner.credits).toBe(14);
  });
  it("admits and executes a later second-breaker upgrade without dismantling coverage", () => {
    let s = install(fixture(), breakerId);
    addCopy(s, breakerId);
    const { evaluation } = evaluate(s);
    expect(evaluation.hostedBreakerDevelopment).toMatchObject({
      admitted: true,
    });
    expect(evaluation.hostedBreakerDevelopment!.evidenceCodes).toContain(
      "runner_hosted_breaker_saved_mu:0",
    );
    const first = select(s);
    expect(first.action.actionId).toBe(evaluation.legalActionId);
    s = apply(s, "runner", first.action.actionId);
    const second = select(s);
    expect(second.action.payload?.hostOnCardId).toBe(evaluation.cardInstanceId);
    expect(second.pf.selectedPlan?.moduleId).toBe(
      "runner.develop_board_and_hand",
    );
    s = apply(s, "runner", second.action.actionId);
    expect(s.runner.memoryUsed).toBe(1);
    expect(
      s.runner.rig.programs.filter(
        (c) => s.cardInstances[c]!.definitionId === breakerId,
      ),
    ).toHaveLength(2);
  });
  it.each([
    "reserve",
    "no_consumer",
    "last_click",
    "short_horizon",
    "urgent",
    "no_saving",
  ])("does not force the investment for %s", (reason) => {
    const s = fixture();
    if (reason === "reserve") s.runner.credits = 6;
    if (reason === "no_consumer") {
      const id = s.runner.grip.find(
        (c) => s.cardInstances[c]!.definitionId === breakerId,
      )!;
      s.runner.grip = s.runner.grip.filter((c) => c !== id);
      s.runner.stack.push(id);
      s.cardInstances[id]!.zone = { side: "runner", zone: "stack" };
    }
    if (reason === "last_click") s.runner.clicks = 1;
    if (reason === "short_horizon") s.runner.stack = s.runner.stack.slice(0, 2);
    if (reason === "urgent")
      RealEngineFixtureBuilder.forState(s).withCorpRemoteRoot(
        "remote_1",
        "onr_v1_220_tycho-extension",
        3,
      );
    if (reason === "no_saving")
      for (const server of s.corp.servers) server.ice = [];
    const { input, evaluation } = evaluate(s);
    expect(evaluation.hostedBreakerDevelopment?.admitted).toBe(false);
    expect(chooseAiAction(input).actionId).not.toBe(evaluation.legalActionId);
  });
  it("does not buy another host once the same breaker already uses a credit host", () => {
    let s = install(fixture(), stockId);
    s = install(s, breakerId, true);
    addCopy(s, stockId);
    addCopy(s, breakerId);
    expect(evaluate(s).evaluation.hostedBreakerDevelopment?.admitted).toBe(
      false,
    );
  });
  it("uses the host even when ordinary MU is full, without trashing support", () => {
    let s = fixture();
    for (const id of [
      "onr_v1_012_clown",
      "onr_v1_046_pattels-virus",
      "onr_proteus_091_lockjaw",
      "onr_v1_071_vewy-vewy-quiet",
    ]) {
      RealEngineFixtureBuilder.forState(s).withRunnerProgramInstalled(id);
    }
    s.runner.memoryUsed = 4;
    const { evaluation } = evaluate(s);
    expect(evaluation.hostedBreakerDevelopment?.admitted).toBe(true);
    s = apply(s, "runner", evaluation.legalActionId!);
    const hosted = select(s);
    expect(hosted.action.payload?.hostOnCardId).toBe(evaluation.cardInstanceId);
    s = apply(s, "runner", hosted.action.actionId);
    expect(s.runner.memoryUsed).toBe(4);
    expect(s.runner.rig.programs).toHaveLength(5);
  });
  it("retains the exact public host target through repeated DTO sanitization", () => {
    const s = install(fixture(), stockId);
    const raw = getLegalActions(s, "runner").find(
      (a) => a.payload?.hostOnCardId,
    )!;
    const input = inputFor(s);
    const twice = buildAiDecisionInputDto(input);
    expect(
      twice.legalActions.find((a) => a.actionId === raw.actionId),
    ).toMatchObject({
      actionId: raw.actionId,
      expiresAtStateVersion: s.stateVersion,
      payload: { hostOnCardId: raw.payload!.hostOnCardId },
      targetRequirements: raw.targetRequirements,
    });
  });
  it("uses the funded copy in a path quote even when the unhosted copy sorts first", () => {
    let s = install(fixture(), breakerId);
    addCopy(s, breakerId);
    s = install(s, stockId);
    s = install(s, breakerId, true);
    const input = inputFor(s);
    const rig = input.playerView.own.rig!;
    const ice = input.playerView.servers.find(
      (server) => server.id === "rd",
    )!.ice;
    const quote = (cards: typeof rig) =>
      assessKnownRezzedIcePath(
        ice,
        cards,
        runnerRunPathCreditBudgetWithVisiblePools(20, cards),
      );
    const funded = quote(rig);
    const empty = quote(rig.map((c) => ({ ...c, counterDisplays: [] })));
    expect(funded.canReachAccess).toBe(true);
    expect(funded.creditsAfterPath - empty.creditsAfterPath).toBe(2);
  });
  it("spends the hosted copy's credits in the actual run with both copies installed", () => {
    let s = install(fixture(), breakerId);
    addCopy(s, breakerId);
    s = install(s, stockId);
    s = install(s, breakerId, true);
    const hosted = s.runner.rig.programs.find(
      (c) => s.cardInstances[c]!.hostedOn,
    )!;
    const host = s.cardInstances[hosted]!.hostedOn!;
    const run = getLegalActions(s, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "rd",
    )!;
    s = apply(s, "runner", run.actionId);
    for (let i = 0; i < 10 && s.run?.phase !== "encounter_ice"; i++) {
      const next = getLegalActions(s, s.activeSide).find(
        (a) => a.type === "continue_run",
      )!;
      expect(next).toBeDefined();
      s = apply(s, s.activeSide, next.actionId);
    }
    expect(s.run?.phase).toBe("encounter_ice");
    const chosen = select(s);
    expect(chosen.pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
    expect(chosen.action.source).toBe(hosted);
    s = apply(s, "runner", chosen.action.actionId);
    const remainingPool = inputFor(s)
      .playerView.own.rig!.find((c) => c.instanceId === host)!
      .counterDisplays!.find(
        (d) => d.creditPool?.requireHostedBreakerForIcebreakerUse,
      )!;
    expect(remainingPool.amount).toBeLessThan(2);
  });
  it("does not double-count run credits already covered by renewable pools", () => {
    const s = fixture();
    // Real installed providers with their Engine-produced credit pools.
    for (const id of ["onr_v1_011_cloak", "onr_v1_011_cloak"]) {
      const instance = s.runner.stack.find(
        (c) => s.cardInstances[c]!.definitionId === id,
      );
      if (!instance) throw Error(`Missing fixture card ${id}`);
      s.runner.stack = s.runner.stack.filter((c) => c !== instance);
      s.runner.grip.push(instance);
      s.cardInstances[instance]!.zone = { side: "runner", zone: "grip" };
    }
    let installed = install(s, "onr_v1_011_cloak");
    installed = install(installed, "onr_v1_011_cloak");
    installed.runner.clicks = 4;
    // Strength zero still costs Krash one credit per broken subroutine.
    // Cloaks fully cover this cost, so Spin Chip adds no liquid saving.
    for (const server of installed.corp.servers) {
      for (const id of server.ice)
        installed.cardInstances[id]!.strengthModifier = -20;
    }
    expect(
      evaluate(installed).evaluation.hostedBreakerDevelopment?.admitted,
    ).toBe(false);
  });
});
