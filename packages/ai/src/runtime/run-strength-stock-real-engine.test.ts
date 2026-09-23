import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { evaluateRunnerHandDevelopment } from "../runner/hand-development/hand-development-evaluation";
import { assessRunStrengthStock } from "../runner/hand-development/run-strength-stock";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const stockId = "onr_proteus_091_lockjaw",
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
    .withRunnerClicks(1)
    .withRunnerGripSize(0)
    .withRunnerProgramInstalled(breakerId)
    .withRunnerCardInGrip(stockId)
    .withRezzedCorpIceOnServer("rd", "onr_v1_245_fire-wall")
    .withRezzedCorpIceOnServer("hq", "onr_v1_252_keeper");
  s.runner.memoryUsed = 1;
  return s;
}
function assess(s: GameState) {
  const input = buildAiDecisionInput(s, "runner", {
    difficulty: "hard",
    decisionId: `stock:${s.stateVersion}`,
    profileId: "stock",
    ownDeckSnapshot: snapshot,
  });
  const evaluation = evaluateRunnerHandDevelopment({ input }).find(
    (e) => e.definitionId === stockId,
  )!;
  const targets = evaluateRunnerRunTargets({ input });
  const stock = assessRunStrengthStock(
    input,
    evaluation,
    targets,
    buildRunnerEconomyPosture({ input }),
  );
  return { input, evaluation, stock, targets };
}
describe("run-strength consumable stock through the real development owner", () => {
  it("admits a last-click inventory option without requiring an immediate run", () => {
    const { input, stock } = assess(fixture());
    expect(stock).toMatchObject({ admitted: true, priorityClass: "P5" });
    expect(stock!.evidenceCodes).toContain(
      "runner_run_strength_stock_future_savings_not_spendable",
    );
    const decision = chooseAiAction(input);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.develop_board_and_hand",
          viability: "ready",
        }),
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });
  it("selects and applies stock when current central pressure has no affordable route", () => {
    const s = fixture();
    s.runner.credits = 8;
    // An almost empty grip legitimately prefers replenishing the hand. Keep
    // real, currently redundant/support cards so this is an idle setup choice.
    for (const id of [
      breakerId,
      breakerId,
      "onr_v1_046_pattels-virus",
      "onr_v1_146_zetatech-mem-chip",
    ]) {
      const instance = s.runner.stack.find(
        (c) => s.cardInstances[c]!.definitionId === id,
      )!;
      expect(instance).toBeDefined();
      s.runner.stack = s.runner.stack.filter((c) => c !== instance);
      s.runner.grip.push(instance);
      s.cardInstances[instance]!.zone = { side: "runner", zone: "grip" };
    }
    for (const server of s.corp.servers)
      for (const id of server.ice) s.cardInstances[id]!.strengthModifier = 8;
    const { input, evaluation } = assess(s);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(evaluation.legalActionId);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
    expect(pf.route?.actionId).toBe(decision.actionId);
    expect(pf.executionOrigin?.leafPlanInstanceId).toBe(
      pf.selectedPlan?.instanceId,
    );
    const next = apply(s, "runner", decision.actionId!);
    expect(next.runner.rig.programs).toContain(evaluation.cardInstanceId);
    expect(next.runner.clicks).toBe(0);
    expect(next.runner.credits).toBe(8);
  });
  it.each(["no_breaker", "full_mu", "tagged", "empty_future", "reserve"])(
    "holds stock for %s",
    (condition) => {
      const s = fixture();
      if (condition === "no_breaker") {
        RealEngineFixtureBuilder.forState(s).withRunnerCardInGrip(breakerId);
        s.runner.memoryUsed = 0;
      }
      if (condition === "full_mu") s.runner.memoryUsed = 4;
      if (condition === "tagged") s.runner.tags = 1;
      if (condition === "empty_future") s.runner.stack = [];
      if (condition === "reserve") s.runner.credits = 0;
      const { stock, input, evaluation } = assess(s);
      expect(stock?.admitted).toBe(false);
      expect(chooseAiAction(input).actionId).not.toBe(evaluation.legalActionId);
    },
  );
  it("keeps urgent advanced remote contest ahead of inventory", () => {
    const s = fixture();
    RealEngineFixtureBuilder.forState(s).withCorpRemoteRoot(
      "remote_1",
      "onr_v1_220_tycho-extension",
      3,
    );
    const { stock, input, evaluation } = assess(s);
    expect(stock).toMatchObject({ admitted: false });
    expect(chooseAiAction(input).actionId).not.toBe(evaluation.legalActionId);
  });
  it("does not stock a second unspent copy", () => {
    let s = fixture();
    const first = assess(s);
    s = apply(s, "runner", first.evaluation.legalActionId!);
    const second = s.runner.stack.find(
      (id) => s.cardInstances[id]!.definitionId === stockId,
    )!;
    expect(second).toBeDefined();
    s.runner.stack = s.runner.stack.filter((id) => id !== second);
    s.runner.grip.push(second);
    s.cardInstances[second]!.zone = { side: "runner", zone: "grip" };
    s.runner.clicks = 1;
    expect(assess(s).stock).toMatchObject({ admitted: false });
  });
  it.each([0, 4])(
    "uses stored strength only when useful against strength %i",
    (strength) => {
      let s = fixture();
      s.runner.clicks = 3;
      for (const id of s.corp.servers.find((s) => s.id === "rd")!.ice)
        s.cardInstances[id]!.strengthModifier = strength - 4;
      const first = assess(s);
      s = apply(s, "runner", first.evaluation.legalActionId!);
      s = apply(
        s,
        "runner",
        getLegalActions(s, "runner").find(
          (a) => a.type === "start_run" && a.payload?.serverId === "rd",
        )!.actionId,
      );
      for (let i = 0; i < 10 && s.run?.phase !== "encounter_ice"; i++) {
        const side = s.activeSide;
        const actions = getLegalActions(s, side);
        const next = actions.find((a) => a.type === "continue_run");
        if (!next)
          throw Error(JSON.stringify(actions.map((a) => [a.type, a.label])));
        s = apply(s, side, next.actionId);
      }
      expect(s.run?.phase).toBe("encounter_ice");
      const input = buildAiDecisionInput(s, "runner", {
        difficulty: "hard",
        decisionId: "stock-encounter",
        profileId: "stock",
        ownDeckSnapshot: snapshot,
      });
      const boost = input.legalActions.find(
        (a) => a.payload?.runnerAbility === "boost_icebreaker_for_run",
      )!;
      expect(boost).toBeDefined();
      expect(input.legalActions.some((a) => a.type === "pump_breaker")).toBe(
        true,
      );
      const decision = chooseAiAction(input);
      if (strength === 0) {
        expect(decision.actionId).not.toBe(boost.actionId);
        return;
      }
      expect(decision.actionId).toBe(boost.actionId);
      expect(
        decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
      ).toBe("runner.convert_run_window");
      const next = apply(s, "runner", decision.actionId!);
      expect(next.runner.rig.programs).not.toContain(
        first.evaluation.cardInstanceId,
      );
      expect(
        getPlayerView(next, "runner").own.rig?.find(
          (c) => c.definitionId === breakerId,
        )?.strength,
      ).toBe(2);
    },
  );
});
