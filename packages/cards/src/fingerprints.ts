import type { CardSpec, SetSpec } from "./contracts";
import {
  assertStrictlySerializable,
  canonicalSerialize,
  deepFreezeSerializable,
} from "./serializable";

export const CARD_FINGERPRINT_SCHEMA_VERSION = "card-fingerprints-v1" as const;
export const CARD_REGISTRY_CONTEXT_SCHEMA_VERSION =
  "card-registry-context-v1" as const;

export type Fingerprint = `fnv1a64x2:${string}:${string}`;

export type CardSectionFingerprints = {
  schemaVersion: typeof CARD_FINGERPRINT_SCHEMA_VERSION;
  cardRulesFingerprint: Fingerprint;
  textFingerprint: Fingerprint;
  printingFingerprint: Fingerprint;
  planningAnnotationsFingerprint: Fingerprint;
  publicationFingerprint: Fingerprint;
};

export type CardRegistryFingerprints = {
  schemaVersion: typeof CARD_FINGERPRINT_SCHEMA_VERSION;
  cardRulesAggregateFingerprint: Fingerprint;
  textAggregateFingerprint: Fingerprint;
  printingAggregateFingerprint: Fingerprint;
  planningAnnotationsAggregateFingerprint: Fingerprint;
  publicationAggregateFingerprint: Fingerprint;
  registryCardPoolFingerprint: Fingerprint;
  registryFingerprint: Fingerprint;
};

export type EngineRegistryVersionContext = {
  engineSchemaVersion: string;
  cardImplementationVersion: string;
  primitiveContractVersion: string;
  cardPoolSnapshotId: string;
  matchCardPoolDefinitionIds: readonly string[];
};

export type CardRegistryRulesContext = {
  schemaVersion: typeof CARD_REGISTRY_CONTEXT_SCHEMA_VERSION;
  matchCardDefinitionIds: readonly string[];
  cardRulesAggregateFingerprint: Fingerprint;
  cardPoolFingerprint: Fingerprint;
  cardPoolSnapshotId: string;
  engineSchemaVersion: string;
  cardImplementationVersion: string;
  primitiveContractVersion: string;
  fingerprint: Fingerprint;
};

export type PlanningRegistryVersionContext = {
  actionSemanticSchemaVersion: string;
  plannerPolicyVersion: string;
  planModuleSetFingerprint: string;
};

export type CardRegistryPlanningContext = {
  schemaVersion: typeof CARD_REGISTRY_CONTEXT_SCHEMA_VERSION;
  rulesContextFingerprint: Fingerprint;
  planningAnnotationsAggregateFingerprint: Fingerprint;
  actionSemanticSchemaVersion: string;
  plannerPolicyVersion: string;
  planModuleSetFingerprint: string;
  fingerprint: Fingerprint;
};

export function cardSectionFingerprints(
  spec: CardSpec,
): CardSectionFingerprints {
  const faceTextOverrides = spec.printings
    .filter((printing) => printing.faceTextOverride !== undefined)
    .map((printing) => ({
      printingId: printing.printingId,
      faceTextOverride: printing.faceTextOverride!,
    }))
    .sort((left, right) => compareText(left.printingId, right.printingId));
  const printingMetadata = spec.printings
    .map(({ faceTextOverride: _faceTextOverride, ...printing }) => printing)
    .sort((left, right) => compareText(left.printingId, right.printingId));
  return deepFreezeSerializable({
    schemaVersion: CARD_FINGERPRINT_SCHEMA_VERSION,
    cardRulesFingerprint: fingerprint("card-rules-v1", {
      schemaVersion: spec.schemaVersion,
      identity: {
        cardDefinitionId: spec.identity.cardDefinitionId,
        side: spec.identity.side,
        cardType: spec.identity.cardType,
      },
      engine: spec.engine,
    }),
    textFingerprint: fingerprint("card-text-v1", {
      title: spec.identity.title,
      text: spec.text,
      rulesProvenance: spec.rules,
      faceTextOverrides,
    }),
    printingFingerprint: fingerprint("card-printing-v1", printingMetadata),
    planningAnnotationsFingerprint: fingerprint(
      "card-planning-annotations-v1",
      spec.planningAnnotations ?? null,
    ),
    publicationFingerprint: fingerprint(
      "card-publication-v1",
      spec.publication,
    ),
  });
}

