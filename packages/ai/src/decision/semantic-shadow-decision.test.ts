import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { buildSemanticDecisionFrame } from "./semantic-decision-frame";
import { buildSemanticShadowDecision } from "./semantic-shadow-decision";

describe("SemanticShadowDecision", () => {
  it("ranks only LegalAction ids from the frame", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("draw-1", "draw_card", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.build_economy_base",
          family: "economy",
          priority: 940,
          urgency: "high",
          source: "economy_posture",
          evidence: ["funding_need:true"],
        },
      ],
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions.map((action) => action.actionId).sort()).toEqual([
      "draw-1",
      "gain-1",
    ]);
    expect(
      trace.rankedActions.every((action) =>
        frame.legalActionIds.includes(action.actionId),
      ),
    ).toBe(true);
    expect(trace.selectedActionId).toBeUndefined();
    expect(trace.noRuntimeEffect).toBe(true);
  });

  it("explains blocked actions separately", () => {
    const input = inputFor("runner", [
      legalAction("choice-1", "resolve_choice", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.resolve_target",
          family: "target_resolution",
          priority: 80,
          urgency: "high",
          evidence: ["target_profile_without_legal_options"],
        },
      ],
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions).toEqual([]);
    expect(trace.rejectedActions).toContainEqual(
      expect.objectContaining({
        actionId: "choice-1",
        blockers: expect.arrayContaining([
          "target_context_missing_for_target_profile",
        ]),
      }),
    );
  });

  it("uses frame economy context to reject unaffordable setup actions", () => {
    const input = inputFor("runner", [
      legalAction("install-expensive", "install_card", "runner", 6),
      legalAction("gain-1", "gain_credit", "runner"),
    ]);
    input.playerView.own.credits = 2;
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.find_or_install_primary_breaker",
          family: "coverage",
          priority: 940,
          urgency: "high",
          source: "boardstate",
          evidence: ["missing_coverage:true"],
        },
      ],
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rejectedActions).toContainEqual(
      expect.objectContaining({
        actionId: "install-expensive",
        blockers: expect.arrayContaining(["cannot_pay"]),
      }),
    );
  });

  it("keeps remote score threats above deck R&D pressure", () => {
    const input = inputFor("runner", [
      legalAction("run-rd", "start_run", "runner", 0, {
        payload: { serverId: "rd" },
      }),
      legalAction("run-remote", "start_run", "runner", 0, {
        payload: { serverId: "remote_1" },
      }),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      runner: {
        runTargets: [
          runTarget({
            actionId: "run-rd",
            targetServerId: "rd",
            targetKind: "rd",
            recommendation: "run_now",
            accessPayoff: "fresh",
          }),
          runTarget({
            actionId: "run-remote",
            targetServerId: "remote_1",
            targetKind: "remote",
            recommendation: "run_now",
            accessPayoff: "score_threat",
            scoreThreat: true,
          }),
        ],
      },
      doctrineDiagnostic: doctrine("runner", "runner.rnd_pressure"),
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions[0]).toMatchObject({
      actionId: "run-remote",
      primaryGoalId: "runner.neutral.remote_contest_if_score_threat",
    });
    expect(trace.rankedActions[0]?.score).toBeGreaterThan(
      trace.rankedActions.find((action) => action.actionId === "run-rd")?.score ?? 0,
    );
  });

  it("keeps flatline risk above access payoff from doctrine pressure", () => {
    const input = inputFor("runner", [
      legalAction("draw-1", "draw_card", "runner"),
      legalAction("run-hq", "start_run", "runner", 0, {
        payload: { serverId: "hq" },
      }),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      runner: {
        runTargets: [
          runTarget({
            actionId: "run-hq",
            targetServerId: "hq",
            targetKind: "hq",
            recommendation: "draw_for_damage_buffer",
            accessPayoff: "agenda",
            blinkRiskSeverity: "high",
          }),
        ],
      },
      doctrineDiagnostic: doctrine("runner", "runner.hq_pressure"),
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions[0]).toMatchObject({
      actionId: "draw-1",
      primaryGoalId: "runner.neutral.survival_risk",
    });
    expect(trace.rankedActions[0]?.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ component: "threat_response" }),
      ]),
    );
  });

  it("keeps low credits and cannot-pay gates above score ambition", () => {
    const input = inputFor("corp", [
      legalAction("score-expensive", "score_agenda", "corp", 4),
      legalAction("gain-1", "gain_credit", "corp"),
    ]);
    input.playerView.own.credits = 1;
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "corp",
        stateVersion: input.playerView.stateVersion,
      }),
      doctrineDiagnostic: doctrine("corp", "corp.fast_advance"),
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions[0]?.actionId).toBe("gain-1");
    expect(trace.rejectedActions).toContainEqual(
      expect.objectContaining({
        actionId: "score-expensive",
        blockers: expect.arrayContaining(["cannot_pay"]),
      }),
    );
  });

  it("keeps legal corp score windows above generic economy", () => {
    const input = inputFor("corp", [
      legalAction("score-1", "score_agenda", "corp"),
      legalAction("gain-1", "gain_credit", "corp"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "corp",
        stateVersion: input.playerView.stateVersion,
      }),
      doctrineDiagnostic: doctrine("corp", "corp.asset_economy"),
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.rankedActions[0]).toMatchObject({
      actionId: "score-1",
      primaryGoalId: "corp.tactical.score_closeout",
    });
    expect(trace.rankedActions[0]?.score).toBeGreaterThan(
      trace.rankedActions.find((action) => action.actionId === "gain-1")?.score ?? 0,
    );
  });

  it("is deterministic for equivalent frames", () => {
    const frame = frameForEconomyChoice();

    const first = buildSemanticShadowDecision(frame);
    const second = buildSemanticShadowDecision(frame);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("does not serialize forbidden private payload markers", () => {
    const traceJson = JSON.stringify(buildSemanticShadowDecision(frameForEconomyChoice()));

    expect(traceJson).not.toContain("privatePayload");
    expect(traceJson).not.toContain("cardInstances");
    expect(traceJson).not.toContain("fullGameState");
  });

  it("summarizes target choice shadow without creating selections", () => {
    const input = inputFor("runner", [
      legalAction("run-hq", "start_run", "runner", 0, {
        targetRequirements: [
          {
            id: "server",
            kind: "server",
            visibility: "known_to_actor",
          },
        ],
      }),
      legalAction("gain-1", "gain_credit", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
        selectedTargetsByActionId: {
          "run-hq": { server: "hq" },
        },
      }),
      tacticalGoals: [
        {
          goalId: "runner.neutral.safe_run_access",
          family: "pressure",
          priority: 900,
          urgency: "high",
          source: "neutral",
          evidence: ["test_goal"],
        },
      ],
    });

    const trace = buildSemanticShadowDecision(frame);

    expect(trace.targetChoiceShadow).toMatchObject({
      scope: "target_choice_shadow_trace_summary",
      reportOnly: true,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      actionCount: 1,
      rankedOptionCount: 1,
      topActionId: "run-hq",
      topOptionId: "hq",
      selectionOutput: {
        selectedChoicesCreated: false,
        selectedTargetsCreated: false,
      },
      evidence: expect.arrayContaining([
        "target_choice_shadow:trace_summary",
        "selected_choices_created:false",
        "selected_targets_created:false",
      ]),
    });
    expect(JSON.stringify(trace)).not.toMatch(/privatePayload|cardInstances|fullGameState/i);
  });

  it("optionally includes diagnostic doctrine goals in the shadow trace", () => {
    const input = inputFor("runner", [
      legalAction("run-hq", "start_run", "runner"),
      legalAction("gain-1", "gain_credit", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      doctrineDiagnostic: runnerRemoteContestDoctrine(),
    });

    expect(buildSemanticShadowDecision(frame).doctrineGoals).toBeUndefined();

    const trace = buildSemanticShadowDecision(frame, {
      includeDoctrineGoalsInTrace: true,
    });

    expect(trace.doctrineGoals).toMatchObject({
      scope: "doctrine_goal_trace_summary",
      reportOnly: true,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      goalCount: 1,
      goals: [
        expect.objectContaining({
          goalId: "runner.doctrine.remote_contest",
          family: "remote_contest",
          source: "deck",
        }),
      ],
      evidence: expect.arrayContaining([
        "doctrine_goals:trace_summary",
        "productive_use_allowed:false",
      ]),
    });
    expect(trace.selectedActionId).toBeUndefined();
    expect(trace.noRuntimeEffect).toBe(true);
  });
});

