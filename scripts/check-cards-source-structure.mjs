#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cardsRoot = path.join(root, "packages", "cards");
const sourceRoot = path.join(cardsRoot, "src");

if (process.argv.includes("--self-test")) runSelfTest();
else runRepositoryCheck();

function runRepositoryCheck() {
  const files = collectSourceFiles(sourceRoot).filter(
    (file) => !/\.(test|spec)\.ts$/.test(file),
  );
  const fileSet = new Set(files.map((file) => path.resolve(file)));
  const graph = new Map(files.map((file) => [path.resolve(file), new Set()]));
  const findings = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    findings.push(...sourceFindings(file, source, fileSet, graph));
  }
  findings.push(...configurationFindings());
  for (const cycle of graphCycles(graph))
    findings.push(
      `Cards-Quellzyklus: ${cycle.map(relativeCardPath).join(" -> ")}`,
    );
  if (findings.length > 0) {
    console.error("CARDS_SOURCE_STRUCTURE FAIL");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exitCode = 1;
  } else
    console.log(`CARDS_SOURCE_STRUCTURE OK files=${files.length} cycles=0`);
}

function sourceFindings(file, sourceText, fileSet, graph) {
  const relative = relativeCardPath(file);
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const findings = [];
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) &&
      !ts.isExportDeclaration(statement)
    )
      continue;
    const moduleSpecifier = statement.moduleSpecifier;
    if (!moduleSpecifier || !ts.isStringLiteralLike(moduleSpecifier)) continue;
    const specifier = moduleSpecifier.text;
    if (specifier.startsWith(".")) {
      const target = resolveRelative(file, specifier, fileSet);
      if (!target) {
        const absolute = path.resolve(path.dirname(file), specifier);
        if (!absolute.startsWith(sourceRoot + path.sep))
          findings.push(
            `${relative}: relativer Import verlässt packages/cards/src (${specifier})`,
          );
      } else graph.get(path.resolve(file))?.add(target);
    } else if (specifier !== "@netgrid/shared")
      findings.push(
        `${relative}: Produktivimport ${specifier} ist in cards nicht erlaubt`,
      );
  }
  const forbiddenGlobalRoots = new Set([
    "process",
    "crypto",
    "performance",
    "window",
    "document",
    "navigator",
    "localStorage",
    "sessionStorage",
  ]);
  const forbiddenCalls = new Set(["fetch", "WebSocket", "XMLHttpRequest"]);
  const seenRuntimeGlobals = new Set();
  walk(source);
  function walk(node) {
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      inspectModuleNode(node.argument.literal);
    if (ts.isCallExpression(node)) {
      const dynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const requireCall =
        ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (dynamicImport || requireCall) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument))
          inspectSpecifier(argument.text);
        else
          findings.push(
            `${relative}: dynamischer Import/require muss ein Stringliteral sein`,
          );
      }
    }
    const isPropertyName =
      ts.isIdentifier(node) &&
      ts.isPropertyAccessExpression(node.parent) &&
      node.parent.name === node;
    const pathParts = isPropertyName ? undefined : accessPath(node);
    const normalizedPath =
      pathParts?.[0] === "globalThis" ? pathParts.slice(1) : pathParts;
    if (normalizedPath?.length) {
      if (forbiddenGlobalRoots.has(normalizedPath[0]))
        seenRuntimeGlobals.add(normalizedPath[0]);
      if (normalizedPath[0] === "Math" && normalizedPath[1] === "random")
        seenRuntimeGlobals.add("Math.random");
      if (normalizedPath[0] === "Date" && normalizedPath[1] === "now")
        seenRuntimeGlobals.add("Date.now");
    }
    if (
      (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      ts.isIdentifier(node.expression) &&
      (forbiddenCalls.has(node.expression.text) ||
        node.expression.text === "Date")
    )
      seenRuntimeGlobals.add(node.expression.text);
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callPath = accessPath(node.expression);
      const normalizedCallPath =
        callPath?.[0] === "globalThis" ? callPath.slice(1) : callPath;
      if (
        normalizedCallPath?.length === 1 &&
        forbiddenCalls.has(normalizedCallPath[0])
      )
        seenRuntimeGlobals.add(normalizedCallPath[0]);
    }
    ts.forEachChild(node, walk);
  }
  for (const runtimeGlobal of seenRuntimeGlobals)
    findings.push(
      `${relative}: ${runtimeGlobal} ist in der reinen Vertragsschicht verboten`,
    );
  return findings;

  function accessPath(node) {
    if (ts.isIdentifier(node)) return [node.text];
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node)
    )
      return accessPath(node.expression);
    if (ts.isPropertyAccessExpression(node)) {
      const prefix = accessPath(node.expression);
      return prefix ? [...prefix, node.name.text] : undefined;
    }
    if (
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression)
    ) {
      const prefix = accessPath(node.expression);
      return prefix ? [...prefix, node.argumentExpression.text] : undefined;
    }
    return undefined;
  }

  function inspectModuleNode(node) {
    if (ts.isStringLiteralLike(node)) inspectSpecifier(node.text);
  }
  function inspectSpecifier(specifier) {
    if (specifier.startsWith(".")) {
      const target = resolveRelative(file, specifier, fileSet);
      if (!target) {
        const absolute = path.resolve(path.dirname(file), specifier);
        if (!absolute.startsWith(sourceRoot + path.sep))
          findings.push(
            `${relative}: relativer Import verlässt packages/cards/src (${specifier})`,
          );
      } else graph.get(path.resolve(file))?.add(target);
    } else if (specifier !== "@netgrid/shared")
      findings.push(
        `${relative}: Produktivimport ${specifier} ist in cards nicht erlaubt`,
      );
  }
}

