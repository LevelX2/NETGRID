import type { CardDefinitionId } from "@netgrid/shared";
import {
  canonicalCapabilityId,
  type CanonicalCapabilityId,
  type CapabilityKey,
} from "./capability-identity";
import {
  assertCardSpecContract,
  assertSetSpecContract,
  finalizeCardSpec,
  finalizeSetSpec,
} from "./card-spec-validation";
import type { CardSpec, PrintingId, SetId, SetSpec } from "./contracts";
import {
  cardSectionFingerprints,
  assertEngineRegistryVersionContext,
  assertCardRegistryRulesContext,
  createCardRegistryPlanningContext,
  createCardRegistryRulesContext,
  fingerprint,
  registryFingerprints,
  type CardRegistryFingerprints,
  type CardSectionFingerprints,
  type EngineRegistryVersionContext,
  type CardRegistryPlanningContext,
  type CardRegistryRulesContext,
  type PlanningRegistryVersionContext,
  FingerprintContractError,
} from "./fingerprints";
import {
  projectEditorCard,
  projectEngineCard,
  projectPlanningCard,
  projectPublicCard,
  projectPublicSet,
  type EditorCardView,
  type EngineCapabilityView,
  type EngineCardView,
  type PlanningCardView,
  type PublicCardView,
  type PublicPrintingView,
  type PublicSetView,
  type RegistryEditorSummary,
} from "./projections";
import { deepFreezeSerializable, type DeepReadonly } from "./serializable";

export const CARD_REGISTRY_SCHEMA_VERSION = "card-registry-v1" as const;

/** Safe identity shared by all subpaths; scoped lookup APIs remain separate. */
export type CardRegistry = Readonly<{
  schemaVersion: typeof CARD_REGISTRY_SCHEMA_VERSION;
  registryFingerprint: string;
}>;

export type CardRegistryInput = {
  cardSpecs: readonly CardSpec[];
  setSpecs: readonly SetSpec[];
};

export type CardRegistryErrorCode =
  | "duplicate_card_definition_id"
  | "duplicate_printing_id"
  | "duplicate_set_id"
  | "duplicate_capability_id"
  | "orphan_printing_set"
  | "unknown_match_card_pool_definition_id"
  | "invalid_registry_handle";

export class CardRegistryError extends Error {
  readonly name = "CardRegistryError";

  constructor(
    readonly code: CardRegistryErrorCode,
    readonly value: string,
    message: string,
  ) {
    super(`${code} (${value}): ${message}`);
  }
}

type CapabilityRecord = {
  canonicalCapabilityId: CanonicalCapabilityId;
  cardDefinitionId: CardDefinitionId;
  capabilityKey: CapabilityKey;
  capability: Record<string, unknown> & { capabilityKey: CapabilityKey };
};

type RegistryAccess = {
  cards: readonly DeepReadonly<CardSpec>[];
  sets: readonly DeepReadonly<SetSpec>[];
  cardsById: ReadonlyMap<CardDefinitionId, DeepReadonly<CardSpec>>;
  setsById: ReadonlyMap<SetId, DeepReadonly<SetSpec>>;
  printingsById: ReadonlyMap<PrintingId, DeepReadonly<PublicPrintingView>>;
  printingSpecsById: ReadonlyMap<
    PrintingId,
    DeepReadonly<CardSpec["printings"][number]>
  >;
  capabilitiesById: ReadonlyMap<
    CanonicalCapabilityId,
    DeepReadonly<EngineCapabilityView>
  >;
  sectionFingerprints: ReadonlyMap<
    CardDefinitionId,
    DeepReadonly<CardSectionFingerprints>
  >;
  fingerprints: DeepReadonly<CardRegistryFingerprints>;
  publicCards: ReadonlyMap<CardDefinitionId, DeepReadonly<PublicCardView>>;
  publicCardList: readonly DeepReadonly<PublicCardView>[];
  publicPrintingList: readonly DeepReadonly<PublicPrintingView>[];
  publicSetList: readonly DeepReadonly<PublicSetView>[];
  publicSets: ReadonlyMap<SetId, DeepReadonly<PublicSetView>>;
  engineCards: ReadonlyMap<CardDefinitionId, DeepReadonly<EngineCardView>>;
  engineCardList: readonly DeepReadonly<EngineCardView>[];
  planningCards: ReadonlyMap<CardDefinitionId, DeepReadonly<PlanningCardView>>;
  planningCardList: readonly DeepReadonly<PlanningCardView>[];
  editorCards: ReadonlyMap<CardDefinitionId, DeepReadonly<EditorCardView>>;
  editorCardList: readonly DeepReadonly<EditorCardView>[];
  summary: DeepReadonly<RegistryEditorSummary>;
};

