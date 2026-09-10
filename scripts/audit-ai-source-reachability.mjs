import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(repoRoot, "packages", "ai", "src");
const manifestPath = path.join(
  repoRoot,
  "docs",
  "reviews",
  "ai",
  "ai-tactical-runtime-reachability-audit-2026-08-08.json",
);
const reportPath = manifestPath.replace(/\.json$/, ".md");

const args = new Set(process.argv.slice(2));
if (args.has("--self-test")) {
  runSelfTest();
  process.exit(0);
}

const sourceFiles = collectFiles(srcRoot, isTypeScriptFile).filter(
  (file) => !isTestFile(file),
);
const sourceSet = new Set(sourceFiles);
const sourceGraph = buildGraph(sourceFiles, sourceSet);
const testFiles = collectFiles(
  srcRoot,
  (file) => isTypeScriptFile(file) && isTestFile(file),
);
const testGraph = buildExternalConsumerGraph(testFiles, sourceSet, "test");
const workspaceGraph = buildExternalConsumerGraph(
  [
    ...collectFiles(path.join(repoRoot, "apps"), isTypeScriptFile),
    ...collectFiles(path.join(repoRoot, "packages"), isTypeScriptFile).filter(
      (file) => !file.startsWith(srcRoot + path.sep),
    ),
    ...collectFiles(path.join(repoRoot, "scripts"), isTypeScriptFile),
  ],
  sourceSet,
  "workspace",
);

const packageManifest = JSON.parse(
  readFileSync(path.join(repoRoot, "packages", "ai", "package.json"), "utf8"),
);
const publicRuntimeExportRoots = packageRuntimeExportRoots(
  packageManifest.exports,
);

const roots = {
  live: [
    ...new Set([
      ...publicRuntimeExportRoots,
      "ai-runtime-public-entrypoints.ts",
    ]),
  ],
  simulation: ["simulation.ts", "ai-simulation-public-entrypoints.ts"],
  legacy: [
    "tactical-plans.ts",
    "runtime/semantic-runtime.ts",
    "plans/tactical-plan-runner-plans.ts",
    "plans/tactical-plan-corp-plans.ts",
  ],
};
const intentionalEvaluationRoots = [
  [
    "evaluation/semantic-shadow-league.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/doctrine-goal-coverage.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/play-strength-benchmark.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/real-engine-access-corpus.ts",
    "current_real_engine_access_corpus",
  ],
  [
    "evaluation/real-engine-decision-corpus.ts",
    "current_real_engine_decision_corpus",
  ],
  [
    "evaluation/real-engine-decision-corpus-fixtures.ts",
    "current_real_engine_decision_corpus",
  ],
  [
    "evaluation/real-engine-fixture-builder.ts",
    "current_real_engine_decision_corpus",
  ],
  [
    "evaluation/selfplay-decision-snapshot-mining.ts",
    "current_selfplay_regression_evidence",
  ],
  [
    "reports/selfplay-promotion-activity-formatters.ts",
    "current_selfplay_regression_evidence",
  ],
  [
    "actions/action-semantic-invariants.ts",
    "current_action_semantics_safety_contract",
  ],
  [
    "evaluation/proteus-random-model-readiness.ts",
    "current_proteus_random_readiness_evaluation",
  ],
  [
    "evaluation/replay-portable-fixtures.ts",
    "current_plan_first_replay_contract",
  ],
  [
    "evaluation/semantic-shadow-league-delta.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/semantic-shadow-report.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/target-choice-shadow-coverage.ts",
    "historical_semantic_shadow_comparison",
  ],
  [
    "evaluation/target-choice-shadow-readiness.ts",
    "historical_semantic_shadow_comparison",
  ],
]
  .map(([entry, reason]) => ({
    entry,
    reason,
    path: path.join(srcRoot, entry),
  }))
  .filter((root) => sourceSet.has(root.path));
