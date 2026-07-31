import { describe, expect, it } from "vitest";

import type { AiPlanFirstDecisionDebug } from "@netgrid/shared";

import { aiTurnPlanComparison } from "./ai-turn-plan-comparison-ui";

describe("AI turn-plan comparison UI", () => {
  it("keeps the selected line visible and orders it before alternatives", () => {
    const decision = planFirstDecision();
    const result = aiTurnPlanComparison(
      decision,
      new Map([
        ["corp.draw", "Karte ziehen"],
        ["corp.install", "ICE installieren"],
      ]),
    );

    expect(result).toBeDefined();
    expect(result?.cards).toHaveLength(2);
    expect(result?.cards[0]).toMatchObject({
      lineId: "line:selected",
      selected: true,
      actionId: "corp.draw",
      actionLabel: "Karte ziehen",
      moduleId: "corp.economy",
      scalarValue: 51,
      stepCount: 2,
    });
    expect(result?.cards[0]?.selectedPhases).toHaveLength(1);
    expect(result?.cards[1]).toMatchObject({
      lineId: "line:defense",
      selected: false,
      actionLabel: "ICE installieren",
      scalarValue: 46,
      defenseLine: {
        targetServerId: "remote_1",
        totalValue: 46,
      },
      steps: [
        expect.objectContaining({
          semanticActionType: "defense.install",
          currentActionId: "corp.install",
        }),
      ],
      evaluationValues: {
        defense: 40,
        economy: 5,
        bluff: 1,
      },
    });
  });

  it("exposes the planner reason and does not mutate considered lines", () => {
    const decision = planFirstDecision();
    const originalLines = structuredClone(
      decision.turnPlanning?.consideredLines,
    );

    const result = aiTurnPlanComparison(decision, new Map());

    expect(result?.selectionReason).toBe("turn_plan_best_valid_line");
    expect(decision.turnPlanning?.consideredLines).toEqual(originalLines);
  });
});

function planFirstDecision(): AiPlanFirstDecisionDebug {
  return {
    schemaVersion: "ai-plan-first-decision-debug-v1",
    stateVersion: 7,
    lane: "plan",
    selectionAuthority: "turn_plan_commitment",
    rootPlanInstanceId: "plan:economy",
    leafExecutorInstanceId: "plan:economy",
    selectedPlan: planInstance("plan:economy", "corp.economy"),
    priority: {
      requestedClass: "P4",
      effectiveClass: "P4",
      reasonCode: "turn_plan_best_valid_line",
      horizon: "current_turn",
      readiness: "executable_now",
      intentFit: "aligned",
      validationReasonCodes: ["priority_claim_accepted"],
    },
    route: {
      planInstanceId: "plan:economy",
      stepId: "draw",
      capabilityId: "draw_card",
      purpose: "Improve hand",
      actionId: "corp.draw",
      actionType: "draw_card",
      semanticActionType: "economy.draw",
      stateVersion: 7,
    },
    strategicContext: {
      authority: "diagnostic_only",
      intentFit: "aligned",
      signals: [],
    },
    engineQuoteEvidence: {
      status: "certified",
      evidenceCodes: [],
    },
    assessmentEvidenceCodes: [],
    dispositions: [],
    portfolio: [
      planInstance("plan:economy", "corp.economy"),
      planInstance("plan:defense", "corp.defend_servers"),
    ],
    turnPlanning: {
      schemaVersion: "ai-turn-planning-debug-v1",
      mode: "cutover",
      stateVersion: 7,
      sideSafePlanningFingerprint: "planning:test",
      planningRulesFingerprint: "rules:test",
      turnKey: "corp:turn:3",
      heads: [
        {
          candidateId: "head:draw",
          moduleId: "corp.economy",
          rootPlanInstanceId: "plan:economy",
          actionId: "corp.draw",
          semanticActionType: "economy.draw",
          invocationKey: "invoke:draw",
          witnessValid: true,
        },
        {
          candidateId: "head:defense",
          moduleId: "corp.defend_servers",
          rootPlanInstanceId: "plan:defense",
          actionId: "corp.install",
          semanticActionType: "defense.install",
          invocationKey: "invoke:defense",
          witnessValid: true,
        },
      ],
      selectedLine: {
        lineId: "line:selected",
        stopReason: "observation_boundary",
        projectedFrameKey: "frame:selected",
        cursor: { phaseIndex: 0, nodeIndex: 0 },
        phases: [
          {
            phaseId: "phase:economy",
            rootPlanInstanceId: "plan:economy",
            rootModuleId: "corp.economy",
            rootProvenance: "resident",
            entryFrameKey: "frame:entry",
            completionCode: "observation_required",
            transitionKind: "observation_boundary",
            supportBindings: [],
            nodes: [
              {
                nodeId: "node:draw",
                semanticActionType: "economy.draw",
              },
              {
                nodeId: "node:install",
                semanticActionType: "economy.install",
              },
            ],
          },
        ],
      },
      search: {
        headCount: 2,
        lineCount: 2,
        expandedNodeCount: 4,
        protectedPartitionCount: 2,
        conservativeBaselineCount: 1,
        maximumDepth: 2,
        maximumExpandedNodes: 16,
        maximumBranchesPerPartition: 4,
        maximumParetoLinesPerPartition: 3,
        selectedLineScalarValue: 51,
        selectedLineStepCount: 2,
      },
      consideredLines: [
        {
          lineId: "line:defense",
          firstActionId: "corp.install",
          rootPlanInstanceId: "plan:defense",
          stepCount: 1,
          scalarValue: 46,
          stopReason: "projected_turn_end",
          violatedObligationCount: 0,
          steps: [
            {
              candidateId: "head:defense",
              semanticActionType: "defense.install",
              rootPlanInstanceId: "plan:defense",
              nextMilestoneId: "remote-protected",
              currentActionId: "corp.install",
            },
          ],
          evaluationValues: {
            defense: 40,
            economy: 5,
            bluff: 1,
          },
          evidenceCodes: ["defense_line_quoted"],
        },
      ],
      defenseComparison: {
        selectedLineId: "line:defense",
        lines: [
          {
            lineId: "line:defense",
            targetServerId: "remote_1",
            disposition: "install_rez_ready",
            actionCount: 1,
            fundingGapBefore: 0,
            fundingGapAfter: 0,
            rezReadyAfterLine: true,
            bluffValue: 1,
            defenseValue: 40,
            economyValue: 5,
            totalValue: 46,
          },
        ],
        rejected: [],
      },
      pruneEvents: [],
      evidenceCodes: [],
    },
  };
}

function planInstance(instanceId: string, moduleId: string) {
  return {
    instanceId,
    dedupeKey: instanceId,
    moduleId,
    moduleVersion: "1",
    viability: "ready",
    portfolioRole: "foreground",
    executionState: "ready",
    persistencePolicy: "turn",
    phase: "ready",
    milestone: "start",
    openNeedIds: [],
    blockers: [],
    evidenceCodes: [],
  };
}
