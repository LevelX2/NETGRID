import { describe, expect, it } from "vitest";

import {
  CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  FORBIDDEN_SHADOW_TRACE_CONSUMERS,
  buildShadowModeTraceContractReport,
  type ShadowDecisionTrace,
} from "./controlled-shadow-mode";

describe("buildShadowModeTraceContractReport", () => {
  it("defines a developer-only no-runtime-effect trace contract", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.schemaVersion).toBe("shadow-mode-trace-contract-v1");
    expect(report.scope).toBe("trace_contract_only");
    expect(report.typeName).toBe("ShadowDecisionTrace");
    expect(report.visibilityScope).toBe("developer_only");
    expect(report.noRuntimeEffect).toBe(true);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.runtimeConsumerStatus).toBe("none");
  });

  it("requires legacy and semantic shadow decision evidence without allowing execution", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.requiredTraceFields).toEqual(
      expect.arrayContaining([
        "legacyDecision",
        "legalActionSummary",
        "candidateSummary",
        "tacticalGoals",
        "doctrineReadiness",
        "hardGates",
        "visibilityScope",
        "noRuntimeEffect",
      ]),
    );
    expect(report.requiredLegacyDecisionFields).toEqual(
      expect.arrayContaining([
        "selectedActionId",
        "selectedActionType",
        "source",
      ]),
    );
    expect(report.requiredSemanticDecisionFields).toEqual(
      expect.arrayContaining([
        "scoreStatus",
        "topCandidates",
        "blockedCandidates",
        "whyNot",
      ]),
    );
    expect(report.actualDecisionContract).toBe(
      "actualDecision_equals_legacyDecision",
    );
  });

  it("names public and runtime consumers as forbidden trace consumers", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.forbiddenConsumers).toEqual(FORBIDDEN_SHADOW_TRACE_CONSUMERS);
    expect(report.forbiddenConsumers).toEqual(
      expect.arrayContaining([
        "applyAction",
        "PlayerAction",
        "PublicEvent",
        "PlayerView",
        "WebSocket payload",
        "Replay payload",
        "Planner weights",
      ]),
    );
  });

  it("keeps every controlled shadow mode no-effect flag false", () => {
    const report = buildShadowModeTraceContractReport();

    expect(report.noEffectFlags).toEqual(CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS);
    expect(Object.values(report.noEffectFlags)).toEqual(
      expect.arrayContaining([false]),
    );
    expect(Object.values(report.noEffectFlags).every((value) => value === false)).toBe(
      true,
    );
  });
});

describe("ShadowDecisionTrace", () => {
  it("can represent legacy execution and semantic shadow diagnostics side by side", () => {
    const trace = {
      traceId: "trace-ai051-example",
      stateVersion: 12,
      actorSide: "runner",
      legacyDecision: {
        selectedActionId: "gain-credit-1",
        selectedActionType: "gain_credit",
        source: "legacy_ai",
        selectedFromLegalActions: true,
        evidence: ["legacy selected an engine LegalAction"],
      },
      semanticShadowDecision: {
        selectedActionId: "draw-card-1",
        selectedCandidateId: "candidate-draw-card-1",
        scoreStatus: "ranked_shadow_only",
        topCandidates: [],
        blockedCandidates: [],
        whyNot: [],
        noRuntimeEffect: true,
      },
      legalActionSummary: [
        {
          actionId: "gain-credit-1",
          actionType: "gain_credit",
          source: "engine_legal_actions",
          visibilityScope: "actor_private",
        },
      ],
      candidateSummary: [
        {
          candidateId: "candidate-draw-card-1",
          actionId: "draw-card-1",
          actionType: "draw_card",
          primaryProjectionStatus: "projected",
          hardGateStatus: "pass",
          projectionIssues: [],
        },
      ],
      tacticalGoals: [
        {
          goalId: "runner.economy_stabilize",
          family: "runner_economy_stabilize",
          side: "runner",
          readiness: "ready",
          evidence: ["goal is side-safe"],
        },
      ],
      doctrineReadiness: {
        status: "ready",
        gaps: [],
        evidence: ["doctrine diagnostics are side-safe"],
      },
      hardGates: {
        gateResults: [
          {
            gateId: "actual_decision_legacy_only",
            status: "pass",
            severity: "info",
            evidence: ["actualDecision remains legacyDecision"],
          },
        ],
        illegalSemanticDecisionCount: 0,
        hiddenInfoViolationCount: 0,
        runtimeEffectCount: 0,
        actualDecisionOverrideCount: 0,
        nonEngineLegalAssumptionCount: 0,
      },
      visibilityScope: "developer_only",
      noRuntimeEffect: true,
    } satisfies ShadowDecisionTrace;

    expect(trace.legacyDecision.source).toBe("legacy_ai");
    expect(trace.semanticShadowDecision?.noRuntimeEffect).toBe(true);
    expect(trace.visibilityScope).toBe("developer_only");
    expect(trace.hardGates.actualDecisionOverrideCount).toBe(0);
  });
});