export function registryFingerprints(
  cards: readonly {
    cardDefinitionId: string;
    fingerprints: CardSectionFingerprints;
  }[],
  sets: readonly SetSpec[],
): CardRegistryFingerprints {
  const orderedCards = [...cards].sort((left, right) =>
    compareText(left.cardDefinitionId, right.cardDefinitionId),
  );
  const orderedSets = [...sets].sort((left, right) =>
    compareText(left.setId, right.setId),
  );
  const rows = <Key extends keyof CardSectionFingerprints>(key: Key) =>
    orderedCards.map((card) => [card.cardDefinitionId, card.fingerprints[key]]);
  const cardRulesRows = rows("cardRulesFingerprint");
  const textRows = rows("textFingerprint");
  const printingRows = rows("printingFingerprint");
  const planningRows = rows("planningAnnotationsFingerprint");
  const publicationRows = rows("publicationFingerprint");
  const setPrintingRows = orderedSets.map((set) => [
    set.setId,
    fingerprint("set-printing-v1", {
      setId: set.setId,
      name: set.name,
      code: set.code ?? null,
      sortOrder: set.sortOrder,
    }),
  ]);
  const setPublicationRows = orderedSets.map((set) => [
    set.setId,
    fingerprint("set-publication-v1", set.publication),
  ]);
  const aggregates = {
    schemaVersion: CARD_FINGERPRINT_SCHEMA_VERSION,
    cardRulesAggregateFingerprint: fingerprint(
      "registry-card-rules-v1",
      cardRulesRows,
    ),
    textAggregateFingerprint: fingerprint("registry-text-v1", textRows),
    printingAggregateFingerprint: fingerprint("registry-printing-v1", {
      cards: printingRows,
      sets: setPrintingRows,
    }),
    planningAnnotationsAggregateFingerprint: fingerprint(
      "registry-planning-v1",
      planningRows,
    ),
    publicationAggregateFingerprint: fingerprint("registry-publication-v1", {
      cards: publicationRows,
      sets: setPublicationRows,
    }),
    registryCardPoolFingerprint: fingerprint(
      "registry-card-pool-v1",
      orderedCards.map((card) => card.cardDefinitionId),
    ),
  };
  return deepFreezeSerializable({
    ...aggregates,
    registryFingerprint: fingerprint("registry-full-v1", aggregates),
  });
}

export function createCardRegistryRulesContext(
  selection: {
    matchCardDefinitionIds: readonly string[];
    cardRulesAggregateFingerprint: Fingerprint;
    cardPoolFingerprint: Fingerprint;
  },
  versions: EngineRegistryVersionContext,
): CardRegistryRulesContext {
  assertEngineRegistryVersionContext(versions);
  const matchCardPoolDefinitionIds = [
    ...versions.matchCardPoolDefinitionIds,
  ].sort(compareText);
  if (
    selection.matchCardDefinitionIds.length !==
      matchCardPoolDefinitionIds.length ||
    selection.matchCardDefinitionIds.some(
      (entry, index) => entry !== matchCardPoolDefinitionIds[index],
    )
  )
    throw new FingerprintContractError(
      "mixed_registry_context",
      "selected rules rows and requested match pool differ",
    );
  const input = {
    schemaVersion: CARD_REGISTRY_CONTEXT_SCHEMA_VERSION,
    matchCardDefinitionIds: matchCardPoolDefinitionIds,
    cardRulesAggregateFingerprint: selection.cardRulesAggregateFingerprint,
    cardPoolFingerprint: selection.cardPoolFingerprint,
    cardPoolSnapshotId: versions.cardPoolSnapshotId,
    engineSchemaVersion: versions.engineSchemaVersion,
    cardImplementationVersion: versions.cardImplementationVersion,
    primitiveContractVersion: versions.primitiveContractVersion,
  };
  return deepFreezeSerializable({
    ...input,
    fingerprint: fingerprint("card-registry-rules-context-v1", input),
  });
}

export function assertEngineRegistryVersionContext(
  versions: EngineRegistryVersionContext,
): void {
  assertExactStringContext(versions, [
    "engineSchemaVersion",
    "cardImplementationVersion",
    "primitiveContractVersion",
    "cardPoolSnapshotId",
    "matchCardPoolDefinitionIds",
  ]);
  if (
    !Array.isArray(versions.matchCardPoolDefinitionIds) ||
    versions.matchCardPoolDefinitionIds.some(
      (entry) => typeof entry !== "string" || entry.trim().length === 0,
    ) ||
    new Set(versions.matchCardPoolDefinitionIds).size !==
      versions.matchCardPoolDefinitionIds.length
  )
    throw new FingerprintContractError(
      "invalid_version_context",
      "matchCardPoolDefinitionIds must be a unique non-empty string array",
    );
}

export function createCardRegistryPlanningContext(
  planningAnnotationsAggregateFingerprint: Fingerprint,
  rulesContext: CardRegistryRulesContext,
  versions: PlanningRegistryVersionContext,
): CardRegistryPlanningContext {
  assertExactStringContext(versions, [
    "actionSemanticSchemaVersion",
    "plannerPolicyVersion",
    "planModuleSetFingerprint",
  ]);
  const input = {
    schemaVersion: CARD_REGISTRY_CONTEXT_SCHEMA_VERSION,
    rulesContextFingerprint: rulesContext.fingerprint,
    planningAnnotationsAggregateFingerprint,
    actionSemanticSchemaVersion: versions.actionSemanticSchemaVersion,
    plannerPolicyVersion: versions.plannerPolicyVersion,
    planModuleSetFingerprint: versions.planModuleSetFingerprint,
  };
  return deepFreezeSerializable({
    ...input,
    fingerprint: fingerprint("card-registry-planning-context-v1", input),
  });
}

