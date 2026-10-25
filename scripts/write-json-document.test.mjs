import assert from "node:assert/strict";
import test from "node:test";
import { writeJsonDocument } from "./lib/write-json-document.mjs";

test("streams the unchanged registry JSON format with bounded chunks", () => {
  const document = {
    schemaVersion: 1,
    pairings: [{ id: "544", reproduction_json: { text: 'Ä\n\\"ß😀'.repeat(200) } }],
    games: [{ metadata_json: [null, true, false, 3.5, -2, {}, []] }],
    clusters: [], cases: [], fixes: [],
  };
  const chunks = [];
  writeJsonDocument(document, (chunk) => {
    assert.ok(chunk.length <= 17);
    chunks.push(Buffer.from(chunk, "utf8"));
  }, 17);
  const actual = Buffer.concat(chunks).toString("utf8");
  assert.equal(actual, `${JSON.stringify(document, null, 2)}\n`);
  assert.deepEqual(JSON.parse(actual), document);
  assert.ok(chunks.length > 100);
});

test("handles escaped and unpaired surrogates at every chunk boundary", () => {
  const value = { ['key😀\"']: "😀\ud800X\udc00\t\r\n\\\"" };
  for (let size = 2; size < 25; size += 1) {
    const chunks = [];
    writeJsonDocument(value, (chunk) => chunks.push(Buffer.from(chunk)), size);
    assert.equal(Buffer.concat(chunks).toString(), `${JSON.stringify(value, null, 2)}\n`);
  }
});

test("fails visibly on values outside the registry JSON contract", () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => writeJsonDocument(cyclic, () => {}), /Circular/);
  assert.throws(() => writeJsonDocument({ missing: undefined }, () => {}), /Unsupported/);
  assert.throws(() => writeJsonDocument({}, () => {}, 1), /chunk size/);
});