const rootPaths = Object.fromEntries(
  Object.entries(roots).map(([kind, entries]) => [
    kind,
    entries
      .map((entry) => path.join(srcRoot, entry))
      .filter((entry) => sourceSet.has(entry)),
  ]),
);
const intentionalEvaluationReachability = intentionalEvaluationRoots.map(
  (root) => ({
    ...root,
    reachable: reachableFrom([root.path], sourceGraph.all),
  }),
);
const reachability = {
  live_runtime: reachableFrom(rootPaths.live, sourceGraph.runtime),
  live_type: reachableFrom(rootPaths.live, sourceGraph.all),
  simulation_runtime: reachableFrom(rootPaths.simulation, sourceGraph.runtime),
  simulation_type: reachableFrom(rootPaths.simulation, sourceGraph.all),
  legacy_runtime: reachableFrom(rootPaths.legacy, sourceGraph.runtime),
  legacy_type: reachableFrom(rootPaths.legacy, sourceGraph.all),
  test_runtime: reachableFromExternal(testGraph, sourceGraph.runtime),
  test_type: reachableFromExternal(testGraph, sourceGraph.all),
  tooling_runtime: reachableFromExternal(
    toolingConsumers(workspaceGraph),
    sourceGraph.runtime,
  ),
  tooling_type: reachableFromExternal(
    toolingConsumers(workspaceGraph),
    sourceGraph.all,
  ),
  intentional_evaluation_type: new Set(
    intentionalEvaluationReachability.flatMap((root) => [...root.reachable]),
  ),
};

const rows = sourceFiles.map((file) =>
  classifyFile(file, {
    sourceGraph,
    testGraph,
    workspaceGraph,
    reachability,
    intentionalEvaluationReachability,
  }),
);
const summary = summarize(rows);
const audit = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  roots: {
    ...roots,
    intentionalEvaluation: intentionalEvaluationRoots.map(
      ({ entry, reason }) => ({
        path: entry,
        reason,
      }),
    ),
  },
  summary,
  rows,
};

if (args.has("--check")) {
  const failures = reachabilityCheckFailures(summary);
  if (failures.length > 0) {
    console.error(
      `AI_SOURCE_REACHABILITY_CHECK FAILED: ${failures.join(", ")}`,
    );
    process.exit(1);
  }
  console.log("AI_SOURCE_REACHABILITY_CHECK OK");
  process.exit(0);
}

