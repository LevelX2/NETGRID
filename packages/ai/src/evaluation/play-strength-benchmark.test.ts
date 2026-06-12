import { describe, expect, it } from "vitest";
import type { AiDecision, AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import {
  buildRealEngineDecisionCorpusScenarios,
} from "./real-engine-decision-corpus-fixtures";
import { buildRealEngineDecisionCorpus } from "./real-engine-decision-corpus";
import {
  buildPlayStrengthCalibrationBenchmark,
  comparePlayStrengthCalibrationProfiles,
} from "./play-strength-benchmark";

describe("PlayStrengthCalibrationBenchmark", () => {
  it("summarizes snapshot scores, mistakes, agreement and score components", () => {
    const frame = economyFrame();
    const trace = buildSemanticShadowDecision(frame);
    const illegalTrace: SemanticDecisionTrace = {
      ...trace,
      rankedActions: [
        {
          actionId: "not-legal",
          rank: 1,
          score: 100,
          components: [],
          blockers: [],
          explanation: "bad_fixture",
        },
      ],
    };

    const benchmark = buildPlayStrengthCalibrationBenchmark([
      {
        snapshotId: "agree",
        frame,
        trace,
        runtimeDecision: decision("gain-1", "runner.semantic.economy"),
      },
      {
        snapshotId: "disagree",
        frame,
        trace,
        runtimeDecision: decision("draw-1", "runner.semantic.draw"),
      },
      {
        snapshotId: "mistake",
        frame,
        trace: illegalTrace,
        runtimeDecision: decision("gain-1", "runner.semantic.economy"),
      },
    ]);

    expect(benchmark.sampleCount).toBe(3);
    expect(benchmark.averageTopScore).toBeGreaterThan(0);
    expect(benchmark.blockedActionCount).toBe(0);
    expect(benchmark.mistakeCountByClass.illegal_action).toBe(1);
    expect(benchmark.agreementWithRuntime).toEqual({
      agreed: 1,
      total: 3,
      rate: 0.333,
    });
    expect(benchmark.scoreComponentContribution.goal_fit).toBeGreaterThan(0);
    expect(benchmark.evidence).toContain("productive_weight_change:false");
    expect(JSON.stringify(benchmark)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("compares calibration profiles against the local baseline without runtime effect", () => {
    const samples = buildRealEngineDecisionCorpus(
      buildRealEngineDecisionCorpusScenarios(),
    ).map((sample) => ({
      snapshotId: sample.scenarioId,
      frame: sample.frame,
    }));

    const diff = comparePlayStrengthCalibrationProfiles(samples);

    expect(diff.baselineProfileId).toBe("baseline_v1");
    expect(diff.candidateProfileId).toBe("shadow_calibrated_v1");
    expect(diff.baselineReference).toBe(
      "ai-shadow-league-baseline-2026-06-12",
    );
    expect(diff.sampleCount).toBe(samples.length);
    expect(diff.changedScoreSampleCount).toBeGreaterThan(0);
    expect(diff.productiveUseAllowed).toBe(false);
    expect(diff.runtimeConsumerStatus).toBe("none");
    expect(diff.noRuntimeEffect).toBe(true);
    expect(diff.evidence).toEqual(
      expect.arrayContaining([
        "play_strength_calibration_profile_diff:diagnostic_only",
        "runtime_weight_change:false",
      ]),
    );
    expect(JSON.stringify(diff)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });
});

function economyFrame() {
  const input = inputFor("runner", [
    legalAction("gain-1", "gain_credit", "runner"),
    legalAction("draw-1", "draw_card", "runner"),
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

function decision(actionId: string, reasonCode: string): AiDecision {
  return {
    actionId,
    reasonCode,
    explanation: reasonCode,
    consideredActionIds: [],
    fallbackUsed: false,
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
      stateVersion: 1,
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
    actionNumber: 1,
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
    expiresAtStateVersion: 1,
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
