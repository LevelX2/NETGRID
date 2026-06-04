import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildDeckDoctrineV2DiagnosticReadinessReport } from "./action-doctrine-goal-diagnostics";

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
