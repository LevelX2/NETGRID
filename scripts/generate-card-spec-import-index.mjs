import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format as formatWithPrettier } from "prettier";
import ts from "typescript";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_RELATIVE =
  "packages/cards/src/generated/card-spec-import-index.ts";

function discoverFiles(root, relativeDirectory, suffix) {
  const directory = path.join(root, relativeDirectory);
  const found = [];
  const visit = (current) => {
    if (!existsDirectory(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "generated") visit(absolute);
        continue;
      }
      if (
        entry.isFile() &&
        entry.name.endsWith(suffix) &&
        !entry.name.includes(".test.") &&
        !entry.name.includes(".spec.")
      )
        found.push(absolute);
    }
  };
  visit(directory);
  return found;
}

function existsDirectory(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true }) !== undefined;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

function extractId(file, exportName, pathSegments) {
  const source = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = [];
  for (const statement of sourceFile.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    )
      continue;
    for (const declaration of statement.declarationList.declarations)
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === exportName &&
        declaration.initializer
      )
        declarations.push(declaration.initializer);
  }
  if (declarations.length !== 1)
    throw new Error(
      `expected_single_export_${exportName}:${path.relative(REPOSITORY_ROOT, file)}`,
    );
  let current = unwrapExpression(declarations[0]);
  for (const segment of pathSegments) {
    if (!ts.isObjectLiteralExpression(current))
      throw new Error(`invalid_export_shape_${exportName}:${file}`);
    const matches = current.properties.filter(
      (property) =>
        ts.isPropertyAssignment(property) &&
        propertyName(property.name) === segment,
    );
    if (matches.length !== 1)
      throw new Error(`expected_single_${segment}:${file}`);
    current = unwrapExpression(matches[0].initializer);
  }
  if (ts.isStringLiteralLike(current)) return current.text;
  if (
    pathSegments.at(-1) === "cardDefinitionId" &&
    ts.isCallExpression(current) &&
    ts.isIdentifier(current.expression) &&
    current.expression.text === "cardDefinitionId" &&
    current.arguments.length === 1 &&
    ts.isStringLiteralLike(current.arguments[0])
  )
    return current.arguments[0].text;
  throw new Error(`expected_literal_${pathSegments.at(-1)}:${file}`);
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current)
  )
    current = current.expression;
  return current;
}

function propertyName(name) {
  return ts.isIdentifier(name) || ts.isStringLiteralLike(name)
    ? name.text
    : undefined;
}

function relativeImport(outputFile, sourceFile) {
  let result = path
    .relative(path.dirname(outputFile), sourceFile)
    .replaceAll(path.sep, "/")
    .replace(/\.ts$/, "");
  if (!result.startsWith(".")) result = `./${result}`;
  return result;
}

