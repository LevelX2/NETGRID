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

  it("keeps proteus random and bad-publicity readiness diagnostic", () => {
    const report = readFileSync(
      path.join(
        repoRoot,
        "docs/reviews/ai/ai-proteus-random-bad-publicity-readiness-2026-06-13.md",
      ),
      "utf8",
    );

    for (const card of [
      "AI Board Member",
      "Charity Takeover",
      "Scaldan",
      "Frame-Up",
      "Faked Hit",
      "Poisoned Water Supply",
      "Back Door to Netwatch",
      "Roadblock",
    ]) {
      expect(report).toContain(card);
    }
    expect(report).toContain("needs_random_model");
    expect(report).toContain("needs_bad_publicity_model");
    expect(report).toContain("ready_for_semantic_annotation");
    expect(report).toContain("productiveUseAllowed: false");
    expect(report).toContain("runtimeConsumerStatus: none");
    expect(report).toContain("proteus_ai_supported: false");
  });

  it("keeps proteus hidden resource ambush readiness diagnostic", () => {
    const report = readFileSync(
      path.join(
        repoRoot,
        "docs/reviews/ai/ai-proteus-hidden-resource-ambush-readiness-2026-06-13.md",
      ),
      "utf8",
    );

    for (const card of [
      "Airport Locker",
      "HQ Mole",
      "R&D Mole",
      "Simulacrum",
      "Death from Above",
      "Mercenary Subcontract",
      "Doppelganger Antibody",
      "Pattel Antibody",
      "Stereogram Antibody",
      "Bel-Digmo Antibody",
    ]) {
      expect(report).toContain(card);
    }
    expect(report).toContain("hidden_resource_constraints");
    expect(report).toContain("target_choice_gaps");
    expect(report).toContain("access_ambush_precision");
    expect(report).toContain("virus_counter_risk");
    expect(report).toContain("productiveUseAllowed: false");
    expect(report).toContain("proteus_ai_supported: false");
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

  it("covers corp tag punish worklist package one as diagnostic semantics", () => {
    const profiles = [
      corpSemanticProfile("Closed Accounts", ["tag.payoff.economy_denial"]),
      corpSemanticProfile("Scorched Earth", ["tag.payoff.meat_damage"]),
      corpSemanticProfile("Punitive Counterstrike", ["tag.payoff.meat_damage"]),
      corpSemanticProfile("Urban Renewal", ["tag.payoff.damage_clock"]),
      corpSemanticProfile("Netwatch Operations Office", ["tag.source.trace"]),
      corpSemanticProfile("Private Cybernet Police", ["tag.source.resource"]),
      corpSemanticProfile("City Surveillance", ["tag.source.snowball"]),
      corpSemanticProfile("Data Raven", ["access.tag_ambush"]),
      corpSemanticProfile("TRAP!", ["access.tag_ambush"]),
      corpSemanticProfile("Solo Squad", ["tag.payoff.runner_resource_trash"]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "tag.source.trace",
        "tag.source.snowball",
        "tag.payoff.meat_damage",
        "access.tag_ambush",
      ]),
    );
    expect(
      profiles
        .filter((profile) =>
          profile.tacticSignals.some(
            (signal) =>
              signal.startsWith("tag.") || signal === "access.tag_ambush",
          ),
        )
        .every((profile) =>
        profile.abilitySemantics?.[0]?.strategySupport?.some(
          (support) => support.strategyId === "corp.doctrine.tag_trace_punish",
        ),
      ),
    ).toBe(true);
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers corp damage ambush worklist package one as diagnostic semantics", () => {
    const profiles = [
      corpSemanticProfile("Setup!", ["access.corp_net_damage_ambush"]),
      corpSemanticProfile("Vacant Soulkiller", [
        "access.corp_brain_damage_ambush",
      ]),
      corpSemanticProfile("Virus Test Site", ["access.corp_net_damage_ambush"]),
      corpSemanticProfile("Experimental AI", ["access.corp_program_trash"]),
      corpSemanticProfile("Corprunner's Shattered Remains", [
        "access.corp_hardware_trash",
      ]),
      corpSemanticProfile("Dedicated Response Team", [
        "access.corp_meat_damage_ambush",
      ]),
      corpSemanticProfile("TRAP!", ["access.corp_net_damage_ambush"]),
      corpSemanticProfile("Bolter Cluster", ["corp_ice.net_damage"]),
      corpSemanticProfile("Cinderella", ["corp_ice.program_trash"]),
      corpSemanticProfile("Code Corpse", ["corp_ice.brain_damage"]),
      corpSemanticProfile("Wall of Ice", ["corp_ice.end_the_run_tax"]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "access.corp_net_damage_ambush",
        "access.corp_brain_damage_ambush",
        "access.corp_program_trash",
        "access.corp_hardware_trash",
        "corp_ice.net_damage",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers runner access payoff worklist package as diagnostic semantics", () => {
    const profiles = [
      runnerAccessPayoffProfile("R&D Interface", ["access.rnd_multiaccess"]),
      runnerAccessPayoffProfile("HQ Interface", ["access.hq_multiaccess"]),
      runnerAccessPayoffProfile("Executive Wiretaps", [
        "access.hq_multiaccess",
        "access.central_payoff",
      ]),
      runnerAccessPayoffProfile("Custodial Position", [
        "access.central_payoff",
      ]),
      runnerAccessPayoffProfile("Rush Hour", ["run.structure_only"]),
      runnerAccessPayoffProfile("All-Hands", ["run.structure_only"]),
      runnerAccessPayoffProfile("Kilroy Was Here", ["access.free_trash"]),
      runnerAccessPayoffProfile("Romp through HQ", ["access.hq_multiaccess"]),
      runnerAccessPayoffProfile("Crumble", ["access.free_trash"]),
      runnerAccessPayoffProfile("Garbage In", ["access.free_trash"]),
      runnerAccessPayoffProfile("Highlighter", ["access.rnd_multiaccess"]),
      runnerAccessPayoffProfile("Vienna 22", ["access.central_payoff"]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "access.hq_multiaccess",
        "access.rnd_multiaccess",
        "access.free_trash",
        "access.central_payoff",
        "run.structure_only",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers runner economy commitment worklist package as diagnostic semantics", () => {
    const profiles = [
      runnerEconomyCommitmentProfile("Broker", ["economy.burst_credit"]),
      runnerEconomyCommitmentProfile("Rigged Investments", [
        "economy.commitment_bank",
        "economy.deferred_credit",
      ]),
      runnerEconomyCommitmentProfile("Short-Term Contract", [
        "economy.burst_credit",
        "risk.loss_condition",
      ]),
      runnerEconomyCommitmentProfile("Top Runners' Conference", [
        "economy.deferred_credit",
      ]),
      runnerEconomyCommitmentProfile("Loan from Chiba", [
        "economy.burst_credit",
        "risk.loss_condition",
      ]),
      runnerEconomyCommitmentProfile("Databroker", ["economy.deferred_credit"]),
      runnerEconomyCommitmentProfile("Organ Donor", [
        "economy.burst_credit",
        "risk.loss_condition",
      ]),
      runnerEconomyCommitmentProfile("Score!", ["economy.burst_credit"]),
      runnerEconomyCommitmentProfile("Livewire's Contacts", [
        "economy.deferred_credit",
      ]),
      runnerEconomyCommitmentProfile("Score! / burst-credit preps", [
        "commitment.run_breaking",
      ]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "economy.burst_credit",
        "economy.deferred_credit",
        "economy.commitment_bank",
        "risk.loss_condition",
        "commitment.run_breaking",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers corp remote economy asset worklist package as diagnostic semantics", () => {
    const profiles = [
      corpRemoteEconomyAssetProfile("Holovid Campaign", [
        "economy.campaign_drip",
        "access.remote_trash_commitment",
      ]),
      corpRemoteEconomyAssetProfile("BBS Whispering Campaign", [
        "economy.campaign_drip",
        "corp_asset.economy_value",
      ]),
      corpRemoteEconomyAssetProfile("Braindance Campaign", [
        "economy.finite_pool",
      ]),
      corpRemoteEconomyAssetProfile("Investment Firm", [
        "economy.finite_pool",
        "counter.bank",
      ]),
      corpRemoteEconomyAssetProfile("Rockerboy Promotion", [
        "economy.campaign_drip",
      ]),
      corpRemoteEconomyAssetProfile("Department of Truth Enhancement", [
        "corp_asset.economy_value",
      ]),
      corpRemoteEconomyAssetProfile("Information Laundering", [
        "counter.bank",
        "counter.cashout",
      ]),
      corpRemoteEconomyAssetProfile("Vapor Ops", ["corp_asset.economy_value"]),
      corpRemoteEconomyAssetProfile("South African Mining Corp", [
        "economy.finite_pool",
      ]),
      corpRemoteEconomyAssetProfile("ACME Savings and Loan", [
        "counter.bank",
        "counter.cashout",
      ]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "economy.finite_pool",
        "economy.campaign_drip",
        "counter.bank",
        "counter.cashout",
        "access.remote_trash_commitment",
        "corp_asset.economy_value",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });

  it("covers corp ice tax worklist package as diagnostic semantics", () => {
    const profiles = [
      corpIceTaxProfile("Data Masons", ["ice_tax"]),
      corpIceTaxProfile("Encoder Inc.", ["rez_discount"]),
      corpIceTaxProfile("Skälderviken SA Beta Test Site", [
        "subroutine_support",
        "constraint.only_model",
      ]),
      corpIceTaxProfile("Jerusalem City Grid", ["rez_discount"]),
      corpIceTaxProfile("Crystal Palace Station Grid", ["break_cost_tax"]),
      corpIceTaxProfile("Tesseract Fort Construction", [
        "subroutine_support",
        "target_profile.required",
      ]),
      corpIceTaxProfile("Ball and Chain", ["run_tax"]),
      corpIceTaxProfile("Virizz", ["break_cost_tax"]),
      corpIceTaxProfile("Newsgroup Taunting", ["run_tax"]),
    ];

    const report = buildActionSemanticInvariantReport(profiles);

    expect(report.valid).toBe(true);
    expect(profiles.flatMap((profile) => profile.tacticSignals)).toEqual(
      expect.arrayContaining([
        "ice_tax",
        "rez_discount",
        "subroutine_support",
        "break_cost_tax",
        "run_tax",
        "constraint.only_model",
        "target_profile.required",
      ]),
    );
    expect(report.productiveUseAllowed).toBe(false);
  });
});

function runnerAccessPayoffProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.runner_access_payoff`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "runner.doctrine.central_pressure",
            role: "access_payoff",
            confidence: "medium",
            evidence: `${title} is classified by functional access payoff semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.runner_central_or_accessed_card",
            status: "not_available",
            issues: ["target_context_unavailable"],
            evidence: [
              "Access payoff remains diagnostic until side-safe target profile coverage exists.",
            ],
          },
        ],
      },
    ],
  };
}

function runnerEconomyCommitmentProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.runner_economy_commitment`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "runner.doctrine.economy_engine",
            role: "economy_commitment",
            confidence: "medium",
            evidence: `${title} is classified by functional economy commitment semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.runner_economy_commitment",
            status: "not_available",
            issues: ["card_semantics_unavailable"],
            evidence: [
              "Commitment bank and loss-condition precision remains diagnostic.",
            ],
          },
        ],
      },
    ],
  };
}

function corpRemoteEconomyAssetProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.corp_remote_economy_asset`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "corp.doctrine.asset_economy",
            role: "remote_economy_asset",
            confidence: "medium",
            evidence: `${title} is classified by functional remote economy asset semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.corp_remote_asset_economy",
            status: "not_available",
            issues: ["target_context_unavailable"],
            evidence: [
              "Remote trash commitment and counter-state precision remains diagnostic.",
            ],
          },
        ],
      },
    ],
  };
}

function corpIceTaxProfile(
  title: string,
  tacticSignals: string[],
): ActionCardSemanticProfile {
  return {
    cardId: `onr_v1_worklist_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tacticSignals,
    abilitySemantics: [
      {
        abilityId: `${title}.corp_ice_tax`,
        tacticSignals,
        strategySupport: [
          {
            strategyId: "corp.doctrine.ice_tax",
            role: "ice_tax_support",
            confidence: "medium",
            evidence: `${title} is classified by functional ICE tax and rez-economy semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.corp_ice_tax_or_grid_context",
            status: "not_available",
            issues: ["target_context_unavailable"],
            evidence: [
              "Constraint-only effects stay separate from target profile matches.",
            ],
          },
        ],
      },
    ],
  };
}

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
            status: "not_available",
            issues: ["target_context_unavailable"],
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
            status: "not_available",
            issues: ["card_semantics_unavailable"],
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
  strategyId = "corp.doctrine.remote_scoring_scoreline",
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
            strategyId: tacticSignals.some(
              (signal) =>
                signal.startsWith("tag.") || signal === "access.tag_ambush",
            )
              ? "corp.doctrine.tag_trace_punish"
              : tacticSignals.some((signal) =>
                    signal.includes("damage") || signal.includes("trash"),
                  )
                ? "corp.doctrine.damage_pressure"
                : strategyId,
            role: "scoreline_support",
            confidence: "medium",
            evidence: `${title} is classified by functional corp scoreline semantics.`,
          },
        ],
        targetProfileMatches: [
          {
            targetProfileId: "tp.corp_visible_scoreline_target",
            status: "not_available",
            issues: ["target_context_unavailable"],
            evidence: ["Corp target profile remains diagnostic."],
          },
        ],
      },
    ],
  };
}
