import {
  assertCardRegistryPlanningContext,
  assertCardRegistryRulesContext,
  type CardRegistryRulesContext,
  type CardRegistryPlanningContext,
  type PlanningRegistryVersionContext,
} from "../fingerprints";
import {
  createPlanningContextForRegistry,
  planningCardViewForDefinitionId,
  planningCardViews,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";

export type {
  CardRegistryPlanningContext,
  CardRegistryRulesContext,
  PlanningRegistryVersionContext,
};
export { assertCardRegistryPlanningContext, assertCardRegistryRulesContext };
export type { PlanningCardView } from "../projections";
export type { CardPlanningAnnotations } from "../planning-annotations";
export type {
  ProspectiveCapability,
  ProspectiveCapabilityDescriptor,
  ProspectiveCapabilityFamily,
  ProspectiveCapabilityView,
  ProspectiveDirectOutcome,
  ProspectiveInitialConditionEvaluation,
  ProspectiveInitializedValue,
  ProspectiveInstallChoice,
  ProspectiveLiability,
  ProspectiveTransition,
  ProspectiveUncertaintyClass,
} from "../prospective-capabilities";
export {
  assertCanonicalCapabilityId,
  assertAbilityRefIdentity,
  parseCanonicalCapabilityId,
} from "../capability-identity";
export type { CanonicalCapabilityId } from "../capability-identity";

export const planningCardByDefinitionId = planningCardViewForDefinitionId.bind(
  undefined,
  CARD_REGISTRY,
);
export const planningCards = (): ReturnType<typeof planningCardViews> =>
  planningCardViews(CARD_REGISTRY);

export function createPlanningRegistryContext(
  rulesContext: import("../fingerprints").CardRegistryRulesContext,
  versions: PlanningRegistryVersionContext,
): CardRegistryPlanningContext {
  return createPlanningContextForRegistry(
    CARD_REGISTRY,
    rulesContext,
    versions,
  );
}
