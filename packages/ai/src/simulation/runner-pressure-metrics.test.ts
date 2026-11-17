import {
  applyAction,
  createGameAfterSetup,
  DEMO_DECKS,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { expect, it, vi } from "vitest";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { runnerEncounterCreditBudgetForInput } from "../runtime/runner-encounter-credit-budget";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { simulationActionLocation } from "../runtime/simulation-action-target";
import { createRunnerBreakerCoverageDiagnosticsForSimulationAction } from "./runner-breaker-coverage-diagnostics";
import { createRunnerPressureMetricContext } from "./runner-pressure-metrics";
import { countRunnerCoverageConversions } from "./runner-setup-metric-counts";

it("respects a fort's Trace payment restriction without treating bad publicity as liquid reserve", () => {
  const lockout = "onr_v1_373_twenty-four-hour-surveillance";
  const baseCorp = DEMO_DECKS.demo_corp_001;
  const cloak = "onr_v1_011_cloak";
  const baseRunner = DEMO_DECKS.demo_runner_001;
  const runnerDeck = {
    ...baseRunner,
    cards: [
      ...baseRunner.cards.filter((card) => card.id !== cloak),
      { id: cloak, quantity: 1 },
    ],
  };
  let state = createGameAfterSetup({
    matchId: "runner-pressure-budget",
    seed: "runner-pressure-budget",
    runnerDeck,
    corpDeck: {
      ...baseCorp,
      cards: [
        ...baseCorp.cards.filter((card) => card.id !== lockout),
        { id: lockout, quantity: 1 },
      ],
    },
  });
  state.traceRulesProfile = "classic_blind_corp_ties";
  state = applyCorpAction(state, "mandatory_draw");
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(4)
    .withCorpRemoteRoot("hq", lockout, 0, { rezzed: true });
  state.corp.badPublicity = 2;
  state = applyCorpAction(state, "end_turn");
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(7)
    .withRunnerCardInGrip(cloak);
  const install = getLegalActions(state, "runner").find(
    (action) =>
      action.type === "install_card" &&
      state.cardInstances[action.source]?.definitionId === cloak,
  )!;
  state = apply(state, install);
  expect(state.runner.credits).toBe(0);
  const runnerInput = (position: GameState) =>
    buildAiDecisionInput(position, "runner", {
      ownDeckSnapshot: {
        deckSnapshotId: runnerDeck.id,
        side: "runner",
        cards: runnerDeck.cards.map(({ id, quantity }) => ({
          cardId: id,
          quantity,
        })),
      },
    });
  const input = runnerInput(state);
  const hq = input.playerView.servers.find((server) => server.id === "hq")!;
  expect(hq.statuses).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ kind: "run_payment_restriction" }),
    ]),
  );
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({
      type: "start_run",
      timingPoint: input.playerView.timingPoint,
      payload: expect.objectContaining({ serverId: "hq" }),
    }),
  );
  const quote = vi.fn(assessKnownRezzedIcePath);
  const { assessRunnerPressureReadyForMetrics } =
    createRunnerPressureMetricContext({
      assessKnownRezzedIcePath: quote,
      runnerStrategicBreakerTargetForMetrics: (server) => server.id === "hq",
      knownPositionMemoryForInput: () => [],
      definitionTypeForMetrics: () => undefined,
      remoteRootTrashCostForMetrics: () => undefined,
      canBreakerDefinitionBreakIce: () => false,
      runnerVisibleIceCreatesCoverageNeedForMetrics: () => false,
      runnerMissingBreakerRolesForMetrics: () => [],
      runnerCoverageSearchActionForMetrics: () => false,
      runnerCoverageRecoveryActionForMetrics: () => false,
    });

  const assessment = assessRunnerPressureReadyForMetrics(input);

  expect(quote).toHaveBeenCalledWith(
    hq.ice,
    input.playerView.own.rig,
    expect.objectContaining({ credits: 2, traceEligibleCredits: 0 }),
    hq.root,
    input.playerView.opponent.credits,
    expect.objectContaining({
      traceRulesProfile: "classic_blind_corp_ties",
      excludeStealthTraceCredits: true,
    }),
  );
  expect(assessment.readyTargets).toEqual([]);
  expect(assessment.blockers).toContain("missing_post_run_reserve");

  const encounterBudget = (serverId: string) => {
    const run = input.legalActions.find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === serverId,
    )!;
    return runnerEncounterCreditBudgetForInput(runnerInput(apply(state, run)));
  };
  expect(encounterBudget("hq")).toMatchObject({
    runOnlyCredits: 2,
    stealthNonNoisyIcebreakerCredits: 0,
    stealthCreditsBySourceId: {},
  });
  expect(encounterBudget("rd").stealthNonNoisyIcebreakerCredits).toBe(3);
});

