import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(repoRoot, "packages", "ai", "src");

if (process.argv.includes("--self-test")) {
  runSelfTest();
  process.exit(0);
}

const productionFiles = collectSourceFiles(srcRoot, false);
const testFiles = collectSourceFiles(srcRoot, true).filter((file) =>
  isTestFile(file),
);
const productionFileSet = new Set(productionFiles);
const allGraph = new Map(productionFiles.map((file) => [file, new Set()]));
const valueGraph = new Map(productionFiles.map((file) => [file, new Set()]));

for (const file of productionFiles) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) &&
      !ts.isExportDeclaration(statement)
    ) {
      continue;
    }
    const moduleSpecifier = statement.moduleSpecifier;
    if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue;
    const target = resolveRelativeImport(
      file,
      moduleSpecifier.text,
      productionFileSet,
    );
    if (!target) continue;
    allGraph.get(file).add(target);
    if (statementHasRuntimeEdge(statement)) valueGraph.get(file).add(target);
  }
}

const findings = [];
for (const file of productionFiles) {
  const relative = relativeSourcePath(file);
  if (
    currentSimulationHasHistoricalMarker(relative, readFileSync(file, "utf8"))
  ) {
    findings.push(
      `${relative} contains a historical V143 marker outside the regression boundary`,
    );
  }
}
const valueCycles = cyclicComponents(valueGraph);
if (valueCycles.length > 0) {
  findings.push(
    ...valueCycles.map(
      (component) =>
        `runtime import cycle: ${component.map(relativeSourcePath).join(" -> ")}`,
    ),
  );
}

const expectedTypeCycleSignatures = new Set();
const actualTypeCycles = cyclicComponents(allGraph);
const actualTypeCycleSignatures = new Set(
  actualTypeCycles.map((component) =>
    signature(component.map(relativeSourcePath)),
  ),
);
for (const unexpected of [...actualTypeCycleSignatures].filter(
  (entry) => !expectedTypeCycleSignatures.has(entry),
)) {
  findings.push(`unexpected type import cycle: ${unexpected}`);
}
for (const missing of [...expectedTypeCycleSignatures].filter(
  (entry) => !actualTypeCycleSignatures.has(entry),
)) {
  findings.push(
    `type-cycle ratchet is stale because the allowed cycle disappeared: ${missing}`,
  );
}

const productionLineCaps = new Map([
  ["belief-state.ts", 2548],
  ["runtime/semantic-runtime-corp-score.ts", 492],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-score-action-families.ts",
    391,
  ],
  ["runtime/semantic-runtime-corp-board-triage.ts", 364],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-board-triage-alignment.ts",
    463,
  ],
  ["runner-hand-development.ts", 936],
  ["runner/hand-development/runner-hand-text-signals.ts", 431],
  ["runner/hand-development/runner-persistent-install-evaluation.ts", 1450],
  ["visible-run-analysis.ts", 629],
  ["run-analysis/visible-run-breaker-path.ts", 838],
  ["run-analysis/visible-run-hazards.ts", 753],
  ["runtime/semantic-choice-ranking.ts", 10],
  ["runtime/choice-ranking/mapped-choice-orchestrator.ts", 482],
  ["runtime/choice-ranking/mapped-choice-initial-overrides.ts", 128],
  ["runtime/semantic-runtime-corp-scoring-window.ts", 249],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-board-triage-policies.ts",
    2276,
  ],
  ["runtime/corp-scoreline/semantic-runtime-corp-score-action-economy.ts", 885],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-components.ts",
    526,
  ],
  ["runtime/corp-scoreline/semantic-runtime-corp-score-active-remote.ts", 505],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection.ts",
    1189,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-scoring-window-runner-pressure.ts",
    448,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-scoring-window-card-data.ts",
    4,
  ],
]);
for (const file of productionFiles) {
  const relative = relativeSourcePath(file);
  const lineCount = sourceLineCount(file);
  const cap = productionLineCaps.get(relative) ?? 2500;
  if (lineCount > cap) {
    findings.push(
      `${relative} has ${lineCount} lines; allowed maximum is ${cap}`,
    );
  }
}

const testLineCaps = new Map([
  ["runner-hand-development.test.ts", 655],
  ["runner/hand-development/runner-persistent-install-evaluation.test.ts", 912],
  ["runtime/semantic-runtime-corp-score-active-remote.test.ts", 1606],
  ["runtime/semantic-runtime-corp-score-economy-and-trace.test.ts", 1067],
  ["runtime/semantic-runtime-corp-score-pressure.test.ts", 1183],
  ["tactical-plans.test.ts", 4308],
  ["semantic-ai-runtime-cutover-boundaries.test.ts", 241],
  ["semantic-ai-runtime-cutover-corp.test.ts", 1429],
  ["semantic-ai-runtime-cutover-runner-plans.test.ts", 1602],
  ["semantic-ai-runtime-cutover-runner-safety.test.ts", 710],
  ["runtime/semantic-runtime-corp-board-triage.test.ts", 1764],
  ["runtime/semantic-runtime-corp-scoring-window.test.ts", 812],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-score-scoreline-and-install.test.ts",
    3314,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-board-triage-central.test.ts",
    517,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-board-triage-clock.test.ts",
    368,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-board-triage-remote-funding.test.ts",
    613,
  ],
  [
    "runtime/corp-scoreline/semantic-runtime-corp-scoring-window-protection.test.ts",
    877,
  ],
  ["runner-run-target-evaluation.test.ts", 3150],
  ["runtime/semantic-choice-ranking.test.ts", 1218],
  [
    "runtime/choice-ranking/semantic-choice-ranking-corp-scoreline.test.ts",
    230,
  ],
  ["runtime/choice-ranking/semantic-choice-ranking-corp-triage.test.ts", 206],
  ["runtime/choice-ranking/semantic-choice-ranking-mapping.test.ts", 102],
]);
for (const [relative, cap] of testLineCaps) {
  const file = path.join(srcRoot, ...relative.split("/"));
  const lineCount = sourceLineCount(file);
  if (lineCount > cap) {
    findings.push(
      `${relative} has ${lineCount} lines; allowed maximum is ${cap}`,
    );
  }
}

