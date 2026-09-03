import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateReleaseCardSpecImportIndex } from "./generate-card-spec-import-index.mjs";

const scriptsRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsRoot, "..");
const output = await generateReleaseCardSpecImportIndex(
  repositoryRoot,
  "packages/cards/src/generated/card-spec-release-import-index.ts",
);

assert.ok(output.includes("specs/originalset-v1/"));
assert.ok(!output.includes("specs/testset/"));
assert.ok(!output.includes("sets/testset.set-spec"));
assert.ok(!output.includes('setId: "testset"'));
process.stdout.write("RELEASE_CARD_INDEX_OK\n");
