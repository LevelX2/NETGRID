import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import functionSignalDerivationData from "../../../data/ai/function-signal-derivation-v1.json";
import strategicRolesData from "../../../data/ai/strategic-roles-v1.json";
import strategyGoalsData from "../../../data/ai/strategy-goals-v1.json";
import tacticSignalCatalogData from "../../../data/ai/tactic-signals-v1.json";

type StrategyGoal = {
  strategyId: string;
  side: "runner" | "corp";
  detectionMode:
    | "payoff_anchor"
    | "engine_anchor"
    | "structural_density"
    | "support_requirement";
  anchorSignals: string[];
};

type CheckReport = {
  hardErrorCount: number;
  warningCount: number;
  hardErrors: Array<{ kind: string; path?: string; cardId?: string }>;
  warnings: Array<{ kind: string; count?: number; items?: unknown[] }>;
  taxonomy: {
    strategyGoalCount: number;
    runnerStrategyGoalCount: number;
    corpStrategyGoalCount: number;
    strategicRoleIds: string[];
    tacticSignalCatalogCount: number;
  };
  gates: Record<string, boolean>;
  derivationSmokeTests: Record<
    string,
    { signals: string[]; anchorStrategyIds: string[] }
  >;
  sideAwareDerivation: {
    preventedWrongSideAnchorCount: number;
    wrongSideAnchorMatchCount: number;
  };
  ai004Triage: {
    roles: Array<{
      value: string;
      mappingCategory: string;
      triageSource?: string;
    }>;
    planRoles: Array<{
      value: string;
      mappingCategory: string;
      triageSource?: string;
    }>;
    descriptorGaps: Array<{ gapId: string; batchMigrationDecision: string }>;
  };
};

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

let cachedReport: CheckReport | undefined;

function loadStrategyTaxonomyReport(): CheckReport {
  cachedReport ??= JSON.parse(
    execFileSync(
      process.execPath,
      ["scripts/check-ai-strategy-taxonomy.mjs", "--json"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    ),
  ) as CheckReport;
  return cachedReport;
}

function loadMutatedStrategyTaxonomyReport(mutator: string): CheckReport {
  const scriptPath = path.join(repoRoot, "scripts/check-ai-strategy-taxonomy.mjs");
  const checkerUrl = pathToFileURL(scriptPath).href;
  const script = `
    import fs from "node:fs";
    import os from "node:os";
    import path from "node:path";
    import { buildAiStrategyTaxonomyReport } from ${JSON.stringify(checkerUrl)};
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "netgrid-ai-taxonomy-"));
    const files = [
      "data/ai/ai-card-hints-active.json",
      "data/ai/ai-card-hints-compiled.json",
      "data/ai/strategy-goals-v1.json",
      "data/ai/strategic-roles-v1.json",
      "data/ai/function-signal-derivation-v1.json",
      "data/ai/tactic-signals-v1.json",
    ];
    for (const relative of files) {
      const target = path.join(tempRoot, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(${JSON.stringify(repoRoot)}, relative), target);
    }
    const activePath = path.join(tempRoot, "data/ai/ai-card-hints-active.json");
    const compiledPath = path.join(tempRoot, "data/ai/ai-card-hints-compiled.json");
    const active = JSON.parse(fs.readFileSync(activePath, "utf8"));
    const compiled = JSON.parse(fs.readFileSync(compiledPath, "utf8"));
    function setLineSupport(cardId, lineSupport) {
      for (const data of [active, compiled]) {
        const card = data.cards.find((candidate) => candidate.cardId === cardId);
        if (!card) throw new Error("Missing test card " + cardId);
        card.lineSupport = lineSupport;
      }
    }
    function setStrategicRole(cardId, strategicRole) {
      for (const data of [active, compiled]) {
        const card = data.cards.find((candidate) => candidate.cardId === cardId);
        if (!card) throw new Error("Missing test card " + cardId);
        card.strategicRole = strategicRole;
      }
    }
    function setFunctionTags(cardId) {
      for (const data of [active, compiled]) {
        const card = data.cards.find((candidate) => candidate.cardId === cardId);
        if (!card) throw new Error("Missing test card " + cardId);
        card.functionTags = ["manual"];
      }
    }
    ${mutator}
    fs.writeFileSync(activePath, JSON.stringify(active, null, 2) + "\\n");
    fs.writeFileSync(compiledPath, JSON.stringify(compiled, null, 2) + "\\n");
    const { report } = buildAiStrategyTaxonomyReport({ repoRoot: tempRoot });
    console.log(JSON.stringify(report));
  `;
  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: repoRoot,
      encoding: "utf8",
    }),
  ) as CheckReport;
}

