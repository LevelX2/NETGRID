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
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerPressureMetricContext } from "./runner-pressure-metrics";

it("respects a fort's Trace payment restriction without treating bad publicity as liquid reserve", () => {
  const lockout = "onr_v1_373_twenty-four-hour-surveillance";
  const baseCorp = DEMO_DECKS.demo_corp_001;
  const runnerDeck = DEMO_DECKS.demo_runner_001;
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
  state.runner.credits = 0;
  const input = buildAiDecisionInput(state, "runner", {
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
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
});

function applyCorpAction(
  state: GameState,
  type: LegalAction["type"],
): GameState {
  const action = getLegalActions(state, "corp").find(
    (candidate) => candidate.type === type,
  )!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
