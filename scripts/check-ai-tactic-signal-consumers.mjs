#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const TACTIC_SIGNAL_CATALOG_PATH = "data/ai/tactic-signals-v1.json";
const FUNCTION_SIGNAL_DERIVATION_PATH =
  "data/ai/function-signal-derivation-v1.json";
const CONSUMER_SOURCE_ROOTS = ["packages/ai/src"];
const HARD_GATE_GROUP_PREFIXES = [
  "agenda_semantic_review_v1",
  "assets_v2",
  "ice_semantic_review_v2",
  "ops_v2",
  "operations_v2",
  "upgrades_v2",
];
const HARD_GATE_SIGNAL_IDS = new Set([
  "corp_ice.multi_program_trash",
  "damage.corp_persistent_damage_counter",
  "run.corp_run_rewind",
  "tag.snowball_followup",
]);

function repoPath(relativePath) {
  return path.join(REPO_ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(repoPath(relativePath), "utf8"));
}

function listFiles(relativeRoot) {
  const root = repoPath(relativeRoot);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const absolutePath = path.join(root, entry.name);
      if (entry.isDirectory()) {
        return listFiles(path.relative(REPO_ROOT, absolutePath));
      }
      const relativePath = path.relative(REPO_ROOT, absolutePath);
      return entry.isFile() &&
        relativePath.endsWith(".ts") &&
        !relativePath.endsWith(".test.ts") &&
        !relativePath.endsWith(".d.ts")
        ? [relativePath]
        : [];
    })
    .sort();
}

function sourceRefsBySignalId(signalIds) {
  const refs = new Map(signalIds.map((signalId) => [signalId, []]));
  for (const sourcePath of CONSUMER_SOURCE_ROOTS.flatMap(listFiles)) {
    const lines = fs.readFileSync(repoPath(sourcePath), "utf8").split(/\r?\n/);
    for (const [lineIndex, line] of lines.entries()) {
      for (const signalId of signalIds) {
        if (!line.includes(signalId)) continue;
        refs.get(signalId)?.push({
          path: sourcePath,
          line: lineIndex + 1,
        });
      }
    }
  }
  return refs;
}

function strategyAnchorsBySignalId(derivationRules) {
  const bySignal = new Map();
  for (const rule of derivationRules) {
    if (typeof rule.signalId !== "string") continue;
    const anchors = bySignal.get(rule.signalId) ?? new Set();
    for (const strategyId of rule.strategyAnchorFor ?? []) {
      anchors.add(strategyId);
    }
    bySignal.set(rule.signalId, anchors);
  }
  return new Map(
    [...bySignal.entries()].map(([signalId, anchors]) => [
      signalId,
      [...anchors].sort(),
    ]),
  );
}

function hasExplicitNoRuntimePolicy(signal) {
  const notes = String(signal.notes ?? "").toLocaleLowerCase("en-US");
  return (
    notes.includes("does not create planner") ||
    notes.includes("does not create runtime") ||
    notes.includes("no runtime") ||
    notes.includes("read-only hint metadata only") ||
    notes.includes("read-only semantics only")
  );
}

function coverageRequirement(signal) {
  if (
    signal.targetProfileRelevant === true ||
    signal.mayAnchorStrategy === true ||
    (signal.allowedStrategyAnchors?.length ?? 0) > 0
  ) {
    return "consumer_or_explicit_policy_required";
  }
  return "none";
}

function isHardGateSignal(signal) {
  if (HARD_GATE_SIGNAL_IDS.has(signal.signalId)) return true;
  return HARD_GATE_GROUP_PREFIXES.some((prefix) =>
    String(signal.group ?? "").startsWith(prefix),
  );
}

