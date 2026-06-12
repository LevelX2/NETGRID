import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
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
  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: "runner-remote-test",
    side: "runner",
    status: "complete",
    neutralDoctrine: false,
    strategyDiagnostics: [
      {
        strategyId: "runner.remote_contest",
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
