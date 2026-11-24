import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoot = path.join(repoRoot, "packages", "ai", "src");
const liveEntryPoint = path.join(sourceRoot, "index.ts");
const cardIdPattern = /^onr_(?:v1|classic|proteus)_\d{3}_[a-z0-9_-]+$/;
const startedAt = performance.now();
const allowedCategories = new Set([
  "engine_quote_source",
  "individual_plan_model",
  "lifecycle_binding",
  "review_required",
]);

const allowedCardIdUses = createAllowances([
  {
    relativePath: "runner/run-window/runner-targeted-bypass-plan.ts",
    cardId: 323,
    category: "individual_plan_model",
    reason:
      "The definition ID identifies the source of a dedicated secret-choice plan.",
  },
  {
    relativePath: "runner/shell-traders/shell-traders-plan-signals.ts",
    cardId: 388,
    category: "individual_plan_model",
    reason:
      "The definition ID binds signals to the dedicated delayed card plan.",
  },
  {
    relativePath: "plans/resident-plan-portfolio.ts",
    cardId: 487,
    category: "lifecycle_binding",
    reason:
      "The definition ID validates the persisted origin of the exact Vacuum Link encounter continuation.",
  },
  {
    relativePath: "runner/run-window/run-window-selected-origin.ts",
    cardId: 487,
    category: "lifecycle_binding",
    expectedCount: 3,
    reason:
      "The definition ID binds the selected LegalAction and encountered ICE to the exact Vacuum Link rewind continuation.",
  },
  {
    relativePath: "runner/run-window/run-window-vacuum-link-continuation.ts",
    cardId: 487,
    category: "lifecycle_binding",
    expectedCount: 3,
    reason:
      "The definition ID validates and advances the selected Vacuum Link encounter continuation.",
  },
  {
    relativePath: "corp/defense/defense-discovery-support.ts",
    cardId: 570,
    category: "lifecycle_binding",
    expectedCount: 1,
    reason:
      "The definition ID restores Dr. Dreff's resident delayed-success plan source.",
  },
  {
    relativePath: "corp/defense/temporary-ice-choice.ts",
    cardId: 570,
    category: "lifecycle_binding",
    expectedCount: 1,
    reason:
      "The shared choice binding validates Dr. Dreff's rezzed source on the successful-run fort.",
  },
  {
    relativePath: "runtime/selected-choices-for-decision.ts",
    cardId: 64,
    category: "lifecycle_binding",
    reason:
      "The definition ID validates the scored source of the already selected damage-replacement choice.",
  },
  {
    relativePath: "corp/score/score-choice-binding.ts",
    cardId: 25,
    category: "lifecycle_binding",
    reason:
      "The definition ID validates the visible rezzed source of the already selected Satellite Monitors choice.",
  },
]);

if (process.argv.includes("--self-test")) {
  runSelfTest();
  process.exit(0);
}

const productionFiles = collectProductionSourceFiles(sourceRoot);
const productionFileSet = new Set(productionFiles);
const liveFiles = collectReachableFiles(
  liveEntryPoint,
  productionFileSet,
).filter(isGenericDecisionScope);
const occurrences = liveFiles.flatMap(cardIdOccurrences);
const findings = [];
let classifiedOccurrences = 0;

for (const occurrence of occurrences) {
  const key = occurrenceKey(occurrence.relativePath, occurrence.cardId);
  const allowance = allowedCardIdUses.get(key);
  if (!allowance) {
    findings.push(
      `${occurrence.relativePath}:${occurrence.line} uses ${occurrence.cardId} without a classified allowance`,
    );
    continue;
  }
  allowance.actualCount += 1;
  classifiedOccurrences += 1;
}

for (const [key, allowance] of allowedCardIdUses) {
  if (allowance.actualCount !== allowance.expectedCount) {
    findings.push(
      `${key} allowance is stale: expected ${allowance.expectedCount} occurrence(s), found ${allowance.actualCount}`,
    );
  }
}

if (findings.length > 0) {
  console.error(
    `AI_GENERIC_CARD_ID_GUARDS FAILED scanned=${liveFiles.length} occurrences=${occurrences.length} classifiedOccurrences=${classifiedOccurrences} violations=${findings.length} durationMs=${Math.round(performance.now() - startedAt)}`,
  );
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

const categoryCounts = new Map();
for (const allowance of allowedCardIdUses.values()) {
  categoryCounts.set(
    allowance.category,
    (categoryCounts.get(allowance.category) ?? 0) + allowance.actualCount,
  );
}

if (process.argv.includes("--inventory")) {
  for (const [key, allowance] of allowedCardIdUses) {
    console.log(
      `- ${allowance.category} ${key} occurrences=${allowance.actualCount}: ${allowance.reason}`,
    );
  }
}

console.log(
  `AI_GENERIC_CARD_ID_GUARDS OK scanned=${liveFiles.length} occurrences=${occurrences.length} allowances=${allowedCardIdUses.size} categories=${formatCategoryCounts(categoryCounts)} violations=0 durationMs=${Math.round(performance.now() - startedAt)}`,
);

function createAllowances(entries) {
  const allowances = new Map();
  for (const entry of entries) {
    const key = occurrenceKey(entry.relativePath, entry.cardId);
    if (allowances.has(key)) {
      throw new Error(`Duplicate AI card-ID allowance: ${key}`);
    }
    if (!allowedCategories.has(entry.category)) {
      throw new Error(
        `Unknown AI card-ID allowance category ${entry.category}: ${key}`,
      );
    }
    if (!entry.reason?.trim()) {
      throw new Error(`AI card-ID allowance needs a reason: ${key}`);
    }
    allowances.set(key, {
      ...entry,
      expectedCount: entry.expectedCount ?? 1,
      actualCount: 0,
    });
  }
  return allowances;
}

function formatCategoryCounts(categoryCounts) {
  return [...categoryCounts]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => `${category}:${count}`)
    .join(",");
}

function collectProductionSourceFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectProductionSourceFiles(absolute));
      continue;
    }
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) continue;
    if (/\.(?:test|test-support)\.tsx?$/.test(entry.name)) continue;
    files.push(path.normalize(absolute));
  }
  return files.sort();
}

function collectReachableFiles(entryPoint, fileSet) {
  const reachable = new Set();
  const pending = [path.normalize(entryPoint)];
  while (pending.length > 0) {
    const file = pending.pop();
    if (reachable.has(file)) continue;
    if (!fileSet.has(file)) {
      throw new Error(
        `Live AI entry references an unknown source file: ${file}`,
      );
    }
    reachable.add(file);
    const source = parseSourceFile(file);
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) &&
        !ts.isExportDeclaration(statement)
      ) {
        continue;
      }
      const moduleSpecifier = statement.moduleSpecifier;
      if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue;
      if (!statementHasRuntimeEdge(statement)) continue;
      const target = resolveRelativeImport(file, moduleSpecifier.text, fileSet);
      if (target && !reachable.has(target)) pending.push(target);
    }
  }
  return [...reachable].sort();
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

function cardIdOccurrences(file) {
  const source = parseSourceFile(file);
  const relativePath = relativeSourcePath(file);
  const occurrences = [];

  function visit(node) {
    const candidate = cardIdText(node);
    if (candidate) {
      const line =
        source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      occurrences.push({ relativePath, line, cardId: candidate });
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return occurrences;
}

function cardIdText(node) {
  if (ts.isNumericLiteral(node)) {
    const id = Number(node.text);
    return Number.isSafeInteger(id) && id > 0 && isCardIdPosition(node)
      ? id
      : undefined;
  }
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isIdentifier(node)
  ) {
    return cardIdPattern.test(node.text) ? node.text : undefined;
  }
  if (ts.isTemplateHead(node)) {
    const candidate = node.text.replace(/:$/, "");
    return cardIdPattern.test(candidate) ? candidate : undefined;
  }
  return undefined;
}

function isCardIdPosition(node) {
  let expression = node;
  while (
    ts.isParenthesizedExpression(expression.parent) ||
    ts.isAsExpression(expression.parent) ||
    ts.isSatisfiesExpression(expression.parent) ||
    ts.isArrayLiteralExpression(expression.parent)
  ) {
    expression = expression.parent;
  }
  const parent = expression.parent;
  if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) {
    return (
      parent.initializer === expression &&
      (isCardDefinitionName(parent.name) ||
        (ts.isVariableDeclaration(parent) &&
          parent.type?.getText() === "CardDefinitionId"))
    );
  }
  if (ts.isBinaryExpression(parent)) {
    const other = parent.left === expression ? parent.right : parent.left;
    return isCardDefinitionName(other);
  }
  if (ts.isElementAccessExpression(parent)) {
    return (
      parent.argumentExpression === expression &&
      /^(CARD_DEFINITIONS_BY_ID|CARD_SPECS_BY_ID|AI_HINTS_BY_CARD)$/.test(
        parent.expression.getText(),
      )
    );
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(expression)) {
    return (
      /^(cardDefinitionId|getCardAiHints|getCardDefinition)$/.test(
        parent.expression.getText(),
      ) ||
      /^(AI_HINTS_BY_CARD|CARD_DEFINITIONS_BY_ID|CARD_SPECS_BY_ID)\.(get|has)$/.test(
        parent.expression.getText(),
      )
    );
  }
  return false;
}

function isCardDefinitionName(node) {
  const name = ts.isPropertyAccessExpression(node) ? node.name : node;
  if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) return false;
  return /(?:definitionIds?|definition_ids?|cardDefinitionIds?|^cardId$)$/i.test(
    name.text,
  );
}

function parseSourceFile(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
}

function relativeSourcePath(file) {
  return path.relative(sourceRoot, file).replaceAll("\\", "/");
}

function isGenericDecisionScope(file) {
  const relativePath = relativeSourcePath(file);
  return !["diagnostics/", "evaluation/", "reports/", "simulation/"].some(
    (prefix) => relativePath.startsWith(prefix),
  );
}

function occurrenceKey(relativePath, cardId) {
  return `${relativePath}::${cardId}`;
}

function runSelfTest() {
  const source = ts.createSourceFile(
    "self-test.ts",
    `
      if (definitionId === "onr_v1_999_future-card") return true;
      const registry = { onr_classic_123_other_card: "profile" };
      const lifecycle = \`onr_proteus_456_lifecycle:${"${instanceId}"}\`;
      if (card.definitionId !== 17) return false;
      const BOUND_DEFINITION_ID = 23 as const;
      const quote = { sourceDefinitionId: 37 };
      const hint = AI_HINTS_BY_CARD.get(45);
      const ordinaryAmount = 17;
      const ordinary = "not-a-card-id";
      // onr_v1_111_comment-only must not be detected.
    `,
    ts.ScriptTarget.Latest,
    true,
  );
  const detected = [];
  function visit(node) {
    const candidate = cardIdText(node);
    if (candidate) detected.push(candidate);
    ts.forEachChild(node, visit);
  }
  visit(source);
  const expected = [
    "onr_v1_999_future-card",
    "onr_classic_123_other_card",
    "onr_proteus_456_lifecycle",
    17,
    23,
    37,
    45,
  ];
  if (detected.join("|") !== expected.join("|")) {
    throw new Error(
      `AI generic card-id guard self-test failed: ${detected.join("|")}`,
    );
  }
  console.log("AI_GENERIC_CARD_ID_GUARDS self-test OK");
}
