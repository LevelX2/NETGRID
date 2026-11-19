import type { CardDefinitionId } from "@netgrid/shared";
export type * from "./definition-types";
export {
  activatedAbilityAtTiming,
  additionalTimingCondition,
} from "./definition-ability-contracts";
export type * from "./card-mechanical-contracts";
export {
  CapabilityIdentityError,
  assertCanonicalCapabilityId,
  assertAbilityRefIdentity,
  capabilityKey,
  canonicalCapabilityId,
  parseCanonicalCapabilityId,
} from "../capability-identity";
export type {
  AbilityKey,
  CanonicalCapabilityId,
  CapabilityKey,
} from "../capability-identity";
import {
  engineCapabilityViewForId,
  engineCardViewForDefinitionId,
  engineCardViews,
  cardSpecForDefinitionId,
  createRulesContextForRegistry,
  setSpecForId,
} from "../registry";
import { CARD_REGISTRY, CARD_SPEC_SOURCE_REFS } from "../registry-runtime";
import type { EngineRegistryVersionContext } from "../fingerprints";
export type {
  CardRegistryRulesContext,
  EngineRegistryVersionContext,
} from "../fingerprints";
export type { EngineCapabilityView, EngineCardView } from "../projections";
export type { DeepReadonly } from "../serializable";
export const engineCardByDefinitionId = engineCardViewForDefinitionId.bind(
  undefined,
  CARD_REGISTRY,
);
export const engineCapabilityById = engineCapabilityViewForId.bind(
  undefined,
  CARD_REGISTRY,
);
export const engineCards = (): ReturnType<typeof engineCardViews> =>
  engineCardViews(CARD_REGISTRY);
import {
  hasCardSpecImplementation,
  projectEngineCardDefinition,
  projectCardSpecImplementation,
  projectTraceSuccessEffect,
} from "./card-spec-engine-projections";
export { projectTraceSuccessEffect };
export type { CardSpecCardImplementation } from "./card-spec-engine-projections";

const cardSpecEngineViews = engineCardViews(CARD_REGISTRY);
const cachedCardSpecSourceRefs = Object.freeze(
  CARD_SPEC_SOURCE_REFS.map((entry) => Object.freeze({ ...entry })),
);
const cachedCardSpecSourceRefsById = new Map<
  CardDefinitionId,
  (typeof cachedCardSpecSourceRefs)[number]
>(cachedCardSpecSourceRefs.map((entry) => [entry.cardDefinitionId, entry]));
const expectedCardSpecRuntimeDefinitionIds = Object.freeze(
  cachedCardSpecSourceRefs.flatMap(({ cardDefinitionId }) => {
    const spec = cardSpecForDefinitionId(CARD_REGISTRY, cardDefinitionId);
    if (spec === undefined)
      throw new Error(`card_spec_source_ref_missing_spec:${cardDefinitionId}`);
    const hasActiveSet = spec.printings.some(
      (printing) =>
        setSpecForId(CARD_REGISTRY, printing.setId)?.publication.status ===
        "active",
    );
    return spec.publication.status === "active" && hasActiveSet
      ? [spec.identity.cardDefinitionId]
      : [];
  }),
);
function hasRuntimeCardSpecImplementation(
  definitionId: CardDefinitionId,
): boolean {
  const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
  if (spec === undefined)
    throw new Error(`card_spec_runtime_missing_spec:${definitionId}`);
  if (hasCardSpecImplementation(spec.engine)) return true;
  // CS10 transfers Originalset ICE authority to the canonical printed
  // subroutine projection. Other active sets keep their existing staged
  // implementation partitions until their own sourcecut.
  return (
    spec.printings.some((printing) => printing.setId === "originalset-v1") &&
    (spec.engine.printedSubroutines?.length ?? 0) > 0
  );
}
const expectedCardSpecImplementationIds = Object.freeze(
  expectedCardSpecRuntimeDefinitionIds.filter(hasRuntimeCardSpecImplementation),
);
if (
  cardSpecEngineViews.length !== expectedCardSpecRuntimeDefinitionIds.length ||
  cardSpecEngineViews.some(
    (view) =>
      !expectedCardSpecRuntimeDefinitionIds.includes(view.cardDefinitionId),
  )
)
  throw new Error("card_spec_runtime_definition_partition_mismatch");

const cachedCardSpecDefinitions = Object.freeze(
  cardSpecEngineViews.map((engine) => {
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      engine.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error("card_spec_engine_projection_missing_spec");
    return projectEngineCardDefinition(engine, spec);
  }),
);
const cachedCardSpecDefinitionsById = new Map<
  CardDefinitionId,
  (typeof cachedCardSpecDefinitions)[number]
>(cachedCardSpecDefinitions.map((definition) => [definition.id, definition]));
const cachedCardSpecImplementations = Object.freeze(
  cardSpecEngineViews.flatMap((engine) => {
    if (!hasRuntimeCardSpecImplementation(engine.cardDefinitionId)) return [];
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      engine.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error("card_spec_engine_projection_missing_spec");
    return [projectCardSpecImplementation(engine, spec)];
  }),
);
const cachedCardSpecImplementationsById = new Map<
  CardDefinitionId,
  (typeof cachedCardSpecImplementations)[number]
>(
  cachedCardSpecImplementations.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);
if (
  cachedCardSpecImplementations.length !==
    expectedCardSpecImplementationIds.length ||
  cachedCardSpecImplementations.some(
    (implementation) =>
      !expectedCardSpecImplementationIds.includes(
        implementation.cardDefinitionId,
      ),
  )
)
  throw new Error("card_spec_implementation_partition_mismatch");

export const cardSpecDefinitionById = (definitionId: CardDefinitionId) =>
  cachedCardSpecDefinitionsById.get(definitionId);
export const cardSpecDefinitions = () => cachedCardSpecDefinitions;
export const cardSpecImplementationById = (definitionId: CardDefinitionId) =>
  cachedCardSpecImplementationsById.get(definitionId);
export const cardSpecImplementations = () => cachedCardSpecImplementations;
export const cardSpecSourceRefByDefinitionId = (
  definitionId: CardDefinitionId,
) => cachedCardSpecSourceRefsById.get(definitionId);
export const cardSpecSourceRefs = () => cachedCardSpecSourceRefs;
export function cardSpecSetIdsForDefinitionId(definitionId: CardDefinitionId) {
  const spec = cardSpecForDefinitionId(CARD_REGISTRY, definitionId);
  if (spec === undefined) return undefined;
  return Object.freeze([
    ...new Set(spec.printings.map((printing) => printing.setId)),
  ]);
}
export const cardSpecRuntimeDefinitionIds = () =>
  expectedCardSpecRuntimeDefinitionIds;
export const cardSpecImplementationDefinitionIds = () =>
  expectedCardSpecImplementationIds;

export function createEngineRegistryRulesContext(
  versions: EngineRegistryVersionContext,
): ReturnType<typeof createRulesContextForRegistry> {
  return createRulesContextForRegistry(CARD_REGISTRY, versions);
}
