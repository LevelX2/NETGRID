import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import { buildSemanticDecisionFrame } from "./semantic-decision-frame";
import { buildAiOpportunityProjections } from "./opportunity-projection";
import { buildAiThreatProjections } from "./threat-projection";

describe("Threat and Opportunity projections", () => {
  it("projects known central agenda payoff as a runner opportunity", () => {
    const frame = frameWithRunTargets([
      runTarget({
        targetServerId: "hq",
        targetKind: "hq",
        accessPayoff: "agenda",
        recommendation: "run_now",
        pathPassability: "reachable",
      }),
    ]);

    const opportunities = buildAiOpportunityProjections(frame);

    expect(opportunities[0]?.opportunity).toBe("known_agenda_payoff");
    expect(opportunities[0]?.priority).toBe("critical");
  });

  it("projects remote score threat as contest window and corp score threat", () => {
    const frame = frameWithRunTargets([
      runTarget({
        targetServerId: "remote-1",
        targetKind: "remote",
        accessPayoff: "score_threat",
        recommendation: "find_breaker_first",
        pathPassability: "blocked_missing_coverage",
        scoreThreat: true,
      }),
    ]);

    expect(
      buildAiOpportunityProjections(frame).some(
        (projection) => projection.opportunity === "remote_contest_window",
      ),
    ).toBe(true);
    expect(
      buildAiThreatProjections(frame).some(
        (projection) => projection.threat === "corp_score_window",
      ),
    ).toBe(true);
  });

  it("projects low grip damage risk as runner flatline risk", () => {
    const frame = frameWithRunTargets([
      runTarget({
        targetServerId: "rd",
        targetKind: "rd",
        accessPayoff: "unknown",
        recommendation: "draw_for_damage_buffer",
        blinkRiskSeverity: "lethal",
      }),
    ]);

    const threats = buildAiThreatProjections(frame);

    expect(threats[0]?.threat).toBe("runner_flatline_risk");
    expect(threats[0]?.severity).toBe("critical");
  });

  it("projects corp score window from corp frame evidence and candidate timing", () => {
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [legalAction("score-1", "score_agenda", "corp")]),
      actionCandidates: buildActionSemanticCandidates({
        legalActions: [legalAction("score-1", "score_agenda", "corp")],
        observerSide: "corp",
        stateVersion: 3,
      }),
      evidence: ["score_window:agenda_ready"],
    });

    const opportunities = buildAiOpportunityProjections(frame);

    expect(opportunities[0]?.opportunity).toBe("score_window");
    expect(opportunities[0]?.side).toBe("corp");
  });

  it("does not project corp score window from action id text alone", () => {
    const action = legalAction(
      "score-looking-credit-action",
      "gain_credit",
      "corp",
    );
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [action]),
      actionCandidates: buildActionSemanticCandidates({
        legalActions: [action],
        observerSide: "corp",
        stateVersion: 3,
      }),
    });

    expect(
      buildAiOpportunityProjections(frame).some(
        (projection) => projection.opportunity === "score_window",
      ),
    ).toBe(false);
  });

  it("projects corp opportunity evidence only from bounded frame markers", () => {
    const action = legalAction("gain-1", "gain_credit", "corp");
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [action]),
      actionCandidates: buildActionSemanticCandidates({
        legalActions: [action],
        observerSide: "corp",
        stateVersion: 3,
      }),
      evidence: [
        "noise_score_windowish",
        "score_window:agenda_ready",
        "rez_value_window:protect_scoring_remote",
      ],
    });

    const opportunities = buildAiOpportunityProjections(frame).map(
      (projection) => projection.opportunity,
    );

    expect(opportunities).toContain("score_window");
    expect(opportunities).toContain("rez_value_window");
  });

  it("does not project corp opportunity evidence from substring noise", () => {
    const action = legalAction("gain-1", "gain_credit", "corp");
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [action]),
      actionCandidates: buildActionSemanticCandidates({
        legalActions: [action],
        observerSide: "corp",
        stateVersion: 3,
      }),
      evidence: [
        "corp_score_windowish_noise",
        "not_rez_value_window_noise",
      ],
    });

    const opportunities = buildAiOpportunityProjections(frame).map(
      (projection) => projection.opportunity,
    );

    expect(opportunities).not.toContain("score_window");
    expect(opportunities).not.toContain("rez_value_window");
  });

  it("projects corp low rez reserve from side-safe frame evidence", () => {
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [legalAction("gain-1", "gain_credit", "corp")]),
      evidence: ["low_rez_reserve:credits_below_outer_ice_cost"],
    });

    const threats = buildAiThreatProjections(frame);

    expect(threats).toContainEqual(
      expect.objectContaining({
        threat: "corp_low_rez_reserve",
        affectedSide: "corp",
      }),
    );
  });

  it("does not project corp low rez reserve from substring noise", () => {
    const frame = buildSemanticDecisionFrame({
      input: inputFor("corp", [legalAction("gain-1", "gain_credit", "corp")]),
      evidence: ["corp_low_rez_reserveish_noise"],
    });

    expect(
      buildAiThreatProjections(frame).some(
        (projection) => projection.threat === "corp_low_rez_reserve",
      ),
    ).toBe(false);
  });

  it("projects runner economy starvation from economy posture", () => {
    const frame = buildSemanticDecisionFrame({
      input: inputFor("runner", [legalAction("gain-1", "gain_credit", "runner")]),
      runner: {
        economyPosture: economyPosture({ fundingNeed: true }),
      },
    });

    const threats = buildAiThreatProjections(frame);

    expect(threats).toContainEqual(
      expect.objectContaining({ threat: "runner_economy_starvation" }),
    );
  });
});