function frameForEconomyChoice() {
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
    tacticalGoals: [
      {
        goalId: "runner.build_economy_base",
        family: "economy",
        priority: 940,
        urgency: "high",
        source: "economy_posture",
        evidence: ["funding_need:true"],
      },
    ],
  });
}

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 5,
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
    actionNumber: 5,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
  credits = 0,
  options: {
    targetRequirements?: LegalAction["targetRequirements"];
    payload?: LegalAction["payload"];
  } = {},
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: credits > 0 ? [{ credits }] : [],
    targetRequirements: options.targetRequirements ?? [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 5,
    ...(options.payload ? { payload: options.payload } : {}),
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

function runnerRemoteContestDoctrine(): DeckDoctrineV2Diagnostic {
  return doctrine("runner", "runner.remote_contest");
}

function doctrine(
  side: "runner" | "corp",
  strategyId: string,
): DeckDoctrineV2Diagnostic {
  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: `${side}-${strategyId}-test`,
    side,
    status: "complete",
    neutralDoctrine: false,
    strategyDiagnostics: [
      {
        strategyId,
        status: "complete",
        anchorScore: 80,
        supportScore: 80,
        finalScore: 80,
        confidence: "high",
        anchorEvidenceCount: 1,
        supportEvidenceCount: 1,
        supportGaps: [],
      },
    ],
    rolesStatus: {
      status: "complete",
      cardCount: 1,
      cardRows: 1,
      completeCards: 1,
      partialCards: 0,
      anchorlessCards: 0,
      cardsWithoutRoles: [],
      roleSignalCount: 1,
      functionSignalCount: 1,
      strategyAnchorCount: 1,
    },
    cardRoles: [],
    warnings: [],
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: {
      actionSelection: false,
      plannerWeights: false,
      scoring: false,
      legalActionGeneration: false,
      engineMutation: false,
      hiddenInfoProjection: false,
    },
  };
}

