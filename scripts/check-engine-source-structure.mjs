#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const engineRoot = path.join(repoRoot, "packages", "engine", "src");
const abilityPayloadRegistryFile = path.join(
  repoRoot,
  "packages",
  "shared",
  "src",
  "ability-payload.ts",
);
const runtimeRoot = path.join(engineRoot, "game", "engine-runtime-internal");
const abilityRoot = path.join(engineRoot, "ability-engine");
const cardImplementationRoot = path.join(engineRoot, "card-implementations");

const forbiddenRuntimeDelegateFiles = [
  "action-runtime-delegates.ts",
  "card-runtime-delegates.ts",
  "choice-runtime-delegates.ts",
  "flow-runtime-delegates.ts",
  "runtime-delegate-store.ts",
  "runtime-delegates.ts",
  "state-runtime-delegates.ts",
];
const allowedLayerDebt = new Set([
  "ability-engine/active-modifiers.ts -> game/state/temporary-breaker-strength.ts",
  "ability-engine/card-implementation-runtime-activated-costs.ts -> game/payment/runner-payment-support.ts",
]);
const runtimePortContractFiles = [
  "access-flow-runtime-port.ts",
  "action-runtime-port.ts",
  "card-runtime-host-port.ts",
  "card-runtime-resolver-port.ts",
  "card-strength-cost-runtime-port.ts",
  "choice-hidden-zone-runtime-port.ts",
  "choice-resolver-runtime-port.ts",
  "corp-runtime-port.ts",
  "corp-zone-runtime-port.ts",
  "counter-turn-runtime-port.ts",
  "damage-trace-runtime-port.ts",
  "economy-runtime-port.ts",
  "encounter-movement-runtime-port.ts",
  "flow-runtime-port.ts",
  "hidden-zone-arrange-runtime-port.ts",
  "hidden-zone-dice-loop-runtime-port.ts",
  "hidden-zone-nonsearch-runtime-port.ts",
  "hidden-zone-search-runtime-port.ts",
  "install-rez-runtime-port.ts",
  "lifecycle-runtime-port.ts",
  "lookup-runtime-port.ts",
  "pending-choice-runtime-port.ts",
  "run-flow-runtime-port.ts",
  "state-corp-runtime-port.ts",
  "state-runtime-resolver-port.ts",
  "turn-corp-runtime-port.ts",
  "turn-runtime-port.ts",
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
const actualVersionedAbilityPayloadFields = new Set();
const registeredAbilityPayloadFields = new Set(
  stringLiteralArrayValues(
    parseSource(
      abilityPayloadRegistryFile,
      readFileSync(abilityPayloadRegistryFile, "utf8"),
    ),
    "ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS",
  ),
);

for (const file of productionFiles) {
  const source = parseSource(file, readFileSync(file, "utf8"));
  for (const field of versionedAbilityPayloadFields(source))
    actualVersionedAbilityPayloadFields.add(field);
  const resolvedEffectAssertionCount = countTypeAssertionsNamed(
    source,
    "ResolvedGameEffect",
  );
  if (resolvedEffectAssertionCount > 0)
    findings.push(
      `${relativeEnginePath(file)} bypasses ResolvedGameEffect validation with ${resolvedEffectAssertionCount} type assertion(s)`,
    );
  if (relativeEnginePath(file).startsWith("game/engine-runtime-internal/")) {
    const dependencySnapshots = countRuntimeDependencySnapshots(source);
    if (dependencySnapshots > 0)
      findings.push(
        `${relativeEnginePath(file)} captures ${dependencySnapshots} runtime dependency object destructuring snapshot(s)`,
      );
  }
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

for (const field of actualVersionedAbilityPayloadFields) {
  if (!registeredAbilityPayloadFields.has(field))
    findings.push(`unregistered versioned ability payload field: ${field}`);
}

const actualCycles = cyclicComponents(graph);
const actualCycleSignatures = new Set(
  actualCycles.map((component) =>
    signature(component.map((file) => relativeEnginePath(file))),
  ),
);
for (const cycle of actualCycleSignatures) {
  findings.push(`relative import cycle: ${cycle}`);
}
for (const layerEdge of actualLayerDebt) {
  if (!allowedLayerDebt.has(layerEdge))
    findings.push(`unexpected forbidden layer edge: ${layerEdge}`);
}
for (const allowed of allowedLayerDebt) {
  if (!actualLayerDebt.has(allowed))
    findings.push(`stale allowed-layer debt entry: ${allowed}`);
}

const runtimeFileNames = new Set(readdirSync(runtimeRoot));
for (const fileName of forbiddenRuntimeDelegateFiles) {
  if (runtimeFileNames.has(fileName))
    findings.push(`${runtimePath(fileName)} must not be reintroduced`);
}

const definitionFamilyFiles = readdirSync(abilityRoot)
  .filter((name) => /^definition-.*-contracts\.ts$/.test(name))
  .sort();
for (const fileName of definitionFamilyFiles) {
  const file = path.join(abilityRoot, fileName);
  const source = parseSource(file, readFileSync(file, "utf8"));
  const valueStatement = source.statements.find(
    (statement) => !isDeclarativeContractStatement(statement),
  );
  if (valueStatement)
    findings.push(
      `ability-engine/${fileName} contains runtime statement kind ${ts.SyntaxKind[valueStatement.kind]}`,
    );
}

const cardSubregistryRoot = path.join(cardImplementationRoot, "subregistries");
for (const fileName of readdirSync(cardSubregistryRoot)) {
  if (/^card-implementation-group-\d{3}\.ts$/.test(fileName))
    findings.push(
      `card-implementations/subregistries/${fileName} uses a numbered registry group`,
    );
}
const legacyCoverageSourceLocations = path.join(
  cardImplementationRoot,
  "coverage-source-locations.ts",
);
if (existsSync(legacyCoverageSourceLocations))
  findings.push(
    "card-implementations/coverage-source-locations.ts must stay removed; CardSpec source refs own coverage locations",
  );

const coverageMetadata = path.join(cardImplementationRoot, "coverage.ts");
if (!existsSync(coverageMetadata)) {
  findings.push("card-implementations/coverage.ts is missing");
} else {
  const coverageSource = parseSource(
    coverageMetadata,
    readFileSync(coverageMetadata, "utf8"),
  );
  const cardSpecCoverageImports = importedBindingNames(
    coverageSource,
    "@netgrid/cards/engine",
  );
  for (const requiredImport of [
    "cardSpecImplementationDefinitionIds",
    "cardSpecRuntimeDefinitionIds",
    "cardSpecSourceRefByDefinitionId",
  ])
    if (!cardSpecCoverageImports.has(requiredImport))
      findings.push(
        `card-implementations/coverage.ts must derive coverage from CardSpec ${requiredImport}`,
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
const runtimePortBindings = path.join(runtimeRoot, "runtime-port-bindings.ts");
const runtimePortBindingsSource = parseSource(
  runtimePortBindings,
  readFileSync(runtimePortBindings, "utf8"),
);
const runtimePortBindingsAnyCount = countSyntaxKind(
  runtimePortBindingsSource,
  ts.SyntaxKind.AnyKeyword,
);
if (runtimePortBindingsAnyCount > 0)
  findings.push(
    `${runtimePath("runtime-port-bindings.ts")} contains ${runtimePortBindingsAnyCount} any type nodes`,
  );
for (const fileName of runtimePortContractFiles) {
  const file = path.join(runtimeRoot, fileName);
  const source = parseSource(file, readFileSync(file, "utf8"));
  const anyCount = countSyntaxKind(source, ts.SyntaxKind.AnyKeyword);
  if (anyCount > 0)
    findings.push(
      `${runtimePath(fileName)} contains ${anyCount} any type nodes`,
    );
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
  `ENGINE_SOURCE_STRUCTURE OK production=${productionFiles.length} relativeCycles=${actualCycles.length}`,
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

function importedBindingNames(source, moduleSpecifier) {
  const names = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== moduleSpecifier ||
      !statement.importClause ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    )
      continue;
    for (const element of statement.importClause.namedBindings.elements)
      names.add(element.propertyName?.text ?? element.name.text);
  }
  return names;
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

function countRuntimeDependencySnapshots(source) {
  let count = 0;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isObjectBindingPattern(node.name) &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === "deps"
    )
      count += 1;
    ts.forEachChild(node, visit);
  }
  visit(source);
  return count;
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

function countSyntaxKind(node, kind) {
  let count = node.kind === kind ? 1 : 0;
  ts.forEachChild(node, (child) => {
    count += countSyntaxKind(child, kind);
  });
  return count;
}

function countTypeAssertionsNamed(node, typeName) {
  let count = 0;
  function visit(current) {
    if (
      (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current)) &&
      ts.isTypeReferenceNode(current.type) &&
      ts.isIdentifier(current.type.typeName) &&
      current.type.typeName.text === typeName
    )
      count += 1;
    ts.forEachChild(current, visit);
  }
  visit(node);
  return count;
}

function stringLiteralArrayValues(source, variableName) {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName &&
        declaration.initializer &&
        ts.isAsExpression(declaration.initializer) &&
        ts.isArrayLiteralExpression(declaration.initializer.expression)
      )
        return declaration.initializer.expression.elements
          .filter(ts.isStringLiteral)
          .map((element) => element.text);
    }
  }
  return [];
}

