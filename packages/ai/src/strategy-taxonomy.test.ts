import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import functionSignalDerivationData from "../../../data/ai/function-signal-derivation-v1.json";
import strategicRolesData from "../../../data/ai/strategic-roles-v1.json";
import strategyGoalsData from "../../../data/ai/strategy-goals-v1.json";

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
  taxonomy: {
    strategyGoalCount: number;
    runnerStrategyGoalCount: number;
    corpStrategyGoalCount: number;
    strategicRoleIds: string[];
  };
  derivationSmokeTests: Record<
    string,
    { signals: string[]; anchorStrategyIds: string[] }
  >;
  sideAwareDerivation: {
    preventedWrongSideAnchorCount: number;
    wrongSideAnchorMatchCount: number;
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

function smokeTest(
  report: CheckReport,
  key:
    | "runnerEconomy"
    | "rndMultiaccess"
    | "normalBreaker"
    | "corpTagPunishPayoff"
    | "corpDamagePayoff"
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

  it("derives function signals without turning generic support into strategy", () => {
    const report = loadStrategyTaxonomyReport();
    const runnerEconomy = smokeTest(report, "runnerEconomy");
    const rndMultiaccess = smokeTest(report, "rndMultiaccess");
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

  it("keeps function signals derived and hidden-info free", () => {
    const serializedContract = JSON.stringify({
      strategyGoalsData,
      strategicRolesData,
      functionSignalDerivationData,
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
