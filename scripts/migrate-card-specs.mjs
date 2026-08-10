import { parseSetMigrationInvocation } from "./lib/card-spec-migration-core.mjs";

const adapters = Object.freeze({
  testset: "./lib/testset-card-spec-migration-adapter.mjs",
  classic: "./lib/classic-card-spec-migration-adapter.mjs",
  proteus: "./lib/proteus-card-spec-migration-adapter.mjs",
  "originalset-v1": "./lib/originalset-v1-card-spec-migration-adapter.mjs",
});
const descriptors = Object.freeze(
  Object.fromEntries(Object.keys(adapters).map((setId) => [setId, { setId }])),
);
const { setId } = parseSetMigrationInvocation(process.argv, descriptors);
await import(adapters[setId]);
