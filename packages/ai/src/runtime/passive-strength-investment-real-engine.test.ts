import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  projectVisibleIceAfterPassiveRunnerInstall,
  replayEvents,
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
import capturedInvestment from "../../../../data/scenarios/ai-decision-checkpoints/cp-clown-strength-pool-investment-g9-d324.json";
import capturedContinuation from "../../../../data/scenarios/ai-decision-checkpoints/cp-clown-p6-continuation-g6-d239-241.json";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

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
  it("releases residual liquidity for Clown one decision earlier through strategic development", () => {
    const { checkpoints } = structuredClone(
      capturedContinuation,
    ) as unknown as {
      checkpoints: Array<{
        input: AiDecisionInputWithDeckCapabilities;
        runtime?: AiRuntimeCheckpointV1;
      }>;
    };
    const first = checkpoints[0]!;
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot!.deckSnapshotId,
      first.runtime!,
    );
    // Restore once, then preserve actual in-process commitments. Restoring the
    // final checkpoint alone simulates a restart and falsely passes this case.
    expect(chooseAiAction(first.input).actionId).toBe("runner.draw_card");
    // The new horizon admits the investment before the old extra credit click.
    // Stop at that divergence instead of feeding an obsolete successor state.
    const input = checkpoints[1]!.input;
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("install_card");
    expect(action.source).toBe("runner_onr_v1_012_clown_3");
    expect(decision.fallbackUsed).toBe(false);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
    expect(pf.route?.actionId).toBe(action.actionId);
    expect(pf.executionOrigin?.leafPlanInstanceId).toBe(
      pf.selectedPlan?.instanceId,
    );
  });
  it("selects the real G9 D324 investment that funds the cheaper HQ path", () => {
    const capture = structuredClone(capturedInvestment) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const { input, runtime } = capture;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("install_card");
    expect(action.source).toBe("runner_onr_v1_012_clown_3");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.develop_board_and_hand");
    expect(decision.decisionDebug?.planFirstDecision?.route?.actionId).toBe(
      action.actionId,
    );
  });

  it.each([15, 16])(
    "checks the post-install liquid reserve at %i credits with a real renewing pool",
    (credits) => {
      const state = fixture();
      RealEngineFixtureBuilder.forState(state)
        .withRunnerCredits(credits)
        .withRunnerProgramInstalled("onr_v1_071_vewy-vewy-quiet");
      const source = Object.values(state.cardInstances).find(
        (c) =>
          c.definitionId === "onr_v1_071_vewy-vewy-quiet" &&
          c.zone.zone === "rig",
      )!;
      source.counters = { bit: 2 };
      state.runner.memoryUsed = 2;
      const { input, evaluation, investment } = assess(state);
      expect(investment?.admitted).toBe(credits === 16);
      if (credits === 16) {
        const decision = chooseAiAction(input);
        expect(decision.actionId).toBe(evaluation.legalActionId);
        const next = apply(state, "runner", decision.actionId!);
        expect(next.runner.credits).toBe(12);
        expect(next.cardInstances[source.instanceId]!.counters?.bit).toBe(2);
      }
    },
  );

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
    const exhausted = assess(state);
    expect(exhausted.investment?.admitted).toBe(false);
    expect(
      exhausted.input.playerView.own.rig!.find(
        (c) => c.definitionId === "onr_v1_011_cloak",
      )!.counterDisplays,
    ).toContainEqual(
      expect.objectContaining({
        amount: 0,
        creditPool: expect.objectContaining({ capacity: 3 }),
      }),
    );
  });

  it("values an unrevealed board as a conditional option, never a known saving", () => {
    const state = fixture();
    for (const id of state.corp.servers.find((s) => s.id === "rd")!.ice) {
      state.cardInstances[id]!.rezzed = false;
      state.cardInstances[id]!.faceup = false;
    }
    const { investment } = assess(state);
    expect(investment).toMatchObject({ admitted: true, priorityClass: "P5" });
    expect(investment!.evidenceCodes).toContain(
      "runner_passive_strength_unrevealed_board_option_value",
    );
    expect(
      investment!.evidenceCodes.some(
        (e) => e.includes("saving_per_run:") || e.includes("current_saving:"),
      ),
    ).toBe(false);
    const changed = structuredClone(state);
    changed.runner.stack.reverse();
    changed.corp.rd.reverse();
    for (const id of changed.corp.servers.find((s) => s.id === "rd")!.ice)
      changed.cardInstances[id]!.definitionId = "onr_v1_279_wall-of-static";
    expect(assess(changed).investment).toEqual(investment);
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
    // Move another copy; the generic fixture helper would return the first
    // installed Clown to the grip and falsely test a first installation again.
    const secondId = state.runner.stack.find(
      (id) => state.cardInstances[id]!.definitionId === clownId,
    )!;
    state.runner.stack = state.runner.stack.filter((id) => id !== secondId);
    state.runner.grip.push(secondId);
    state.cardInstances[secondId]!.zone = { side: "runner", zone: "grip" };
    const { input, evaluation } = assess(state);
    const before = input.playerView.servers.find((s) => s.id === "rd")!.ice;
    const predicted = before.map(
      (c) =>
        projectVisibleIceAfterPassiveRunnerInstall(clownId, c)!
          .effectiveRunQuote!.encounterStrength,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(evaluation.legalActionId);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.develop_board_and_hand");
    const next = apply(state, "runner", decision.actionId!);
    expect(
      next.runner.rig.programs.filter(
        (id) => next.cardInstances[id]!.definitionId === clownId,
      ),
    ).toHaveLength(2);
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

  it.each(["poor", "no_mu", "matchpoint", "zero_strength"])(
    "defers %s instead of forcing the named deck card",
    (condition) => {
      const state = fixture();
      if (condition === "poor") state.runner.credits = 4;
      if (condition === "no_mu") state.runner.memoryUsed = 4;
      if (condition === "matchpoint") state.agendaPointsToWin = 2;
      if (condition === "zero_strength")
        for (const id of state.corp.servers.find((s) => s.id === "rd")!.ice)
          state.cardInstances[id]!.strengthModifier = -20;
      const { investment, input, evaluation } = assess(state);
      expect(investment?.admitted).toBe(false);
      if (evaluation.legalActionId)
        expect(chooseAiAction(input).actionId).not.toBe(
          evaluation.legalActionId,
        );
    },
  );

  it("admits preparatory strength support while reserving the hand breaker's credits and MU", () => {
    const state = fixture();
    RealEngineFixtureBuilder.forState(state).withRunnerCardInGrip(krashId);
    state.runner.memoryUsed = 0;
    const { input, investment } = assess(state);
    expect(investment).toMatchObject({ admitted: true, priorityClass: "P5" });
    expect(investment!.evidenceCodes).toContain(
      "runner_passive_strength_consumer_location:hand",
    );
    const decision = chooseAiAction(input);
    expect(decision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.develop_board_and_hand",
          viability: "ready",
        }),
      ]),
    );
    state.runner.memoryUsed = input.playerView.own.memoryLimit! - 1;
    expect(assess(state).investment?.admitted).toBe(false);
    state.runner.memoryUsed = 0;
    state.runner.credits = 6;
    expect(assess(state).investment?.admitted).toBe(false);
  });

  it("uses the last click for future savings and applies the exact owned installation", () => {
    const state = fixture();
    state.runner.clicks = 1;
    const { input, evaluation, investment } = assess(state);
    expect(investment).toMatchObject({ admitted: true, priorityClass: "P4" });
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(evaluation.legalActionId);
    const pf = decision.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan?.moduleId).toBe("runner.develop_board_and_hand");
    expect(pf.route?.actionId).toBe(decision.actionId);
    expect(pf.executionOrigin?.leafPlanInstanceId).toContain(
      "runner.develop_board_and_hand",
    );
    const next = apply(state, "runner", decision.actionId!);
    expect(next.runner.rig.programs).toContain(evaluation.cardInstanceId);
    expect(next.runner.credits).toBe(36);
    expect(next.runner.clicks).toBe(0);
  });

  it("uses only remaining own-deck composition for a future breaker and rejects an exhausted consumer", () => {
    const state = fixture();
    const f = RealEngineFixtureBuilder.forState(state);
    f.withRunnerCardInGrip(krashId)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(clownId);
    state.runner.memoryUsed = 0;
    const breakers = state.runner.stack.filter(
      (id) => state.cardInstances[id]!.definitionId === krashId,
    );
    const others = state.runner.stack.filter((id) => !breakers.includes(id));
    const kept = new Set([...breakers, ...others.slice(0, 3)]);
    for (const id of state.runner.stack.filter((id) => !kept.has(id))) {
      state.runner.heap.push(id);
      state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
    }
    state.runner.stack = state.runner.stack.filter((id) => kept.has(id));
    const before = assess(state).investment;
    expect(before).toMatchObject({ admitted: true, priorityClass: "P5" });
    expect(before!.evidenceCodes).toContain(
      "runner_passive_strength_consumer_location:deck",
    );
    state.runner.stack.reverse();
    expect(assess(state).investment).toEqual(before);
    for (const id of breakers) {
      state.runner.stack = state.runner.stack.filter((entry) => entry !== id);
      state.runner.heap.push(id);
      state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
    }
    expect(assess(state).investment?.admitted).toBe(false);
  });

  it.each([false, true])(
    "builds two Clowns in one runtime and checks the third against spare memory (%s)",
    (extraMemory) => {
      let state = fixture();
      if (extraMemory) {
        state.runner.clicks = 4;
        const memoryCard = getPlayerView(state, "runner").own.gripOrHq.find(
          (c) => c.definitionId === "onr_v1_146_zetatech-mem-chip",
        )!;
        const install = getLegalActions(state, "runner").find(
          (a) =>
            a.type === "install_card" && a.source === memoryCard.instanceId,
        )!;
        state = apply(state, "runner", install.actionId);
      }
      const copies = state.runner.stack.filter(
        (id) => state.cardInstances[id]!.definitionId === clownId,
      );
      for (const id of copies) {
        state.runner.stack = state.runner.stack.filter((entry) => entry !== id);
        state.runner.grip.push(id);
        state.cardInstances[id]!.zone = { side: "runner", zone: "grip" };
      }
      const initial = structuredClone(state);
      const eventStart = state.eventLog.length;
      for (const installedCount of [1, 2]) {
        const { input } = assess(state);
        const decision = chooseAiAction(input);
        const action = input.legalActions.find(
          (a) => a.actionId === decision.actionId,
        )!;
        expect(action.type).toBe("install_card");
        expect(
          input.playerView.own.gripOrHq.find(
            (c) => c.instanceId === action.source,
          )?.definitionId,
        ).toBe(clownId);
        expect(
          decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
        ).toBe("runner.develop_board_and_hand");
        state = apply(state, "runner", action.actionId);
        expect(
          state.runner.rig.programs.filter(
            (id) => state.cardInstances[id]!.definitionId === clownId,
          ),
        ).toHaveLength(installedCount);
      }
      const third = assess(state);
      expect(third.investment?.admitted).toBe(true);
      const decision = chooseAiAction(third.input);
      if (extraMemory) {
        expect(decision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              moduleId: "runner.develop_board_and_hand",
              target: { kind: "card", id: clownId },
              viability: "ready",
            }),
          ]),
        );
      } else {
        expect(third.evaluation.deferReason).toBe("missing_mu");
        expect(decision.actionId).not.toBe(third.evaluation.legalActionId);
      }
      expect(decision.fallbackUsed).toBe(false);
      const replay = replayEvents(initial, state.eventLog.slice(eventStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it.each([
    ["onr_v1_039_krash", "runner.rig_and_coverage"],
    [
      "onr_proteus_139_eurocorpse-tm-spin-chip",
      "runner.develop_board_and_hand",
    ],
    ["onr_v1_011_cloak", "runner.recurring_economy"],
    ["onr_v1_071_vewy-vewy-quiet", "runner.recurring_economy"],
    ["onr_proteus_134_cortical-cybermodem", "runner.develop_board_and_hand"],
    ["onr_proteus_150_streetware-distributor", "runner.credit_bank"],
  ])("binds canonical core card %s to its existing owner", (cardId, owner) => {
    const state = fixture();
    const f = RealEngineFixtureBuilder.forState(state)
      .withRunnerGripSize(0)
      .withRunnerCardInGrip(cardId!);
    if (cardId!.includes("spin-chip") || cardId === krashId) {
      f.withRunnerCardInGrip(krashId);
      state.runner.memoryUsed = 0;
    }
    if (cardId === "onr_proteus_150_streetware-distributor")
      state.runner.credits = 5;
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      profileId: "core-card-audit",
      ownDeckSnapshot: snapshot,
    });
    const decision = chooseAiAction(input);
    const pf = decision.decisionDebug!.planFirstDecision!;
    const ownPlans = pf.portfolio.filter((p) => p.moduleId === owner);
    if (cardId === krashId) {
      expect(pf.selectedPlan?.moduleId).toBe(owner);
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      expect(action.type).toBe("install_card");
      expect(
        input.playerView.own.gripOrHq.find(
          (c) => c.instanceId === action.source,
        )?.definitionId,
      ).toBe(krashId);
      expect(
        apply(state, "runner", action.actionId).runner.rig.programs,
      ).toContain(action.source);
    } else {
      const targetId =
        owner === "runner.credit_bank"
          ? input.playerView.own.gripOrHq.find(
              (c) => c.definitionId === cardId,
            )!.instanceId
          : cardId;
      expect(ownPlans).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            target: expect.objectContaining({ id: targetId }),
          }),
        ]),
      );
      if (
        owner === "runner.develop_board_and_hand" ||
        owner === "runner.credit_bank"
      ) {
        expect(
          ownPlans.some(
            (p) => p.target?.id === targetId && p.viability === "ready",
          ),
        ).toBe(true);
      }
    }
  });
});