function configurationFindings() {
  const findings = [];
  const manifest = JSON.parse(
    readFileSync(path.join(cardsRoot, "package.json"), "utf8"),
  );
  const dependencies = Object.keys(manifest.dependencies ?? {});
  if (dependencies.length !== 1 || dependencies[0] !== "@netgrid/shared")
    findings.push(
      "packages/cards/package.json: einzige Produktivdependency muss @netgrid/shared sein",
    );
  const config = JSON.parse(
    readFileSync(path.join(cardsRoot, "tsconfig.json"), "utf8"),
  );
  if (
    !Array.isArray(config.compilerOptions?.types) ||
    config.compilerOptions.types.length !== 0
  )
    findings.push(
      "packages/cards/tsconfig.json: compilerOptions.types muss leer sein",
    );
  if (
    JSON.stringify(config.compilerOptions?.lib) !== JSON.stringify(["ES2022"])
  )
    findings.push(
      'packages/cards/tsconfig.json: compilerOptions.lib muss exakt ["ES2022"] sein',
    );
  return findings;
}

function runSelfTest() {
  const cases = [
    ["valid-shared.ts", 'import type { Side } from "@netgrid/shared";', 0],
    [
      "invalid-engine.ts",
      'import type { GameState } from "@netgrid/engine";',
      1,
    ],
    ["invalid-ai.ts", 'export type * from "@netgrid/ai";', 1],
    ["invalid-catalog.ts", 'import "@netgrid/catalog";', 1],
    ["invalid-node.ts", 'import { readFile } from "node:fs";', 1],
    ["invalid-browser.ts", "export const width = window.innerWidth;", 1],
    ["invalid-random.ts", "export const value = Math.random();", 1],
    ["valid-math.ts", "export const value = Math.max(1, 2);", 0],
    [
      "invalid-global-process.ts",
      "export const value = (globalThis as any).process.env.X;",
      1,
    ],
    [
      "invalid-global-crypto.ts",
      "export const value = globalThis.crypto.randomUUID();",
      1,
    ],
    [
      "invalid-global-window.ts",
      "export const value = globalThis['window'].document;",
      1,
    ],
    [
      "invalid-global-fetch.ts",
      'export const value = globalThis.fetch("/api");',
      1,
    ],
    [
      "invalid-global-websocket.ts",
      'export const value = new globalThis.WebSocket("ws://example");',
      1,
    ],
    ["invalid-relative.ts", 'export type * from "../../engine/src/index";', 1],
    [
      "invalid-server-relative.ts",
      'import("../../../apps/server/src/index");',
      1,
    ],
    ["invalid-db.ts", 'const db = require("@prisma/client");', 1],
    ["invalid-dynamic.ts", "const module = import(target);", 1],
  ];
  const failures = [];
  for (const [name, source, expected] of cases) {
    const file = path.join(sourceRoot, name);
    const graph = new Map([[path.resolve(file), new Set()]]);
    const actual = sourceFindings(file, source, new Set(), graph).length;
    if (actual !== expected)
      failures.push(`${name}: expected ${expected}, got ${actual}`);
  }
  const cycleGraph = new Map([
    ["a", new Set(["b"])],
    ["b", new Set(["a"])],
  ]);
  if (graphCycles(cycleGraph).length !== 1)
    failures.push("A<->B cycle was not detected");
  const acyclicGraph = new Map([
    ["a", new Set(["b"])],
    ["b", new Set()],
  ]);
  if (graphCycles(acyclicGraph).length !== 0)
    failures.push("acyclic graph was rejected");
  if (failures.length > 0) {
    console.error("CARDS_SOURCE_STRUCTURE SELFTEST FAIL");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else
    console.log(`CARDS_SOURCE_STRUCTURE SELFTEST OK cases=${cases.length + 2}`);
}

function collectSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(target));
    else if (entry.name.endsWith(".ts")) files.push(path.resolve(target));
  }
  return files;
}

function resolveRelative(file, specifier, fileSet) {
  const base = path.resolve(path.dirname(file), specifier);
  for (const candidate of [`${base}.ts`, path.join(base, "index.ts")])
    if (fileSet.has(candidate)) return candidate;
  return undefined;
}

function graphCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(node) {
    if (visiting.has(node)) {
      cycles.push([...stack.slice(stack.indexOf(node)), node]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) visit(next);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return cycles;
}

function relativeCardPath(file) {
  return path.relative(cardsRoot, file).replaceAll(path.sep, "/");
}
