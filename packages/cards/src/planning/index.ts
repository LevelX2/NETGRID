import type { CardDefinitionId } from "@netgrid/shared";
import {
  assertCardRegistryPlanningContext,
  assertCardRegistryRulesContext,
  type CardRegistryRulesContext,
  type CardRegistryPlanningContext,
  type PlanningRegistryVersionContext,
} from "../fingerprints";
import {
  cardSpecForDefinitionId,
  createPlanningContextForRegistry,
  planningCardViewForDefinitionId,
  planningCardViews,
} from "../registry";
import { CARD_REGISTRY } from "../registry-runtime";
import type { PlanningCardView } from "../projections";
import type { DeepReadonly } from "../serializable";
import {
  projectCardPlanningFacts,
  type CardPlanningFacts,
} from "./card-planning-facts";

export type { CardPlanningFacts };
export type { CardPlanningSubroutine } from "./card-planning-facts";

export type {
  CardRegistryPlanningContext,
  CardRegistryRulesContext,
  PlanningRegistryVersionContext,
};
export { assertCardRegistryPlanningContext, assertCardRegistryRulesContext };
export { canonicalSerialize } from "../serializable";
export type { PlanningCardView } from "../projections";
export type {
  CardPlanningAnnotations,
  PlanningPlanOwner,
  PlanningPlanOwnerRoute,
  PlanningInterpretation,
} from "../planning-annotations";
export {
  KNOWN_PLANNING_PLAN_OWNERS,
  KNOWN_PLANNING_PLAN_OWNER_ROUTES,
  KNOWN_PLANNING_TACTIC_SIGNALS,
  KNOWN_PLANNING_TACTIC_USES,
} from "../planning-annotations";
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
  CapabilityIdentityError,
  canonicalCapabilityId,
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

export type PlanningCardWithFacts = Readonly<{
  facts: CardPlanningFacts;
  planning: DeepReadonly<PlanningCardView>;
}>;

const planningCardsWithFacts = Object.freeze(
  planningCards().map((planning): PlanningCardWithFacts => {
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      planning.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error(
        `card_spec_planning_missing_spec:${planning.cardDefinitionId}`,
      );
    return Object.freeze({
      facts: projectCardPlanningFacts(planning, spec.identity.title, spec.text),
      planning,
    });
  }),
);
const planningCardsWithFactsById = new Map(
  planningCardsWithFacts.map((card) => [card.facts.id, card]),
);

export const planningCardWithFactsByDefinitionId = (id: CardDefinitionId) =>
  planningCardsWithFactsById.get(id);
export const planningCardFactsByDefinitionId = (id: CardDefinitionId) =>
  planningCardsWithFactsById.get(id)?.facts;
export const listPlanningCardsWithFacts = () => planningCardsWithFacts;

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
