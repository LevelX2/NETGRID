import type { AiSimulationSummary } from "./ai-simulation-summary";
import { describe, expect, it } from "vitest";
import {
  detectAiSelfplaySuspiciousDecisions,
  extractAiSelfplayDecisionPoints,
  isSelfplayTraceRedactionSafe,
  safeSelfplayFacts,
  summarizeSelfplayActionLimitClusters,
  summarizeSelfplayActionLimitSubclusters,
} from "./selfplay-trace-mining";

describe("SelfplayTraceMining", () => {
  it("extracts redaction-safe decision points from selfplay summaries", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-hq",
        targetServerId: "hq",
        planKind: "runner.hq_pressure",
        evidence: ["safe_central_access:true"],
        actionAlternatives: [
          {
            rank: 1,
            actionId: "run-hq",
            actionType: "start_run",
            selected: true,
            whyChosen: ["pressure_window"],
            whyNot: [],
          },
          {
            rank: 2,
            actionId: "gain-credit",
            actionType: "gain_credit",
            selected: false,
            whyChosen: [],
            whyNot: ["lower_priority"],
          },
        ],
      }),
    ]);

    const [point] = extractAiSelfplayDecisionPoints([summary]);

    expect(point).toMatchObject({
      matchId: "selfplay:selfplay-trace-mining",
      seed: "selfplay-trace-mining",
      summaryIndex: 0,
      actionIndex: 0,
      side: "runner",
      stateVersion: 1,
      selectedActionId: "run-hq",
      selectedActionType: "start_run",
      planKind: "runner.hq_pressure",
      targetServerId: "hq",
      reasonCode: "runner.synthetic",
      redactionSafe: true,
    });
    expect(point?.actionAlternatives).toEqual([
      expect.objectContaining({
        actionId: "run-hq",
        actionType: "start_run",
        selected: true,
        whyChosen: ["pressure_window"],
      }),
      expect.objectContaining({
        actionId: "gain-credit",
        actionType: "gain_credit",
        selected: false,
        whyNot: ["lower_priority"],
      }),
    ]);
    expect(JSON.stringify(point)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug/i,
    );
  });

  it("detects repeated no-payoff remote decisions without hidden trace data", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-remote-1",
        targetServerId: "remote_1",
        evidence: ["known_no_current_payoff"],
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "run-remote-2",
        targetServerId: "remote_1",
        evidence: ["known_no_current_payoff"],
        runnerRepeatRunOnKnownUnpayableRemotePath: true,
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: [
        "repeated_no_progress_run",
        "repeated_known_no_payoff_remote",
      ],
    });

    const repeatFinding = findings.find(
      (finding) => finding.selectedActionId === "run-remote-2",
    );

    expect(findings).toHaveLength(2);
    expect(repeatFinding?.detectorIds).toEqual([
      "repeated_no_progress_run",
      "repeated_known_no_payoff_remote",
    ]);
    expect(
      findings.some((finding) => finding.selectedActionId === "run-remote-1"),
    ).toBe(true);
    expect(isSelfplayTraceRedactionSafe(findings)).toBe(true);
  });

  it("bounds repeated no-payoff remote signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-remote-positive",
        targetServerId: "remote_1",
        evidence: ["remote_memory_payoff:known_low_value"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-remote-noise",
        targetServerId: "remote_1",
        evidence: ["remote_memory_payoff:known_low_valueish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["repeated_known_no_payoff_remote"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("run-remote-positive");
  });

  it("does not flag a repeated central after the Corp refreshed that central", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-rd-before-refresh",
        targetServerId: "rd",
      }),
      selfplayAction("corp", 2, "mandatory_draw", {
        selectedActionId: "corp-mandatory-draw",
      }),
      selfplayAction("runner", 3, "start_run", {
        selectedActionId: "run-rd-after-refresh",
        targetServerId: "rd",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["repeated_no_progress_run"],
    });

    expect(findings).toEqual([]);
  });

  it("still flags a same-window repeated central without refresh", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-hq-first",
        targetServerId: "hq",
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "run-hq-repeat",
        targetServerId: "hq",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["repeated_no_progress_run"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("run-hq-repeat");
  });

  it("bounds no-legal-action failure errors to structured tokens", () => {
    const positive = {
      ...selfplaySummary([
        selfplayAction("runner", 1, "draw_card", {
          selectedActionId: "draw-positive",
        }),
      ]),
      errors: ["No legal action available for runner."],
    };
    const noise = {
      ...selfplaySummary([
        selfplayAction("runner", 1, "draw_card", {
          selectedActionId: "draw-noise",
        }),
      ]),
      errors: ["No legalistic actioneer marker."],
    };

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["no_legal_action_failure"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("draw-positive");
  });

  it("bounds low-value archives signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "archives-positive",
        targetServerId: "archives",
        debugFacts: ["archives_known_no_agenda"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "archives-noise",
        targetServerId: "archives",
        debugFacts: ["archives_known_no_agendaish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["repeated_low_value_archives"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("archives-positive");
  });

  it("requires stable visible Archives with no unknown cards for repeat findings", () => {
    const stable = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "archives-stable-1",
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 0,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:stable",
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "archives-stable-2",
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 0,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:stable",
      }),
    ]);
    const freshUnknown = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 0,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:before",
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "archives-fresh-unknown",
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 1,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:before",
      }),
    ]);
    const changed = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 0,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:before",
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "archives-changed",
        targetServerId: "archives",
        runnerArchivesUnknownCardCount: 0,
        runnerArchivesKnownAgenda: false,
        runnerArchivesVisibleFingerprint: "fnv1a:after",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions(
      [stable, freshUnknown, changed],
      { detectorIds: ["repeated_low_value_archives"] },
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("archives-stable-2");
  });

  it("bounds bank over-target signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "bank-positive",
        debugFacts: ["bankOverTarget:true"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "bank-noise",
        debugFacts: ["bankOverTarget:trueish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["bank_over_target_without_funding_need"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("bank-positive");
  });

  it("bounds risky self-damage signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "self-damage-positive",
        debugFacts: ["self_damage_survives:false"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "self-damage-noise",
        debugFacts: ["self_damage_survives:falseish"],
      }),
    ]);
    const safeAlternative = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "self-damage-safe",
        debugFacts: [
          "self_damage_survives:false",
          "runner.self_damage.safe_alternative",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions(
      [positive, noise, safeAlternative],
      {
        detectorIds: ["risky_self_damage_action"],
      },
    );

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("self-damage-positive");
  });

  it("bounds blink hand-buffer signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "blink-positive",
        debugFacts: ["blinkRiskSeverity:lethal"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "blink-noise",
        debugFacts: ["blinkRiskSeverity:lethalish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["blink_low_hand_buffer_run"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("blink-positive");
  });

  it("bounds recovery loop entry signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "recovery-entry-positive-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "recovery-entry-positive-2",
        reasonCode: "runner.recovery",
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "recovery-entry-noise-1",
        reasonCode: "runner.recoveryish",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "recovery-entry-noise-2",
        reasonCode: "runner.recoveryish",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["recovery_low_value_loop"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("recovery-entry-positive-2");
  });

  it("ignores mandatory run microsteps in recovery and plan mismatch detectors", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "continue_run", {
        selectedActionId: "continue-recovery-1",
        reasonCode: "runner.recovery.heap",
        planKind: "runner.run_pressure",
      }),
      selfplayAction("runner", 2, "continue_run", {
        selectedActionId: "continue-recovery-2",
        reasonCode: "runner.recovery.heap",
        planKind: "runner.run_pressure",
      }),
      selfplayAction("runner", 3, "resolve_choice", {
        selectedActionId: "resolve-run-choice",
        reasonCode: "runner.recovery.heap",
        planKind: "runner.run_pressure",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["recovery_low_value_loop", "plan_step_action_mismatch"],
    });

    expect(findings).toEqual([]);
  });

  it("bounds recovery coverage signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "recovery-positive-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "recovery-positive-2",
        reasonCode: "runner.recovery",
        debugFacts: ["coverageAnswerRole:recovery_answer"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "recovery-noise-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "recovery-noise-2",
        reasonCode: "runner.recovery",
        debugFacts: ["coverageAnswerRole:recovery_answerish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["recovery_low_value_loop"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("recovery-noise-2");
  });

  it("bounds recovery funding signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "funding-positive-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "funding-positive-2",
        reasonCode: "runner.recovery",
        debugFacts: ["runner_credit_base_recommendation:fund_useful_hand_card"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "funding-noise-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "funding-noise-2",
        reasonCode: "runner.recovery",
        debugFacts: [
          "runner_credit_base_recommendation:fund_useful_hand_cardish",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["recovery_low_value_loop"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("funding-noise-2");
  });

  it("bounds recovery search signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "search-positive-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "search-positive-2",
        reasonCode: "runner.recovery",
        debugFacts: ["coverageAnswerRole:program_search"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "search-noise-1",
        reasonCode: "runner.recovery",
      }),
      selfplayAction("runner", 2, "trigger_ability", {
        selectedActionId: "search-noise-2",
        reasonCode: "runner.recovery",
        debugFacts: ["coverageAnswerRole:program_searchish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["recovery_low_value_loop"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("search-noise-2");
  });

  it("bounds semantic override markers to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "override-positive",
        debugFacts: ["semantic_runtime_actual_differs_from_legacy_debug"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "override-noise",
        debugFacts: ["semantic_runtime_actual_differs_from_legacy_debugish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["semantic_override_suspicious"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("override-positive");
  });

  it("bounds semantic override explanations to structured entries", () => {
    const explained = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "override-explained",
        debugFacts: [
          "semantic_runtime_actual_differs_from_legacy_debug",
          "selected_by_plan_mapping",
        ],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "trigger_ability", {
        selectedActionId: "override-explanation-noise",
        debugFacts: [
          "semantic_runtime_actual_differs_from_legacy_debug",
          "selected_by_plan_mappingish",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([explained, noise], {
      detectorIds: ["semantic_override_suspicious"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("override-explanation-noise");
  });

  it("bounds setup plan-mismatch pressure signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "setup-mismatch-positive",
        planKind: "runner.setup",
        debugFacts: ["runnerPressureReady:false"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "setup-mismatch-noise",
        planKind: "runner.setup",
        debugFacts: ["runnerPressureReady:falseish"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["plan_step_action_mismatch"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("setup-mismatch-positive");
  });

  it("bounds plan-mismatch plan-kind signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "plan-kind-positive",
        planKind: "runner.run_pressure",
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "plan-kind-noise",
        planKind: "runner.runny_pressureish",
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["plan_step_action_mismatch"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("plan-kind-positive");
  });

  it("accepts actions selected by the current mapped plan step", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "mapped-draw-for-run-plan",
        planKind: "runner.run_pressure",
        debugFacts: [
          "tactical_plan_mapping_outcome:plan_mapping_selected",
          "tactical_step:draw_for_answer",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["plan_step_action_mismatch"],
    });

    expect(findings).toEqual([]);
  });

  it("bounds run plan-mismatch funding and reserve explanations to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "run-mismatch-positive",
        planKind: "runner.run_pressure",
        debugFacts: ["funding_need:true", "reserve:run_cost"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "run-mismatch-noise",
        planKind: "runner.run_pressure",
        debugFacts: ["funding_need:trueish_noise", "reserve_noise"],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([positive, noise], {
      detectorIds: ["plan_step_action_mismatch"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("run-mismatch-noise");
  });

  it("bounds Corp late-credit reserve explanations to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("corp", 1, "gain_credit", {
        selectedActionId: "corp-reserve-positive",
        debugFacts: ["corpRezReserve:true", "protection:central"],
        corpScoreTerminalWindowScoreLegal: true,
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("corp", 1, "gain_credit", {
        selectedActionId: "corp-reserve-noise",
        debugFacts: ["corpRezReserveish:true", "protectionist_noise"],
        corpScoreTerminalWindowScoreLegal: true,
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      corp_late_gain_credit_real_rez_or_protection_reserve: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      corp_late_gain_credit_without_rez_score_protection_need: 1,
    });
  });

  it("bounds Runner late-credit reserve and safety explanations to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "runner-reserve-positive",
        debugFacts: [
          "known_unaffordable_path:true",
          "encounter_survival:damage",
        ],
        runnerPressureReadyTrue: true,
        runnerPressureReadyByTargetRemote: true,
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "runner-reserve-noise",
        debugFacts: [
          "known_unaffordable_path:trueish_noise",
          "encounter_survivalist_noise",
        ],
        runnerPressureReadyTrue: true,
        runnerPressureReadyByTargetRemote: true,
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      runner_late_gain_credit_real_reserve: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      runner_late_gain_credit_without_funding_need: 1,
    });
  });

  it("bounds late-credit funding-need signals to structured entries", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "funding-need-positive",
        debugFacts: ["funding_need:true"],
        runnerPressureReadyTrue: true,
        runnerPressureReadyByTargetRemote: true,
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "gain_credit", {
        selectedActionId: "funding-need-noise",
        debugFacts: ["funding_need:trueish_noise"],
        runnerPressureReadyTrue: true,
        runnerPressureReadyByTargetRemote: true,
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      mixed_unknown: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      runner_late_gain_credit_without_funding_need: 1,
    });
  });

  it("bounds late run-step pressure signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-step-positive",
        reasonCode: "runner.simple_run_choice",
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "run-step-noise",
        reasonCode: "runner.simple_run_choiceish",
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      run_microstep_required: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      mixed_unknown: 1,
    });
  });

  it("bounds breach pending run-step signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "access_card", {
        selectedActionId: "breach-positive",
        debugFacts: ["access_queue"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "access_card", {
        selectedActionId: "breach-noise",
        debugFacts: ["access_queueish"],
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      breach_pending: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      access_pending: 1,
    });
  });

  it("bounds late draw coverage-need signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "draw-coverage-positive",
        debugFacts: ["hand_goal"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "draw-coverage-noise",
        debugFacts: ["hand_goalish"],
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      late_draw_for_coverage_or_hand_goal: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      late_draw_without_coverage_or_hand_goal: 1,
    });
  });

  it("bounds late low-delta action signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "activated_card_ability", {
        selectedActionId: "low-delta-positive",
        debugFacts: ["known_low_value"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "activated_card_ability", {
        selectedActionId: "low-delta-noise",
        debugFacts: ["known_low_valueish"],
      }),
    ]);

    expect(summarizeSelfplayActionLimitSubclusters([positive])).toMatchObject({
      late_ability_reuse_low_delta: 1,
    });
    expect(summarizeSelfplayActionLimitSubclusters([noise])).toMatchObject({
      mixed_unknown: 1,
    });
  });

  it("bounds setup economy cluster signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "setup-economy-positive",
        reasonCode: "runner.draw_for_answers.one",
      }),
      selfplayAction("runner", 2, "draw_card", {
        selectedActionId: "setup-economy-positive-2",
        reasonCode: "runner.draw_for_answers.two",
      }),
      selfplayAction("runner", 3, "draw_card", {
        selectedActionId: "setup-economy-positive-3",
        reasonCode: "runner.draw_for_answers.three",
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "draw_card", {
        selectedActionId: "setup-economy-noise",
        reasonCode: "runner.draw_for_answersish",
      }),
    ]);

    expect(summarizeSelfplayActionLimitClusters([positive])).toMatchObject({
      action_limit_setup_economy_loop: 1,
    });
    expect(summarizeSelfplayActionLimitClusters([noise])).toMatchObject({
      action_limit_mixed_or_unknown: 1,
    });
  });

  it("bounds low-value repeat cluster signals to text tokens", () => {
    const positive = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "low-value-positive",
        evidence: ["known_low_value"],
      }),
      selfplayAction("runner", 2, "start_run", {
        selectedActionId: "low-value-positive-2",
        evidence: ["known_low_value"],
      }),
      selfplayAction("runner", 3, "start_run", {
        selectedActionId: "low-value-positive-3",
        evidence: ["known_low_value"],
      }),
    ]);
    const noise = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        selectedActionId: "low-value-noise",
        evidence: ["known_low_valueish"],
      }),
    ]);

    expect(summarizeSelfplayActionLimitClusters([positive])).toMatchObject({
      action_limit_low_value_repeat: 1,
    });
    expect(summarizeSelfplayActionLimitClusters([noise])).toMatchObject({
      action_limit_mixed_or_unknown: 1,
    });
  });

  it("drops forbidden debug facts during redaction", () => {
    expect(
      safeSelfplayFacts(["safe_fact", "privatePayload:bad", "deckOrder:bad"]),
    ).toEqual(["safe_fact"]);
    expect(isSelfplayTraceRedactionSafe({ cardInstances: [] })).toBe(false);
  });

  it("bounds redaction markers to exact selfplay trace tokens", () => {
    expect(
      safeSelfplayFacts(["privatePayloadish:ok", "deckOrderish:ok"]),
    ).toEqual(["deckOrderish:ok", "privatePayloadish:ok"]);
    expect(isSelfplayTraceRedactionSafe({ cardInstancesish: [] })).toBe(true);
  });

  it("does not report a positive stackable duplicate install as low delta", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "install_card", {
        selectedActionId: "install-positive-broker",
        runnerLowValueDuplicateInstallAction: true,
        evidence: [
          "semantic_score:854",
          "bankCommitmentStatus:install_ready",
          "persistentInstallDuplicateRole:useful_backup",
          "persistentInstallStackability:action_bank_parallel",
        ],
      }),
    ]);

    expect(
      detectAiSelfplaySuspiciousDecisions([summary], {
        detectorIds: ["duplicate_low_delta_install"],
      }),
    ).toHaveLength(0);
  });

  it.each([
    ["negative total", ["semantic_score:-20"]],
    [
      "deferred install",
      ["semantic_score:220", "bankCommitmentStatus:install_deferred"],
    ],
    [
      "redundant duplicate",
      [
        "semantic_score:220",
        "persistentInstallDuplicateRole:redundant_duplicate",
      ],
    ],
  ])("reports a %s duplicate install", (_label, evidence) => {
    const summary = selfplaySummary([
      selfplayAction("runner", 1, "install_card", {
        selectedActionId: "install-low-delta",
        runnerLowValueDuplicateInstallAction: true,
        evidence,
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["duplicate_low_delta_install"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("install-low-delta");
  });

  it("detects a clearly dominated repeated run selected by the plan", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 81, "start_run", {
        selectedActionId: "run-rd-negative",
        targetServerId: "rd",
        runnerRepeatedLowValueCentralRun: true,
        runnerRepeatedCentralRunWithoutFreshValue: true,
        evidence: [
          "tactical_plan_mapping_outcome:semantic_choice_blocked",
          "tactical_plan_type:runner.opportunistic_central_run",
        ],
        debugFacts: [
          "selection_score:runtime_raw_score:-1127",
          "runtime_why_not:alternative:start_run:rawSemanticScore:1643",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["clearly_dominated_plan_choice"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.relevantDebugFacts).toEqual(
      expect.arrayContaining([
        "dominated_selected_raw_score:-1127",
        "dominating_alternative_raw_score:1643",
      ]),
    );
  });

  it("detects a negative committed trash decline with a positive alternative", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 111, "decline_trash", {
        selectedActionId: "decline-planned-trash",
        evidence: [
          "runner_run_plan_objective:trash_asset_or_upgrade",
          "runner_run_plan_access_trash_policy:trash_if_value_positive",
          "runner_run_plan_access_reserve:2",
          "remote_trash_cost:2",
          "semantic_score:-1745",
        ],
        debugFacts: [
          "runtime_why_not:alternative:trash_accessed_card:rawSemanticScore:635",
        ],
      }),
    ]);

    const findings = detectAiSelfplaySuspiciousDecisions([summary], {
      detectorIds: ["clearly_dominated_plan_choice"],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]?.selectedActionId).toBe("decline-planned-trash");
  });

  it("does not call an over-budget trash decline clearly dominated", () => {
    const summary = selfplaySummary([
      selfplayAction("runner", 287, "decline_trash", {
        selectedActionId: "decline-over-budget-trash",
        evidence: [
          "runner_run_plan_objective:trash_asset_or_upgrade",
          "runner_run_plan_access_trash_policy:trash_if_value_positive",
          "runner_run_plan_access_reserve:2",
          "remote_trash_cost:3",
          "semantic_score:-1745",
        ],
        debugFacts: [
          "runtime_why_not:alternative:trash_accessed_card:rawSemanticScore:600",
        ],
      }),
    ]);

    expect(
      detectAiSelfplaySuspiciousDecisions([summary], {
        detectorIds: ["clearly_dominated_plan_choice"],
      }),
    ).toHaveLength(0);
  });

  it("does not classify a fresh-payoff or positive plan choice as dominated", () => {
    const fresh = selfplaySummary([
      selfplayAction("runner", 1, "start_run", {
        runnerRepeatedLowValueCentralRun: true,
        evidence: [
          "tactical_plan_mapping_outcome:plan_mapping_selected",
          "runner_rnd_fresh_memory",
        ],
        debugFacts: [
          "selection_score:runtime_raw_score:-20",
          "runtime_why_not:alternative:gain_credit:rawSemanticScore:100",
        ],
      }),
    ]);
    const positive = selfplaySummary([
      selfplayAction("runner", 2, "start_run", {
        runnerRepeatedLowValueCentralRun: true,
        evidence: ["tactical_plan_mapping_outcome:plan_mapping_selected"],
        debugFacts: [
          "selection_score:runtime_raw_score:20",
          "runtime_why_not:alternative:gain_credit:rawSemanticScore:100",
        ],
      }),
    ]);

    expect(
      detectAiSelfplaySuspiciousDecisions([fresh, positive], {
        detectorIds: ["clearly_dominated_plan_choice"],
      }),
    ).toHaveLength(0);
  });
});

function selfplaySummary(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary {
  return {
    seed: "selfplay-trace-mining",
    winner: "action_limit_reached",
    actions: actionSequence.length,
    turns: 2,
    finalAgendaPoints: { runner: 0, corp: 0 },
    finalStateHash: "fnv1a:selfplay-trace-mining",
    eventLogLength: actionSequence.length,
    replayOk: true,
    replayErrors: [],
    actionSequence,
    errors: [],
    cardPoolVersion: "0.99.0",
    metrics: {
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
    },
  };
}

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
