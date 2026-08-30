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
    relativePath: "plans/runner-core-plan-modules.ts",
    cardId: "onr_v1_176_the-shell-traders",
    category: "individual_plan_model",
    reason:
      "The definition ID identifies the exact source of a dedicated card plan.",
  },
  {
    relativePath: "runtime/runner-targeted-bypass-plan.ts",
    cardId: "onr_v1_111_social-engineering",
    category: "individual_plan_model",
    reason:
      "The definition ID identifies the source of a dedicated secret-choice plan.",
  },
  {
    relativePath: "runtime/shell-traders-plan-signals.ts",
    cardId: "onr_v1_176_the-shell-traders",
    category: "individual_plan_model",
    reason:
      "The definition ID binds signals to the dedicated delayed card plan.",
  },
  {
    relativePath: "plans/resident-plan-portfolio.ts",
    cardId: "onr_v1_275_vacuum-link",
    category: "lifecycle_binding",
    reason:
      "The definition ID validates the persisted origin of the exact Vacuum Link encounter continuation.",
  },
  {
    relativePath: "runtime/plan-first-live-runtime.ts",
    cardId: "onr_v1_275_vacuum-link",
    category: "lifecycle_binding",
    expectedCount: 6,
    reason:
      "The definition ID binds the selected LegalAction and encountered ICE to the exact Vacuum Link rewind continuation.",
  },
  {
    relativePath: "runtime/plan-first-live-runtime.ts",
    cardId: "onr_v1_358_dr-dreff",
    category: "lifecycle_binding",
    expectedCount: 2,
    reason:
      "The definition ID restores Dr. Dreff's resident delayed-success plan source and validates the visible rezzed source of its already selected resolution choice.",
  },
  {
    relativePath: "runtime/selected-choices-for-decision.ts",
    cardId: "onr_proteus_006_please-dont-choke-anyone",
    category: "lifecycle_binding",
    reason:
      "The definition ID validates the scored source of the already selected damage-replacement choice.",
  },
  {
    relativePath: "runtime/selected-choices-for-decision.ts",
    cardId: "onr_classic_021_satellite-monitors",
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
  ];
  if (detected.join("|") !== expected.join("|")) {
    throw new Error(
      `AI generic card-id guard self-test failed: ${detected.join("|")}`,
    );
  }
  console.log("AI_GENERIC_CARD_ID_GUARDS self-test OK");
}
