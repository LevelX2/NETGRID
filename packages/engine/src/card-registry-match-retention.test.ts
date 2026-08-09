import { describe, expect, it } from "vitest";

import { GENERATED_CARD_SPECS } from "../../cards/src/generated/card-spec-import-index";
import {
  cardSpecForDefinitionId,
  createRulesContextForRegistry,
  editorCardViews,
  engineCardViews,
  planningCardViews,
  publicCardViews,
  publicPrintingViews,
  publicSetViews,
  registryEditorSummary,
  registryFingerprintsFor,
} from "../../cards/src/registry";
import { CARD_REGISTRY } from "../../cards/src/registry-runtime";
import { CS06_CARD_DEFINITION_IDS } from "../../cards/src/cs06-slice";
import { CARD_IMPLEMENTATIONS_BY_DEFINITION_ID } from "./card-implementations/registry";
import { CARD_DEFINITIONS, CARD_DEFINITIONS_BY_ID } from "./card-definitions";
import { createGameAfterSetup } from "./game/create-game";
import { cardRegistryRetentionDecks } from "./test-fixtures/card-registry-retention-decks";

describe("CardSpec registry per-match retention", () => {
  it("retains no registry objects or CardSpec projection graphs in 500 matches", () => {
    const rulesContext = createRulesContextForRegistry(CARD_REGISTRY, {
      engineSchemaVersion: "retention-probe-engine-v1",
      cardImplementationVersion: "retention-probe-implementation-v1",
      primitiveContractVersion: "retention-probe-primitives-v1",
      cardPoolSnapshotId: "retention-probe-pool-v1",
      matchCardPoolDefinitionIds: CS06_CARD_DEFINITION_IDS,
    });
    const authorityRoots = [
      CARD_REGISTRY,
      GENERATED_CARD_SPECS,
      ...CS06_CARD_DEFINITION_IDS.map((definitionId) =>
        cardSpecForDefinitionId(CARD_REGISTRY, definitionId),
      ),
      publicCardViews(CARD_REGISTRY),
      publicPrintingViews(CARD_REGISTRY),
      publicSetViews(CARD_REGISTRY),
      engineCardViews(CARD_REGISTRY),
      planningCardViews(CARD_REGISTRY),
      editorCardViews(CARD_REGISTRY),
      registryEditorSummary(CARD_REGISTRY),
      registryFingerprintsFor(CARD_REGISTRY),
      rulesContext,
      CARD_DEFINITIONS,
      CARD_DEFINITIONS_BY_ID,
      CARD_IMPLEMENTATIONS_BY_DEFINITION_ID,
    ].filter((value) => value !== undefined);
    const authorityObjects = new Set<object>();
    for (const root of authorityRoots)
      collectObjectIdentityClosure(root, authorityObjects);
    const stressDecks = cardRegistryRetentionDecks("stress");
    const states = Array.from({ length: 500 }, (_, index) =>
      createGameAfterSetup({
        seed: `cs06-registry-retention-${index}`,
        matchId: `cs06-registry-retention-${index}`,
        ...stressDecks,
      }),
    );
    const findings = {
      authorityReferences: 0,
      maps: 0,
      sets: 0,
      dates: 0,
      functions: 0,
      forbiddenKeys: [] as string[],
      authorityShapedClones: [] as string[],
    };

    for (const state of states)
      scanGraph(
        state,
        "state",
        new WeakSet<object>(),
        authorityObjects,
        findings,
      );

    expect(findings).toEqual({
      authorityReferences: 0,
      maps: 0,
      sets: 0,
      dates: 0,
      functions: 0,
      forbiddenKeys: [],
      authorityShapedClones: [],
    });
  });
});

function collectObjectIdentityClosure(
  value: unknown,
  identities: Set<object>,
): void {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null ||
    identities.has(value)
  )
    return;
  identities.add(value);
  if (value instanceof Map) {
    for (const [key, nested] of value) {
      collectObjectIdentityClosure(key, identities);
      collectObjectIdentityClosure(nested, identities);
    }
    return;
  }
  if (value instanceof Set) {
    for (const nested of value)
      collectObjectIdentityClosure(nested, identities);
    return;
  }
  for (const nested of Object.values(value))
    collectObjectIdentityClosure(nested, identities);
}

function scanGraph(
  value: unknown,
  path: string,
  visited: WeakSet<object>,
  authorityObjects: ReadonlySet<object>,
  findings: {
    authorityReferences: number;
    maps: number;
    sets: number;
    dates: number;
    functions: number;
    forbiddenKeys: string[];
    authorityShapedClones: string[];
  },
): void {
  if (typeof value === "function") {
    findings.functions += 1;
    return;
  }
  if (typeof value !== "object" || value === null || visited.has(value)) return;
  visited.add(value);
  if (authorityObjects.has(value)) findings.authorityReferences += 1;
  if (isAuthorityShapedClone(value)) findings.authorityShapedClones.push(path);
  if (value instanceof Map) findings.maps += 1;
  if (value instanceof Set) findings.sets += 1;
  if (value instanceof Date) findings.dates += 1;
  if (value instanceof Map || value instanceof Set || value instanceof Date)
    return;

  for (const [key, nested] of Object.entries(value)) {
    if (
      /^(?:cardSpec|cardRegistry|registryContext|rulesContext|planningAnnotations|engineCardView|planningCardView|cardDefinition|cardImplementation|capability|projection|spec)$/i.test(
        key,
      )
    )
      findings.forbiddenKeys.push(`${path}.${key}`);
    scanGraph(nested, `${path}.${key}`, visited, authorityObjects, findings);
  }
}

function isAuthorityShapedClone(value: object): boolean {
  const record = value as Record<string, unknown>;
  if (
    typeof record.schemaVersion === "string" &&
    /^(?:card-registry|card-spec|engine-card-view|planning-card-view|editor-card-view|public-card-view|public-printing-view|public-set-view|card-registry-context|card-mechanical-spec|card-planning-annotations)-v\d+$/.test(
      record.schemaVersion,
    )
  )
    return true;
  if (
    "identity" in record &&
    "text" in record &&
    "rules" in record &&
    "engine" in record &&
    "printings" in record &&
    "publication" in record
  )
    return true;
  if (
    typeof record.cardDefinitionId === "string" &&
    (Array.isArray(record.abilities) ||
      ("engine" in record && "cardRulesFingerprint" in record))
  )
    return true;
  return (
    typeof record.capabilityKey === "string" &&
    Array.isArray(record.addressability) &&
    typeof record.kind === "string"
  );
}
