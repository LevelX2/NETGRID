import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import {
  DEFAULT_TACTICAL_GOAL_TAXONOMY,
  buildActionToGoalDiagnosticMappingReport,
  buildDeckDoctrineV2DiagnosticReadinessReport,
  buildTacticalGoalTaxonomyDiagnosticReport,
  type TacticalGoalDefinition,
} from "./action-doctrine-goal-diagnostics";

describe("buildDeckDoctrineV2DiagnosticReadinessReport", () => {
  it("surfaces fully evidenced card fields while retaining partial projection status", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 0, {
          source: "ai044-card",
        }),
      ],
      sideSafeAbilityBindings: [
        {
          actionId: "ai044-0-activated_card_ability",
          sourceCardId: "ai044-card",
          abilityId: "ability.ai044",
          method: "single_legal_ability_inferred",
          evidence: ["AI044 side-safe single ability"],
        },
      ],
      cardSemanticProfilesByCardId: {
        "ai044-card": {
          cardId: "ai044-card",
          tacticSignals: ["card.context.economy"],
          abilitySemantics: [
            {
              abilityId: "ability.ai044",
              tacticSignals: ["economy.burst"],
              strategySupport: [
                {
                  strategyId: "runner.rig_setup",
                  role: "support",
                  confidence: "medium",
                  evidence: "AI044 strategy support",
                },
              ],
              conditions: [
                {
                  kind: "board.economy_window",
                  status: "present",
                  evidence: ["AI044 condition"],
                },
              ],
              risks: [
                {
                  kind: "tempo_delay",
                  severity: "low",
                  evidence: ["AI044 risk"],
                },
              ],
              constraints: [
                {
                  kind: "credit_floor",
                  status: "satisfied",
                  evidence: ["AI044 constraint"],
                },
              ],
            },
          ],
        },
      },
    });
    if (!candidate) throw new Error("Expected one candidate");

    const report = buildDeckDoctrineV2DiagnosticReadinessReport([candidate]);

    expect(report.scope).toBe("diagnostic_only");
    expect(report.noEffectFlags).toMatchObject({
      planner: false,
      actionScore: false,
      engine: false,
      legality: false,
      hiddenInfoLeak: false,
    });
    expect(report.summary).toMatchObject({
      totalCandidates: 1,
      ready: 0,
      partial: 1,
      blocked: 0,
    });
    expect(report.entries[0]).toMatchObject({
      actionId: "ai044-0-activated_card_ability",
      sourceCardId: "ai044-card",
      readinessStatus: "partial",
    });
    expect(report.entries[0]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "projection_status",
          status: "partial",
        }),
        expect.objectContaining({
          fieldId: "strategy_support",
          status: "ready",
        }),
        expect.objectContaining({ fieldId: "conditions", status: "ready" }),
        expect.objectContaining({ fieldId: "risks", status: "ready" }),
        expect.objectContaining({ fieldId: "constraints", status: "ready" }),
      ]),
    );
  });

  it("surfaces unresolved card doctrine gaps without filling them", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("activated_card_ability", 1, {
          source: "ai044-ambiguous-card",
        }),
      ],
      cardSemanticProfilesByCardId: {
        "ai044-ambiguous-card": {
          cardId: "ai044-ambiguous-card",
          tacticSignals: ["card.context.multi"],
          abilitySemantics: [
            { abilityId: "ability.a", tacticSignals: ["draw.card"] },
            { abilityId: "ability.b", tacticSignals: ["economy.gain"] },
          ],
        },
      },
    });
    if (!candidate) throw new Error("Expected one candidate");

    const report = buildDeckDoctrineV2DiagnosticReadinessReport([candidate]);

    expect(report.summary).toMatchObject({
      totalCandidates: 1,
      ready: 0,
      partial: 1,
      blocked: 0,
    });
    expect(report.entries[0]?.readinessStatus).toBe("partial");
    expect(report.entries[0]?.deckDoctrineGaps).toEqual(
      expect.arrayContaining([
        "ability_unresolved",
        "ability_binding_partial",
        "strategy_support_missing",
        "conditions_missing",
      ]),
    );
  });

  it("keeps hidden-info-blocked candidates diagnostic-only and does not project target ids", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("trash_resource", 2, {
          targetRequirements: [
            {
              id: "hidden-resource",
              kind: "card",
              side: "runner",
              visibility: "engine_only",
            },
          ],
        }),
      ],
    });
    if (!candidate) throw new Error("Expected one candidate");

    const report = buildDeckDoctrineV2DiagnosticReadinessReport([candidate]);
    const serialized = JSON.stringify(report);

    expect(report.summary.blocked).toBe(1);
    expect(report.entries[0]?.readinessStatus).toBe("blocked");
    expect(report.entries[0]?.deckDoctrineGaps).toContain("hidden_info_blocked");
    expect(report.entries[0]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldId: "hidden_info_guard",
          status: "blocked",
        }),
      ]),
    );
    expect(serialized).not.toContain("secret-runner-resource-card");
  });
});