export async function generateCardSpecImportIndex(root, options = {}) {
  const profile = options.profile ?? "development";
  if (profile !== "development" && profile !== "release")
    throw new Error(`invalid_card_spec_import_profile:${profile}`);
  const outputRelative = options.outputRelative ?? OUTPUT_RELATIVE;
  const outputFile = path.join(root, outputRelative);
  const cards = discoverFiles(root, "packages/cards/src/specs", ".card-spec.ts")
    .filter(
      (file) =>
        profile !== "release" ||
        !path
          .relative(path.join(root, "packages/cards/src/specs"), file)
          .split(path.sep)
          .includes("testset"),
    )
    .map((file) => ({
      file,
      id: extractId(file, "cardSpec", ["identity", "cardDefinitionId"]),
    }));
  const sets = discoverFiles(root, "packages/cards/src/sets", ".set-spec.ts")
    .map((file) => ({
      file,
      id: extractId(file, "setSpec", ["setId"]),
    }))
    .filter((entry) => profile !== "release" || entry.id !== "testset");
  cards.sort((left, right) => compareText(left.id, right.id));
  sets.sort((left, right) => compareText(left.id, right.id));
  assertUnique(cards, "cardDefinitionId");
  assertUnique(sets, "setId");
  const lines = [
    profile === "development"
      ? "// Generated by scripts/generate-card-spec-import-index.mjs. Do not edit."
      : "// Generated by scripts/generate-card-spec-import-index.mjs (release). Do not edit.",
    `import type { CardSpec, SetSpec } from "${relativeImport(
      outputFile,
      path.join(root, "packages/cards/src/contracts.ts"),
    )}";`,
    "",
  ];
  cards.forEach((entry, index) =>
    lines.push(
      `import { cardSpec as cardSpec${index} } from "${relativeImport(outputFile, entry.file)}";`,
    ),
  );
  sets.forEach((entry, index) =>
    lines.push(
      `import { setSpec as setSpec${index} } from "${relativeImport(outputFile, entry.file)}";`,
    ),
  );
  if (cards.length > 0 || sets.length > 0) lines.push("");
  lines.push(
    `export const GENERATED_CARD_SPECS = [${cards.map((_entry, index) => `cardSpec${index}`).join(", ")}] as const satisfies readonly CardSpec[];`,
    `export const GENERATED_CARD_SPEC_SOURCE_REFS = [${cards
      .map(
        (entry) =>
          `{ cardDefinitionId: ${JSON.stringify(entry.id)}, sourcePath: ${JSON.stringify(path.relative(root, entry.file).replaceAll(path.sep, "/"))} }`,
      )
      .join(", ")}] as const;`,
    `export const GENERATED_SET_SPECS = [${sets.map((_entry, index) => `setSpec${index}`).join(", ")}] as const satisfies readonly SetSpec[];`,
    "",
  );
  return formatWithPrettier(lines.join("\n"), { parser: "typescript" });
}

export async function writeCardSpecImportIndex(root) {
  const output = path.join(root, OUTPUT_RELATIVE);
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, await generateCardSpecImportIndex(root));
  return output;
}

export async function checkCardSpecImportIndex(root) {
  const output = path.join(root, OUTPUT_RELATIVE);
  let current = "";
  try {
    current = readFileSync(output, "utf8");
  } catch (error) {
    if (!error || error.code !== "ENOENT") throw error;
  }
  return current === (await generateCardSpecImportIndex(root));
}

export async function generateReleaseCardSpecImportIndex(root, outputRelative) {
  return generateCardSpecImportIndex(root, {
    profile: "release",
    outputRelative,
  });
}

