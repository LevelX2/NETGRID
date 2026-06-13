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

  it("keeps proteus play-strength readiness diagnostic and gated behind originalset stability", () => {
    const report = readFileSync(
      path.join(
        repoRoot,
        "docs/reviews/ai/ai-proteus-play-strength-readiness-2026-06-12.md",
      ),
      "utf8",
    );

    expect(report).toContain("diagnostic_readiness_only");
    expect(report).toContain(
      "Proteus bleibt für KI-Play-Strength zurückgestellt",
    );
    expect(report).toContain("Originalset-Worklists haben Vorrang");
    expect(report).toContain("`productiveUseAllowed`: `false`");
    expect(report).toContain("`semanticExecutionAllowed`: `false`");
    expect(report).toContain("`runtimeConsumerStatus`: `none`");
    expect(report).toContain("`noRuntimeEffect`: `true`");

    const expectedReadinessAreas = [
      "AI-PROTEUS-READ-01-random-outcomes",
      "AI-PROTEUS-READ-02-bad-publicity",
      "AI-PROTEUS-READ-03-ambush-virus",
      "AI-PROTEUS-READ-04-variable-x-costs",
      "AI-PROTEUS-READ-05-temporary-actions",
      "AI-PROTEUS-READ-06-complex-run-modification",
      "AI-PROTEUS-READ-07-target-choice-gaps",
      "AI-PROTEUS-READ-08-risk-projection-gaps",
    ];

    for (const readinessArea of expectedReadinessAreas) {
      expect(report).toContain(`\`${readinessArea}\``);
    }
    expect(
      [...report.matchAll(/`AI-PROTEUS-READ-\d{2}-[^`]+`/g)].map(
        (match) => match[0],
      ),
    ).toHaveLength(expectedReadinessAreas.length);
  });

  it("covers runner breaker-search worklist package one as diagnostic semantics", () => {
    const profiles: ActionCardSemanticProfile[] = [
      runnerBreakerSearchProfile("Self-Modifying Code", [
        "coverage.search_program",
        "target_profile.program_from_stack_gap",
      ]),
      runnerBreakerSearchProfile("Mystery Box", [
        "coverage.search_program",
        "risk.random_outcome",
      ]),
      runnerBreakerSearchProfile("The Short Circuit", [
        "coverage.install_breaker",
        "risk.temporary_program",
      ]),
      runnerBreakerSearchProfile("Mantis, Fixer-at-Large", [
        "coverage.search_program",
        "target_profile.runner_program",
      ]),
      runnerBreakerSearchProfile("Temple Microcode Outlet", [
        "coverage.install_breaker",
        "target_profile.program_install",
      ]),
      runnerBreakerSearchProfile("Test Spin", [
        "coverage.search_program",
        "risk.random_outcome",
      ]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(report.productiveUseAllowed).toBe(false);
    expect(report.noEffectFlags).toEqual(
      expect.arrayContaining(["no_runtime_scoring", "no_action_selection"]),
    );
  });

  it("covers runner survival risk worklist package one as diagnostic semantics", () => {
    const profiles = [
      runnerRiskProfile("Arasaka Owns You", ["risk.self_brain_damage"]),
      runnerRiskProfile("Emergency Self-Construct", ["survival.flatline_prevention"]),
      runnerRiskProfile("Force Shield", ["survival.damage_prevention"]),
      runnerRiskProfile("Shield", ["survival.damage_prevention"]),
      runnerRiskProfile("Armored Fridge", ["survival.damage_prevention"]),
      runnerRiskProfile("Trauma Team", ["survival.flatline_prevention"]),
      runnerRiskProfile("Lifesaver Nanosurgeons", [
        "survival.flatline_prevention",
      ]),
      runnerRiskProfile("Preying Mantis", ["risk.random_damage"]),
      runnerRiskProfile("Quest for Cattekin", ["risk.action_loss"]),
      runnerRiskProfile("Lucidrine Booster Drug", [
        "risk.random_damage",
        "risk.action_loss",
      ]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "risk.self_brain_damage",
        "survival.flatline_prevention",
        "risk.random_damage",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers corp score advance worklist package one as diagnostic semantics", () => {
    const profiles = [
      corpSemanticProfile("Project Consultants", ["advance.counter_placement"]),
      corpSemanticProfile("Management Shake-Up", ["advance.counter_transfer"]),
      corpSemanticProfile("Systematic Layoffs", ["advance.counter_cashout"]),
      corpSemanticProfile("Team Restructuring", ["advance.counter_transfer"]),
      corpSemanticProfile("Falsified-Transactions Expert", [
        "advance.counter_cashout",
      ]),
      corpSemanticProfile("Chicago Branch", ["advance.overadvance_support"]),
      corpSemanticProfile("Vapor Ops", ["corp_scoreline.doctrine_link"]),
      corpSemanticProfile("Project Babylon", ["advance.overadvance_support"]),
      corpSemanticProfile("Project Venice", ["advance.overadvance_support"]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "advance.counter_placement",
        "advance.counter_transfer",
        "advance.overadvance_support",
        "advance.counter_cashout",
        "corp_scoreline.doctrine_link",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });
});

function runnerBreakerSearchProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.coverage_search`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "runner.doctrine.breaker_search",
            role: "coverage_enabler",
            confidence: "medium",
            evidence: `${title} is classified by functional search/install coverage semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.runner_program_or_stack_search",
            status: "gap",
            issues: ["target_choice_gap"],
            evidence: ["TargetProfile remains diagnostic and side-safe."],
          },
        ],
      },
    ],
  };
}

function runnerRiskProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.survival_risk`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "runner.doctrine.survival",
            role: "risk_control",
            confidence: "medium",
            evidence: `${title} is classified by functional survival and risk semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.runner_self_or_damage_context",
            status: "gap",
            issues: ["risk_projection_gap"],
            evidence: ["Damage prevention precision remains diagnostic."],
          },
        ],
      },
    ],
  };
}

function corpSemanticProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.corp_semantic`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "corp.doctrine.remote_scoring_scoreline",
            role: "scoreline_support",
            confidence: "medium",
            evidence: `${title} is classified by functional corp scoreline semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.corp_visible_scoreline_target",
            status: "gap",
            issues: ["target_choice_gap"],
            evidence: ["Corp target profile remains diagnostic."],
          },
        ],
      },
    ],
  };
}
