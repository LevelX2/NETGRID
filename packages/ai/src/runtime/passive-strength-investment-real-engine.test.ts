import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  projectVisibleIceAfterPassiveRunnerInstall,
} from "@netgrid/engine";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildDeckStrategyProfile } from "../deck-doctrine-strategy";
import { AI_HINTS_BY_CARD } from "../ai-hints";
import { evaluateRunnerHandDevelopment } from "../runner/hand-development/hand-development-evaluation";
import { assessPassiveStrengthInvestment } from "../runner/hand-development/passive-strength-investment";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const runner = catalog.decks.find(
  (d) =>
    d.standardDeckId ===
    "standard_runner_krashkurs_clown_kreditmaschine_2026_07_11",
)!;
const corp = catalog.decks.find((d) => d.name === "Dr. Dreffs letzte Visite")!;
const clownId = "onr_v1_012_clown";
const krashId = "onr_v1_039_krash";
const snapshot = {
  deckSnapshotId: runner.standardDeckId,
  side: "runner" as const,
  cards: runner.cards,
};
afterEach(resetResidentPlanPortfolioMemory);

function apply(state: GameState, side: "corp" | "runner", actionId: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `strength:${state.stateVersion}:${actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
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
  let state = createGameAfterSetup({
    seed: "clown-strength-investment",
    matchId: "clown-strength-investment",
    runnerDeck: deck(runner),
    corpDeck: deck(corp),
    agendaPointsToWin: 7,
  });
  state = apply(
    state,
    "corp",
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
  state = apply(
    state,
    "corp",
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!.actionId,
  );
  const f = RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(40)
    .withRunnerClicks(3)
    .withRunnerGripSize(0)
    .withRunnerProgramInstalled(krashId)
    .withRunnerCardInGrip(clownId)
    .withRezzedCorpIceOnServer("rd", "onr_v1_279_wall-of-static")
    .withRezzedCorpIceOnServer("rd", "onr_proteus_018_datacomb");
  for (const id of [
    "onr_v1_146_zetatech-mem-chip",
    "onr_proteus_091_lockjaw",
    "onr_v1_046_pattels-virus",
    "onr_proteus_150_streetware-distributor",
  ])
    f.withRunnerCardInGrip(id);
  state.runner.memoryUsed = 1;
  return state;
}

function assess(state: GameState) {
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    decisionId: `strength:${state.stateVersion}`,
    profileId: "strength-investment",
    ownDeckSnapshot: snapshot,
  });
  const evaluation = evaluateRunnerHandDevelopment({ input }).find(
    (e) => e.definitionId === clownId,
  )!;
  const targets = evaluateRunnerRunTargets({ input });
  const investment = assessPassiveStrengthInvestment(
    input,
    evaluation,
    targets,
    buildRunnerEconomyPosture({ input }),
  );
  return { input, evaluation, targets, investment };
}

describe("canonical passive strength investment", () => {
  it("admits Streetware with its real install and rematerializes its actual bank build", () => {
    let state = fixture();
    state.runner.credits = 5;
    const input = assess(state).input;
    const source = input.playerView.own.gripOrHq.find(
      (c) => c.definitionId === "onr_proteus_150_streetware-distributor",
    )!;
    const decision = chooseAiAction(input);
    expect(decision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.credit_bank",
          phase: "install",
          viability: "ready",
        }),
      ]),
    );
    const install = input.legalActions.find(
      (a) => a.type === "install_card" && a.source === source.instanceId,
    )!;
    state = apply(state, "runner", install.actionId);
    const afterInput = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      decisionId: "bank-after-install",
      profileId: "strength-investment",
      ownDeckSnapshot: snapshot,
    });
    const build = afterInput.legalActions.find(
      (a) =>
        a.source === source.instanceId &&
        a.payload?.cardImplementationAddsHostedCredits === true,
    )!;
    expect(build).toBeDefined();
    const afterDecision = chooseAiAction(afterInput);
    expect(afterDecision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.credit_bank",
          phase: "build",
          viability: "ready",
        }),
      ]),
    );
    state = apply(state, "runner", build.actionId);
    expect(state.cardInstances[source.instanceId]!.counters?.bit).toBe(3);
    expect(state.runner.credits).toBe(4);
  });

  it("prices compatible recurring credits and rejects a saving already absorbed by the pool", () => {
    const state = fixture();
    RealEngineFixtureBuilder.forState(state)
      .withRunnerProgramInstalled("onr_v1_011_cloak")
      .withRunnerProgramInstalled("onr_v1_071_vewy-vewy-quiet");
    state.runner.memoryUsed = 3;
    for (const id of state.runner.rig.programs) {
      const card = state.cardInstances[id]!;
      if (card.definitionId === "onr_v1_011_cloak") card.counters = { bit: 3 };
      if (card.definitionId === "onr_v1_071_vewy-vewy-quiet")
        card.counters = { bit: 2 };
    }
    expect(assess(state).investment?.admitted).toBe(true);
    RealEngineFixtureBuilder.forState(state).withCorpCardInHq(
      "onr_proteus_018_datacomb",
    );
    expect(assess(state).investment?.admitted).toBe(false);
    // Spent pools do not disappear from the next-turn economic comparison.
    for (const id of state.runner.rig.programs)
      state.cardInstances[id]!.counters = { bit: 0 };
    expect(assess(state).investment?.admitted).toBe(false);
  });

  it("does not convert hidden ICE into a known saving", () => {
    const state = fixture();
    for (const id of state.corp.servers.find((s) => s.id === "rd")!.ice) {
      state.cardInstances[id]!.rezzed = false;
      state.cardInstances[id]!.faceup = false;
    }
    expect(assess(state).investment?.admitted).toBe(false);
  });
  it("connects real hints, coverage and the Clown engine without mocked roles", () => {
    const profile = buildDeckStrategyProfile(snapshot);
    expect(
      AI_HINTS_BY_CARD.get(krashId)?.breakerProfile?.emergencyCoverage,
    ).not.toBe(true);
    expect(profile.runnerProfile?.coverageProfile.universal.count).toBe(3);
    expect(profile.primaryStrategies).toContain("runner.rig_first");
    expect(
      profile.runnerEngineDoctrine?.providers.find((p) => p.cardId === clownId)
        ?.supportCapabilities,
    ).toContain("runner.coverage.breaker");
    const dropp = buildDeckStrategyProfile({
      ...snapshot,
      cards: [{ cardId: "onr_v1_019_dropp", quantity: 3 }],
    });
    expect(dropp.runnerProfile?.coverageProfile.universal.count).toBe(0);
    expect(
      AI_HINTS_BY_CARD.get("onr_v1_019_dropp")?.breakerProfile?.sideEffects,
    ).toContain("ends_run_after_use");
  });

  it("quotes the marginal reduction exactly as the real Engine install", () => {
    const state = fixture(),
      { input, evaluation } = assess(state);
    const ice = input.playerView.servers.find((s) => s.id === "rd")!.ice;
    const predicted = ice.map(
      (c) =>
        projectVisibleIceAfterPassiveRunnerInstall(clownId, c)!
          .effectiveRunQuote!.encounterStrength,
    );
    const next = apply(state, "runner", evaluation.legalActionId!);
    expect(
      getPlayerView(next, "runner")
        .servers.find((s) => s.id === "rd")!
        .ice.map((c) => c.effectiveRunQuote!.encounterStrength),
    ).toEqual(predicted);
    expect(state.runner.credits).toBe(40);
    expect(
      projectVisibleIceAfterPassiveRunnerInstall(clownId, {
        ...ice[0]!,
        known: false,
      }),
    ).toBeUndefined();
    expect(
      projectVisibleIceAfterPassiveRunnerInstall(krashId, ice[0]!),
    ).toBeUndefined();
  });

  it("stacks a second installation only once against the existing encounter quote", () => {
    let state = fixture();
    state = apply(state, "runner", assess(state).evaluation.legalActionId!);
    RealEngineFixtureBuilder.forState(state).withRunnerCardInGrip(clownId);
    const { input, evaluation } = assess(state);
    const before = input.playerView.servers.find((s) => s.id === "rd")!.ice;
    const predicted = before.map(
      (c) =>
        projectVisibleIceAfterPassiveRunnerInstall(clownId, c)!
          .effectiveRunQuote!.encounterStrength,
    );
    const next = apply(state, "runner", evaluation.legalActionId!);
    expect(
      getPlayerView(next, "runner")
        .servers.find((s) => s.id === "rd")!
        .ice.map((c) => c.effectiveRunQuote!.encounterStrength),
    ).toEqual(predicted);
    expect(predicted).toEqual(
      before.map((c) =>
        Math.max(0, c.effectiveRunQuote!.encounterStrength! - 1),
      ),
    );
  });

  it("derives other strength support and Corp hand capacity from their real mechanics", () => {
    for (const id of ["onr_proteus_091_lockjaw", "onr_v1_046_pattels-virus"])
      expect(AI_HINTS_BY_CARD.get(id)?.roles).toContain("icebreaker_support");
    for (const id of [
      "onr_v1_322_euromarket-consortium",
      "onr_v1_205_main-office-relocation",
    ])
      expect(
        AI_HINTS_BY_CARD.get(id)?.effects?.find(
          (e) => e.kind === "hand_size_modifier",
        )?.scope,
      ).toBe("corp");
  });

  it("admits and selects an amortizing installation through the development plan", () => {
    const { input, evaluation, investment } = assess(fixture());
    expect(investment?.admitted).toBe(true);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(evaluation.legalActionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.evidence).toContain("plan_first_runtime:true");
    expect(decision.evidence?.some((e) => e.startsWith("plan_step_id:"))).toBe(
      true,
    );
    expect(
      decision.evidence?.some((e) => e.startsWith("plan_scheduler:route:")),
    ).toBe(true);
    expect(
      decision.decisionDebug?.planFirstDecision?.executionOrigin
        ?.leafPlanInstanceId,
    ).toContain("runner.develop_board_and_hand");
  });

  it.each([
    "no_breaker",
    "poor",
    "no_mu",
    "last_click",
    "matchpoint",
    "zero_strength",
  ])("defers %s instead of forcing the named deck card", (condition) => {
    const state = fixture();
    if (condition === "no_breaker") {
      RealEngineFixtureBuilder.forState(state).withRunnerCardInGrip(krashId);
      state.runner.memoryUsed = 0;
    }
    if (condition === "poor") state.runner.credits = 4;
    if (condition === "no_mu") state.runner.memoryUsed = 4;
    if (condition === "last_click") state.runner.clicks = 1;
    if (condition === "matchpoint") state.agendaPointsToWin = 2;
    if (condition === "zero_strength")
      for (const id of state.corp.servers.find((s) => s.id === "rd")!.ice)
        state.cardInstances[id]!.strengthModifier = -20;
    const { investment, input, evaluation } = assess(state);
    expect(investment?.admitted).toBe(false);
    if (evaluation.legalActionId)
      expect(chooseAiAction(input).actionId).not.toBe(evaluation.legalActionId);
  });
});
