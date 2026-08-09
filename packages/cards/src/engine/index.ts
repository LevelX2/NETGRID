export type * from "./definition-types";
export type * from "./card-mechanical-contracts";
export {
  CapabilityIdentityError,
  assertCanonicalCapabilityId,
  assertAbilityRefIdentity,
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
  createRulesContextForRegistry,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import type { EngineRegistryVersionContext } from "../fingerprints";
export type {
  CardRegistryRulesContext,
  EngineRegistryVersionContext,
} from "../fingerprints";
export type { EngineCapabilityView, EngineCardView } from "../projections";
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
export function createEngineRegistryRulesContext(
  versions: EngineRegistryVersionContext,
): ReturnType<typeof createRulesContextForRegistry> {
  return createRulesContextForRegistry(CARD_REGISTRY, versions);
}
