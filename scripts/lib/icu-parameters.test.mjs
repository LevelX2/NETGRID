import assert from "node:assert/strict";
import { test } from "node:test";
import { icuParameters } from "./icu-parameters.mjs";

test("select branch text is not a parameter, including numeric selectors", () => {
  assert.deepEqual(
    [...icuParameters("{n} {n, select, 1 {Credit} other {Credits}}")],
    ["n"],
  );
});
test("nested plural and select branches retain actual parameters", () => {
  assert.deepEqual(
    [
      ...icuParameters(
        "{side, select, corp {{count, plural, =0 {none} one {{card}} other {# cards}}} other {{name}}}",
      ),
    ].sort(),
    ["card", "count", "name", "side"],
  );
});
test("quoted braces and rich text do not invent arguments", () => {
  assert.deepEqual(
    [...icuParameters("<b>{amount, number}</b> '{literal}'")],
    ["amount"],
  );
});
test("malformed ICU is rejected", () => {
  assert.throws(() => icuParameters("{n, plural, one {Card}}"));
});
