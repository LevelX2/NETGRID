import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

export function parseSetMigrationInvocation(argv, descriptors) {
  const requestedModes = ["dry-run", "check", "write"].filter((candidate) =>
    argv.includes(`--${candidate}`),
  );
  if (requestedModes.length !== 1)
    throw new Error("card_spec_migration_requires_exactly_one_mode");
  const setFlag = argv.indexOf("--set");
  const setId = setFlag < 0 ? undefined : argv[setFlag + 1];
  const descriptor = setId === undefined ? undefined : descriptors[setId];
  if (descriptor === undefined)
    throw new Error(`card_spec_migration_unknown_set:${setId ?? "missing"}`);
  return { mode: requestedModes[0], setId, descriptor };
}

export function assertAllowedKeys(value, allowed, pathLabel, fail) {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    fail(`card_spec_migration_invalid_object:${pathLabel}`);
  for (const key of Object.keys(value))
    if (!allowed.has(key))
      fail(`card_spec_migration_unknown_field:${pathLabel}:${key}`);
}

export function assertDerivedCounts(actualByLabel, expectedByLabel, fail) {
  for (const [label, expected] of Object.entries(expectedByLabel)) {
    const actual = actualByLabel[label];
    if (actual !== expected)
      fail(
        `card_spec_migration_report_count_mismatch:${label}:${actual}:${expected}`,
      );
  }
}

export function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function expression(__expression) {
  return { __expression };
}

export function renderValue(value, depth = 0) {
  if (value?.__expression !== undefined) return value.__expression;
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const indent = "  ".repeat(depth);
  const childIndent = "  ".repeat(depth + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value
      .map((entry) => `${childIndent}${renderValue(entry, depth + 1)},`)
      .join("\n")}\n${indent}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";
  return `{\n${entries
    .map(
      ([key, entry]) =>
        `${childIndent}${safeProperty(key)}: ${renderValue(entry, depth + 1)},`,
    )
    .join("\n")}\n${indent}}`;
}

export function extractArrayObjects(sourceText, variableName, fail) {
  const sourceFile = ts.createSourceFile(
    "legacy-source.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0)
    fail(`card_spec_migration_legacy_parse_error:${variableName}`);
  let array;
  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName &&
        declaration.initializer !== undefined
      ) {
        const initializer = unwrapExpression(declaration.initializer);
        if (ts.isArrayLiteralExpression(initializer)) array = initializer;
      }
    }
  });
  if (array === undefined)
    fail(`card_spec_migration_legacy_array_missing:${variableName}`);
  return array.elements
    .filter((element) => !ts.isSpreadElement(element))
    .map((element) => evaluateLiteral(element, fail));
}

export async function verifyMigrationOutputs({
  mode,
  root,
  outputDirectory,
  generated,
  targetFor,
  writeDirectories = [],
  driftCode,
  fail,
}) {
  if (mode === "write") {
    await mkdir(outputDirectory, { recursive: true });
    for (const directory of writeDirectories)
      await mkdir(directory, { recursive: true });
  }
  if (mode === "dry-run") return;
  const stale = [];
  const unexpectedTargets = [];
  const resolvedOutputDirectory = path.resolve(outputDirectory);
  const expectedSpecFiles = new Set(
    [...generated.keys()].filter((entry) => entry.endsWith(".card-spec.ts")),
  );
  if (existsSync(outputDirectory))
    for (const fileName of readdirSync(outputDirectory))
      if (
        fileName.endsWith(".card-spec.ts") &&
        !expectedSpecFiles.has(fileName)
      )
        unexpectedTargets.push(path.resolve(outputDirectory, fileName));
  for (const target of unexpectedTargets) {
    if (path.dirname(target) !== resolvedOutputDirectory)
      fail(`card_spec_migration_unsafe_stale_target:${target}`);
    if (mode === "write") unlinkSync(target);
    else
      stale.push(
        `unexpected:${path.relative(root, target).replaceAll("\\", "/")}`,
      );
  }
  for (const [relativePath, content] of generated) {
    const target = targetFor(relativePath);
    if (mode === "write") {
      writeFileSync(target, content, "utf8");
      continue;
    }
    if (!existsSync(target) || readFileSync(target, "utf8") !== content)
      stale.push(path.relative(root, target).replaceAll("\\", "/"));
  }
  if (stale.length > 0) fail(`${driftCode}:${stale.join(",")}`);
}

function evaluateLiteral(node, fail) {
  const value = unwrapExpression(node);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))
    return value.text;
  if (ts.isNumericLiteral(value)) return Number(value.text);
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (value.kind === ts.SyntaxKind.NullKeyword) return null;
  if (
    ts.isPrefixUnaryExpression(value) &&
    value.operator === ts.SyntaxKind.MinusToken
  )
    return -evaluateLiteral(value.operand, fail);
  if (ts.isArrayLiteralExpression(value))
    return value.elements.map((entry) => evaluateLiteral(entry, fail));
  if (ts.isObjectLiteralExpression(value)) {
    const result = {};
    for (const property of value.properties) {
      if (!ts.isPropertyAssignment(property))
        fail(
          `card_spec_migration_unsupported_legacy_property:${property.getText()}`,
        );
      result[propertyName(property.name, fail)] = evaluateLiteral(
        property.initializer,
        fail,
      );
    }
    return result;
  }
  fail(`card_spec_migration_unsupported_legacy_expression:${value.getText()}`);
}

function unwrapExpression(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  )
    current = current.expression;
  return current;
}

function propertyName(node, fail) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  fail(`card_spec_migration_unsupported_property_name:${node.getText()}`);
}

function safeProperty(key) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}