const ACCESS_BY_REGISTRY = new WeakMap<CardRegistry, RegistryAccess>();

export function createCardRegistry(input: CardRegistryInput): CardRegistry {
  // Validate and collect all global failures before freezing any caller input.
  for (const spec of input.cardSpecs) assertCardSpecContract(spec);
  for (const set of input.setSpecs) assertSetSpecContract(set);

  const cardIds = new Set<string>();
  const printingIds = new Set<string>();
  const setIds = new Set<string>();
  const capabilityIds = new Set<string>();
  const rawCapabilities: CapabilityRecord[] = [];

  for (const set of input.setSpecs) {
    if (setIds.has(set.setId))
      fail("duplicate_set_id", set.setId, "setId must be globally unique");
    setIds.add(set.setId);
  }
  for (const spec of input.cardSpecs) {
    const definitionId = spec.identity.cardDefinitionId;
    if (cardIds.has(definitionId))
      fail(
        "duplicate_card_definition_id",
        definitionId,
        "cardDefinitionId must be globally unique",
      );
    cardIds.add(definitionId);
    for (const printing of spec.printings) {
      if (printingIds.has(printing.printingId))
        fail(
          "duplicate_printing_id",
          printing.printingId,
          "printingId must be globally unique",
        );
      if (!setIds.has(printing.setId))
        fail(
          "orphan_printing_set",
          printing.setId,
          `printing ${printing.printingId} references an unknown set`,
        );
      printingIds.add(printing.printingId);
    }
    for (const capability of collectCapabilities(spec)) {
      const id = canonicalCapabilityId(definitionId, capability.capabilityKey);
      if (capabilityIds.has(id))
        fail(
          "duplicate_capability_id",
          id,
          "canonical capability identity must be globally unique",
        );
      capabilityIds.add(id);
      rawCapabilities.push({
        canonicalCapabilityId: id,
        cardDefinitionId: definitionId,
        capabilityKey: capability.capabilityKey,
        capability,
      });
    }
  }

  const cards = input.cardSpecs
    .map(finalizeCardSpec)
    .sort((left, right) =>
      compareText(
        left.identity.cardDefinitionId,
        right.identity.cardDefinitionId,
      ),
    );
  const sets = input.setSpecs
    .map(finalizeSetSpec)
    .sort((left, right) => compareText(left.setId, right.setId));
  const cardsById = new Map(
    cards.map((spec) => [spec.identity.cardDefinitionId, spec] as const),
  );
  const setsById = new Map(sets.map((set) => [set.setId, set] as const));
  const sectionFingerprints = new Map(
    cards.map((spec) => [
      spec.identity.cardDefinitionId,
      cardSectionFingerprints(spec as CardSpec),
    ]),
  );
  const fingerprints = registryFingerprints(
    cards.map((spec) => ({
      cardDefinitionId: spec.identity.cardDefinitionId,
      fingerprints: sectionFingerprints.get(spec.identity.cardDefinitionId)!,
    })),
    sets as readonly SetSpec[],
  );
  const publicSetIds = new Set(
    sets
      .filter((set) => set.publication.status !== "disabled")
      .map((set) => set.setId),
  );
  const runtimeSetIds = new Set(
    sets
      .filter((set) => set.publication.status === "active")
      .map((set) => set.setId),
  );
  const runtimeCards = cards.filter(
    (spec) =>
      spec.publication.status === "active" &&
      spec.printings.some((printing) => runtimeSetIds.has(printing.setId)),
  );
  const publicCards = new Map(
    cards
      .filter(
        (spec) =>
          spec.publication.status !== "disabled" &&
          spec.printings.some((printing) => publicSetIds.has(printing.setId)),
      )
      .map((spec) => [
        spec.identity.cardDefinitionId,
        projectPublicCard(
          spec,
          sectionFingerprints.get(spec.identity.cardDefinitionId)!,
          publicSetIds,
        ),
      ]),
  );
  const publicSets = new Map(
    sets
      .filter((set) => set.publication.status !== "disabled")
      .map((set) => [set.setId, projectPublicSet(set)]),
  );
  const engineCards = new Map(
    runtimeCards.map((spec) => [
      spec.identity.cardDefinitionId,
      projectEngineCard(
        spec,
        sectionFingerprints.get(spec.identity.cardDefinitionId)!,
      ),
    ]),
  );
  const planningCards = new Map(
    runtimeCards.map((spec) => [
      spec.identity.cardDefinitionId,
      projectPlanningCard(
        spec,
        sectionFingerprints.get(spec.identity.cardDefinitionId)!,
      ),
    ]),
  );
  const editorCards = new Map(
    cards.map((spec) => [
      spec.identity.cardDefinitionId,
      projectEditorCard(
        spec,
        sectionFingerprints.get(spec.identity.cardDefinitionId)!,
      ),
    ]),
  );
  const printingsById = new Map<PrintingId, DeepReadonly<PublicPrintingView>>();
  for (const card of publicCards.values())
    for (const printing of card.printings)
      printingsById.set(printing.printingId, printing);
  const printingSpecsById = new Map(
    cards.flatMap((card) =>
      card.printings.map(
        (printing) => [printing.printingId, printing] as const,
      ),
    ),
  );
  const capabilitiesById = new Map(
    rawCapabilities
      .sort((left, right) =>
        compareText(left.canonicalCapabilityId, right.canonicalCapabilityId),
      )
      .map((record) => [
        record.canonicalCapabilityId,
        deepFreezeSerializable({
          schemaVersion: "engine-capability-view-v1" as const,
          ...record,
        }),
      ]),
  );
  const summary = deepFreezeSerializable({
    schemaVersion: "registry-editor-summary-v1" as const,
    definitionCount: cards.length,
    printingCount: printingIds.size,
    setCount: sets.length,
    capabilityCount: capabilitiesById.size,
    fingerprints,
  });
  const registry: CardRegistry = Object.freeze({
    schemaVersion: CARD_REGISTRY_SCHEMA_VERSION,
    registryFingerprint: fingerprints.registryFingerprint,
  });
  ACCESS_BY_REGISTRY.set(registry, {
    cards,
    sets,
    cardsById,
    setsById,
    printingsById,
    printingSpecsById,
    capabilitiesById,
    sectionFingerprints,
    fingerprints,
    publicCards,
    publicCardList: deepFreezeSerializable([...publicCards.values()]),
    publicPrintingList: deepFreezeSerializable([...printingsById.values()]),
    publicSetList: deepFreezeSerializable([...publicSets.values()]),
    publicSets,
    engineCards,
    engineCardList: deepFreezeSerializable([...engineCards.values()]),
    planningCards,
    planningCardList: deepFreezeSerializable([...planningCards.values()]),
    editorCards,
    editorCardList: deepFreezeSerializable([...editorCards.values()]),
    summary,
  });
  return registry;
}