describe("buildTacticalGoalTaxonomyDiagnosticReport", () => {
  it("reports a side-balanced diagnostic TacticalGoal taxonomy without productive use", () => {
    const report = buildTacticalGoalTaxonomyDiagnosticReport();
    const serialized = JSON.stringify(report);

    expect(report.scope).toBe("diagnostic_taxonomy_only");
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toMatchObject({
      totalGoals: DEFAULT_TACTICAL_GOAL_TAXONOMY.length,
      runnerGoals: 5,
      corpGoals: 5,
      blockerPolicyCount: 10,
      validationIssues: [],
    });
    expect(report.summary.lifecycleStates.blocked_by_gap).toBeGreaterThan(0);
    expect(report.definitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          goalId: "runner.remote_contest",
          side: "runner",
          family: "runner_remote_contest",
          lifecycleState: "blocked_by_gap",
        }),
        expect.objectContaining({
          goalId: "corp.tag_trace_punish",
          side: "corp",
          family: "corp_tag_trace_punish",
          lifecycleState: "blocked_by_gap",
        }),
      ]),
    );
    expect(serialized).not.toContain("selectedActionId");
    expect(serialized).not.toContain("rankedAlternatives");
    expect(serialized).not.toContain("numericActionScore");
  });

  it("keeps blocker removal conditions explicit for gap-marked goals", () => {
    const report = buildTacticalGoalTaxonomyDiagnosticReport();
    const runnerRig = report.definitions.find(
      (goal) => goal.goalId === "runner.rig_setup",
    );

    expect(runnerRig?.blockerPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockerId: "runner_rig_missing_card_semantics",
          issues: expect.arrayContaining([
            "card_semantics_unavailable",
            "ability_unresolved",
          ]),
          removalCondition:
            "Provide side-safe CardSemanticProfile and ability binding evidence.",
        }),
      ]),
    );
  });

  it("surfaces invalid taxonomy definitions as diagnostics instead of using them", () => {
    const duplicateGoal: TacticalGoalDefinition = {
      ...DEFAULT_TACTICAL_GOAL_TAXONOMY[0],
      family: "corp_economy_stabilize",
    };

    const report = buildTacticalGoalTaxonomyDiagnosticReport([
      DEFAULT_TACTICAL_GOAL_TAXONOMY[0],
      duplicateGoal,
    ]);

    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ issueId: "duplicate_goal_id" }),
        expect.objectContaining({ issueId: "side_family_mismatch" }),
      ]),
    );
  });
});

describe("buildActionToGoalDiagnosticMappingReport", () => {
  it("builds an input-ordered diagnostic mapping table without ranking or selection", () => {
    const candidates = buildActionSemanticCandidates({
      legalActions: [
        legalAction("gain_credit", 0, {
          source: "basic_action",
          side: "runner",
          costs: [{ clicks: 1 }],
        }),
        legalAction("rez_ice", 1, {
          source: "corp-ice",
          side: "corp",
          costs: [{ credits: 3 }],
          targetRequirements: [
            {
              id: "ice",
              kind: "card",
              side: "corp",
              visibility: "known_to_actor",
            },
          ],
        }),
        legalAction("trash_resource", 2, {
          source: "basic_action",
          side: "runner",
          targetRequirements: [
            {
              id: "hidden-resource",
              kind: "card",
              side: "runner",
              visibility: "engine_only",
            },
          ],
        }),
      ],
      selectedTargetsByActionId: {
        "ai044-1-rez_ice": {
          ice: "outermost-ice",
        },
      },
    });

    const report = buildActionToGoalDiagnosticMappingReport(candidates);
    const serialized = JSON.stringify(report);

    expect(report.scope).toBe("diagnostic_mapping_only");
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.summary).toEqual({
      totalCandidates: 3,
      totalGoals: DEFAULT_TACTICAL_GOAL_TAXONOMY.length,
      totalMappings: 30,
      compatible: 3,
      blocked: 2,
      unknown: 10,
      notApplicable: 15,
    });
    expect(report.mappings[0]).toMatchObject({
      actionId: "ai044-0-gain_credit",
      goalId: "runner.economy_stabilize",
      status: "compatible",
      inputOrder: { candidateIndex: 0, goalIndex: 0 },
    });
    expect(serialized).not.toContain("selectedActionId");
    expect(serialized).not.toContain("rankedAlternatives");
    expect(serialized).not.toContain("numericActionScore");
  });

  it("blocks hidden-info mappings with explicit removal conditions", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("trash_resource", 0, {
          source: "basic_action",
          side: "runner",
          targetRequirements: [
            {
              id: "hidden-resource",
              kind: "card",
              side: "runner",
              visibility: "engine_only",
            },
          ],
        }),
      ],
    });
    if (!candidate) throw new Error("Expected one candidate");

    const report = buildActionToGoalDiagnosticMappingReport([candidate]);
    const remoteContest = report.mappings.find(
      (mapping) => mapping.goalId === "runner.remote_contest",
    );

    expect(remoteContest).toMatchObject({
      actionId: "ai044-0-trash_resource",
      status: "blocked",
      blockerIds: ["runner_remote_hidden_target"],
    });
    expect(remoteContest?.reasons[0]).toContain(
      "Keep hidden remote contents blocked",
    );
    expect(JSON.stringify(remoteContest)).not.toContain(
      "secret-runner-resource-card",
    );
  });

  it("marks missing evidence as unknown instead of inferring action-goal fit", () => {
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [
        legalAction("start_run", 0, {
          source: "basic_action",
          side: "runner",
        }),
      ],
    });
    if (!candidate) throw new Error("Expected one candidate");

    const report = buildActionToGoalDiagnosticMappingReport([candidate]);
    const centralPressure = report.mappings.find(
      (mapping) => mapping.goalId === "runner.central_pressure",
    );

    expect(centralPressure).toMatchObject({
      status: "unknown",
      missingCandidateFields: expect.arrayContaining([
        "actionTacticSignals",
        "targetContext",
      ]),
      blockerIds: [],
    });
  });
});

function legalAction(
  type: LegalAction["type"],
  index: number,
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId: `ai044-${index}-${type}`,
    side: index % 2 === 0 ? "runner" : "corp",
    type,
    label: `AI044 fixture ${type}`,
    source: type === "trash_resource" ? "basic_action" : `card-${type}`,
    timingPoint: index % 2 === 0 ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 45,
    ...overrides,
  };
}