function assertUnique(entries, field) {
  for (let index = 1; index < entries.length; index += 1)
    if (entries[index - 1].id === entries[index].id)
      throw new Error(`duplicate_${field}:${entries[index].id}`);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function runSelfTest() {
  const root = mkdtempSync(path.join(tmpdir(), "netgrid-card-index-"));
  try {
    const cards = path.join(root, "packages/cards/src/specs");
    const sets = path.join(root, "packages/cards/src/sets");
    mkdirSync(cards, { recursive: true });
    mkdirSync(sets, { recursive: true });
    const testCards = path.join(cards, "testset");
    mkdirSync(testCards, { recursive: true });
    writeFileSync(
      path.join(cards, "z.card-spec.ts"),
      '// cardDefinitionId: "decoy"\nconst decoy = { identity: { cardDefinitionId: "also-decoy" } };\nexport const cardSpec = { identity: { cardDefinitionId: cardDefinitionId("z-card") } };\n',
    );
    writeFileSync(
      path.join(cards, "a.card-spec.ts"),
      'export const cardSpec = { identity: { cardDefinitionId: "a-card" } };\n',
    );
    writeFileSync(
      path.join(sets, "base.set-spec.ts"),
      'export const setSpec = { setId: "base" };\n',
    );
    writeFileSync(
      path.join(testCards, "excluded.card-spec.ts"),
      'export const cardSpec = { identity: { cardDefinitionId: "test-card" } };\n',
    );
    writeFileSync(
      path.join(sets, "testset.set-spec.ts"),
      'export const setSpec = { setId: "testset" };\n',
    );
    const first = await generateCardSpecImportIndex(root);
    const second = await generateCardSpecImportIndex(root);
    assert.equal(first, second);
    assert.equal(
      await formatWithPrettier(first, { parser: "typescript" }),
      first,
    );
    assert.ok(first.indexOf("a.card-spec") < first.indexOf("z.card-spec"));
    assert.match(
      first,
      /export const GENERATED_SET_SPECS = \[\s*setSpec0,\s*setSpec1,\s*\] as const satisfies readonly SetSpec\[\];/,
    );
    assert.ok(first.includes('cardDefinitionId: "a-card"'));
    assert.ok(first.includes('cardDefinitionId: "test-card"'));
    assert.ok(
      first.includes('sourcePath: "packages/cards/src/specs/a.card-spec.ts"'),
    );
    const release = await generateReleaseCardSpecImportIndex(
      root,
      "packages/cards/src/generated/card-spec-release-import-index.ts",
    );
    assert.ok(!release.includes("test-card"));
    assert.ok(!release.includes("testset.set-spec"));
    assert.ok(release.includes("(release)"));
    const output = path.join(root, OUTPUT_RELATIVE);
    assert.equal(await checkCardSpecImportIndex(root), false);
    await writeCardSpecImportIndex(root);
    const firstWrite = readFileSync(output, "utf8");
    await writeCardSpecImportIndex(root);
    assert.equal(readFileSync(output, "utf8"), firstWrite);
    assert.equal(await checkCardSpecImportIndex(root), true);
    writeFileSync(output, "stale\n");
    assert.equal(await checkCardSpecImportIndex(root), false);
    await writeCardSpecImportIndex(root);
    writeFileSync(
      path.join(cards, "untracked.card-spec.ts"),
      'export const cardSpec = { identity: { cardDefinitionId: "m-card" } };\n',
    );
    assert.ok((await generateCardSpecImportIndex(root)).includes("m-card"));
    assert.ok(
      (await generateCardSpecImportIndex(root)).includes("untracked.card-spec"),
    );
    assert.equal(await checkCardSpecImportIndex(root), false);
    await writeCardSpecImportIndex(root);
    assert.equal(await checkCardSpecImportIndex(root), true);
    const invalid = path.join(cards, "invalid.card-spec.ts");
    writeFileSync(invalid, "export const other = {};\n");
    await assert.rejects(
      generateCardSpecImportIndex(root),
      /expected_single_export_cardSpec/,
    );
    writeFileSync(
      invalid,
      "export const cardSpec = { identity: { cardDefinitionId: dynamicId } };\n",
    );
    await assert.rejects(
      generateCardSpecImportIndex(root),
      /expected_literal_cardDefinitionId/,
    );
    writeFileSync(
      invalid,
      'export const cardSpec = { identity: { cardDefinitionId: "one" } };\nexport const cardSpec = { identity: { cardDefinitionId: "two" } };\n',
    );
    await assert.rejects(
      generateCardSpecImportIndex(root),
      /expected_single_export_cardSpec/,
    );
    rmSync(invalid);
    writeFileSync(
      path.join(cards, "duplicate.card-spec.ts"),
      'export const cardSpec = { identity: { cardDefinitionId: "a-card" } };\n',
    );
    await assert.rejects(
      generateCardSpecImportIndex(root),
      /duplicate_cardDefinitionId:a-card/,
    );
    rmSync(path.join(cards, "duplicate.card-spec.ts"));
    writeFileSync(
      path.join(sets, "duplicate.set-spec.ts"),
      'export const setSpec = { setId: "base" };\n',
    );
    await assert.rejects(
      generateCardSpecImportIndex(root),
      /duplicate_setId:base/,
    );
    console.log(
      "CardSpec import-index self-test passed (filesystem/drift/determinism).",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const arguments_ = process.argv.slice(2);
  if (arguments_.includes("--self-test")) {
    await runSelfTest();
  } else {
    const output = path.join(REPOSITORY_ROOT, OUTPUT_RELATIVE);
    if (arguments_.includes("--write")) {
      await writeCardSpecImportIndex(REPOSITORY_ROOT);
      console.log(`Wrote ${OUTPUT_RELATIVE}`);
    } else if (arguments_.includes("--check")) {
      if (!(await checkCardSpecImportIndex(REPOSITORY_ROOT))) {
        console.error(
          `${OUTPUT_RELATIVE} is stale; run the generator with --write.`,
        );
        process.exitCode = 1;
      } else
        console.log(`CardSpec import index is current: ${OUTPUT_RELATIVE}`);
    } else {
      throw new Error("Expected --write, --check, or --self-test");
    }
  }
}
