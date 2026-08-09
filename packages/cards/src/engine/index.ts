export type * from "./definition-types";
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
} from "../registry";
import {
  CARD_REGISTRY,
  CARD_SPEC_SOURCE_REFS,
} from "../registry-runtime";
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
  projectCs06CardDefinition,
  projectCs06CardImplementation,
} from "./cs06-compatibility-projections";
export type { Cs06CardImplementation } from "./cs06-compatibility-projections";
import { CS06_CARD_DEFINITION_IDS } from "../cs06-slice";
export { CS06_CARD_DEFINITION_IDS } from "../cs06-slice";

const cs06EngineViews = engineCardViews(CARD_REGISTRY);
const expectedCs06Ids = new Set<string>(CS06_CARD_DEFINITION_IDS);
const cachedCs06SourceRefs = Object.freeze(
  CARD_SPEC_SOURCE_REFS.map((entry) => Object.freeze({ ...entry })),
);
if (
  cachedCs06SourceRefs.length !== expectedCs06Ids.size ||
  cachedCs06SourceRefs.some(
    (entry) => !expectedCs06Ids.has(entry.cardDefinitionId),
  )
)
  throw new Error("cs06_source_ref_slice_mismatch");
const cachedCs06SourceRefsById = new Map<
  string,
  (typeof cachedCs06SourceRefs)[number]
>(cachedCs06SourceRefs.map((entry) => [entry.cardDefinitionId, entry]));
if (
  cs06EngineViews.length !== expectedCs06Ids.size ||
  cs06EngineViews.some((view) => !expectedCs06Ids.has(view.cardDefinitionId))
)
  throw new Error("cs06_registry_slice_mismatch");

const cachedCs06Definitions = Object.freeze(
  cs06EngineViews.map((engine) => {
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      engine.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error("cs06_projection_missing_card_spec");
    return projectCs06CardDefinition(engine, spec);
  }),
);
const cachedCs06DefinitionsById = new Map<
  string,
  (typeof cachedCs06Definitions)[number]
>(cachedCs06Definitions.map((definition) => [definition.id, definition]));
const cachedCs06Implementations = Object.freeze(
  cs06EngineViews.map((engine) => {
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      engine.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error("cs06_projection_missing_card_spec");
    return projectCs06CardImplementation(engine, spec);
  }),
);
const cachedCs06ImplementationsById = new Map<
  string,
  (typeof cachedCs06Implementations)[number]
>(
  cachedCs06Implementations.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

export const cs06CardDefinitionById = (definitionId: string) =>
  cachedCs06DefinitionsById.get(definitionId);
export const cs06CardDefinitions = () => cachedCs06Definitions;
export const cs06CardImplementationById = (definitionId: string) =>
  cachedCs06ImplementationsById.get(definitionId);
export const cs06CardImplementations = () => cachedCs06Implementations;
export const cs06CardSpecSourceRefByDefinitionId = (definitionId: string) =>
  cachedCs06SourceRefsById.get(definitionId);
export const cs06CardSpecSourceRefs = () => cachedCs06SourceRefs;
export function createEngineRegistryRulesContext(
  versions: EngineRegistryVersionContext,
): ReturnType<typeof createRulesContextForRegistry> {
  return createRulesContextForRegistry(CARD_REGISTRY, versions);
}