function frameWithRunTargets(runTargets: RunnerRunTargetEvaluation[]) {
  const input = inputFor("runner", [
    legalAction("gain-1", "gain_credit", "runner"),
    legalAction("run-1", "start_run", "runner"),
  ]);
  return buildSemanticDecisionFrame({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    }),
    runner: {
      runTargets,
      economyPosture: economyPosture({ fundingNeed: false }),
    },
  });
}

function runTarget(params: {
  targetServerId: string;
  targetKind: RunnerRunTargetEvaluation["targetKind"];
  accessPayoff: RunnerRunTargetEvaluation["accessPayoff"];
  recommendation: RunnerRunTargetEvaluation["recommendation"];
  pathPassability?: RunnerRunTargetEvaluation["pathPassability"];
  scoreThreat?: boolean;
  blinkRiskSeverity?: NonNullable<
    RunnerRunTargetEvaluation["blinkRiskAssessment"]
  >["riskSeverity"];
}): RunnerRunTargetEvaluation {
  const pathPassability = params.pathPassability ?? "reachable";
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId: params.targetServerId,
    targetKind: params.targetKind,
    accessServerId: params.targetServerId,
    accessTargetKind: params.targetKind,
    actionId: "run-1",
    accessPayoff: params.accessPayoff,
    knownAccessState: params.accessPayoff === "agenda" ? "known_payoff" : "unknown",
    multiaccessAvailable: false,
    pathPassability,
    pathCost: 1,
    creditsAfterRun: 4,
    stealOrTrashAffordable: true,
    installedRunPayoff: payoff(),
    runActionPayoff: payoff(),
    runActionProjection: {
      actionId: "run-1",
      actionType: "start_run",
      sourceKind: "basic_action",
      targetServerId: params.targetServerId,
      targetKind: params.targetKind,
      accessServerId: params.targetServerId,
      structure: "direct_start_run",
      accessPayoffSignals: [],
      constraintSignals: [],
      riskSignals: [],
      noNoisyBreakers: false,
      bypassFirstIce: false,
      projectionStatus: "concrete_target",
      evidence: ["test_run_projection"],
    },
    riskyUniversalCoverage: false,
    ...(params.blinkRiskSeverity
      ? {
          blinkRiskAssessment: {
            currentHandCount: 1,
            handAfterActionCost: 1,
            blinkUsesLikely: 1,
            visibleSubroutinesLikely: 1,
            maxSingleFailureDamage: 2,
            worstCaseDamageEstimate: 2,
            lethalOnAnyFailure: params.blinkRiskSeverity === "lethal",
            lethalOnHighFailure: params.blinkRiskSeverity === "lethal",
            survivesOneFailedBlinkUse: params.blinkRiskSeverity !== "lethal",
            riskSeverity: params.blinkRiskSeverity,
            payoffOverride: "none",
            stableCoverageAvailable: false,
            pathDependsOnBlink: true,
            breakWouldBeExcludedInEncounter: false,
            blockedByHandBuffer: params.blinkRiskSeverity === "lethal",
            noProgressRunExpected: false,
            expectedEtrUnbroken: false,
            recentFailure: false,
            recentDamageAmount: 0,
            sameServerRepeatedRiskPenalty: 0,
            evidence: ["blink_risk:test"],
          },
        }
      : {}),
    scoreThreat: params.scoreThreat ?? false,
    recommendation: params.recommendation,
    score: params.scoreThreat ? 120 : 80,
    evidence: ["test_run_target"],
  };
}

