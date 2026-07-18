#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const engineRoot = path.join(repoRoot, "packages", "engine", "src");
const runtimeRoot = path.join(engineRoot, "game", "engine-runtime-internal");
const abilityRoot = path.join(engineRoot, "ability-engine");

const delegateDebt = new Map([
  ["action-runtime-delegates.ts", 107],
  ["card-runtime-delegates.ts", 50],
  ["choice-runtime-delegates.ts", 89],
  ["flow-runtime-delegates.ts", 58],
  ["state-runtime-delegates.ts", 59],
]);
const delegateExportCaps = new Map([
  ["action-runtime-delegates.ts", 107],
  ["card-runtime-delegates.ts", 50],
  ["choice-runtime-delegates.ts", 89],
  ["flow-runtime-delegates.ts", 58],
  ["state-runtime-delegates.ts", 126],
]);
const runtimeImportFanoutDebt = new Map([
  ["game/engine-runtime-internal/access-flow-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/action-runtime-bootstrap.ts", 123],
  ["game/engine-runtime-internal/activated-card-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/apply-action-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/card-lifecycle-runtime-hosts.ts", 118],
  ["game/engine-runtime-internal/card-runtime-bootstrap.ts", 122],
  ["game/engine-runtime-internal/card-runtime-deps-hosts.ts", 118],
  ["game/engine-runtime-internal/card-runtime-resolvers.ts", 123],
  ["game/engine-runtime-internal/card-strength-cost-runtime-services.ts", 117],
  ["game/engine-runtime-internal/choice-hidden-zone-resolvers.ts", 121],
  ["game/engine-runtime-internal/corp-runtime-resolvers.ts", 122],
  ["game/engine-runtime-internal/counter-turn-runtime-services.ts", 117],
  ["game/engine-runtime-internal/damage-trace-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/economy-runtime-services.ts", 118],
  ["game/engine-runtime-internal/encounter-movement-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/flow-runtime-bootstrap.ts", 122],
  ["game/engine-runtime-internal/install-rez-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/legal-action-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/lookup-runtime-services.ts", 117],
  ["game/engine-runtime-internal/play-board-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/public-event-runtime-bootstrap.ts", 121],
  ["game/engine-runtime-internal/run-flow-runtime-hosts.ts", 116],
  ["game/engine-runtime-internal/runtime-bootstrap-support.ts", 124],
  ["game/engine-runtime-internal/scored-economy-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/state-corp-runtime-resolvers.ts", 126],
  ["game/engine-runtime-internal/state-runtime-bootstrap.ts", 122],
  ["game/engine-runtime-internal/state-runtime-resolvers.ts", 126],
  ["game/engine-runtime-internal/trigger-ability-runtime-hosts.ts", 117],
  ["game/engine-runtime-internal/turn-runtime-resolvers.ts", 125],
  ["game/engine-runtime-internal/zone-runtime-services.ts", 118],
]);
const allowedCycleSignatures = new Set([
  "game/engine-runtime-internal/runtime-bootstrap-support.ts|game/engine-runtime-internal/runtime-delegates.ts|game/engine-runtime-internal/state-corp-runtime-resolvers.ts|game/engine-runtime-internal/state-runtime-resolvers.ts",
  "game/run/fort-pass-window.ts|game/run/windows/after-passing-last-ice-window.ts|game/run/windows/run-window-host.ts",
]);
const allowedLayerDebt = new Set([
  "ability-engine/active-modifiers.ts -> game/state/temporary-breaker-strength.ts",
  "ability-engine/card-implementation-runtime-activated-costs.ts -> game/payment/runner-payment-support.ts",
  "ability-engine/cost-pipeline.ts -> game/payment/index.ts",
]);
const stateRuntimePortFiles = [
  "card-strength-cost-runtime-port.ts",
  "counter-turn-runtime-port.ts",
  "economy-runtime-port.ts",
  "lookup-runtime-port.ts",
  "zone-runtime-port.ts",
];

if (process.argv.includes("--self-test")) {
  runSelfTest();
  process.exit(0);
}

const productionFiles = collectSourceFiles(engineRoot);
const productionFileSet = new Set(productionFiles);
const graph = new Map(productionFiles.map((file) => [file, new Set()]));
const findings = [];
const actualLayerDebt = new Set();

for (const file of productionFiles) {
  const source = parseSource(file, readFileSync(file, "utf8"));
  for (const statement of source.statements) {
    if (!isModuleDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) continue;
    const target = resolveRelativeImport(
      file,
      specifier.text,
      productionFileSet,
    );
    if (target) graph.get(file).add(target);
    const layerFinding = forbiddenLayerEdge(
      relativeEnginePath(file),
      target ? relativeEnginePath(target) : specifier.text,
    );
    if (layerFinding) actualLayerDebt.add(layerFinding);
  }
}

