#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionExtensions = new Set([".ts", ".tsx", ".js", ".mjs"]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
]);
const roots = ["packages", "apps/server/src", "apps/web"];
const packageRules = [
  { prefix: "packages/shared/", allow: new Set() },
  { prefix: "packages/cards/", allow: new Set(["@netgrid/shared"]) },
  { prefix: "packages/catalog/", allow: new Set(["@netgrid/shared"]) },
  {
    prefix: "packages/decks/",
    allow: new Set(["@netgrid/catalog", "@netgrid/shared"]),
  },
  {
    prefix: "packages/engine/",
    allow: new Set(["@netgrid/cards", "@netgrid/shared"]),
  },
  {
    prefix: "packages/ai/",
    allow: new Set([
      "@netgrid/catalog",
      "@netgrid/cards",
      "@netgrid/decks",
      "@netgrid/engine",
      "@netgrid/shared",
    ]),
  },
];

if (process.argv.includes("--self-test")) runSelfTest();
else runRepositoryCheck();

function runRepositoryCheck() {
  const files = roots
    .flatMap((entry) => collectFiles(path.join(root, entry)))
    .map((file) => slash(path.relative(root, file)))
    .filter((file) => productionExtensions.has(path.extname(file)))
    .filter((file) => !/\.(test|spec)\.[^.]+$/.test(file));
  const findings = files.flatMap((file) =>
    boundaryFindings(file, readFileSync(path.join(root, file), "utf8")),
  );
  findings.push(...manifestFindings());

  if (findings.length > 0) {
    console.error("PACKAGE_BOUNDARIES FAIL");
    for (const finding of findings) console.error(`- ${finding}`);
    process.exitCode = 1;
  } else console.log(`PACKAGE_BOUNDARIES OK files=${files.length}`);
}

function boundaryFindings(file, source) {
  const imports = importedSpecifiers(file, source);
  const findings = [];
  const rule = packageRules.find((candidate) =>
    file.startsWith(candidate.prefix),
  );
  const normalWebClient = isNormalWebClientModule(file);
  const engineProduction = isEngineProductionModule(file);
  for (const entry of imports) {
    if (entry.unknownDynamic) {
      if (rule || normalWebClient)
        findings.push(
          `${file}: dynamischer Import/require muss ein Stringliteral sein`,
        );
      continue;
    }
    const imported = entry.specifier;
    if (!imported) continue;
    if (rule && imported.startsWith("@netgrid/")) {
      const packageName = workspacePackageName(imported);
      if (!rule.allow.has(packageName))
        findings.push(
          `${file}: ${imported} ist in dieser Paketschicht nicht erlaubt`,
        );
      else if (
        file.startsWith("packages/engine/") &&
        imported === "@netgrid/cards"
      )
        findings.push(
          `${file}: Engine muss Card-Verträge ausschließlich über @netgrid/cards/engine importieren`,
        );
      else if (file.startsWith("packages/ai/") && imported === "@netgrid/cards")
        findings.push(
          `${file}: AI muss Card-Verträge ausschließlich über @netgrid/cards/planning importieren`,
        );
      else if (
        imported !== packageName &&
        !allowedWorkspaceSubpath(file, imported)
      )
        findings.push(
          `${file}: Subpath ${imported} ist nicht explizit freigegeben`,
        );
    }
    if (normalWebClient && forbiddenNormalBrowserImport(file, imported))
      findings.push(
        `${file}: normaler Webclient darf ${imported} nicht direkt laden`,
      );
    if (
      normalWebClient &&
      imported.startsWith(".") &&
      relativeImportReachesPrivilegedCode(file, imported)
    )
      findings.push(
        `${file}: normaler Webclient-Relativimport erreicht privilegierten Code (${imported})`,
      );
    if (engineProduction) {
      if (!imported.startsWith(".") && !imported.startsWith("@netgrid/"))
        findings.push(
          `${file}: Engine darf keine externe Runtime-/FS-/DB-Abhängigkeit ${imported} laden`,
        );
      if (
        imported.startsWith(".") &&
        relativeImportEscapesEngine(file, imported)
      )
        findings.push(
          `${file}: Engine-Relativimport verlässt packages/engine (${imported})`,
        );
    }
  }
  if (engineProduction) findings.push(...engineGlobalFindings(file, source));
  return findings;
}