export function assertCardRegistryRulesContext(
  value: unknown,
): asserts value is CardRegistryRulesContext {
  const record = contextRecord(value, [
    "schemaVersion",
    "matchCardDefinitionIds",
    "cardRulesAggregateFingerprint",
    "cardPoolFingerprint",
    "cardPoolSnapshotId",
    "engineSchemaVersion",
    "cardImplementationVersion",
    "primitiveContractVersion",
    "fingerprint",
  ]);
  if (record.schemaVersion !== CARD_REGISTRY_CONTEXT_SCHEMA_VERSION)
    invalidContext("rules context schemaVersion is invalid");
  const ids = record.matchCardDefinitionIds;
  if (
    !Array.isArray(ids) ||
    ids.some((id) => typeof id !== "string" || id.trim().length === 0) ||
    new Set(ids).size !== ids.length ||
    ids.some((id, index) => index > 0 && ids[index - 1] >= id)
  )
    invalidContext("matchCardDefinitionIds must be unique and sorted");
  for (const key of [
    "cardRulesAggregateFingerprint",
    "cardPoolFingerprint",
    "cardPoolSnapshotId",
    "engineSchemaVersion",
    "cardImplementationVersion",
    "primitiveContractVersion",
    "fingerprint",
  ])
    if (typeof record[key] !== "string" || record[key].length === 0)
      invalidContext(`${key} must be a non-empty string`);
  const { fingerprint: actual, ...input } = record;
  if (actual !== fingerprint("card-registry-rules-context-v1", input))
    invalidContext("rules context fingerprint mismatch");
}

export function assertCardRegistryPlanningContext(
  value: unknown,
): asserts value is CardRegistryPlanningContext {
  const record = contextRecord(value, [
    "schemaVersion",
    "rulesContextFingerprint",
    "planningAnnotationsAggregateFingerprint",
    "actionSemanticSchemaVersion",
    "plannerPolicyVersion",
    "planModuleSetFingerprint",
    "fingerprint",
  ]);
  if (record.schemaVersion !== CARD_REGISTRY_CONTEXT_SCHEMA_VERSION)
    invalidContext("planning context schemaVersion is invalid");
  for (const key of [
    "rulesContextFingerprint",
    "planningAnnotationsAggregateFingerprint",
    "actionSemanticSchemaVersion",
    "plannerPolicyVersion",
    "planModuleSetFingerprint",
    "fingerprint",
  ])
    if (typeof record[key] !== "string" || record[key].length === 0)
      invalidContext(`${key} must be a non-empty string`);
  const { fingerprint: actual, ...input } = record;
  if (actual !== fingerprint("card-registry-planning-context-v1", input))
    invalidContext("planning context fingerprint mismatch");
}

export function fingerprint(domain: string, value: unknown): Fingerprint {
  if (!domain || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(domain))
    throw new FingerprintContractError(
      "invalid_fingerprint_domain",
      `invalid fingerprint domain: ${domain}`,
    );
  const input = canonicalSerialize({
    fingerprintSchemaVersion: CARD_FINGERPRINT_SCHEMA_VERSION,
    domain,
    value,
  });
  const first = fnv1a32(input, 0x811c9dc5);
  const second = fnv1a32(input, 0x9e3779b9);
  return `fnv1a64x2:${domain}:${first}${second}`;
}

export type FingerprintContractErrorCode =
  | "invalid_fingerprint_domain"
  | "invalid_version_context"
  | "invalid_registry_context"
  | "mixed_registry_context";

export class FingerprintContractError extends Error {
  readonly name = "FingerprintContractError";

  constructor(
    readonly code: FingerprintContractErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
  }
}

function assertExactStringContext(
  value: object,
  keys: readonly string[],
): void {
  const actual = Object.keys(value).sort(compareText);
  const expected = [...keys].sort(compareText);
  if (
    actual.length !== expected.length ||
    actual.some((entry, index) => entry !== expected[index])
  )
    throw new FingerprintContractError(
      "invalid_version_context",
      `expected exactly ${expected.join(",")}`,
    );
  for (const key of keys) {
    const entry = (value as Record<string, unknown>)[key];
    if (key === "matchCardPoolDefinitionIds") continue;
    if (typeof entry !== "string" || entry.trim().length === 0)
      throw new FingerprintContractError(
        "invalid_version_context",
        `${key} must be a non-empty string`,
      );
  }
}

function contextRecord(
  value: unknown,
  expectedKeys: readonly string[],
): Record<string, unknown> {
  assertStrictlySerializable(value, "$registryContext");
  if (value === null || typeof value !== "object" || Array.isArray(value))
    invalidContext("context must be an object");
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort(compareText);
  const sortedExpected = [...expectedKeys].sort(compareText);
  if (
    actualKeys.length !== sortedExpected.length ||
    actualKeys.some((key, index) => key !== sortedExpected[index])
  )
    invalidContext(`expected exactly ${sortedExpected.join(",")}`);
  return record;
}

function invalidContext(message: string): never {
  throw new FingerprintContractError("invalid_registry_context", message);
}

function fnv1a32(input: string, seed: number): string {
  let hash = seed;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
