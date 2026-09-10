import ts from "typescript";

const informationalCategories = new Set([
  "allowed_catalog_reference",
  "test_only_card_name",
  "false_positive",
]);

export function findingFingerprint(finding) {
  return [
    finding.path,
    finding.token,
    finding.cardTitle,
    finding.tokenSource,
    finding.category,
    finding.targetAbstraction,
  ].join("|");
}

export function semanticFingerprints(report) {
  return [
    ...report.findings
      .filter((finding) => !informationalCategories.has(finding.category))
      .map(findingFingerprint),
    ...report.derivedCatalogGuard.fingerprints,
  ].sort();
}

// A debt ceiling, not an exact historical inventory: removals are improvements.
// Multiplicity remains significant, so extra uses of an old leak still fail.
export function guardRegressions(actual, baseline) {
  const configuration = (report) =>
    JSON.stringify({
      schemaVersion: report.schemaVersion,
      scope: [...report.scope].sort(),
      categories: [...report.categories].sort(),
    });
  const failures = [];
  if (configuration(actual) !== configuration(baseline))
    failures.push({ code: "guard_configuration_changed" });
  const counts = (report) => {
    const result = new Map();
    for (const key of semanticFingerprints(report))
      result.set(key, (result.get(key) ?? 0) + 1);
    return result;
  };
  const expectedCounts = counts(baseline);
  for (const [fingerprint, actualCount] of counts(actual)) {
    const baselineCount = expectedCounts.get(fingerprint) ?? 0;
    if (actualCount > baselineCount)
      failures.push({
        code: "card_name_leak_increased",
        fingerprint,
        baselineCount,
        actualCount,
      });
  }
  return failures;
}

// Tooling may describe concrete decks. Only the literal value of a catalog-ID
// data property is exempt, never comparisons, dispatch, identifiers or kinds.
export function catalogDataLiteralRanges(path, text) {
  if (!path.startsWith("scripts/")) return [];
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const ranges = [];
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      ["cardId", "cardDefinitionId"].includes(node.name.text) &&
      ts.isStringLiteral(node.initializer) &&
      /^onr_(?:v1|proteus|classic)_\d+_[a-z0-9-]+$/.test(node.initializer.text)
    )
      ranges.push([node.initializer.getStart(source), node.initializer.end]);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return ranges;
}
