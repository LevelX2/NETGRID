import { describe, expect, it } from "vitest";
import {
  evaluateDoctrineQualityGate,
  formatAiSelfplayTraceMiningReport,
  formatDoctrineQualityBenchmarkReport,
  formatMatchProgressionBenchmarkReport,
  formatMatchProgressionBenchmarkSuiteReport,
} from "./benchmark-reports";
import {
  summarizeSelfplayActionLimitClusters,
  summarizeSelfplayActionLimitSubclusters,
} from "./selfplay-trace-mining";
import {
  detectAiSelfplaySuspiciousDecisions,
  listMatchProgressionBenchmarkDeckSlots,
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  type AiSimulationSummary,
} from "../index";

describe("benchmark report formatting", () => {
  it("formats doctrine quality benchmark reports with gate interpretation", () => {
    const benchmark = runDoctrineQualityBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const gate = evaluateDoctrineQualityGate(benchmark);
    const report = formatDoctrineQualityBenchmarkReport(benchmark, gate);

    expect(report).toContain("# AI Deck Doctrine Quality Benchmark Report");
    expect(report).toContain("| nakedAgendaInstalls |");
    expect(report).toContain("## Safety Delta");
    expect(report).toContain(`Gate: ${gate.accepted ? "PASS" : "FAIL"}`);
    expect(gate.thresholds.maxCandidateIllegalActions).toBe(0);
    expect(JSON.stringify({ gate, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("reports match progression metrics alongside safety signals", () => {
    const benchmark = runMatchProgressionBenchmark({
      includeHoldout: false,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 20,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
    });
    const report = formatMatchProgressionBenchmarkReport(benchmark);

    expect(benchmark.version).toBe("ai-match-progression-v1");
    expect(benchmark.diagnosticOnly).toBe(true);
    expect(benchmark.baselineProfile).toBe("belief_ai_v1_4_2");
    expect(benchmark.candidateProfile).toBe("current_candidate");
    expect(benchmark.runnerDeckId).toBe("demo_runner_008");
    expect(benchmark.corpDeckId).toBe("demo_corp_008");
    expect(benchmark.maxActions).toBe(20);
    expect(benchmark.seeds.length).toBeGreaterThan(0);
    expect(benchmark.baseline.games).toBe(benchmark.seeds.length);
    expect(benchmark.candidate.games).toBe(benchmark.seeds.length);
    expect(benchmark.baseline.actionLimitRate).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.actionLimitRate).toBeLessThanOrEqual(1);
    expect(benchmark.delta.actionLimitRate).toBe(
      benchmark.candidate.actionLimitRate - benchmark.baseline.actionLimitRate,
    );
    expect(benchmark.candidate.averageTurns).toBeGreaterThanOrEqual(0);
    expect(
      benchmark.candidate.scoreOrStealActionsPerMatch,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.profileComparisons.map((entry) => entry.profile)).toEqual([
      "basic_corp_ai",
      "basic_runner_ai",
      "belief_ai_v1_4_2",
      "current_candidate",
    ]);
    expect(
      benchmark.candidate.centralPressureRuns +
        benchmark.candidate.remotePressureRuns,
    ).toBeGreaterThanOrEqual(0);
    expect(benchmark.candidate.illegalActions).toBe(0);
    expect(benchmark.candidate.replayFailures).toBe(0);
    expect(report).toContain("# AI Match Progression Benchmark Report");
    expect(report).toContain("## Progression Metrics");
    expect(report).toContain("successfulCentralRuns");
    expect(report).toContain("scoringRemoteDevelopmentActions");
    expect(report).toContain("## Profile Comparison");
    expect(report).toContain("## Safety Metrics");
    expect(report).toContain("Gate: diagnostic_only");
    expect(JSON.stringify({ benchmark, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 30_000);

  it("reports a deck-separated match progression suite with pending real-scene slots", () => {
    const suite = runMatchProgressionBenchmarkSuite({
      includeHoldout: false,
      maxActions: 10,
      baselineProfile: "belief_ai_v1_4_2",
      candidateProfile: "current_candidate",
      comparisonProfiles: [
        "basic_corp_ai",
        "belief_ai_v1_4_2",
        "current_candidate",
      ],
    });
    const report = formatMatchProgressionBenchmarkSuiteReport(suite);
    const slots = listMatchProgressionBenchmarkDeckSlots();
    const smoke = suite.slots.find(
      (slot) => slot.slotId === "safety_smoke_demo_008",
    );
    const snapshot = suite.slots.find(
      (slot) => slot.slotId === "progression_tuning_origin_rig_vs_tax",
    );
    const localRealisticSlots = suite.slots.filter(
      (slot) => slot.slotType === "local_realistic_holdout",
    );
    const realSceneSlots = suite.slots.filter(
      (slot) => slot.slotType === "real_scene_holdout",
    );

    expect(slots.some((slot) => slot.slotType === "smoke")).toBe(true);
    expect(
      slots.filter((slot) => slot.slotType === "snapshot_tuning"),
    ).toHaveLength(2);
    expect(
      slots.filter((slot) => slot.slotType === "local_realistic_holdout"),
    ).toHaveLength(2);
    expect(smoke?.status).toBe("runnable");
    expect(smoke?.runnerDeckRef).toBe("demo_runner_008");
    expect(snapshot?.status).toBe("runnable");
    expect(snapshot?.benchmark?.runnerDeckId).toBe(
      "onr_origin_runner_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.corpDeckId).toBe(
      "onr_origin_corp_ai_snapshot_v1",
    );
    expect(snapshot?.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
    expect(snapshot?.benchmark?.candidate.illegalActions).toBe(0);
    expect(snapshot?.benchmark?.candidate.replayFailures).toBe(0);
    expect(localRealisticSlots).toHaveLength(2);
    expect(
      localRealisticSlots.every((slot) => slot.status === "runnable"),
    ).toBe(true);
    expect(
      localRealisticSlots.every(
        (slot) => !slot.runnerDeckRef.includes("demo_008"),
      ),
    ).toBe(true);
    for (const slot of localRealisticSlots) {
      expect(slot.runnerDeckRef).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.corpDeckId).toContain("local_realistic_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(realSceneSlots).toHaveLength(2);
    expect(realSceneSlots.every((slot) => slot.status === "runnable")).toBe(
      true,
    );
    expect(
      realSceneSlots.every((slot) => !slot.runnerDeckRef.includes("demo_008")),
    ).toBe(true);
    for (const slot of realSceneSlots) {
      expect(slot.benchmark?.runnerDeckId).toContain("real_scene_");
      expect(slot.benchmark?.corpDeckId).toContain("real_scene_");
      expect(slot.benchmark?.runnerDeckId).not.toBe("demo_runner_008");
      expect(slot.benchmark?.corpDeckId).not.toBe("demo_corp_008");
      expect(slot.benchmark?.candidate.illegalActions).toBe(0);
      expect(slot.benchmark?.candidate.replayFailures).toBe(0);
    }
    expect(report).toContain("## Demo Smoke");
    expect(report).toContain("## Snapshot Progression");
    expect(report).toContain("## Local Realistic Holdout");
    expect(report).toContain("## Real Scene Holdout");
    expect(report).toContain("remoteBuildActions");
    expect(JSON.stringify({ suite, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState/i,
    );
  }, 45_000);

  it("detects suspicious selfplay decisions from redaction-safe synthetic traces", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-detector-synthetic",
      winner: "action_limit_reached",
      actions: 6,
      turns: 3,
      finalAgendaPoints: { runner: 0, corp: 0 },
      finalStateHash: "fnv1a:selfplay",
      eventLogLength: 4,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "start_run", {
          selectedActionId: "run-remote-a",
          targetServerId: "remote_1",
          planKind: "runner.contest_remote",
          evidence: ["known_no_current_payoff"],
        }),
        selfplayAction("runner", 2, "gain_credit", {
          selectedActionId: "gain-credit",
          reasonCode: "runner.plan.recover_economy",
        }),
        selfplayAction("runner", 3, "start_run", {
          selectedActionId: "run-remote-b",
          targetServerId: "remote_1",
          planKind: "runner.contest_remote",
          evidence: ["known_no_current_payoff"],
          runnerRunPenalizedAsKnownNoAccess: true,
          runnerRepeatRunOnKnownUnpayableRemotePath: true,
        }),
        selfplayAction("runner", 4, "trigger_ability", {
          selectedActionId: "bank-load",
          reasonCode: "runner.bank.load",
          evidence: [
            "bankOverDesiredTarget:true",
            "bankConcreteFundingNeed:false",
          ],
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: [
        "repeated_no_progress_run",
        "repeated_known_no_payoff_remote",
        "bank_over_target_without_funding_need",
      ],
    });
    const detectorIds = findings.flatMap((finding) => finding.detectorIds);

    expect(detectorIds).toContain("repeated_no_progress_run");
    expect(detectorIds).toContain("repeated_known_no_payoff_remote");
    expect(detectorIds).toContain("bank_over_target_without_funding_need");
    expect(
      findings.every((finding) => finding.relevantDebugFacts.length > 0),
    ).toBe(true);
    expect(JSON.stringify(findings)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("categorizes recovery loop findings without suppressing the detector", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-recovery-loop-categories",
      winner: "action_limit_reached",
      actions: 4,
      turns: 2,
      finalAgendaPoints: { runner: 0, corp: 0 },
      finalStateHash: "fnv1a:selfplay-recovery-categories",
      eventLogLength: 4,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "activated_card_ability", {
          selectedActionId: "junkyard-low-1",
          reasonCode: "runner.recovery.low_value",
          evidence: ["junkyard recovery without payoff"],
        }),
        selfplayAction("runner", 2, "activated_card_ability", {
          selectedActionId: "junkyard-low-2",
          reasonCode: "runner.recovery.low_value",
          evidence: ["junkyard recovery without payoff"],
        }),
        selfplayAction("runner", 3, "activated_card_ability", {
          selectedActionId: "junkyard-funded-1",
          reasonCode: "runner.recovery.funding",
          evidence: [
            "junkyard recovery",
            "fundingNeedReducesRecoveryLoopPenalty:true",
          ],
        }),
        selfplayAction("runner", 4, "activated_card_ability", {
          selectedActionId: "junkyard-funded-2",
          reasonCode: "runner.recovery.funding",
          evidence: [
            "junkyard recovery",
            "fundingNeedReducesRecoveryLoopPenalty:true",
          ],
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["recovery_low_value_loop"],
    });
    const lowValue = findings.find(
      (finding) => finding.selectedActionId === "junkyard-low-2",
    );

    expect(findings.flatMap((finding) => finding.detectorIds)).toEqual([
      "recovery_low_value_loop",
    ]);
    expect(lowValue?.relevantDebugFacts).toContain(
      "recovery_loop_category:low_value_repeat_no_funding_need",
    );
    expect(
      findings.some(
        (finding) => finding.selectedActionId === "junkyard-funded-2",
      ),
    ).toBe(false);
    expect(JSON.stringify(findings)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("keeps explained semantic overrides out of suspicious selfplay findings", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-detector-explained-overrides",
      winner: "action_limit_reached",
      actions: 2,
      turns: 1,
      finalAgendaPoints: { runner: 0, corp: 0 },
      finalStateHash: "fnv1a:selfplay-overrides",
      eventLogLength: 2,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "gain_credit", {
          selectedActionId: "explained-gain",
          planKind: "runner.opportunistic_central_run",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: [
            "semantic_runtime_actual_differs_from_legacy_debug",
            "runner_recent_same_server_runs",
            "action_semantic_candidate:economy.gain_credit",
            "legacy_reference_action_type:start_run",
          ],
        }),
        selfplayAction("runner", 2, "draw_card", {
          selectedActionId: "unexplained-draw",
          planKind: "runner.opportunistic_central_run",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: [
            "semantic_runtime_actual_differs_from_legacy_debug",
            "legacy_reference_action_type:start_run",
          ],
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: [
        "plan_step_action_mismatch",
        "semantic_override_suspicious",
      ],
    });
    const explained = findings.filter(
      (finding) => finding.selectedActionId === "explained-gain",
    );
    const unexplained = findings.find(
      (finding) => finding.selectedActionId === "unexplained-draw",
    );

    expect(explained).toEqual([]);
    expect(unexplained?.detectorIds).toEqual([
      "plan_step_action_mismatch",
      "semantic_override_suspicious",
    ]);
    expect(JSON.stringify(findings)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("runs and formats a small selfplay trace-mining smoke", () => {
    const result = runAiSelfplayTraceMining({
      seeds: ["ai-v143-tuning-001"],
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      maxActions: 8,
      maxFindings: 5,
    });
    const report = formatAiSelfplayTraceMiningReport(result);

    expect(result.version).toBe("ai-selfplay-trace-mining-v1");
    expect(result.diagnosticOnly).toBe(true);
    expect(result.noTraining).toBe(true);
    expect(result.noAutofix).toBe(true);
    expect(result.aggregate.games).toBe(1);
    expect(result.aggregate.decisions).toBeGreaterThan(0);
    expect(result.aggregate.redactionSafe).toBe(true);
    expect(result.aggregate.allRedactionSafe).toBe(true);
    expect(result.aggregate.averageGameLength).toBeGreaterThan(0);
    expect(result.aggregate.corpAgendaScores).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.runnerAgendaSteals).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.corpFlatlines).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.scoreWindowMissed).toBeGreaterThanOrEqual(0);
    expect(result.aggregate.unsafeScoreChosen).toBeGreaterThanOrEqual(0);
    expect(
      result.aggregate.passiveActionWithScoreLineAvailable,
    ).toBeGreaterThanOrEqual(0);
    expect(
      Object.values(result.aggregate.actionLimitClusters).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(result.aggregate.actionLimitReached);
    expect(
      result.findings.some((finding) =>
        finding.detectorIds.includes("action_limit_reached"),
      ),
    ).toBe(true);
    expect(report).toContain("# AI Selfplay Trace Mining Report");
    expect(report).toContain("## Top Findings");
    expect(report).toContain("Gate: diagnostic_only");
    expect(report).toContain("| allRedactionSafe | 1 |");
    expect(report).toContain("| averageGameLength |");
    expect(report).toContain("| scoreWindowMissed |");
    expect(report).toContain("| unsafeScoreChosen |");
    expect(report).toContain("| passiveActionWithScoreLineAvailable |");
    expect(report).toContain("## Action Limit Clusters");
    expect(report).toContain("## Action Limit Subclusters");
    expect(JSON.stringify({ result, report })).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  }, 30_000);

  it("clusters action-limit roots without hidden trace data", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-action-limit-cluster",
      winner: "action_limit_reached",
      actions: 4,
      turns: 2,
      finalAgendaPoints: { runner: 0, corp: 0 },
      finalStateHash: "fnv1a:selfplay-action-limit-cluster",
      eventLogLength: 4,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "start_run", {
          selectedActionId: "run-rd-1",
          targetServerId: "rd",
          reasonCode: "runner.plan.pressure_rnd",
        }),
        selfplayAction("corp", 2, "gain_credit", {
          selectedActionId: "corp-gain",
        }),
        selfplayAction("runner", 3, "start_run", {
          selectedActionId: "run-rd-2",
          targetServerId: "rd",
          reasonCode: "runner.plan.pressure_rnd",
        }),
        selfplayAction("runner", 4, "start_run", {
          selectedActionId: "run-rd-3",
          targetServerId: "rd",
          reasonCode: "runner.plan.pressure_rnd",
        }),
        selfplayAction("runner", 5, "start_run", {
          selectedActionId: "run-rd-4",
          targetServerId: "rd",
          reasonCode: "runner.plan.pressure_rnd",
        }),
        selfplayAction("runner", 6, "start_run", {
          selectedActionId: "run-rd-5",
          targetServerId: "rd",
          reasonCode: "runner.plan.pressure_rnd",
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const clusters = summarizeSelfplayActionLimitClusters([summary]);

    expect(clusters.action_limit_runner_repeated_no_progress_run).toBe(1);
    expect(Object.values(clusters).reduce((sum, count) => sum + count, 0)).toBe(
      1,
    );
    expect(JSON.stringify(clusters)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("subclusters action-limit roots from the final forty actions", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-action-limit-subcluster",
      winner: "action_limit_reached",
      actions: 5,
      turns: 3,
      finalAgendaPoints: { runner: 6, corp: 3 },
      finalStateHash: "fnv1a:selfplay-action-limit-subcluster",
      eventLogLength: 5,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "gain_credit", {
          selectedActionId: "runner-gain-1",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRemote: true,
        }),
        selfplayAction("runner", 2, "gain_credit", {
          selectedActionId: "runner-gain-2",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRemote: true,
        }),
        selfplayAction("runner", 3, "start_run", {
          selectedActionId: "run-rd",
          targetServerId: "rd",
          reasonCode: "runner.semantic.simple_hq_or_rnd_pressure",
        }),
        selfplayAction("runner", 4, "draw_card", {
          selectedActionId: "runner-draw",
          reasonCode: "runner.semantic.basic_economy_draw",
        }),
        selfplayAction("corp", 5, "gain_credit", {
          selectedActionId: "corp-gain",
          reasonCode: "corp.semantic.basic_economy_draw",
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const subclusters = summarizeSelfplayActionLimitSubclusters([summary]);

    expect(subclusters.runner_late_gain_credit_without_funding_need).toBe(1);
    expect(subclusters.late_gain_credit_without_funding_need).toBe(0);
    expect(
      Object.values(subclusters).reduce((sum, count) => sum + count, 0),
    ).toBe(1);
    expect(JSON.stringify(subclusters)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("keeps reserve and no-alternative gain-credit cases out of no-need subclusters", () => {
    const reserveSummary: AiSimulationSummary = {
      seed: "selfplay-action-limit-runner-reserve-subcluster",
      winner: "action_limit_reached",
      actions: 3,
      turns: 2,
      finalAgendaPoints: { runner: 3, corp: 3 },
      finalStateHash: "fnv1a:selfplay-action-limit-runner-reserve-subcluster",
      eventLogLength: 3,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "gain_credit", {
          selectedActionId: "runner-reserve-gain",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
          runnerEconomyTakenToReachRunReserve: true,
          runnerPressureReadyTrue: true,
          runnerPressureReadyByTargetRemote: true,
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };
    const noAlternativeSummary: AiSimulationSummary = {
      ...reserveSummary,
      seed: "selfplay-action-limit-runner-no-alternative-subcluster",
      finalStateHash: "fnv1a:selfplay-action-limit-runner-no-alternative-subcluster",
      actionSequence: [
        selfplayAction("runner", 1, "gain_credit", {
          selectedActionId: "runner-no-alternative-gain",
          reasonCode: "runner.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
        }),
      ],
    };

    const subclusters = summarizeSelfplayActionLimitSubclusters([
      reserveSummary,
      noAlternativeSummary,
    ]);

    expect(subclusters.runner_late_gain_credit_real_reserve).toBe(1);
    expect(subclusters.runner_late_gain_credit_no_safe_alternative).toBe(1);
    expect(subclusters.runner_late_gain_credit_without_funding_need).toBe(0);
  });

  it("splits corp gain-credit stalls by rez or scoreline alternative", () => {
    const reserveSummary: AiSimulationSummary = {
      seed: "selfplay-action-limit-corp-reserve-subcluster",
      winner: "action_limit_reached",
      actions: 3,
      turns: 2,
      finalAgendaPoints: { runner: 3, corp: 3 },
      finalStateHash: "fnv1a:selfplay-action-limit-corp-reserve-subcluster",
      eventLogLength: 3,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("corp", 1, "gain_credit", {
          selectedActionId: "corp-reserve-gain",
          reasonCode: "corp.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
          corpCreditsBelowCheapestRelevantRez: true,
          corpScoreTerminalWindowScoreLegal: true,
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };
    const noNeedSummary: AiSimulationSummary = {
      ...reserveSummary,
      seed: "selfplay-action-limit-corp-no-need-subcluster",
      finalStateHash: "fnv1a:selfplay-action-limit-corp-no-need-subcluster",
      actionSequence: [
        selfplayAction("corp", 1, "gain_credit", {
          selectedActionId: "corp-no-need-gain",
          reasonCode: "corp.semantic.basic_economy_draw",
          evidence: ["activeFundingNeed:false"],
          corpScoreTerminalWindowScoreLegal: true,
        }),
      ],
    };

    const subclusters = summarizeSelfplayActionLimitSubclusters([
      reserveSummary,
      noNeedSummary,
    ]);

    expect(
      subclusters.corp_late_gain_credit_real_rez_or_protection_reserve,
    ).toBe(1);
    expect(
      subclusters.corp_late_gain_credit_without_rez_score_protection_need,
    ).toBe(1);
  });

  it("does not treat run microsteps as stalls when access follows", () => {
    const summary: AiSimulationSummary = {
      seed: "selfplay-action-limit-run-microstep-subcluster",
      winner: "action_limit_reached",
      actions: 5,
      turns: 2,
      finalAgendaPoints: { runner: 4, corp: 3 },
      finalStateHash: "fnv1a:selfplay-action-limit-run-microstep-subcluster",
      eventLogLength: 5,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "start_run", {
          selectedActionId: "run-rd",
          targetServerId: "rd",
          reasonCode: "runner.semantic.simple_hq_or_rnd_pressure",
        }),
        selfplayAction("runner", 2, "continue_run", {
          selectedActionId: "continue-rd-1",
          reasonCode: "runner.semantic.simple_run_choice",
        }),
        selfplayAction("runner", 3, "continue_run", {
          selectedActionId: "continue-rd-2",
          reasonCode: "runner.semantic.simple_run_choice",
        }),
        selfplayAction("runner", 4, "access_card", {
          selectedActionId: "access-rd",
          reasonCode: "runner.semantic.access_trash_steal",
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };

    const subclusters = summarizeSelfplayActionLimitSubclusters([summary]);

    expect(subclusters.continue_chain_to_access).toBe(1);
    expect(subclusters.late_run_step_stall).toBe(0);
    expect(JSON.stringify(subclusters)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("catches continue and jack-out loops without progress", () => {
    const continueLoop: AiSimulationSummary = {
      seed: "selfplay-action-limit-continue-loop-subcluster",
      winner: "action_limit_reached",
      actions: 5,
      turns: 2,
      finalAgendaPoints: { runner: 4, corp: 3 },
      finalStateHash: "fnv1a:selfplay-action-limit-continue-loop-subcluster",
      eventLogLength: 5,
      replayOk: true,
      replayErrors: [],
      actionSequence: [
        selfplayAction("runner", 1, "start_run", {
          selectedActionId: "run-rd-loop",
          targetServerId: "rd",
          reasonCode: "runner.semantic.simple_hq_or_rnd_pressure",
        }),
        selfplayAction("runner", 2, "continue_run", {
          selectedActionId: "continue-loop-1",
          reasonCode: "runner.semantic.simple_run_choice",
        }),
        selfplayAction("runner", 3, "continue_run", {
          selectedActionId: "continue-loop-2",
          reasonCode: "runner.semantic.simple_run_choice",
        }),
        selfplayAction("runner", 4, "continue_run", {
          selectedActionId: "continue-loop-3",
          reasonCode: "runner.semantic.simple_run_choice",
        }),
      ],
      errors: [],
      cardPoolVersion: "0.99.0",
      metrics: selfplayMetricsFixture(),
    };
    const jackOutLoop: AiSimulationSummary = {
      ...continueLoop,
      seed: "selfplay-action-limit-jackout-loop-subcluster",
      finalStateHash: "fnv1a:selfplay-action-limit-jackout-loop-subcluster",
      actionSequence: [
        selfplayAction("runner", 1, "jack_out", {
          selectedActionId: "jackout-loop-1",
          reasonCode: "runner.run.jack_out_safe_exit",
        }),
        selfplayAction("runner", 2, "jack_out", {
          selectedActionId: "jackout-loop-2",
          reasonCode: "runner.run.jack_out_safe_exit",
        }),
      ],
    };

    const subclusters = summarizeSelfplayActionLimitSubclusters([
      continueLoop,
      jackOutLoop,
    ]);

    expect(subclusters.continue_without_progress).toBe(1);
    expect(subclusters.jackout_loop).toBe(1);
    expect(subclusters.late_run_step_stall).toBe(0);
  });
});

function selfplayAction(
  side: AiSimulationSummary["actionSequence"][number]["side"],
  stateVersionBefore: number,
  actionType: AiSimulationSummary["actionSequence"][number]["actionType"],
  overrides: Partial<AiSimulationSummary["actionSequence"][number]> = {},
): AiSimulationSummary["actionSequence"][number] {
  return {
    ...overrides,
    side,
    stateVersionBefore,
    actionType,
    reasonCode: overrides.reasonCode ?? `${side}.synthetic`,
    explanation: overrides.explanation ?? "Synthetic selfplay action.",
    confidence: overrides.confidence ?? 0.5,
    evidence: overrides.evidence ?? [],
    fallbackUsed: overrides.fallbackUsed ?? false,
    timeoutUsed: overrides.timeoutUsed ?? false,
    qualityTags: overrides.qualityTags ?? [],
    stateHashAfter: overrides.stateHashAfter ?? `fnv1a:${stateVersionBefore}`,
  };
}

function selfplayMetricsFixture(): AiSimulationSummary["metrics"] {
  return {
    illegalActions: 0,
    fallbackRate: 0,
    timeoutRate: 0,
    reasonCodeCoverage: [],
    actionTypeCoverage: [],
    roleCoverage: [],
    progressScore: 0,
    holdout: false,
    doctrine: {
      nakedAgendaInstalls: 0,
      agendaFloodExposure: 0,
      scoreWindowMissed: 0,
      remoteOverbuild: 0,
      economyStall: 0,
      repeatedLowValueCentralRun: 0,
      rigStall: 0,
      assetTrashNeglect: 0,
    },
  };
}