export function buildAiTacticSignalConsumerReport() {
  const tacticSignalData = readJson(TACTIC_SIGNAL_CATALOG_PATH);
  const functionDerivationData = readJson(FUNCTION_SIGNAL_DERIVATION_PATH);
  const signals = tacticSignalData.signals ?? [];
  const signalIds = signals
    .map((signal) => signal.signalId)
    .filter((signalId) => typeof signalId === "string");
  const sourceRefsBySignal = sourceRefsBySignalId(signalIds);
  const anchorsBySignal = strategyAnchorsBySignalId(
    functionDerivationData.derivationRules ?? [],
  );

  const signalCoverage = signals.map((signal) => {
    const sourceRefs = sourceRefsBySignal.get(signal.signalId) ?? [];
    const derivedStrategyAnchors = anchorsBySignal.get(signal.signalId) ?? [];
    const explicitNoRuntimePolicy = hasExplicitNoRuntimePolicy(signal);
    const consumerModes = [
      ...(sourceRefs.length > 0 ? ["runtime_source_reference"] : []),
      ...(derivedStrategyAnchors.length > 0
        ? ["strategy_derivation"]
        : []),
      ...(explicitNoRuntimePolicy ? ["explicit_no_runtime_policy"] : []),
    ];
    return {
      signalId: signal.signalId,
      group: signal.group,
      sideScope: signal.sideScope,
      targetProfileRelevant: signal.targetProfileRelevant === true,
      mayAnchorStrategy: signal.mayAnchorStrategy === true,
      allowedStrategyAnchors: signal.allowedStrategyAnchors ?? [],
      coverageRequirement: coverageRequirement(signal),
      hardGate: isHardGateSignal(signal),
      consumerModes,
      derivedStrategyAnchors,
      sourceRefs,
    };
  });

  const hardErrors = [];
  for (const coverage of signalCoverage) {
    if (
      coverage.coverageRequirement ===
        "consumer_or_explicit_policy_required" &&
      coverage.hardGate &&
      coverage.consumerModes.length === 0
    ) {
      hardErrors.push({
        kind: "tactic_signal_without_consumer_or_policy",
        signalId: coverage.signalId,
        group: coverage.group,
        message:
          "Signal is profile- or strategy-relevant but has neither a source consumer, strategy derivation, nor explicit no-runtime policy.",
      });
    }
    if (
      coverage.targetProfileRelevant &&
      coverage.hardGate &&
      !coverage.consumerModes.includes("runtime_source_reference") &&
      !coverage.consumerModes.includes("explicit_no_runtime_policy")
    ) {
      hardErrors.push({
        kind: "target_profile_signal_without_runtime_or_policy",
        signalId: coverage.signalId,
        group: coverage.group,
        message:
          "targetProfileRelevant signals need a runtime/profile source consumer or an explicit no-runtime policy.",
      });
    }
  }

  return {
    schemaVersion: "ai-tactic-signal-consumer-report-v1",
    status: hardErrors.length === 0 ? "pass" : "fail",
    hardErrorCount: hardErrors.length,
    source: {
      tacticSignalCatalogPath: TACTIC_SIGNAL_CATALOG_PATH,
      functionSignalDerivationPath: FUNCTION_SIGNAL_DERIVATION_PATH,
      consumerSourceRoots: CONSUMER_SOURCE_ROOTS,
    },
    summary: {
      signalCount: signalCoverage.length,
      runtimeSourceReferenceCount: signalCoverage.filter((coverage) =>
        coverage.consumerModes.includes("runtime_source_reference"),
      ).length,
      strategyDerivationCount: signalCoverage.filter((coverage) =>
        coverage.consumerModes.includes("strategy_derivation"),
      ).length,
      explicitNoRuntimePolicyCount: signalCoverage.filter((coverage) =>
        coverage.consumerModes.includes("explicit_no_runtime_policy"),
      ).length,
      requiredCoverageCount: signalCoverage.filter(
        (coverage) => coverage.coverageRequirement !== "none",
      ).length,
      hardGateSignalCount: signalCoverage.filter((coverage) => coverage.hardGate)
        .length,
      hardGateRequiredCoverageCount: signalCoverage.filter(
        (coverage) =>
          coverage.hardGate && coverage.coverageRequirement !== "none",
      ).length,
      legacyBacklogRequiredCoverageCount: signalCoverage.filter(
        (coverage) =>
          !coverage.hardGate && coverage.coverageRequirement !== "none",
      ).length,
    },
    signalCoverage,
    hardErrors,
  };
}

function parseArgs(argv) {
  const args = { json: false };
  for (const arg of argv) {
    if (arg === "--json") args.json = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const report = buildAiTacticSignalConsumerReport();
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(
      `AI_TACTIC_SIGNAL_CONSUMERS ${report.status === "pass" ? "OK" : "FAIL"} signals=${report.summary.signalCount} runtimeRefs=${report.summary.runtimeSourceReferenceCount} strategyDerivations=${report.summary.strategyDerivationCount} explicitNoRuntime=${report.summary.explicitNoRuntimePolicyCount} errors=${report.hardErrorCount}\n`,
    );
    for (const error of report.hardErrors) {
      process.stdout.write(`ERROR ${error.kind} ${error.signalId}\n`);
    }
  }
  if (report.hardErrorCount > 0) process.exitCode = 1;
  return report;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