function payoff() {
  return {
    immediateAccessValue: 10,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
}

function economyPosture(params: { fundingNeed: boolean }): RunnerEconomyPosture {
  return {
    schemaVersion: "runner-economy-posture-v1",
    minimumCreditFloor: 2,
    desiredCreditReserve: 5,
    creditReservePolicy: {
      schemaVersion: 1,
      phase: "midgame",
      currentCredits: params.fundingNeed ? 1 : 5,
      minimumCreditFloor: 2,
      breakerUseReserve: 2,
      contestReserve: 4,
      developmentReserve: 4,
      emergencyReserve: 2,
      desiredCreditReserve: 5,
      remoteScoreThreat: "none",
      canContestIfFunded: true,
      belowReserveNow: params.fundingNeed,
      spendingWouldDropBelowReserve: false,
      reserveDrivers: [],
      reserveOverrides: [],
      evidence: ["test_reserve"],
    },
    creditBasePlan: {
      schemaVersion: "runner-credit-base-plan-v1",
      currentCredits: params.fundingNeed ? 1 : 5,
      minimumCreditFloor: 2,
      desiredCreditReserve: 5,
      runCostReserve: 2,
      creditReservePolicy: {
        schemaVersion: 1,
        phase: "midgame",
        currentCredits: params.fundingNeed ? 1 : 5,
        minimumCreditFloor: 2,
        breakerUseReserve: 2,
        contestReserve: 4,
        developmentReserve: 4,
        emergencyReserve: 2,
        desiredCreditReserve: 5,
        remoteScoreThreat: "none",
        canContestIfFunded: true,
        belowReserveNow: params.fundingNeed,
        spendingWouldDropBelowReserve: false,
        reserveDrivers: [],
        reserveOverrides: [],
        evidence: ["test_reserve"],
      },
      fundingNeed: params.fundingNeed,
      usefulHandCardsBlockedByCredits: params.fundingNeed ? 1 : 0,
      usefulHandCardsAffordableNow: 0,
      recommendation: params.fundingNeed ? "build_credit_base" : "allow_pressure",
      economyPriority: params.fundingNeed ? "high" : "medium",
      evidence: ["test_credit_base"],
    },
    riskAdjustedRunReserve: false,
    buildEconomyBeforePressure: params.fundingNeed,
    bankToolsRelevant: false,
    fundingNeed: params.fundingNeed,
    recommendation: params.fundingNeed ? "build_economy" : "stable",
    evidence: ["test_economy_posture"],
  };
}

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 3,
      timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
      activeSide: side,
      phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
      own: {
        identity: visibleCard(`${side}-identity`),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard(`${side}-opponent-identity`),
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
      servers: [],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 3,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 3,
  };
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}