function runTarget(params: {
  actionId: string;
  targetServerId: string;
  targetKind: RunnerRunTargetEvaluation["targetKind"];
  recommendation: RunnerRunTargetEvaluation["recommendation"];
  accessPayoff: RunnerRunTargetEvaluation["accessPayoff"];
  scoreThreat?: boolean;
  blinkRiskSeverity?: NonNullable<
    RunnerRunTargetEvaluation["blinkRiskAssessment"]
  >["riskSeverity"];
}): RunnerRunTargetEvaluation {
  return {
    schemaVersion: "runner-run-target-evaluation-v1",
    targetServerId: params.targetServerId,
    targetKind: params.targetKind,
    accessServerId: params.targetServerId,
    accessTargetKind: params.targetKind,
    actionId: params.actionId,
    accessPayoff: params.accessPayoff,
    knownAccessState: "unknown",
    multiaccessAvailable: false,
    pathPassability: "reachable",
    pathCost: 0,
    creditsAfterRun: 5,
    stealOrTrashAffordable: "unknown",
    installedRunPayoff: runPayoff(),
    runActionPayoff: runPayoff(),
    runActionProjection: {
      actionId: params.actionId,
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
      evidence: [`test_run_target:${params.targetServerId}`],
    },
    riskyUniversalCoverage: false,
    ...(params.blinkRiskSeverity
      ? {
          blinkRiskAssessment: blinkRisk(params.blinkRiskSeverity),
        }
      : {}),
    scoreThreat: params.scoreThreat ?? false,
    recommendation: params.recommendation,
    score: params.scoreThreat ? 100 : 80,
    evidence: [
      `target:${params.targetServerId}`,
      `recommendation:${params.recommendation}`,
    ],
  };
}

function runPayoff(): RunnerRunTargetEvaluation["installedRunPayoff"] {
  return {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: ["test_payoff"],
  };
}

function blinkRisk(
  riskSeverity: NonNullable<
    RunnerRunTargetEvaluation["blinkRiskAssessment"]
  >["riskSeverity"],
): NonNullable<RunnerRunTargetEvaluation["blinkRiskAssessment"]> {
  return {
    currentHandCount: 1,
    handAfterActionCost: 1,
    blinkUsesLikely: 1,
    visibleSubroutinesLikely: 1,
    maxSingleFailureDamage: 2,
    worstCaseDamageEstimate: 2,
    lethalOnAnyFailure: riskSeverity === "lethal",
    lethalOnHighFailure: riskSeverity === "high" || riskSeverity === "lethal",
    survivesOneFailedBlinkUse: false,
    riskSeverity,
    payoffOverride: "none",
    stableCoverageAvailable: false,
    pathDependsOnBlink: true,
    breakWouldBeExcludedInEncounter: false,
    blockedByHandBuffer: riskSeverity === "high" || riskSeverity === "lethal",
    noProgressRunExpected: false,
    expectedEtrUnbroken: false,
    recentFailure: false,
    recentDamageAmount: 0,
    sameServerRepeatedRiskPenalty: 0,
    evidence: [`blink_risk:${riskSeverity}`],
  };
}
