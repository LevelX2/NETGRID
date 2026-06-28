import type { AiSimulationSummary } from "../index";
import { describe, expect, it } from "vitest";
import {
  detectAiSelfplaySuspiciousDecisions,
  extractAiSelfplayDecisionPoints,
  isSelfplayTraceRedactionSafe,
  safeSelfplayFacts,
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
        debugFacts: [
          "runner_credit_base_recommendation:fund_useful_hand_card",
        ],
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

  it("drops forbidden debug facts during redaction", () => {
    expect(
      safeSelfplayFacts(["safe_fact", "privatePayload:bad", "deckOrder:bad"]),
    ).toEqual(["safe_fact"]);
    expect(isSelfplayTraceRedactionSafe({ cardInstances: [] })).toBe(false);
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
