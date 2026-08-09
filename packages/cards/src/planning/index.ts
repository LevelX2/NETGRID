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
import { CS06_CARD_DEFINITION_IDS } from "../cs06-slice";
import { projectCs06CardDefinition } from "../engine/cs06-compatibility-projections";
import { deepFreezeSerializable } from "../serializable";
import type { ResolvedCardDefinition } from "@netgrid/shared";
import type { DeepReadonly } from "../serializable";
import type { PlanningCardView } from "../projections";

export type {
  CardRegistryPlanningContext,
  CardRegistryRulesContext,
  PlanningRegistryVersionContext,
};
export { assertCardRegistryPlanningContext, assertCardRegistryRulesContext };
export type { PlanningCardView } from "../projections";
export type {
  CardPlanningAnnotations,
  PlanningInterpretation,
} from "../planning-annotations";
export {
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

export type Cs06PlanningCompatibilityCard = DeepReadonly<{
  definition: ResolvedCardDefinition;
  planning: PlanningCardView;
}>;

const expectedCs06Ids = new Set<string>(CS06_CARD_DEFINITION_IDS);
const cachedCs06PlanningCards = deepFreezeSerializable(
  planningCardViews(CARD_REGISTRY).map((planning) => {
    if (!expectedCs06Ids.has(planning.cardDefinitionId))
      throw new Error(
        `cs06_planning_unexpected_definition: ${planning.cardDefinitionId}`,
      );
    const spec = cardSpecForDefinitionId(
      CARD_REGISTRY,
      planning.cardDefinitionId,
    );
    if (spec === undefined)
      throw new Error(
        `cs06_planning_missing_card_spec: ${planning.cardDefinitionId}`,
      );
    return {
      definition: projectCs06CardDefinition(
        {
          schemaVersion: "engine-card-view-v1",
          cardDefinitionId: planning.cardDefinitionId,
          side: planning.side,
          cardType: planning.cardType,
          engine: planning.engine,
          cardRulesFingerprint: planning.cardRulesFingerprint,
        },
        spec,
      ),
      planning,
    };
  }),
);
if (cachedCs06PlanningCards.length !== expectedCs06Ids.size)
  throw new Error("cs06_planning_slice_mismatch");
const cachedCs06PlanningCardsById = new Map(
  cachedCs06PlanningCards.map((entry) => [entry.definition.id, entry]),
);

/** Bound, serializable planning read model; no CardSpec or registry handle. */
export const cs06PlanningCardByDefinitionId = (definitionId: string) =>
  cachedCs06PlanningCardsById.get(definitionId);
export const cs06PlanningCards = () => cachedCs06PlanningCards;
export { CS06_CARD_DEFINITION_IDS } from "../cs06-slice";

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