const actualCycles = cyclicComponents(graph);
const actualCycleSignatures = new Set(
  actualCycles.map((component) =>
    signature(component.map((file) => relativeEnginePath(file))),
  ),
);
for (const cycle of actualCycleSignatures) {
  if (!allowedCycleSignatures.has(cycle))
    findings.push(`unexpected relative import cycle: ${cycle}`);
}
for (const allowed of allowedCycleSignatures) {
  if (!actualCycleSignatures.has(allowed))
    findings.push(`stale allowed-cycle debt entry: ${allowed}`);
}
for (const layerEdge of actualLayerDebt) {
  if (!allowedLayerDebt.has(layerEdge))
    findings.push(`unexpected forbidden layer edge: ${layerEdge}`);
}
for (const allowed of allowedLayerDebt) {
  if (!actualLayerDebt.has(allowed))
    findings.push(`stale allowed-layer debt entry: ${allowed}`);
}

for (const [fileName, expectedUnsafeSignatures] of delegateDebt) {
  const file = path.join(runtimeRoot, fileName);
  const source = parseSource(file, readFileSync(file, "utf8"));
  const unsafeSignatures = countUnsafeDelegateSignatures(source);
  if (unsafeSignatures !== expectedUnsafeSignatures) {
    findings.push(
      `${runtimePath(fileName)} has ${unsafeSignatures} unsafe any delegate signatures; debt ledger expects ${expectedUnsafeSignatures}`,
    );
  }
  const exportedFunctions = countExportedFunctions(source);
  const cap = delegateExportCaps.get(fileName);
  if (exportedFunctions > cap) {
    findings.push(
      `${runtimePath(fileName)} exports ${exportedFunctions} functions; allowed maximum is ${cap}`,
    );
  }
}

for (const [file, targets] of graph) {
  const relative = relativeEnginePath(file);
  const finding = importFanoutFinding(
    relative,
    targets.size,
    runtimeImportFanoutDebt,
  );
  if (finding) findings.push(finding);
}
for (const relative of runtimeImportFanoutDebt.keys()) {
  if (!graph.has(path.join(engineRoot, ...relative.split("/"))))
    findings.push(`stale fan-out debt entry: ${relative}`);
}

const definitionFacade = path.join(abilityRoot, "definition-types.ts");
if (sourceLineCount(definitionFacade) > 20)
  findings.push("ability-engine/definition-types.ts exceeds 20 lines");
const definitionFamilyFiles = readdirSync(abilityRoot)
  .filter((name) => /^definition-.*-contracts\.ts$/.test(name))
  .sort();
if (definitionFamilyFiles.length !== 6)
  findings.push(
    `ability contract structure has ${definitionFamilyFiles.length} family modules; expected 6`,
  );
for (const fileName of definitionFamilyFiles) {
  const file = path.join(abilityRoot, fileName);
  const lineCount = sourceLineCount(file);
  if (lineCount > 1200)
    findings.push(
      `ability-engine/${fileName} has ${lineCount} lines; allowed maximum is 1200`,
    );
  const source = parseSource(file, readFileSync(file, "utf8"));
  const valueStatement = source.statements.find(
    (statement) => !isDeclarativeContractStatement(statement),
  );
  if (valueStatement)
    findings.push(
      `ability-engine/${fileName} contains runtime statement kind ${ts.SyntaxKind[valueStatement.kind]}`,
    );
}

const runtimePortContracts = path.join(
  runtimeRoot,
  "runtime-port-contracts.ts",
);
const runtimePortSource = parseSource(
  runtimePortContracts,
  readFileSync(runtimePortContracts, "utf8"),
);
const runtimePortAnyCount = countSyntaxKind(
  runtimePortSource,
  ts.SyntaxKind.AnyKeyword,
);
if (runtimePortAnyCount > 0)
  findings.push(
    `${runtimePath("runtime-port-contracts.ts")} contains ${runtimePortAnyCount} any type nodes`,
  );
if (sourceLineCount(runtimePortContracts) > 160)
  findings.push(
    `${runtimePath("runtime-port-contracts.ts")} exceeds 160 lines`,
  );

for (const fileName of stateRuntimePortFiles) {
  const file = path.join(runtimeRoot, fileName);
  const source = parseSource(file, readFileSync(file, "utf8"));
  const anyCount = countSyntaxKind(source, ts.SyntaxKind.AnyKeyword);
  if (anyCount > 0)
    findings.push(
      `${runtimePath(fileName)} contains ${anyCount} any type nodes`,
    );
  if (sourceLineCount(file) > 180)
    findings.push(`${runtimePath(fileName)} exceeds 180 lines`);
  const valueStatement = source.statements.find(
    (statement) => !isDeclarativeContractStatement(statement),
  );
  if (valueStatement)
    findings.push(
      `${runtimePath(fileName)} contains runtime statement kind ${ts.SyntaxKind[valueStatement.kind]}`,
    );
}

