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
          mode: "shadow",
          selectedLine: {
            stopReason: "observation_boundary",
          },
          shadowComparison: {
            liveActionId: "corp.draw",
            shadowActionId: "corp.install",
            boundedBaselineActionId: "corp.gain-credit",
            comparisonClass: "two_step_changes_head",
            twoStepChangedHead: true,
          },
          coverage: {
            status: "pass",
            coveragePercent: 100,
            missingActionCount: 0,
            conflictingActionCount: 0,
          },
          search: {
            maximumDepth: 2,
            selectedLineStepCount: 2,
          },
          campaigns: [
            {
              kind: "opening_rush",
              status: "awaiting_opponent_outcome",
              requoteStatus: "awaiting_next_own_turn",
            },
          ],
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
          mode: "shadow",
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
          commitment: {
            commitmentId: "commitment:corp:turn:2",
            status: "awaiting_observation",
            cursor: {
              phaseIndex: 0,
              nodeIndex: 0,
              phaseId: "phase:score-material",
              nodeId: "node:corp.draw",
            },
            phaseEntry: {
              phaseId: "phase:score-material",
              status: "validated",
              reasonCode: "phase_entry_validated",
            },
            rematerialization: {
              status: "replan_required",
              reasonCode: "scheduled_information_boundary",
            },
            observationClass: "scheduled_information_boundary",
            replanReason: "scheduled_information_boundary",
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
          defenseComparison: {
            selectedLineId: "line:defense",
            lines: [
              {
                lineId: "line:defense",
                targetServerId: "rd",
                disposition: "stage_for_later_rez",
                actionCount: 1,
                fundingGapBefore: 2,
                fundingGapAfter: 2,
                rezReadyAfterLine: false,
                bluffValue: 0,
                defenseValue: 18,
                economyValue: 0,
                totalValue: 12,
              },
            ],
            rejected: [],
          },
          campaigns: [
            {
              campaignId: "campaign:agenda:agenda-1:remote_1",
              kind: "opening_rush",
              status: "awaiting_opponent_outcome",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              moduleId: "corp.score_agenda",
              milestoneId: "agenda_installed",
              targetServerId: "remote_1",
              targetCardInstanceId: "agenda-1",
              openingRushOpportunityKey: "opening-rush:2:agenda-1:remote_1",
              requoteStatus: "awaiting_next_own_turn",
              requoteReasonCode: "campaign_waits_for_public_opponent_outcomes",
              publicOutcomes: [
                {
                  outcomeId: "event-run:run_declared:campaign",
                  eventId: "event-run",
                  eventType: "start_run",
                  stateVersionAfter: 8,
                  kind: "run_declared",
                  milestoneId: "opponent_run_observed",
                  origin: "public_event",
                  targetServerId: "remote_1",
                  evidenceCode: "campaign_public_run",
                },
              ],
              evidenceCodes: ["campaign_status:awaiting_opponent_outcome"],
            },
          ],
          shadowComparison: {
            liveActionId: "corp.draw",
            shadowActionId: "corp.install",
            shadowRootPlanInstanceId: "plan:corp.score_agenda:general",
            boundedBaselineActionId: "corp.gain-credit",
            agreement: false,
            comparisonClass: "two_step_changes_head",
            twoStepChangedHead: true,
          },
          coverage: {
            status: "pass",
            coveragePercent: 100,
            legalActionCount: 3,
            productiveActionCount: 2,
            explicitlyNonproductiveActionCount: 1,
            assessmentUnknownActionCount: 0,
            engineWindowActionCount: 0,
            missingActionCount: 0,
            conflictingActionCount: 0,
            issueCodes: [],
            missingActionIds: [],
            conflictingActionIds: [],
          },
          search: {
            headCount: 2,
            lineCount: 2,
            expandedNodeCount: 3,
            protectedPartitionCount: 1,
            conservativeBaselineCount: 1,
            maximumDepth: 2,
            maximumExpandedNodes: 64,
            maximumBranchesPerPartition: 16,
            maximumParetoLinesPerPartition: 4,
            selectedLineScalarValue: 42,
            selectedLineStepCount: 2,
          },
          consideredLines: [
            {
              lineId: "line:shadow-two-step",
              firstActionId: "corp.install",
              rootPlanInstanceId: "plan:corp.score_agenda:general",
              stepCount: 2,
              scalarValue: 42,
              stopReason: "observation_boundary",
              violatedObligationCount: 0,
            },
          ],
          pruneEvents: [],
          evidenceCodes: ["observation_boundary_requires_replanning"],
        },
      },
    },
  };
}
