import { describe, expect, it } from "vitest";

import { serializeAiPlanFirstDecisionVisibleJsonExport } from "../../app/ai-plan-first-decision-export";
import type { MaintenanceAiTraceDetail } from "../../app/maintenance";

describe("AI plan-first decision export", () => {
  it("exports the structured authority contract without legacy score semantics", () => {
    const output = serializeAiPlanFirstDecisionVisibleJsonExport(
      trace(),
      "trace",
      "2026-07-26T12:00:00.000Z",
    );
    const parsed = JSON.parse(output) as {
      schemaVersion: string;
      display: Record<string, unknown>;
    };

    expect(parsed.schemaVersion).toBe("netgrid-ai-decision-display-export-v2");
    expect(parsed.display).toMatchObject({
      contractStatus: "plan_first",
      selectedLegalAction: {
        actionId: "corp.draw",
        actionType: "draw_card",
      },
      planFirstDecision: {
        selectionAuthority: "resident_plan_instance",
        rootPlanInstanceId: "plan:corp.score_agenda:general",
        leafExecutorInstanceId: "plan:corp.economy:score-material",
        route: {
          stepId: "draw_score_material",
          actionId: "corp.draw",
        },
        turnPlanning: {
          schemaVersion: "ai-turn-planning-debug-v1",
          selectedLine: {
            stopReason: "observation_boundary",
          },
        },
      },
    });
    expect(output).not.toMatch(
      /actionRanking|semanticActionRanking|Plan-Zuschlag|TacticalPlan|rawScoreWinner/,
    );
  });
});

function trace(): MaintenanceAiTraceDetail {
  return {
    traceId: "trace-plan-first",
    matchId: "match-plan-first",
    eventId: "event-plan-first",
    stateVersion: 7,
    matchVersion: 8,
    side: "corp",
    turn: 2,
    decisionIndex: 3,
    selectedActionId: "corp.draw",
    selectedActionType: "draw_card",
    planKind: "corp.economy",
    confidence: 1,
    createdAt: "2026-07-26T11:59:00.000Z",
    schemaVersion: "ai-decision-trace-v1",
    meta: {},
    detail: {
      selectedActionId: "corp.draw",
      selectedActionType: "draw_card",
      actionAlternatives: [
        {
          rank: 1,
          actionId: "corp.draw",
          actionType: "draw_card",
          label: "Karte ziehen",
          selected: true,
          score: 999,
          priority: 1200,
        },
      ],
      rankedAlternatives: [
        {
          rank: 1,
          planKind: "legacy.semantic_score",
          score: 999,
        },
      ],
      planFirstDecision: {
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
          phase: "draw_for_parent",
          milestone: "open",
          parentInstanceId: "plan:corp.score_agenda:general",
          parentNeedId: "score-material:general",
          openNeedIds: [],
          blockers: [],
          evidenceCodes: ["exact_parent_need"],
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
        assessmentEvidenceCodes: ["exact_parent_need"],
        dispositions: [],
        portfolio: [],
        turnPlanning: {
          schemaVersion: "ai-turn-planning-debug-v1",
          mode: "projection_contract",
          stateVersion: 7,
          sideSafePlanningFingerprint: "planning-state:test",
          planningRulesFingerprint: "planning-rules:test",
          turnKey: "corp:turn:2",
          heads: [
            {
              candidateId: "head:corp.draw",
              moduleId: "corp.economy",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              actionId: "corp.draw",
              semanticActionType: "economy.draw",
              invocationKey: "invocation:test",
              witnessValid: true,
            },
          ],
          selectedLine: {
            lineId: "line:corp.draw",
            stopReason: "observation_boundary",
            projectedFrameKey: "projected-frame:test",
            cursor: { phaseIndex: 0, nodeIndex: 0 },
            phases: [
              {
                phaseId: "phase:score-material",
                rootPlanInstanceId: "plan:corp.score_agenda:general",
                rootModuleId: "corp.economy",
                rootProvenance: "admitted_support",
                entryFrameKey: "projected-frame:entry",
                completionCode: "observation_required",
                transitionKind: "observation_boundary",
                supportBindings: [],
                nodes: [
                  {
                    nodeId: "node:corp.draw",
                    semanticActionType: "economy.draw",
                    boundaryAfter: "private_observation",
                  },
                ],
              },
            ],
          },
          boundary: {
            kind: "private_observation",
            residualTurnValueBasis: "hand_quality_distribution",
            optionalityUnit: "hand_quality_band",
            optionalityMinimum: 0,
            optionalityMaximum: 1,
          },
          agendaComparison: {
            opportunityKey: "opening-rush:2:agenda-1:remote_1",
            selectedFamily: "pure_rush",
            selectionReason: "opening_rush_admission",
            randomizationEligible: true,
            lines: [
              {
                lineId: "line:pure-rush",
                family: "pure_rush",
                actionCount: 2,
                agendaProgress: 53,
                defense: 6,
                economy: 0,
                risk: 20,
                worstCaseFloor: 27,
                expectedValue: 55,
              },
            ],
          },
          pruneEvents: [],
          evidenceCodes: ["observation_boundary_requires_replanning"],
        },
      },
    },
  };
}
