import assert from "node:assert/strict";
import { test } from "node:test";
import {
  catalogDataLiteralRanges,
  findingFingerprint,
  guardRegressions,
} from "./card-abstraction-contract.mjs";

const finding = {
  path: "packages/engine/src/game/example.ts",
  token: "exampleCard",
  cardTitle: "Example Card",
  tokenSource: "known_watch_token",
  category: "runtime_state_field_uses_card_name",
  targetAbstraction: "generic_effect",
  line: 1,
  column: 1,
  snippet: "exampleCard: true",
};
const report = (findings = [finding], fingerprints = []) => ({
  schemaVersion: 2,
  scope: ["packages/engine/src/game"],
  categories: [
    finding.category,
    "allowed_catalog_reference",
    "test_only_card_name",
    "false_positive",
  ],
  findings,
  summary: { historical: 99 },
  derivedCatalogGuard: {
    fingerprints,
    tokenCount: 20,
    baselineCount: fingerprints.length,
  },
});

test("locations, snippets and diagnostic/catalog counts are not architecture contracts", () => {
  const actual = report([
    { ...finding, line: 100, column: 90, snippet: "reformatted" },
  ]);
  actual.summary = { historical: 200 };
  actual.derivedCatalogGuard.tokenCount = 200;
  assert.deepEqual(guardRegressions(actual, report()), []);
});
for (const category of [
  "allowed_catalog_reference",
  "test_only_card_name",
  "false_positive",
]) {
  test(`growth of ${category} does not constitute a leak`, () => {
    assert.deepEqual(
      guardRegressions(report([finding, { ...finding, category }]), report()),
      [],
    );
  });
}
test("removing a known or derived leak is an improvement", () => {
  assert.deepEqual(
    guardRegressions(
      report([]),
      report([finding], [findingFingerprint(finding)]),
    ),
    [],
  );
});
test("new and repeated known leaks fail with actionable counts", () => {
  for (const baseline of [report([]), report()]) {
    const failures = guardRegressions(report([finding, finding]), baseline);
    assert.equal(failures.length, 1);
    assert.equal(failures[0].code, "card_name_leak_increased");
    assert.equal(failures[0].actualCount, 2);
    assert.equal(failures[0].fingerprint, findingFingerprint(finding));
  }
});
test("new and repeated derived leaks fail independently of baseline freshness", () => {
  const key = findingFingerprint({
    ...finding,
    tokenSource: "derived_catalog_token",
  });
  assert.equal(guardRegressions(report([], [key]), report([])).length, 1);
  assert.equal(
    guardRegressions(report([], [key, key]), report([], [key])).length,
    1,
  );
});
test("moving a leak or changing its category cannot borrow another allowance", () => {
  for (const changed of [
    { ...finding, path: "packages/engine/src/game/new.ts" },
    { ...finding, category: "functional_kind_uses_card_name" },
  ])
    assert.equal(guardRegressions(report([changed]), report()).length, 1);
});
test("scope/category/schema changes require explicit review", () => {
  for (const field of ["schemaVersion", "scope", "categories"]) {
    const changed = report();
    changed[field] = field === "schemaVersion" ? 3 : [];
    assert.equal(
      guardRegressions(changed, report())[0].code,
      "guard_configuration_changed",
    );
  }
});
test("tooling catalog data is recognized by syntax, not filename or line formatting", () => {
  const text =
    'const deck = [{ "cardId":\n "onr_v1_001_example-card", delta: 2 }];';
  const ranges = catalogDataLiteralRanges(
    "scripts/arbitrary-new-tool.ts",
    text,
  );
  assert.equal(ranges.length, 1);
  assert.equal(text.slice(...ranges[0]), '"onr_v1_001_example-card"');
  assert.deepEqual(
    catalogDataLiteralRanges("packages/engine/src/game/test.ts", text),
    [],
  );
});
test("rule comparisons and card-named kinds beside data remain outside the exemption", () => {
  const text = `const config = { cardId: "onr_v1_001_example-card", kind: "example-card" };
    if (cardId === "onr_v1_001_example-card") execute();`;
  const ranges = catalogDataLiteralRanges("scripts/example.ts", text);
  const exempt = (index) =>
    ranges.some(([start, end]) => index >= start && index < end);
  assert.equal(exempt(text.indexOf("example-card")), true);
  assert.equal(exempt(text.indexOf('kind: "example-card"') + 7), false);
  assert.equal(exempt(text.lastIndexOf("example-card")), false);
});