function smokeTest(
  report: CheckReport,
  key:
    | "runnerEconomy"
    | "rndMultiaccess"
    | "hqMultiaccess"
    | "normalBreaker"
    | "runnerRiskyBreaker"
    | "runnerConfigurableBreaker"
    | "runnerTargetedBreaker"
    | "runnerIceStrengthReduction"
    | "runnerEncounterSearchInstall"
    | "corpTagPunishPayoff"
    | "corpCreditTagPunishPayoff"
    | "corpDamagePayoff"
    | "corpScoredAgendaUtility"
    | "corpScoreAcceleration"
    | "corpIceStrengthModifier"
    | "corpIceSubroutineModifier"
    | "corpRunPathIceTax"
    | "corpPersistentAccessPunish"
    | "corpExtraAction"
    | "corpIceFutureRunEffect"
    | "corpTopdeckInfo"
    | "runnerTagSource"
    | "runnerDamage",
): { signals: string[]; anchorStrategyIds: string[] } {
  const result = report.derivationSmokeTests[key];
  expect(result).toBeDefined();
  return result!;
}

describe("AI003 strategy goal taxonomy", () => {
  it("loads and validates the controlled strategy goal set", () => {
    const report = loadStrategyTaxonomyReport();
    const goals = strategyGoalsData.strategyGoals as StrategyGoal[];
    const ids = goals.map((goal) => goal.strategyId);

    expect(report.hardErrorCount).toBe(0);
    expect(report.taxonomy.strategyGoalCount).toBe(20);
    expect(new Set(ids).size).toBe(ids.length);
    expect(goals.map((goal) => goal.detectionMode)).toEqual(
      expect.arrayContaining([
        "payoff_anchor",
        "engine_anchor",
        "structural_density",
        "support_requirement",
      ]),
    );
  });

  it("keeps Runner and Corp strategy IDs side-prefixed", () => {
    const goals = strategyGoalsData.strategyGoals as StrategyGoal[];
    const runnerGoals = goals.filter((goal) => goal.side === "runner");
    const corpGoals = goals.filter((goal) => goal.side === "corp");

    expect(runnerGoals).toHaveLength(10);
    expect(corpGoals).toHaveLength(10);
    expect(runnerGoals.every((goal) => goal.strategyId.startsWith("runner."))).toBe(
      true,
    );
    expect(corpGoals.every((goal) => goal.strategyId.startsWith("corp."))).toBe(
      true,
    );
  });

  it("keeps strategicRole values controlled and optional", () => {
    const report = loadStrategyTaxonomyReport();
    const roleIds = strategicRolesData.strategicRoles.map(
      (role) => role.roleId,
    );

    expect(roleIds).toEqual([
      "payoff_anchor",
      "engine_anchor",
      "enabler",
      "support_tool",
      "utility",
      "defensive_tool",
      "emergency_tool",
      "win_condition",
      "tax_tool",
      "punish_payoff",
      "scoring_tool",
    ]);
    expect(report.taxonomy.strategicRoleIds).toEqual([...roleIds].sort());
    expect(strategicRolesData.lineSupportPolicy.ai003Enforcement).toBe(
      "optional_warn_only",
    );
  });

  it("validates the AI017 controlled tactic signal catalog", () => {
    const report = loadStrategyTaxonomyReport();
    const signalIds = tacticSignalCatalogData.signals.map(
      (signal) => signal.signalId,
    );
    const derivationSignalIds = [
      ...new Set(functionSignalDerivationData.derivationRules.map((rule) => rule.signalId)),
    ].sort();

    expect(report.hardErrorCount).toBe(0);
    expect(tacticSignalCatalogData.schemaVersion).toBe("ai-tactic-signals-v1");
    expect(report.taxonomy.tacticSignalCatalogCount).toBe(68);
    expect(new Set(signalIds).size).toBe(signalIds.length);
    expect([...signalIds].sort()).toEqual(derivationSignalIds);
    expect(signalIds.some((signalId) => signalId.startsWith("anti.ice."))).toBe(
      false,
    );

    for (const signal of tacticSignalCatalogData.signals) {
      expect(signal.group).toBeTruthy();
      expect(signal.description).toBeTruthy();
      expect(["runner", "corp", "neutral"]).toContain(signal.sideScope);
      expect(Array.isArray(signal.sourceKinds)).toBe(true);
      if (signal.supportOnly) {
        expect(signal.mayAnchorStrategy).toBe(false);
        expect(signal.allowedStrategyAnchors).toEqual([]);
      }
    }

    expect(
      tacticSignalCatalogData.signals.filter((signal) => signal.targetProfileRelevant),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ signalId: "breaker.targeted_ice_bonus" }),
        expect.objectContaining({ signalId: "breaker.search_during_encounter" }),
      ]),
    );
  });

  it("derives function signals without turning generic support into strategy", () => {
    const report = loadStrategyTaxonomyReport();
    const runnerEconomy = smokeTest(report, "runnerEconomy");
    const rndMultiaccess = smokeTest(report, "rndMultiaccess");
    const hqMultiaccess = smokeTest(report, "hqMultiaccess");
    const normalBreaker = smokeTest(report, "normalBreaker");
    const corpTagPunishPayoff = smokeTest(report, "corpTagPunishPayoff");

    expect(runnerEconomy.signals).toContain("economy.generic");
    expect(runnerEconomy.anchorStrategyIds).not.toContain(
      "runner.rnd_pressure",
    );
    expect(rndMultiaccess.signals).toContain("access.rnd_multiaccess");
    expect(rndMultiaccess.anchorStrategyIds).toContain(
      "runner.rnd_pressure",
    );
    expect(rndMultiaccess.anchorStrategyIds).toContain(
      "runner.interface_closeout",
    );
    expect(hqMultiaccess.signals).toContain("access.hq_multiaccess");
    expect(hqMultiaccess.anchorStrategyIds).toContain(
      "runner.hq_pressure",
    );
    expect(hqMultiaccess.anchorStrategyIds).toContain(
      "runner.interface_closeout",
    );
    expect(normalBreaker.signals).toContain("breaker.wall");
    expect(normalBreaker.anchorStrategyIds).not.toContain(
      "runner.rig_first",
    );
    expect(corpTagPunishPayoff.signals).toContain("tag.payoff");
    expect(corpTagPunishPayoff.anchorStrategyIds).toContain(
      "corp.tag_trace_punish",
    );
  });

  it("prevents wrong-side strategy anchors for side-ambivalent effects", () => {
    const report = loadStrategyTaxonomyReport();
    const corpExtraAction = smokeTest(report, "corpExtraAction");
    const corpIceFutureRunEffect = smokeTest(
      report,
      "corpIceFutureRunEffect",
    );
    const corpTopdeckInfo = smokeTest(report, "corpTopdeckInfo");
    const runnerTagSource = smokeTest(report, "runnerTagSource");
    const runnerDamage = smokeTest(report, "runnerDamage");

    expect(corpExtraAction.signals).not.toContain("run.extra_action");
    expect(corpExtraAction.anchorStrategyIds).not.toContain(
      "runner.run_event_tempo",
    );
    expect(corpIceFutureRunEffect.signals).not.toContain("run.event_tempo");
    expect(corpIceFutureRunEffect.anchorStrategyIds).not.toContain(
      "runner.run_event_tempo",
    );
    expect(corpTopdeckInfo.signals).not.toContain("info.rnd_topdeck");
    expect(corpTopdeckInfo.anchorStrategyIds).not.toContain(
      "runner.rnd_pressure",
    );
    expect(runnerTagSource.signals).not.toContain("tag.source");
    expect(runnerTagSource.anchorStrategyIds).not.toContain(
      "corp.tag_trace_punish",
    );
    expect(runnerDamage.signals).not.toContain("damage.payoff");
    expect(runnerDamage.anchorStrategyIds).not.toContain("corp.damage_kill");
    expect(report.sideAwareDerivation.preventedWrongSideAnchorCount).toBeGreaterThan(
      0,
    );
    expect(report.sideAwareDerivation.wrongSideAnchorMatchCount).toBe(0);
  });

  it("keeps valid side-aware anchors for Runner pressure and Corp punish", () => {
    const report = loadStrategyTaxonomyReport();
    const rndMultiaccess = smokeTest(report, "rndMultiaccess");
    const corpTagPunishPayoff = smokeTest(report, "corpTagPunishPayoff");
    const corpDamagePayoff = smokeTest(report, "corpDamagePayoff");

    expect(rndMultiaccess.signals).toContain("access.rnd_multiaccess");
    expect(rndMultiaccess.anchorStrategyIds).toContain(
      "runner.rnd_pressure",
    );
    expect(corpTagPunishPayoff.signals).toContain("tag.payoff");
    expect(corpTagPunishPayoff.anchorStrategyIds).toContain(
      "corp.tag_trace_punish",
    );
    expect(corpDamagePayoff.signals).toContain("damage.payoff");
    expect(corpDamagePayoff.anchorStrategyIds).toContain("corp.damage_kill");
  });

  it("keeps AI016 tactic derivation fixes narrow and side-aware", () => {
    const report = loadStrategyTaxonomyReport();
    const creditTagPunish = smokeTest(report, "corpCreditTagPunishPayoff");
    const scoredAgendaUtility = smokeTest(report, "corpScoredAgendaUtility");
    const scoreAcceleration = smokeTest(report, "corpScoreAcceleration");
    const iceStrengthModifier = smokeTest(report, "corpIceStrengthModifier");
    const iceSubroutineModifier = smokeTest(
      report,
      "corpIceSubroutineModifier",
    );
    const runPathIceTax = smokeTest(report, "corpRunPathIceTax");
    const persistentAccessPunish = smokeTest(
      report,
      "corpPersistentAccessPunish",
    );

    expect(creditTagPunish.signals).toContain("tag.payoff");
    expect(creditTagPunish.signals).toContain("tax.runner_credit");
    expect(creditTagPunish.anchorStrategyIds).toContain(
      "corp.tag_trace_punish",
    );
    expect(creditTagPunish.anchorStrategyIds).not.toContain(
      "corp.damage_kill",
    );

    expect(scoredAgendaUtility.signals).toContain("score.agenda_action");
    expect(scoredAgendaUtility.anchorStrategyIds).not.toContain(
      "corp.fast_advance",
    );
    expect(scoreAcceleration.signals).toContain("score.advance_burst");
    expect(scoreAcceleration.anchorStrategyIds).toContain("corp.fast_advance");

    expect(iceStrengthModifier.signals).toContain("ice.strength_modifier");
    expect(iceStrengthModifier.anchorStrategyIds).toContain(
      "corp.ice_tax_glacier",
    );
    expect(iceSubroutineModifier.signals).toContain(
      "ice.subroutine_modifier",
    );
    expect(iceSubroutineModifier.anchorStrategyIds).toContain(
      "corp.ice_tax_glacier",
    );
    expect(runPathIceTax.signals).toContain("tax.ice");
    expect(runPathIceTax.anchorStrategyIds).toContain("corp.ice_tax_glacier");

    expect(persistentAccessPunish.signals).toContain("access.punish");
    expect(persistentAccessPunish.signals).toContain(
      "tax.runner_persistent",
    );
    expect(persistentAccessPunish.anchorStrategyIds).toContain(
      "corp.ambush_bluff",
    );
  });

  it("derives AI017 icebreaker pilot signals without strategy anchors", () => {
    const report = loadStrategyTaxonomyReport();
    const riskyBreaker = smokeTest(report, "runnerRiskyBreaker");
    const configurableBreaker = smokeTest(report, "runnerConfigurableBreaker");
    const targetedBreaker = smokeTest(report, "runnerTargetedBreaker");
    const strengthReduction = smokeTest(report, "runnerIceStrengthReduction");
    const encounterSearchInstall = smokeTest(
      report,
      "runnerEncounterSearchInstall",
    );

    expect(riskyBreaker.signals).toEqual(
      expect.arrayContaining([
        "breaker.risky",
        "breaker.self_trash_risk",
        "breaker.universal",
      ]),
    );
    expect(riskyBreaker.anchorStrategyIds).toEqual([]);

    expect(configurableBreaker.signals).toEqual(
      expect.arrayContaining([
        "breaker.configurable_coverage",
        "breaker.reconfigurable_type",
      ]),
    );
    expect(configurableBreaker.signals).not.toContain("breaker.universal");
    expect(configurableBreaker.anchorStrategyIds).toEqual([]);

    expect(targetedBreaker.signals).toEqual(
      expect.arrayContaining([
        "breaker.sentry",
        "breaker.targeted_ice_bonus",
        "breaker.strength_bonus_vs_chosen_ice",
      ]),
    );
    expect(targetedBreaker.anchorStrategyIds).toEqual([]);

    expect(strengthReduction.signals).toEqual(
      expect.arrayContaining([
        "breaker.support",
        "ice.strength_reduction",
        "run.break_cost_support",
      ]),
    );
    expect(strengthReduction.anchorStrategyIds).toEqual([]);

    expect(encounterSearchInstall.signals).toEqual(
      expect.arrayContaining([
        "breaker.emergency_search",
        "breaker.search_during_encounter",
        "setup.install_support",
        "setup.search",
      ]),
    );
    expect(encounterSearchInstall.anchorStrategyIds).toContain(
      "runner.breaker_search",
    );
    expect(encounterSearchInstall.anchorStrategyIds).not.toContain(
      "runner.rig_first",
    );
  });

  it("keeps legacy lineSupport cleared while retaining warn-only legacy and hard gates", () => {
    const report = loadStrategyTaxonomyReport();
    const legacyWarning = report.warnings.find(
      (warning) => warning.kind === "legacy_lineSupport_values_warn_only",
    );
    expect(legacyWarning?.count ?? 0).toBe(0);
    expect(report.hardErrorCount).toBe(0);
    expect(report.gates.unknownLineSupportFail).toBe(true);
    expect(report.gates.lineSupportSideMismatchFail).toBe(true);

    const legacyLineSupport = loadMutatedStrategyTaxonomyReport(
      `setLineSupport("onr_v1_041_microtech-ai-interface", ["rig_first"]);`,
    );
    const mutatedLegacyWarning = legacyLineSupport.warnings.find(
      (warning) => warning.kind === "legacy_lineSupport_values_warn_only",
    );
    expect(mutatedLegacyWarning?.count).toBeGreaterThan(0);
    expect(legacyLineSupport.hardErrorCount).toBe(0);

    const unknownLineSupport = loadMutatedStrategyTaxonomyReport(
      `setLineSupport("onr_v1_041_microtech-ai-interface", ["not_a_strategy"]);`,
    );
    expect(
      unknownLineSupport.hardErrors.some(
        (error) => error.kind === "unknown_lineSupport_value",
      ),
    ).toBe(true);

    const wrongSideLineSupport = loadMutatedStrategyTaxonomyReport(
      `setLineSupport("onr_v1_041_microtech-ai-interface", ["corp.tag_trace_punish"]);`,
    );
    expect(
      wrongSideLineSupport.hardErrors.some(
        (error) => error.kind === "lineSupport_side_mismatch",
      ),
    ).toBe(true);
  });

  it("keeps strategicRole and manual functionTags hard-gated", () => {
    const invalidStrategicRole = loadMutatedStrategyTaxonomyReport(
      `setStrategicRole("onr_v1_041_microtech-ai-interface", ["invalid_role"]);`,
    );
    expect(
      invalidStrategicRole.hardErrors.some(
        (error) => error.kind === "unknown_strategicRole_value",
      ),
    ).toBe(true);

    const manualFunctionTags = loadMutatedStrategyTaxonomyReport(
      `setFunctionTags("onr_v1_041_microtech-ai-interface");`,
    );
    expect(
      manualFunctionTags.hardErrors.some(
        (error) => error.kind === "manual_functionTags_field",
      ),
    ).toBe(true);
  });

  it("classifies AI004 role and planRole warning triage without strategy cutover", () => {
    const report = loadStrategyTaxonomyReport();
    const explicitTriage = [
      ...report.ai004Triage.roles,
      ...report.ai004Triage.planRoles,
    ].filter((entry) => entry.triageSource === "ai004_explicit");

    expect(explicitTriage).toHaveLength(52);
    expect(
      report.warnings.some(
        (warning) => warning.kind === "unknown_role_or_planRole_values_warn_only",
      ),
    ).toBe(false);
    expect(
      explicitTriage.filter(
        (entry) => entry.mappingCategory === "function_signal_only",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      explicitTriage.filter((entry) => entry.mappingCategory === "descriptor_gap")
        .length,
    ).toBeGreaterThan(0);
    expect(report.ai004Triage.descriptorGaps).toHaveLength(3);
    expect(
      report.ai004Triage.descriptorGaps.every(
        (gap) => gap.batchMigrationDecision === "do_not_bulk_migrate_in_AI004",
      ),
    ).toBe(true);
  });

  it("keeps function signals derived and hidden-info free", () => {
    const serializedContract = JSON.stringify({
      strategyGoalsData,
      strategicRolesData,
      functionSignalDerivationData,
      tacticSignalCatalogData,
    });

    expect(
      functionSignalDerivationData.manualHintFieldPolicy.forbiddenFields,
    ).toEqual(["functionTags"]);
    for (const forbiddenField of [
      "opponentDeckList",
      "privatePayload",
      "fullGameState",
      "cardInstances",
      "actualStackOrder",
      "actualRndOrder",
      "hiddenHqCards",
    ]) {
      expect(serializedContract).not.toContain(`"${forbiddenField}"`);
    }
  });
});