const runtimeRootProductionFiles = productionFiles.filter(
  (file) => path.dirname(file) === path.join(srcRoot, "runtime"),
);
const runtimeRootCap = 289;
if (runtimeRootProductionFiles.length > runtimeRootCap) {
  findings.push(
    `runtime root has ${runtimeRootProductionFiles.length} production files; allowed maximum is ${runtimeRootCap}`,
  );
}

if (findings.length > 0) {
  console.error("AI_SOURCE_STRUCTURE FAILED");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `AI_SOURCE_STRUCTURE OK production=${productionFiles.length} runtimeCycles=${valueCycles.length} allowedTypeCycles=${actualTypeCycles.length} runtimeRootProduction=${runtimeRootProductionFiles.length}`,
);

function collectSourceFiles(root, includeTests) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolute, includeTests));
      continue;
    }
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    if (!includeTests && isTestFile(absolute)) continue;
    files.push(path.normalize(absolute));
  }
  return files.sort();
}

function isTestFile(file) {
  return /\.(?:test|test-support)\.tsx?$/.test(file);
}

function resolveRelativeImport(file, importSource, fileSet) {
  if (!importSource.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(file), importSource);
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    const normalized = path.normalize(candidate);
    if (fileSet.has(normalized)) return normalized;
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

function cyclicComponents(graph) {
  let nextIndex = 0;
  const stack = [];
  const onStack = new Set();
  const indexByNode = new Map();
  const lowLinkByNode = new Map();
  const components = [];

  function visit(node) {
    indexByNode.set(node, nextIndex);
    lowLinkByNode.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of graph.get(node) ?? []) {
      if (!indexByNode.has(target)) {
        visit(target);
        lowLinkByNode.set(
          node,
          Math.min(lowLinkByNode.get(node), lowLinkByNode.get(target)),
        );
      } else if (onStack.has(target)) {
        lowLinkByNode.set(
          node,
          Math.min(lowLinkByNode.get(node), indexByNode.get(target)),
        );
      }
    }

    if (lowLinkByNode.get(node) !== indexByNode.get(node)) return;
    const component = [];
    let current;
    do {
      current = stack.pop();
      onStack.delete(current);
      component.push(current);
    } while (current !== node);
    if (component.length > 1) components.push(component.sort());
  }

  for (const node of graph.keys()) {
    if (!indexByNode.has(node)) visit(node);
  }
  return components.sort((left, right) =>
    signature(left).localeCompare(signature(right)),
  );
}

function relativeSourcePath(file) {
  return path.relative(srcRoot, file).replaceAll("\\", "/");
}

function signature(entries) {
  return entries.slice().sort().join("|");
}

function sourceLineCount(file) {
  return readFileSync(file, "utf8").split(/\r?\n/).length;
}

function currentSimulationHasHistoricalMarker(relative, source) {
  const inCurrentSimulationSurface =
    relative === "simulation.ts" ||
    relative === "ai-simulation-public-entrypoints.ts" ||
    relative.startsWith("simulation/");
  if (!inCurrentSimulationSurface) return false;
  if (relative.startsWith("simulation/regression/")) return false;
  if (
    [
      "simulation/benchmark-profile-data.ts",
      "simulation/soak-seed-data.ts",
    ].includes(relative)
  ) {
    return false;
  }
  return /v143|1\.4\.3/i.test(source);
}

function runSelfTest() {
  const graph = new Map([
    ["a", new Set(["b"])],
    ["b", new Set(["a", "c"])],
    ["c", new Set()],
  ]);
  const cycles = cyclicComponents(graph);
  if (cycles.length !== 1 || signature(cycles[0]) !== "a|b") {
    throw new Error(
      `source structure self-test failed: ${JSON.stringify(cycles)}`,
    );
  }
  if (
    !currentSimulationHasHistoricalMarker(
      "simulation/simulation-league.ts",
      'export const version = "V143";',
    ) ||
    currentSimulationHasHistoricalMarker(
      "simulation/regression/v143/fixture-data.ts",
      'export const version = "1.4.3";',
    )
  ) {
    throw new Error("source structure self-test failed: V143 boundary");
  }
  console.log("AI_SOURCE_STRUCTURE_SELFTEST OK");
}
