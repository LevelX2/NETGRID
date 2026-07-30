import { describe, expect, it } from "vitest";

import {
  aiPlanFirstDispositionSummary,
  aiPlanFirstPriorityLabel,
  aiPlanFirstQuoteStatusLabel,
  aiPlanFirstSelectionAuthorityLabel,
  aiPlanFirstStepLabel,
  aiTurnPlanningModeLabel,
  parseAiPlanFirstDecisionDebug,
} from "./ai-plan-first-decision-ui";

describe("plan-first AI decision display", () => {
  it("parses the authoritative Root/Leaf/Step/LegalAction contract", () => {
    const decision = parseAiPlanFirstDecisionDebug(planDecision());

    expect(decision).toMatchObject({
      lane: "plan",
      selectionAuthority: "resident_plan_instance",
      rootPlanInstanceId: "plan:corp.score_agenda:general",
      leafExecutorInstanceId: "plan:corp.economy:score-material",
      selectedPlan: {
        parentInstanceId: "plan:corp.score_agenda:general",
        parentNeedId: "score-material:general",
      },
      route: {
        stepId: "draw_score_material",
        actionId: "corp.draw",
      },
      strategicContext: { authority: "diagnostic_only" },
    });
    expect(aiPlanFirstPriorityLabel(decision?.priority)).toBe(
      "P5 · Gewählten Plan vorbereiten oder unterstützen",
    );
    expect(
      decision
        ? aiPlanFirstDispositionSummary(decision)
        : { explicitlyNonproductive: -1, unknown: -1 },
    ).toEqual({ explicitlyNonproductive: 0, unknown: 1 });
  });

  it("labels P6 only as an explicit narrow contract", () => {
    const transition = parseAiPlanFirstDecisionDebug({
      ...planDecision(),
      priority: {
        ...planDecision().priority,
        requestedClass: "P6",
        effectiveClass: "P6",
        reasonCode: "neutral_progress",
        p6Contract: "temporary_bounded_liquidity_transition",
      },
    });
    const completion = parseAiPlanFirstDecisionDebug({
      ...planDecision(),
      priority: {
        ...planDecision().priority,
        requestedClass: "P6",
        effectiveClass: "P6",
        reasonCode: "turn_completion",
        p6Contract: "turn_completion",
      },
    });

    expect(aiPlanFirstPriorityLabel(transition?.priority)).toContain(
      "Eng befristeter Liquiditätsübergang",
    );
    expect(aiPlanFirstPriorityLabel(completion?.priority)).toContain(
      "Strukturell belegter Zugabschluss",
    );
    expect(aiPlanFirstPriorityLabel(transition?.priority)).not.toMatch(
      /Produktivität|Fallback/i,
    );
  });

  it("reduces a serialized resident route to its readable current step", () => {
    expect(
      aiPlanFirstStepLabel(
        "plan:corp_hand_and_agenda_management:resolve_hq_overflow%3Acorp%3A26:resolve_hq_overflow",
      ),
    ).toBe("Handkartenlimit erfüllen");
  });

  it("labels committed turn-plan authority distinctly from comparison and engine lanes", () => {
    expect(aiPlanFirstSelectionAuthorityLabel("turn_plan_commitment")).toBe(
      "aus dem verbindlichen Zugplan",
    );
    expect(aiPlanFirstSelectionAuthorityLabel("resident_plan_instance")).toBe(
      "aus einer gespeicherten Planinstanz",
    );
    expect(aiPlanFirstSelectionAuthorityLabel("engine_window")).toBe(
      "aus einem Engine-/Pflichtfenster",
    );
    expect(aiTurnPlanningModeLabel("cutover")).toBe("Verbindlicher Zugplaner");
    expect(aiTurnPlanningModeLabel("shadow")).toBe("Shadow-Vergleich");
  });

  it("fails closed for legacy-only data and exposes Unknown without estimates", () => {
    expect(
      parseAiPlanFirstDecisionDebug({
        tacticalPlan: "runner.build_credit_base",
        rawActionScore: 900,
      }),
    ).toBeUndefined();
    expect(aiPlanFirstQuoteStatusLabel("unknown")).toBe(
      "Unknown · keine Schätzung, fail-closed",
    );
  });
});

function planDecision() {
  return {
    schemaVersion: "ai-plan-first-decision-debug-v1",
    stateVersion: 7,
    lane: "plan",
    selectionAuthority: "resident_plan_instance",
    rootPlanInstanceId: "plan:corp.score_agenda:general",
    leafExecutorInstanceId: "plan:corp.economy:score-material",
    selectedPlan: {
      instanceId: "plan:corp.economy:score-material",
      dedupeKey: "score-material:general",
      moduleId: "corp.economy",
      moduleVersion: "1",
      viability: "ready",
      portfolioRole: "foreground",
      executionState: "executor",
      persistencePolicy: "flexible_support",
      phase: "fund_parent_need",
      milestone: "open",
      parentInstanceId: "plan:corp.score_agenda:general",
      parentNeedId: "score-material:general",
      openNeedIds: [],
      blockers: [],
      evidenceCodes: ["exact_score_material_need"],
    },
    priority: {
      requestedClass: "P5",
      effectiveClass: "P5",
      reasonCode: "required_parent_support",
      horizon: "current_turn",
      readiness: "executable_now",
      intentFit: "aligned",
      validationReasonCodes: ["priority_claim_accepted"],
      delegatedFromPlanInstanceId: "plan:corp.score_agenda:general",
      parentNeedId: "score-material:general",
    },
    route: {
      planInstanceId: "plan:corp.economy:score-material",
      stepId: "draw_score_material",
      capabilityId: "draw_card",
      purpose: "Satisfy exact score-material need",
      actionId: "corp.draw",
      actionType: "draw_card",
      semanticActionType: "economy.draw",
      stateVersion: 7,
    },
    strategicContext: {
      authority: "diagnostic_only",
      primaryStrategyId: "corp.remote_scoring",
      phase: "convert",
      intentFit: "aligned",
      signals: [],
    },
    engineQuoteEvidence: {
      status: "not_reported",
      evidenceCodes: [],
    },
    assessmentEvidenceCodes: ["exact_score_material_need"],
    dispositions: [
      {
        actionId: "corp.install-ice",
        disposition: "assessment_unknown",
        ownerModuleId: "corp.defend_servers",
        evidenceCode: "corp_install_quote_unknown",
      },
    ],
    portfolio: [],
  } as const;
}
