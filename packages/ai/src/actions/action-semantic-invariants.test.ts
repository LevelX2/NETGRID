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

  it("keeps originalset play-strength semantic worklists complete and diagnostic", () => {
    const report = readFileSync(
      path.join(
        repoRoot,
        "docs/reviews/ai/ai-originalset-play-strength-semantic-worklists-2026-06-12.md",
      ),
      "utf8",
    );

    expect(report).toContain("diagnostic_worklists_only");
    expect(report).toContain("`productiveUseAllowed`: `false`");
    expect(report).toContain("`semanticExecutionAllowed`: `false`");
    expect(report).toContain("`runtimeConsumerStatus`: `none`");
    expect(report).toContain("`noRuntimeEffect`: `true`");
    expect(report).toContain("Taktiksignale müssen funktionale Wirkung beschreiben");
    expect(report).toContain(
      "Damage, Tag, Conditions, TargetProfiles und RiskProjection bleiben getrennte Prüfflächen",
    );

    const expectedWorklists = [
      "AI-ORIG-WL-01-runner-multiaccess-access-payoff",
      "AI-ORIG-WL-02-runner-breaker-search-install",
      "AI-ORIG-WL-03-runner-survival-damage-prevention",
      "AI-ORIG-WL-04-runner-economy-banks-commitments",
      "AI-ORIG-WL-05-runner-risky-random-run-tools",
      "AI-ORIG-WL-06-corp-score-windows-advance-support",
      "AI-ORIG-WL-07-corp-rez-economy-ice-tax",
      "AI-ORIG-WL-08-corp-tag-punish",
      "AI-ORIG-WL-09-corp-damage-ambush-access-punish",
      "AI-ORIG-WL-10-corp-asset-economy",
      "AI-ORIG-WL-11-target-profile-gaps",
      "AI-ORIG-WL-12-risk-projection-gaps",
    ];

    for (const worklist of expectedWorklists) {
      expect(report).toContain(`\`${worklist}\``);
    }
    expect(
      [...report.matchAll(/`AI-ORIG-WL-\d{2}-[^`]+`/g)].map(
        (match) => match[0],
      ),
    ).toHaveLength(expectedWorklists.length);
  });
});
