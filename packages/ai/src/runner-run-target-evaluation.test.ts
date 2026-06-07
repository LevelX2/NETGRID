import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import type { BeliefState, RunnerOpponentModel } from "./belief-state";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
} from "./runner-run-target-evaluation";
import {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";

describe("Runner RunTargetEvaluation + EconomyPosture", () => {
  it("recommends an unknown reachable R&D run", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
  });

  it("suppresses R&D when the top card is stale known low value and no multiaccess is present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_281_accounts-receivable",
      }),
    });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: false,
      recommendation: "do_not_run_now",
    });
  });

  it("suppresses a known remote root with no current access payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              definitionId: "onr_v1_281_accounts-receivable",
              type: "operation",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
  });

  it("turns a remote score threat behind visible unbreakable ICE into find-breaker setup", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          ice: [
            visibleCard("remote-ice-1", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
  });

  it("prefers economy when credits are below the run floor and no high payoff exists", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture).toMatchObject({
      minimumCreditFloor: 2,
      fundingNeed: true,
      recommendation: "build_economy",
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("builds a creditbase funding need for useful hand cards blocked by credits", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        developmentRole: "access_payoff",
        availability: "missing_credits",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 4,
          missingCredits: 4,
          reason: "cannot_pay",
        },
      }),
    ];

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations,
    });
    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations,
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 0,
      desiredCreditReserve: 4,
      fundingNeed: true,
      usefulHandCardsBlockedByCredits: 1,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "useful_now",
      installOrPlayCost: 4,
      missingCredits: 4,
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("allows setup spending at five credits when a useful hand card is legal", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "memory_support",
          availability: "legal_now",
          currentNeed: "setup",
          priority: 620,
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 5,
      fundingNeed: false,
      usefulHandCardsAffordableNow: 1,
      recommendation: "allow_setup_spend",
      economyPriority: "low",
    });
    expect(posture.recommendation).toBe("stable");
  });

  it("keeps creditbase conservative when hand development only finds unknown or low-value cards", () => {
    const input = aiInput({
      credits: 4,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "unknown",
          availability: "missing_credits",
          currentNeed: "none",
          strategicFit: "weak",
          priority: 800,
          fundingNeed: {
            installOrPlayCost: 6,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      fundingNeed: false,
      usefulHandCardsBlockedByCredits: 0,
      recommendation: "preserve_reserve",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toBeUndefined();
  });

  it("lets score-threat runs oversteer low-credit creditbase planning", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "access_payoff",
          availability: "missing_credits",
          currentNeed: "useful_now",
          priority: 650,
          fundingNeed: {
            installOrPlayCost: 4,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "run_now",
    });
  });
});

function aiInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  eventTail?: PublicGameEvent[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers,
    publicEvents: params.eventTail ?? [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.eventTail ?? [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-target-test",
    decisionId: "runner-run-target-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  overrides: Partial<PlayerView["servers"][number]> = {},
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root: [],
    ...overrides,
  };
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function visibleIdentity(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}

function handDevelopmentEvaluation(
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: "runner-hand-card",
    availability: "missing_credits",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 600,
    deferReason: "missing_credits",
    evidence: ["source:own_runner_hand"],
    ...overrides,
  };
}

function beliefWithRndTop(params: {
  freshness: RunnerOpponentModel["rndTopFreshness"]["freshness"];
  knownTopDefinitionId?: string;
}): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-access-rd",
    knownToRunner: true,
    freshness: params.freshness,
    ...(params.knownTopDefinitionId
      ? { knownTopDefinitionId: params.knownTopDefinitionId }
      : {}),
    invalidationReasons: [],
  };
  return {
    side: "runner",
    version: "belief-test",
    entries: [],
    assumptions: [],
    uncertainty: [],
    invalidationLog: [],
    eventClassifications: [],
    runnerOpponentModel: {
      corpPlanEstimate: {
        scoring: 0,
        economy: 0,
        protection: 0,
      },
      remoteCardBelief: [],
      unrezzedIceRiskModel: [],
      hqAgendaDensityEstimate: 0,
      rndValueEstimate: 0,
      corpCreditReserveInterpretation: "medium",
      rndTopFreshness,
      knownPositionMemory: [],
      hqHandMemory: {
        handCount: 5,
        knownDefinitions: [],
        knownCount: 0,
        allCardsKnown: false,
        sourceEventIds: [],
        invalidationReasons: [],
        ledger: {
          safeDefinitions: [],
          unknownRestCount: 5,
          candidateGroups: [],
          sourceEventIds: [],
          invalidationReasons: [],
        },
      },
      hiddenRemoteCandidateMemory: [],
    },
    rndTopFreshness,
    knownPositionMemory: [],
  };
}