export function registryFingerprintsFor(
  registry: CardRegistry,
): DeepReadonly<CardRegistryFingerprints> {
  return access(registry).fingerprints;
}

export function createRulesContextForRegistry(
  registry: CardRegistry,
  versions: EngineRegistryVersionContext,
): ReturnType<typeof createCardRegistryRulesContext> {
  const registryAccess = access(registry);
  assertEngineRegistryVersionContext(versions);
  const definitionIds = [...versions.matchCardPoolDefinitionIds].sort(
    compareText,
  );
  const rows: readonly (readonly [string, string])[] = definitionIds.map(
    (definitionId) => {
      const section = registryAccess.sectionFingerprints.get(
        definitionId as CardDefinitionId,
      );
      if (!section)
        fail(
          "unknown_match_card_pool_definition_id",
          definitionId,
          "match card pool references no CardSpec in this registry",
        );
      return [definitionId, section.cardRulesFingerprint] as const;
    },
  );
  const context = createCardRegistryRulesContext(
    {
      matchCardDefinitionIds: definitionIds,
      cardRulesAggregateFingerprint: fingerprint("match-card-rules-v1", rows),
      cardPoolFingerprint: fingerprint("match-card-pool-v1", {
        cardPoolSnapshotId: versions.cardPoolSnapshotId,
        definitionIds,
      }),
    },
    versions,
  );
  for (const definitionId of versions.matchCardPoolDefinitionIds)
    if (!registryAccess.cardsById.has(definitionId as CardDefinitionId))
      fail(
        "unknown_match_card_pool_definition_id",
        definitionId,
        "match card pool references no CardSpec in this registry",
      );
  return context;
}

export function createPlanningContextForRegistry(
  registry: CardRegistry,
  rulesContext: CardRegistryRulesContext,
  versions: PlanningRegistryVersionContext,
): CardRegistryPlanningContext {
  assertCardRegistryRulesContext(rulesContext);
  const expectedRules = createRulesContextForRegistry(registry, {
    engineSchemaVersion: rulesContext.engineSchemaVersion,
    cardImplementationVersion: rulesContext.cardImplementationVersion,
    primitiveContractVersion: rulesContext.primitiveContractVersion,
    cardPoolSnapshotId: rulesContext.cardPoolSnapshotId,
    matchCardPoolDefinitionIds: rulesContext.matchCardDefinitionIds,
  });
  if (expectedRules.fingerprint !== rulesContext.fingerprint)
    throw new FingerprintContractError(
      "mixed_registry_context",
      "rules context does not belong to this registry and match pool",
    );
  const registryAccess = access(registry);
  const planningRows = rulesContext.matchCardDefinitionIds.map(
    (definitionId) => [
      definitionId,
      registryAccess.sectionFingerprints.get(definitionId as CardDefinitionId)!
        .planningAnnotationsFingerprint,
    ],
  );
  return createCardRegistryPlanningContext(
    fingerprint("match-card-planning-v1", planningRows),
    rulesContext,
    versions,
  );
}

