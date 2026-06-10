import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type {
  ActionCardSemanticProfile,
  StrategySupportPair,
} from "../action-semantic-candidate";
import { buildActionSemanticInvariantReport } from "./action-semantic-invariants";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);

describe("Action semantic invariants", () => {
  it("accepts behavior-based signals, complete StrategySupportPairs and side-safe TargetProfiles", () => {
    const report = buildActionSemanticInvariantReport([
      {
        cardId: "onr_v1_valid_semantic_profile",
        tacticSignals: ["card.context.economy"],
        abilitySemantics: [
          {
            abilityId: "ability.economy_burst",
            tacticSignals: ["economy.burst"],
            strategySupport: [
              {
                strategyId: "runner.rig_setup",
                role: "economy_enabler",
                confidence: "medium",
                evidence: "Visible legal action creates usable credits.",
              },
            ],
            targetProfileMatches: [
              {
                targetProfileId: "tp.runner_visible_card",
                status: "matched",
                issues: [],
                evidence: ["LegalAction selected target is actor-visible."],
              },
            ],
          },
        ],
      },
    ]);

    expect(report).toMatchObject({
      scope: "diagnostic_only",
      productiveUseAllowed: false,
      checkedProfileCount: 1,
      valid: true,
      issues: [],
    });
    expect(report.noEffectFlags).toEqual(
      expect.arrayContaining([
        "no_runtime_scoring",
        "no_action_selection",
        "no_legal_action_generation",
        "no_hidden_info_projection",
      ]),
    );
  });

  it("reports structural signals, incomplete support pairs, support-only anchors and hidden TargetProfiles", () => {
    const incompletePair = {
      strategyId: "runner.central_pressure",
      role: "support",
      confidence: "medium",
    } as unknown as StrategySupportPair;
    const invalidProfile: ActionCardSemanticProfile = {
      cardId: "fixture_hidden_profile",
      tacticSignals: ["card.name.hidden_fixture"],
      strategySupport: [incompletePair],
      abilitySemantics: [
        {
          abilityId: "ability.support_only",
          tacticSignals: ["trace_defense.support_only"],
          strategySupport: [
            {
              strategyId: "runner.survival",
              role: "support",
              confidence: "low",
              evidence:
                "Support-only trace defense must stay below strategy anchor.",
            },
          ],
          targetProfileMatches: [
            {
              targetProfileId: "tp.hidden_remote_card",
              status: "matched",
              issues: ["hidden_info_blocked"],
              evidence: ["Hidden remote card identity would be required."],
            },
          ],
        },
      ],
    };

    const report = buildActionSemanticInvariantReport([invalidProfile]);
    const issueIds = report.issues.map((issue) => issue.issueId);

    expect(report.valid).toBe(false);
    expect(issueIds).toEqual(
      expect.arrayContaining([
        "fixture_profile_in_production_scope",
        "pure_type_subtype_name_signal",
        "strategy_support_pair_incomplete",
        "support_only_strategy_id",
        "target_profile_hidden_info",
      ]),
    );
    expect(JSON.stringify(report)).not.toContain("selectedActionId");
    expect(JSON.stringify(report)).not.toContain("rankedAlternatives");
  });

  it("stays out of runtime selection modules", () => {
    for (const sourcePath of [
      "packages/ai/src/index.ts",
      "packages/ai/src/runtime/semantic-runtime.ts",
      "packages/ai/src/runtime/semantic-choice-ranking.ts",
    ]) {
      const source = readFileSync(path.join(repoRoot, sourcePath), "utf8");
      expect(source).not.toContain("action-semantic-invariants");
      expect(source).not.toContain("buildActionSemanticInvariantReport");
    }
  });
});