function allowedWorkspaceSubpath(file, specifier) {
  if (specifier.startsWith("@netgrid/cards/"))
    return (
      (file.startsWith("packages/engine/") &&
        specifier === "@netgrid/cards/engine") ||
      (file.startsWith("packages/ai/") &&
        specifier === "@netgrid/cards/planning")
    );
  return false;
}

function forbiddenNormalBrowserImport(file, specifier) {
  const legacyTutorialEngine =
    (file === "apps/web/app/tutorial.ts" ||
      file === "apps/web/app/tutorial/page.tsx") &&
    (specifier === "@netgrid/engine" ||
      specifier.startsWith("@netgrid/engine/"));
  if (
    !legacyTutorialEngine &&
    (specifier === "@netgrid/engine" ||
      specifier.startsWith("@netgrid/engine/"))
  )
    return true;
  if (specifier === "@netgrid/ai" || specifier.startsWith("@netgrid/ai/"))
    return true;
  if (specifier === "@netgrid/cards") return true;
  if (specifier.startsWith("@netgrid/cards/"))
    return specifier !== "@netgrid/cards/public";
  return false;
}

function runSelfTest() {
  const cases = [
    ["packages/shared/src/invalid.ts", 'import "@netgrid/engine";', 1],
    [
      "packages/cards/src/valid.ts",
      'import type { Side } from "@netgrid/shared";',
      0,
    ],
    ["packages/cards/src/invalid.ts", 'export * from "@netgrid/engine";', 1],
    [
      "packages/engine/src/valid.ts",
      'import type { CardMechanicalSpec } from "@netgrid/cards/engine";',
      0,
    ],
    [
      "packages/engine/src/invalid-root.ts",
      'import type { CardSpec } from "@netgrid/cards";',
      1,
    ],
    [
      "packages/engine/src/invalid-ai.ts",
      'import type { Plan } from "@netgrid/ai";',
      1,
    ],
    [
      "packages/engine/src/invalid-server.ts",
      'import type { Server } from "@netgrid/server";',
      1,
    ],
    [
      "packages/engine/src/invalid-fs.ts",
      'import { readFile } from "node:fs";',
      1,
    ],
    [
      "packages/engine/src/invalid-db.ts",
      'import { PrismaClient } from "@prisma/client";',
      1,
    ],
    [
      "packages/engine/src/invalid-relative.ts",
      'import "../../../../apps/server/src/index";',
      1,
    ],
    [
      "packages/engine/src/invalid-browser.ts",
      "export const value = window.location;",
      1,
    ],
    [
      "packages/engine/src/invalid-bare-browser.ts",
      "export const value = window;",
      1,
    ],
    [
      "packages/engine/src/invalid-global-browser.ts",
      "export const value = globalThis['window'];",
      1,
    ],
    [
      "packages/engine/src/invalid-fetch.ts",
      'export const value = fetch("/api");',
      1,
    ],
    [
      "packages/engine/src/invalid-websocket.ts",
      'export const value = new WebSocket("ws://example");',
      1,
    ],
    [
      "packages/engine/src/invalid-global-fetch.ts",
      'export const value = globalThis.fetch("/api");',
      1,
    ],
    [
      "packages/engine/src/invalid-global-websocket.ts",
      'export const value = new globalThis.WebSocket("ws://example");',
      1,
    ],
    [
      "packages/ai/src/valid.ts",
      'const value = require("@netgrid/engine");',
      0,
    ],
    [
      "packages/ai/src/valid-cards-planning.ts",
      'import type { PlanningCardView } from "@netgrid/cards/planning";',
      0,
    ],
    [
      "packages/ai/src/invalid-cards-root.ts",
      'import type { CardSpec } from "@netgrid/cards";',
      1,
    ],
    [
      "packages/ai/src/invalid-cards-engine.ts",
      'import type { EngineCardView } from "@netgrid/cards/engine";',
      1,
    ],
    [
      "packages/ai/src/invalid-cards-editor.ts",
      'import type { EditorCardView } from "@netgrid/cards/editor";',
      1,
    ],
    [
      "packages/cards/src/invalid-dynamic.ts",
      "const value = import(target);",
      1,
    ],
    ["apps/web/features/game/invalid.tsx", 'import "@netgrid/cards";', 1],
    [
      "apps/web/features/game/invalid-engine.tsx",
      'import("@netgrid/cards/engine");',
      1,
    ],
    [
      "apps/web/features/game/valid.tsx",
      'import type { Card } from "@netgrid/cards/public";',
      0,
    ],
    [
      "apps/web/features/game/valid-runtime.tsx",
      'import * as CardsPublic from "@netgrid/cards/public";',
      0,
    ],
    [
      "apps/web/features/game/invalid-planning.tsx",
      'import type { PlanningCardView } from "@netgrid/cards/planning";',
      1,
    ],
    [
      "apps/web/features/game/invalid-editor.tsx",
      'import type { EditorCardView } from "@netgrid/cards/editor";',
      1,
    ],
    [
      "apps/web/app/replays/page.tsx",
      'import type { CardSpec } from "@netgrid/cards";',
      1,
    ],
    ["apps/web/app/spectate/page.tsx", "const module = import(target);", 1],
    [
      "apps/server/src/cards.ts",
      'import { listPublicCardViews } from "@netgrid/cards/server";',
      0,
    ],
    [
      "apps/web/features/game/invalid-cards-server.tsx",
      'import { listPublicCardViews } from "@netgrid/cards/server";',
      1,
    ],
    [
      "apps/web/app/api/current/route.ts",
      'import { applyAction } from "@netgrid/engine";',
      0,
    ],
    [
      "apps/web/features/game/invalid-relative-cards.tsx",
      'import "../../../../packages/cards/src/index";',
      1,
    ],
    [
      "apps/web/features/game/invalid-relative-export.tsx",
      'export * from "../../../../packages/cards/src/engine/index";',
      1,
    ],
    [
      "apps/web/features/game/invalid-relative-dynamic.tsx",
      'import("../../../../packages/cards/src/planning/index");',
      1,
    ],
    [
      "apps/web/features/game/invalid-relative-require.tsx",
      'require("../../../../packages/cards/src/editor/index");',
      1,
    ],
  ];
  const failures = cases.filter(
    ([file, source, expected]) =>
      boundaryFindings(file, source).length !== expected,
  );
  if (failures.length > 0) {
    console.error("PACKAGE_BOUNDARIES SELFTEST FAIL");
    for (const [file] of failures) console.error(`- ${file}`);
    process.exitCode = 1;
  } else console.log(`PACKAGE_BOUNDARIES SELFTEST OK cases=${cases.length}`);
}