it("counts a native event-started run as pressure and as a coverage follow-up", () => {
  const insideJob = "onr_v1_094_inside-job";
  const baseRunner = DEMO_DECKS.demo_runner_001;
  const runnerDeck = {
    ...baseRunner,
    cards: [
      ...baseRunner.cards.filter(({ id }) => id !== insideJob),
      { id: insideJob, quantity: 1 },
    ],
  };
  let state = createGameAfterSetup({
    seed: "runner-coverage-event-start",
    traceRulesProfile: "modern_open",
    runnerDeck,
  });
  state = applyCorpAction(state, "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(4);
  state = applyCorpAction(state, "end_turn");
  RealEngineFixtureBuilder.forState(state).withRunnerCardInGrip(insideJob);
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
    },
  });
  const action = input.legalActions.find(
    (offer) =>
      offer.type === "play_event" &&
      offer.payload?.serverId === "hq" &&
      state.cardInstances[offer.source]?.definitionId === insideJob,
  );
  if (!action) throw new Error("Missing native Inside Job action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  const location = simulationActionLocation(action, result.event, state, result.state);
  expect(location).toMatchObject({ runnerRunStarted: true, targetServerId: "hq" });
  const diagnose = createRunnerBreakerCoverageDiagnosticsForSimulationAction({
    assessRunnerCoveragePressureForMetrics: () => ({
      blockedServers: new Set(),
      knownIceBlockedServers: new Set(),
      missingBreakerRoles: new Set(),
      matchingInstallActionIds: new Set(),
      searchActionIds: new Set(),
      recoveryActionIds: new Set(),
      heapMatchingBreakerCount: 0,
    }),
    assessRunnerPressureReadyForMetrics: () => ({
      broadReady: true,
      readyTargets: [{ serverId: "hq", targetType: "hq" }],
      falsePositive: false,
      blockers: new Set(),
    }),
    isRunnerEconomyAction: () => false,
    isRunnerRigInstallAction: () => false,
    runnerCoverageSearchActionForMetrics: () => false,
  });
  const flags = diagnose(input, action, location.targetServerId, location.runnerRunStarted === true);
  expect(flags).toMatchObject({
    runnerPressureTakenAfterCoverageReady: true,
    runnerPhaseExitToPressure: true,
  });
  expect(flags.runnerPressureSkippedAfterCoverageReady).toBeUndefined();
  const entry = {
    side: "runner" as const,
    stateVersionBefore: state.stateVersion,
    reasonCode: "fixture",
    explanation: "",
    confidence: 1,
    evidence: [],
    fallbackUsed: false,
    timeoutUsed: false,
    qualityTags: [],
    stateHashAfter: result.event.stateHashAfter,
  };
  expect(
    countRunnerCoverageConversions(
      [
        {
          ...entry,
          actionType: "install_card",
          runnerCoverageImproved: true,
        },
        { ...flags, ...entry, actionType: action.type, ...location },
      ],
      (candidate) => candidate.runnerCoverageImproved === true,
      () => false,
    ),
  ).toBe(1);
});

function applyCorpAction(
  state: GameState,
  type: LegalAction["type"],
): GameState {
  const action = getLegalActions(state, "corp").find(
    (candidate) => candidate.type === type,
  )!;
  return apply(state, action);
}

function apply(state: GameState, action: LegalAction): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