if (findings.length > 0) {
  console.error("ENGINE_SOURCE_STRUCTURE FAILED");
  for (const finding of findings.sort()) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(
  `ENGINE_SOURCE_STRUCTURE OK production=${productionFiles.length} relativeCycles=${actualCycles.length} unsafeDelegateSignatures=${sum(delegateDebt.values())}`,
);

function collectSourceFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    if (/\.(?:test|test-support)\.tsx?$/.test(entry.name)) continue;
    files.push(path.normalize(absolute));
  }
  return files.sort();
}

function parseSource(fileName, source) {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function isModuleDeclaration(statement) {
  return ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement);
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

function forbiddenLayerEdge(source, target) {
  if (
    target.startsWith("game/engine-runtime-internal/") &&
    !source.startsWith("game/engine-runtime-internal/") &&
    source !== "game/engine-runtime.ts"
  ) {
    return `${source} -> ${target}`;
  }
  if (source.startsWith("ability-engine/") && target.startsWith("game/")) {
    return `${source} -> ${target}`;
  }
  if (
    source.startsWith("card-implementations/") &&
    target.startsWith("game/")
  ) {
    return `${source} -> ${target}`;
  }
  return undefined;
}

function countUnsafeDelegateSignatures(source) {
  let count = 0;
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement)) continue;
    const hasAnyReturn = statement.type?.kind === ts.SyntaxKind.AnyKeyword;
    const hasAnyRestArray = statement.parameters.some(
      (parameter) =>
        Boolean(parameter.dotDotDotToken) &&
        ts.isArrayTypeNode(parameter.type) &&
        parameter.type.elementType.kind === ts.SyntaxKind.AnyKeyword,
    );
    if (hasAnyReturn || hasAnyRestArray) count += 1;
  }
  return count;
}

function countExportedFunctions(source) {
  return source.statements.filter(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
  ).length;
}

function importFanoutFinding(relative, actual, debt) {
  const expectedDebt = debt.get(relative);
  if (expectedDebt !== undefined && actual !== expectedDebt)
    return `${relative} imports ${actual} engine modules; fan-out debt ledger expects ${expectedDebt}`;
  if (expectedDebt === undefined && actual > 100)
    return `${relative} imports ${actual} engine modules; allowed maximum is 100`;
  return undefined;
}

function isDeclarativeContractStatement(statement) {
  if (
    ts.isTypeAliasDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement)
  )
    return true;
  if (ts.isImportDeclaration(statement))
    return statement.importClause?.isTypeOnly === true;
  return ts.isExportDeclaration(statement) && statement.isTypeOnly;
}

function sourceLineCount(file) {
  const text = readFileSync(file, "utf8");
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

function countSyntaxKind(node, kind) {
  let count = node.kind === kind ? 1 : 0;
  ts.forEachChild(node, (child) => {
    count += countSyntaxKind(child, kind);
  });
  return count;
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

function relativeEnginePath(file) {
  return path.relative(engineRoot, file).replaceAll("\\", "/");
}

function runtimePath(fileName) {
  return `game/engine-runtime-internal/${fileName}`;
}

function signature(entries) {
  return entries.slice().sort().join("|");
}

function sum(values) {
  return [...values].reduce((total, value) => total + value, 0);
}

function runSelfTest() {
  const graph = new Map([
    ["a", new Set(["b"])],
    ["b", new Set(["a", "c"])],
    ["c", new Set()],
  ]);
  const cycles = cyclicComponents(graph);
  if (cycles.length !== 1 || signature(cycles[0]) !== "a|b")
    throw new Error("engine source structure self-test failed: import cycle");

  const unsafeSource = parseSource(
    "delegate.ts",
    "export function unsafe(...args: any[]): any { return args[0]; }\nexport function safe(value: string): string { return value; }",
  );
  if (
    countUnsafeDelegateSignatures(unsafeSource) !== 1 ||
    countExportedFunctions(unsafeSource) !== 2
  )
    throw new Error(
      "engine source structure self-test failed: unsafe delegate",
    );

  if (
    !importFanoutFinding("new-module.ts", 101, new Map()) ||
    !importFanoutFinding(
      "legacy-module.ts",
      99,
      new Map([["legacy-module.ts", 100]]),
    ) ||
    importFanoutFinding("new-module.ts", 100, new Map())
  )
    throw new Error("engine source structure self-test failed: import fan-out");

  if (
    !forbiddenLayerEdge("ability-engine/example.ts", "game/state/example.ts") ||
    forbiddenLayerEdge("game/state/example.ts", "ability-engine/example.ts")
  )
    throw new Error("engine source structure self-test failed: layer edge");

  const valueContractSource = parseSource(
    "contract.ts",
    "export const executesAtRuntime = true;",
  );
  if (
    valueContractSource.statements.every(isDeclarativeContractStatement) ||
    !parseSource("contract.ts", "export type Safe = string;").statements.every(
      isDeclarativeContractStatement,
    )
  )
    throw new Error(
      "engine source structure self-test failed: declarative contracts",
    );

  console.log("ENGINE_SOURCE_STRUCTURE_SELFTEST OK");
}