function versionedAbilityPayloadFields(source) {
  const fields = new Set();
  function visit(node) {
    if (
      (ts.isIdentifier(node) || ts.isStringLiteral(node)) &&
      /^v\d+[A-Za-z0-9]*Ability$/.test(node.text)
    )
      fields.add(node.text);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return fields;
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
    countRuntimeDependencySnapshots(
      parseSource("runtime.ts", "const { action } = deps;"),
    ) !== 1 ||
    countRuntimeDependencySnapshots(
      parseSource("runtime.ts", "const action = deps.action;"),
    ) !== 0
  )
    throw new Error(
      "engine source structure self-test failed: runtime dependency snapshot",
    );

  if (
    countTypeAssertionsNamed(
      parseSource(
        "effect.ts",
        "declare const value: unknown; const bypass = value as ResolvedGameEffect;",
      ),
      "ResolvedGameEffect",
    ) !== 1
  )
    throw new Error(
      "engine source structure self-test failed: resolved effect assertion",
    );

  if (
    signature(
      Array.from(
        versionedAbilityPayloadFields(
          parseSource(
            "payload.ts",
            'const payload = { v123RunnerAbility: "test" };',
          ),
        ),
      ),
    ) !== "v123RunnerAbility"
  )
    throw new Error(
      "engine source structure self-test failed: ability payload registry",
    );

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