if (args.has("--check-legacy-boundary")) {
  const legacyRuntimeImports = rows.filter((row) =>
    row.runtimeImports.some((entry) => entry.includes("/legacy/")),
  );
  console.log(
    JSON.stringify(
      {
        mode: "report_only",
        legacyDirectoryExists: existsSync(path.join(srcRoot, "legacy")),
        productiveRuntimeImportsFromLegacy: legacyRuntimeImports.map(
          (row) => row.path,
        ),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (args.has("--write")) {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(audit, null, 2)}\n`);
  writeFileSync(reportPath, renderReport(audit));
  console.log(`AI_SOURCE_REACHABILITY_AUDIT wrote ${relative(manifestPath)}`);
  console.log(`AI_SOURCE_REACHABILITY_AUDIT wrote ${relative(reportPath)}`);
} else {
  console.log(JSON.stringify({ summary, files: rows.length }, null, 2));
}

function collectFiles(root, include) {
  if (!existsSync(root)) return [];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(absolute, include));
      continue;
    }
    if (entry.isFile() && include(absolute))
      files.push(path.normalize(absolute));
  }
  return files.sort();
}

function isTypeScriptFile(file) {
  return /\.[cm]?tsx?$/.test(file);
}

function isTestFile(file) {
  return /\.(?:test|test-support)\.[cm]?tsx?$/.test(file);
}

function buildGraph(files, fileSet) {
  const all = new Map(files.map((file) => [file, new Set()]));
  const runtime = new Map(files.map((file) => [file, new Set()]));
  const incomingAll = new Map(files.map((file) => [file, new Set()]));
  const incomingRuntime = new Map(files.map((file) => [file, new Set()]));
  for (const file of files) {
    for (const edge of sourceEdges(file, fileSet)) {
      all.get(file).add(edge.target);
      incomingAll.get(edge.target).add(file);
      if (!edge.runtime) continue;
      runtime.get(file).add(edge.target);
      incomingRuntime.get(edge.target).add(file);
    }
  }
  return { all, runtime, incomingAll, incomingRuntime };
}

function buildExternalConsumerGraph(files, sourceSet, kind) {
  const all = new Map();
  const runtime = new Map();
  for (const file of files) {
    const edges = sourceEdges(file, sourceSet, true);
    if (edges.length === 0) continue;
    all.set(file, new Set(edges.map((edge) => edge.target)));
    runtime.set(
      file,
      new Set(edges.filter((edge) => edge.runtime).map((edge) => edge.target)),
    );
  }
  return { kind, all, runtime };
}

function sourceEdges(file, sourceSet, allowPackageImports = false) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const edges = [];
  const addEdge = (moduleName, runtime) => {
    const target = resolveImport(
      file,
      moduleName,
      sourceSet,
      allowPackageImports,
    );
    if (target) edges.push({ target, runtime });
  };
  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) ||
      ts.isExportDeclaration(statement)
    ) {
      if (
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        addEdge(
          statement.moduleSpecifier.text,
          statementHasRuntimeEdge(statement),
        );
      }
    }
  }
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      addEdge(node.arguments[0].text, true);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return edges;
}

function resolveImport(file, moduleName, sourceSet, allowPackageImports) {
  if (moduleName === "@netgrid/ai") return path.join(srcRoot, "index.ts");
  if (moduleName === "@netgrid/ai/simulation")
    return path.join(srcRoot, "simulation.ts");
  if (!moduleName.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(file), moduleName);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    `${base}.cts`,
    path.join(base, "index.ts"),
  ]) {
    const normalized = path.normalize(candidate);
    if (sourceSet.has(normalized)) return normalized;
  }
  return undefined;
}

function statementHasRuntimeEdge(statement) {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (!clause) return true;
    if (clause.isTypeOnly) return false;
    if (clause.name) return true;
    const bindings = clause.namedBindings;
    if (!bindings) return false;
    if (ts.isNamespaceImport(bindings)) return true;
    return bindings.elements.some((element) => !element.isTypeOnly);
  }
  if (statement.isTypeOnly) return false;
  if (!statement.exportClause) return true;
  if (ts.isNamespaceExport(statement.exportClause)) return true;
  return statement.exportClause.elements.some((element) => !element.isTypeOnly);
}

function reachableFrom(roots, graph) {
  const reached = new Set();
  const pending = [...roots];
  while (pending.length > 0) {
    const current = pending.pop();
    if (reached.has(current)) continue;
    reached.add(current);
    for (const target of graph.get(current) ?? []) pending.push(target);
  }
  return reached;
}

function reachableFromExternal(externalGraph, sourceGraph) {
  const direct = new Set();
  for (const targets of externalGraph.runtime.values()) {
    for (const target of targets) direct.add(target);
  }
  return reachableFrom([...direct], sourceGraph);
}

function toolingConsumers(workspaceGraph) {
  return {
    ...workspaceGraph,
    runtime: new Map(
      [...workspaceGraph.runtime].filter(([file]) =>
        relative(file).startsWith("scripts/"),
      ),
    ),
  };
}

function classifyFile(file, context) {
  const rel = relative(file);
  const flags = Object.fromEntries(
    Object.entries(context.reachability).map(([kind, reached]) => [
      kind,
      reached.has(file),
    ]),
  );
  const productionRuntimeConsumers = [
    ...(context.sourceGraph.incomingRuntime.get(file) ?? []),
  ]
    .filter(
      (consumer) =>
        context.reachability.live_runtime.has(consumer) ||
        context.reachability.simulation_runtime.has(consumer) ||
        context.reachability.tooling_runtime.has(consumer),
    )
    .map(relative);
  const externalConsumers = collectExternalConsumers(
    file,
    context.workspaceGraph,
  );
  const testConsumers = collectExternalConsumers(file, context.testGraph);
  const typeOnlyProductionConsumers = [
    ...(context.sourceGraph.incomingAll.get(file) ?? []),
  ]
    .filter(
      (consumer) =>
        !context.sourceGraph.incomingRuntime.get(file)?.has(consumer),
    )
    .map(relative);
  const classification = classify(flags, {
    productionRuntimeConsumers,
    externalConsumers,
    typeOnlyProductionConsumers,
  });
  return {
    path: rel,
    classification,
    reachableFrom: Object.entries(flags)
      .filter(([, value]) => value)
      .map(([kind]) => kind),
    importedByProduction: [
      ...new Set([...productionRuntimeConsumers, ...externalConsumers]),
    ].sort(),
    importedByTests: testConsumers.sort(),
    imports: [...(context.sourceGraph.all.get(file) ?? [])]
      .map(relative)
      .sort(),
    runtimeImports: [...(context.sourceGraph.runtime.get(file) ?? [])]
      .map(relative)
      .sort(),
    typeOnlyProductionConsumers: typeOnlyProductionConsumers.sort(),
    intentionalEvaluationReasons: context.intentionalEvaluationReachability
      .filter((root) => root.reachable.has(file))
      .map((root) => root.reason),
    publicExportedBy: publicExportedBy(file, context.sourceGraph),
    proposedDisposition: proposedDisposition(classification),
    blocker: blockerFor(classification, {
      productionRuntimeConsumers,
      externalConsumers,
      typeOnlyProductionConsumers,
    }),
  };
}

function collectExternalConsumers(file, graph) {
  return [...graph.all]
    .filter(([, targets]) => targets.has(file))
    .map(([consumer]) => relative(consumer));
}

function publicExportedBy(file, sourceGraph) {
  const index = path.join(srcRoot, "index.ts");
  const simulation = path.join(srcRoot, "simulation.ts");
  return [index, simulation]
    .filter((root) => sourceGraph.all.get(root)?.has(file))
    .map(relative);
}

function classify(flags, consumers) {
  const live = flags.live_runtime || flags.live_type;
  const simulation = flags.simulation_runtime || flags.simulation_type;
  const tooling = flags.tooling_runtime || flags.tooling_type;
  const legacy = flags.legacy_runtime || flags.legacy_type;
  const test = flags.test_runtime || flags.test_type;
  const intentionalEvaluation = flags.intentional_evaluation_type;
  const productive = live || simulation || tooling;
  const legacyAndProductive =
    legacy && (productive || consumers.typeOnlyProductionConsumers.length > 0);
  if (legacyAndProductive) return "mixed_split_required";
  if (live && (simulation || tooling)) return "productive_shared";
  if (live) return "productive_live";
  if (simulation) return "productive_simulation";
  if (tooling) return "productive_tooling";
  if (intentionalEvaluation) return "intentional_test_evaluation";
  if (legacy && test) return "legacy_test_only";
  if (legacy) return "diagnostic_comparison";
  if (test) return "legacy_test_only";
  return "unreferenced";
}

function proposedDisposition(classification) {
  if (classification === "unreferenced") return "RETIRE_NOW";
  if (classification === "intentional_test_evaluation") {
    return "RETAIN_INTENTIONAL_TEST_EVALUATION";
  }
  if (classification === "legacy_test_only")
    return "RETIRE_AFTER_TEST_CONSUMER_REVIEW";
  if (classification === "diagnostic_comparison")
    return "RETAIN_DIAGNOSTIC_OR_RETIRE";
  if (classification === "mixed_split_required") return "SPLIT_BEFORE_RETIRE";
  return "KEEP_PRODUCTIVE";
}

function blockerFor(classification, consumers) {
  if (classification === "mixed_split_required") {
    if (
      consumers.productionRuntimeConsumers.length > 0 ||
      consumers.externalConsumers.length > 0
    ) {
      return "productive runtime consumer";
    }
    return "production type-only consumer requires contract decision";
  }
  if (classification === "legacy_test_only")
    return "test consumer review required";
  if (classification === "intentional_test_evaluation") {
    return "explicit evaluation root";
  }
  if (classification === "diagnostic_comparison")
    return "explicit diagnostic retention decision required";
  return undefined;
}

function summarize(rows) {
  const byClassification = Object.groupBy(rows, (row) => row.classification);
  const byDisposition = Object.groupBy(rows, (row) => row.proposedDisposition);
  return {
    byClassification: Object.fromEntries(
      Object.entries(byClassification).map(([kind, entries]) => [
        kind,
        entries.length,
      ]),
    ),
    decisions: Object.fromEntries(
      Object.entries(byDisposition).map(([kind, entries]) => [
        kind,
        entries.map((row) => row.path),
      ]),
    ),
  };
}

function renderReport(audit) {
  const decisions = audit.summary.decisions;
  const section = (name) => {
    const entries = decisions[name] ?? [];
    return `## ${name}\n\n${entries.length === 0 ? "Keine Dateien." : entries.map((entry) => `- \`${entry}\``).join("\n")}\n`;
  };
  return [
    "# AI Tactical Runtime Reachability Audit",
    "",
    `Erzeugt: ${audit.generatedAt}`,
    "",
    "Der Audit wertet Runtime- und Typkanten getrennt aus. Die vollständigen",
    "Dateidaten stehen im gleichnamigen JSON-Manifest.",
    "",
    "## Klassifikationen",
    "",
    ...Object.entries(audit.summary.byClassification).map(
      ([kind, count]) => `- \`${kind}\`: ${count}`,
    ),
    "",
    section("RETIRE_NOW"),
    section("SPLIT_BEFORE_RETIRE"),
    section("KEEP_PRODUCTIVE"),
    section("RETAIN_INTENTIONAL_TEST_EVALUATION"),
    section("RETIRE_AFTER_TEST_CONSUMER_REVIEW"),
    section("RETAIN_DIAGNOSTIC_OR_RETIRE"),
  ].join("\n");
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

function reachabilityCheckFailures(summary) {
  const violations = [
    ["unreferenced", summary.byClassification.unreferenced ?? 0],
    ["RETIRE_NOW", summary.decisions.RETIRE_NOW?.length ?? 0],
    [
      "mixed_split_required",
      summary.byClassification.mixed_split_required ?? 0,
    ],
    ["legacy_test_only", summary.byClassification.legacy_test_only ?? 0],
  ];
  return violations
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}=${count}`);
}

function runSelfTest() {
  const packageRoots = packageRuntimeExportRoots({
    ".": "./src/index.ts",
    "./catalog": "./src/catalog-ai-hint-public.ts",
    "./simulation": "./src/simulation.ts",
  });
  if (packageRoots.join(",") !== "index.ts,catalog-ai-hint-public.ts")
    throw new Error("package export root self-test failed");
  const graph = new Map([
    ["live", new Set(["shared"])],
    ["legacy", new Set(["isolated"])],
    ["shared", new Set()],
    ["isolated", new Set()],
  ]);
  const live = reachableFrom(["live"], graph);
  const legacy = reachableFrom(["legacy"], graph);
  if (!live.has("shared") || !legacy.has("isolated") || live.has("isolated")) {
    throw new Error("reachability self-test failed");
  }
  if (
    classify(
      { legacy_runtime: true, test_runtime: true },
      {
        productionRuntimeConsumers: [],
        externalConsumers: [],
        typeOnlyProductionConsumers: [],
      },
    ) !== "legacy_test_only"
  ) {
    throw new Error("classification self-test failed: test-only legacy");
  }
  if (
    classify(
      { live_runtime: true, legacy_runtime: true, test_runtime: true },
      {
        productionRuntimeConsumers: ["consumer"],
        externalConsumers: [],
        typeOnlyProductionConsumers: [],
      },
    ) !== "mixed_split_required"
  ) {
    throw new Error("classification self-test failed: mixed legacy");
  }
  if (
    classify(
      { live_type: true },
      {
        productionRuntimeConsumers: [],
        externalConsumers: [],
        typeOnlyProductionConsumers: [],
      },
    ) !== "productive_live"
  ) {
    throw new Error("classification self-test failed: type-only live contract");
  }
  if (
    classify(
      { intentional_evaluation_type: true },
      {
        productionRuntimeConsumers: [],
        externalConsumers: [],
        typeOnlyProductionConsumers: [],
      },
    ) !== "intentional_test_evaluation"
  ) {
    throw new Error("classification self-test failed: intentional evaluation");
  }
  if (
    reachabilityCheckFailures({
      byClassification: { intentional_test_evaluation: 1 },
      decisions: { RETIRE_NOW: [] },
    }).length !== 0
  ) {
    throw new Error(
      "reachability self-test failed: intentional evaluation gate",
    );
  }
  if (
    reachabilityCheckFailures({
      byClassification: { unreferenced: 1, mixed_split_required: 1 },
      decisions: { RETIRE_NOW: ["dead-file"] },
    }).length !== 3
  ) {
    throw new Error("reachability self-test failed: retirement gate");
  }
  console.log("AI_SOURCE_REACHABILITY_AUDIT_SELFTEST OK");
}

function packageRuntimeExportRoots(exports) {
  return Object.entries(exports)
    .filter(
      ([subpath, target]) =>
        subpath !== "./simulation" && typeof target === "string",
    )
    .map(([, target]) => target)
    .filter((target) => target.startsWith("./src/") && target.endsWith(".ts"))
    .map((target) => target.slice("./src/".length));
}