function importedSpecifiers(file, source) {
  const kind = file.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : file.endsWith(".js") || file.endsWith(".mjs")
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const result = [];
  visit(sourceFile);
  return result;

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    )
      pushLiteral(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
      pushLiteral(node.argument.literal);
    else if (ts.isCallExpression(node)) {
      const isImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isImport || isRequire) {
        const argument = node.arguments[0];
        if (argument && ts.isStringLiteralLike(argument))
          result.push({ specifier: argument.text, unknownDynamic: false });
        else result.push({ specifier: undefined, unknownDynamic: true });
      }
    }
    ts.forEachChild(node, visit);
  }

  function pushLiteral(node) {
    if (ts.isStringLiteralLike(node))
      result.push({ specifier: node.text, unknownDynamic: false });
  }
}

function manifestFindings() {
  const manifests = collectFiles(path.join(root, "packages"))
    .filter((file) => path.basename(file) === "package.json")
    .map((file) => ({ file, json: JSON.parse(readFileSync(file, "utf8")) }))
    .filter(
      ({ json }) =>
        typeof json.name === "string" && json.name.startsWith("@netgrid/"),
    );
  const packageNames = new Set(manifests.map(({ json }) => json.name));
  const graph = new Map(manifests.map(({ json }) => [json.name, new Set()]));
  const findings = [];
  for (const { file, json } of manifests) {
    const dependencyNames = Object.keys(json.dependencies ?? {}).filter(
      (name) => packageNames.has(name),
    );
    for (const dependency of dependencyNames)
      graph.get(json.name).add(dependency);
    if (json.name === "@netgrid/cards") {
      const allDependencies = Object.keys(json.dependencies ?? {});
      if (
        allDependencies.length !== 1 ||
        allDependencies[0] !== "@netgrid/shared"
      )
        findings.push(
          `${slash(path.relative(root, file))}: cards darf nur @netgrid/shared als Produktivdependency besitzen`,
        );
    }
  }
  for (const cycle of graphCycles(graph))
    findings.push(`Workspace-Paketzyklus: ${cycle.join(" -> ")}`);
  return findings;
}

function graphCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(node) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node]);
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

function collectFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(target));
    else files.push(target);
  }
  return files;
}

function workspacePackageName(specifier) {
  return specifier.split("/").slice(0, 2).join("/");
}

function isNormalWebClientModule(file) {
  if (!file.startsWith("apps/web/")) return false;
  if (file.startsWith("apps/web/app/api/")) return false;
  if (/\.(test|spec)\.[^.]+$/.test(file)) return false;
  return true;
}

function isEngineProductionModule(file) {
  return (
    file.startsWith("packages/engine/src/") &&
    !file.includes("/src/test/") &&
    !file.includes("/test-fixtures/") &&
    !/\.(test|spec)\.[^.]+$/.test(file)
  );
}

function relativeImportEscapesEngine(file, specifier) {
  const base = path.resolve(root, path.dirname(file), specifier);
  const engineRoot = path.join(root, "packages", "engine");
  return base !== engineRoot && !base.startsWith(engineRoot + path.sep);
}

function relativeImportReachesPrivilegedCode(file, specifier) {
  const base = path.resolve(root, path.dirname(file), specifier);
  const forbiddenRoots = [
    path.join(root, "packages", "cards"),
    path.join(root, "packages", "engine"),
    path.join(root, "packages", "ai"),
    path.join(root, "apps", "server"),
  ];
  return forbiddenRoots.some(
    (forbiddenRoot) =>
      base === forbiddenRoot || base.startsWith(forbiddenRoot + path.sep),
  );
}

function engineGlobalFindings(file, sourceText) {
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const browserGlobals = new Set([
    "window",
    "document",
    "navigator",
    "localStorage",
    "sessionStorage",
    "indexedDB",
  ]);
  const browserCalls = new Set([
    "fetch",
    "WebSocket",
    "XMLHttpRequest",
    "Worker",
  ]);
  const declared = new Set();
  const directUsed = new Set();
  const explicitGlobalUsed = new Set();
  collectDeclarations(source);
  collectUses(source);
  const used = new Set([
    ...explicitGlobalUsed,
    ...[...directUsed].filter((name) => !declared.has(name)),
  ]);
  return [...used].map(
    (name) => `${file}: Engine darf Browserglobal ${name} nicht verwenden`,
  );

  function collectDeclarations(node) {
    if (
      ts.isVariableDeclaration(node) ||
      ts.isParameter(node) ||
      ts.isBindingElement(node)
    )
      collectBinding(node.name);
    if (ts.isImportClause(node)) {
      if (node.name) declared.add(node.name.text);
      if (node.namedBindings && ts.isNamespaceImport(node.namedBindings))
        declared.add(node.namedBindings.name.text);
    }
    ts.forEachChild(node, collectDeclarations);
  }
  function collectBinding(name) {
    if (ts.isIdentifier(name)) declared.add(name.text);
    else
      for (const element of name.elements)
        if (ts.isBindingElement(element)) collectBinding(element.name);
  }
  function collectUses(node) {
    const isPropertyName =
      ts.isIdentifier(node) &&
      ts.isPropertyAccessExpression(node.parent) &&
      node.parent.name === node;
    const access = isPropertyName ? undefined : accessPath(node);
    if (access?.[0] === "globalThis" && browserGlobals.has(access[1]))
      explicitGlobalUsed.add(access[1]);
    else if (access && browserGlobals.has(access[0])) directUsed.add(access[0]);
    if (
      (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      ts.isIdentifier(node.expression) &&
      browserCalls.has(node.expression.text)
    ) {
      directUsed.add(node.expression.text);
    }
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callPath = accessPath(node.expression);
      if (
        callPath?.[0] === "globalThis" &&
        callPath.length === 2 &&
        browserCalls.has(callPath[1])
      )
        explicitGlobalUsed.add(callPath[1]);
    }
    ts.forEachChild(node, collectUses);
  }
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
}

function slash(value) {
  return value.replaceAll(path.sep, "/");
}