export function publicCardViewForDefinitionId(
  registry: CardRegistry,
  definitionId: CardDefinitionId,
): DeepReadonly<PublicCardView> | undefined {
  return access(registry).publicCards.get(definitionId);
}

export function publicCardViews(
  registry: CardRegistry,
): readonly DeepReadonly<PublicCardView>[] {
  return access(registry).publicCardList;
}

export function publicPrintingViewForId(
  registry: CardRegistry,
  printingId: PrintingId,
): DeepReadonly<PublicPrintingView> | undefined {
  return access(registry).printingsById.get(printingId);
}

export function publicPrintingViews(
  registry: CardRegistry,
): readonly DeepReadonly<PublicPrintingView>[] {
  return access(registry).publicPrintingList;
}

export function publicSetViewForId(
  registry: CardRegistry,
  setId: SetId,
): DeepReadonly<PublicSetView> | undefined {
  return access(registry).publicSets.get(setId);
}

export function publicSetViews(
  registry: CardRegistry,
): readonly DeepReadonly<PublicSetView>[] {
  return access(registry).publicSetList;
}

export function engineCardViewForDefinitionId(
  registry: CardRegistry,
  definitionId: CardDefinitionId,
): DeepReadonly<EngineCardView> | undefined {
  return access(registry).engineCards.get(definitionId);
}

export function engineCardViews(
  registry: CardRegistry,
): readonly DeepReadonly<EngineCardView>[] {
  return access(registry).engineCardList;
}

export function engineCapabilityViewForId(
  registry: CardRegistry,
  capabilityId: CanonicalCapabilityId,
): DeepReadonly<EngineCapabilityView> | undefined {
  return access(registry).capabilitiesById.get(capabilityId);
}

export function planningCardViewForDefinitionId(
  registry: CardRegistry,
  definitionId: CardDefinitionId,
): DeepReadonly<PlanningCardView> | undefined {
  return access(registry).planningCards.get(definitionId);
}

export function planningCardViews(
  registry: CardRegistry,
): readonly DeepReadonly<PlanningCardView>[] {
  return access(registry).planningCardList;
}

export function editorCardViewForDefinitionId(
  registry: CardRegistry,
  definitionId: CardDefinitionId,
): DeepReadonly<EditorCardView> | undefined {
  return access(registry).editorCards.get(definitionId);
}

export function editorCardViews(
  registry: CardRegistry,
): readonly DeepReadonly<EditorCardView>[] {
  return access(registry).editorCardList;
}

export function registryEditorSummary(
  registry: CardRegistry,
): DeepReadonly<RegistryEditorSummary> {
  return access(registry).summary;
}

export function cardSpecForDefinitionId(
  registry: CardRegistry,
  definitionId: CardDefinitionId,
): DeepReadonly<CardSpec> | undefined {
  return access(registry).cardsById.get(definitionId);
}

export function setSpecForId(
  registry: CardRegistry,
  setId: SetId,
): DeepReadonly<SetSpec> | undefined {
  return access(registry).setsById.get(setId);
}

export function printingSpecForId(
  registry: CardRegistry,
  printingId: PrintingId,
): DeepReadonly<CardSpec["printings"][number]> | undefined {
  return access(registry).printingSpecsById.get(printingId);
}

function collectCapabilities(spec: CardSpec): CapabilityRecord["capability"][] {
  const found: CapabilityRecord["capability"][] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }
    if (value === null || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (typeof record.capabilityKey === "string")
      found.push(record as CapabilityRecord["capability"]);
    for (const entry of Object.values(record)) visit(entry);
  };
  visit(spec.engine);
  return found;
}

function access(registry: CardRegistry): RegistryAccess {
  const result = ACCESS_BY_REGISTRY.get(registry);
  if (!result)
    fail(
      "invalid_registry_handle",
      registry.schemaVersion,
      "registry was not created by createCardRegistry",
    );
  return result;
}

function fail(
  code: CardRegistryErrorCode,
  value: string,
  message: string,
): never {
  throw new CardRegistryError(code, value, message);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
