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
import { assessSuccessfulRunCounterDevelopment } from "../runner/hand-development/successful-run-counter-development";
import { strategicSupportPrograms } from "../runner/hand-development/strategic-support-development";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const stockId = "onr_v1_046_pattels-virus",
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
    seed: "successful-run-counter-stock",
    matchId: "successful-run-counter-stock",
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

const memoryId = "onr_v1_146_zetatech-mem-chip";
function handCopy(s: GameState, definitionId: string) {
  const id = s.runner.stack.find(
    (id) => s.cardInstances[id]!.definitionId === definitionId,
  )!;
  expect(id).toBeDefined();
  s.runner.stack = s.runner.stack.filter((c) => c !== id);
  s.runner.grip.push(id);
  s.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
}
function idleFixture() {
  const s = fixture();
  s.runner.credits = 10;
  for (const id of [
    breakerId,
    breakerId,
    memoryId,
    "onr_proteus_139_eurocorpse-tm-spin-chip",
  ])
    handCopy(s, id);
  for (const server of s.corp.servers)
    for (const id of server.ice) s.cardInstances[id]!.strengthModifier = 8;
  return s;
}
function assess(s: GameState) {
  const input = buildAiDecisionInput(s, "runner", {
    difficulty: "hard",
    decisionId: `virus:${s.stateVersion}`,
    profileId: "virus",
    ownDeckSnapshot: snapshot,
  });
  const evaluation = evaluateRunnerHandDevelopment({ input }).find(
    (e) => e.definitionId === stockId,
  )!;
  const targets = evaluateRunnerRunTargets({ input });
  const economy = buildRunnerEconomyPosture({ input });
  return {
    input,
    evaluation,
    quote: assessSuccessfulRunCounterDevelopment(
      input,
      evaluation,
      targets,
      economy,
    ),
  };
}
function assertOwner(
  input: ReturnType<typeof assess>["input"],
  definitionId: string,
) {
  const d = chooseAiAction(input);
  const action = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(
    input.playerView.own.gripOrHq.find((c) => c.instanceId === action.source)
      ?.definitionId,
  ).toBe(definitionId);
  const pf = d.decisionDebug!.planFirstDecision!;
  expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
  expect(pf.route?.actionId).toBe(d.actionId);
  expect(pf.executionOrigin?.leafPlanInstanceId).toBe(
    pf.selectedPlan?.instanceId,
  );
  expect(d.fallbackUsed).toBe(false);
  return d.actionId!;
}
describe("conditional counter development and its memory milestone", () => {
  it("classifies the canonical card and actually installs it on an idle last click", () => {
    const s = idleFixture();
    const { input, evaluation, quote } = assess(s);
    expect(evaluation.developmentRole).toBe("breaker_or_rig_piece");
    expect(quote?.admitted).toBe(true);
    expect(quote?.evidenceCodes).toContain(
      "runner_success_counter_strategy_bonus:15",
    );
    const next = apply(s, "runner", assertOwner(input, stockId));
    expect(next.runner.rig.programs).toContain(evaluation.cardInstanceId);
    expect(next.runner.credits).toBe(9);
    expect(next.runner.memoryUsed).toBe(2);
  });
  it("prepares memory for visible support after all breaker coverage is installed", () => {
    let s = idleFixture();
    s.runner.credits = 15;
    s.runner.clicks = 3;
    RealEngineFixtureBuilder.forState(s)
      .withRunnerProgramInstalled("onr_v1_012_clown")
      .withRunnerProgramInstalled("onr_proteus_091_lockjaw")
      .withRunnerProgramInstalled("onr_v1_071_vewy-vewy-quiet");
    s.runner.memoryUsed = 4;
    handCopy(s, "onr_v1_011_cloak");
    s = apply(s, "runner", assertOwner(assess(s).input, memoryId));
    expect(getPlayerView(s, "runner").own.memoryLimit).toBe(6);
    // Preserve the real runtime between steps: no reset may hide commitment bugs.
    s = apply(s, "runner", assertOwner(assess(s).input, stockId));
    expect(s.runner.memoryUsed).toBe(5);
  });
  it.each([
    "reserve",
    "no_breaker",
    "zero_strength",
    "tagged",
    "short_horizon",
    "urgent_remote",
    "existing_copy",
  ])("holds the virus for %s", (condition) => {
    const s = idleFixture();
    if (condition === "reserve") s.runner.credits = 2;
    if (condition === "no_breaker") {
      RealEngineFixtureBuilder.forState(s).withRunnerCardInGrip(breakerId);
      s.runner.memoryUsed = 0;
    }
    if (condition === "zero_strength")
      for (const server of s.corp.servers)
        for (const id of server.ice)
          s.cardInstances[id]!.strengthModifier = -20;
    if (condition === "tagged") s.runner.tags = 1;
    if (condition === "short_horizon") s.corp.rd = s.corp.rd.slice(0, 2);
    if (condition === "urgent_remote")
      RealEngineFixtureBuilder.forState(s).withCorpRemoteRoot(
        "remote_1",
        "onr_v1_220_tycho-extension",
        3,
      );
    if (condition === "existing_copy") {
      RealEngineFixtureBuilder.forState(s).withRunnerProgramInstalled(stockId);
      s.runner.memoryUsed = 2;
      handCopy(s, stockId);
    }
    const { input, evaluation, quote } = assess(s);
    expect(quote?.admitted).toBe(false);
    expect(chooseAiAction(input).actionId).not.toBe(evaluation.legalActionId);
  });
  it("adds a bounded rig-strategy preference without inventing a consumer", () => {
    const { input } = assess(idleFixture());
    const base = strategicSupportPrograms(input, 2).find(
      (s) => s.card.definitionId === stockId,
    )!;
    const aligned = strategicSupportPrograms(input, 2, {
      ...input.ownRunnerStrategicIntent!,
      setupEngine: ["runner.rig_first"],
    }).find((s) => s.card.definitionId === stockId)!;
    expect(aligned.value - base.value).toBe(15);
  });
  it.each([2, 3])(
    "respects the virus reserve boundary at %i credits",
    (credits) => {
      const s = idleFixture();
      s.runner.credits = credits;
      expect(assess(s).quote?.admitted).toBe(credits === 3);
    },
  );
  it.each([5, 6])(
    "reserves memory plus follow-up costs at %i credits",
    (credits) => {
      const s = idleFixture();
      s.runner.credits = credits;
      RealEngineFixtureBuilder.forState(s)
        .withRunnerProgramInstalled("onr_v1_012_clown")
        .withRunnerProgramInstalled("onr_proteus_091_lockjaw")
        .withRunnerProgramInstalled("onr_v1_071_vewy-vewy-quiet");
      s.runner.memoryUsed = 4;
      const { input } = assess(s);
      if (credits === 6) assertOwner(input, memoryId);
      else {
        const d = chooseAiAction(input);
        const memoryActions = input.legalActions.filter((a) =>
          input.playerView.own.gripOrHq.some(
            (c) => c.definitionId === memoryId && a.source === c.instanceId,
          ),
        );
        expect(memoryActions.map((a) => a.actionId)).not.toContain(d.actionId);
      }
    },
  );
  it("prepares a two-program milestone before the last free MU is occupied", () => {
    const s = idleFixture();
    s.runner.credits = 15;
    RealEngineFixtureBuilder.forState(s)
      .withRunnerProgramInstalled("onr_v1_012_clown")
      .withRunnerProgramInstalled("onr_proteus_091_lockjaw");
    s.runner.memoryUsed = 3;
    handCopy(s, "onr_v1_011_cloak");
    // The cheap ready virus may precede memory; the admitted memory plan must
    // already exist while one MU remains, rather than waiting for a failed install.
    const d = chooseAiAction(assess(s).input);
    const plans = d.decisionDebug!.planFirstDecision!.portfolio;
    expect(
      plans.some(
        (p) =>
          p.moduleId === "runner.develop_board_and_hand" &&
          p.dedupeKey?.includes("zetatech-mem-chip") &&
          p.viability === "ready",
      ),
    ).toBe(true);
  });
  it("does not buy memory when existing space already fits the visible milestone", () => {
    const { input } = assess(idleFixture());
    const d = chooseAiAction(input);
    const a = input.legalActions.find((a) => a.actionId === d.actionId)!;
    expect(
      input.playerView.own.gripOrHq.find((c) => c.instanceId === a.source)
        ?.definitionId,
    ).not.toBe(memoryId);
  });
});
