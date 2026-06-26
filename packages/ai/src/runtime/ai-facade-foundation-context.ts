import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import { createCorpTagCreationDiagnosticsContext } from "../simulation/corp-tag-creation-diagnostics";
import { createCorpTagPunishActionContext } from "../simulation/corp-tag-punish-action-context";
import { createCorpVisibleTagPayoffCategoryContext } from "../simulation/corp-visible-tag-payoff-category";
import { createCorpVisibleTagPunishOpportunityContext } from "../simulation/corp-visible-tag-punish-opportunities";
import { createCorpVisibleTagPunishUnknownSkipDiagnosticsContext } from "../simulation/corp-visible-tag-punish-unknown-skip-diagnostics";
import { createSimulationActionDiagnosticsContext } from "../simulation/simulation-action-diagnostics-context";
import type { ServerFeatures } from "./ai-feature-server";
import { createAiFeatureExtractorContext } from "./ai-feature-extractor-context";
import { createRoleContext } from "./role-context";

type KnownPathAssessment = {
  canReachAccess: boolean;
};

export type AiFacadeFoundationContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  buildObservedFacts: (input: AiDecisionInput) => {
    eventCounts: Record<string, number>;
  };
  buildServerFeatures: (
    input: AiDecisionInput,
  ) => Map<string, ServerFeatures>;
  assessKnownRezzedIcePath: (
    ice: VisibleCard[],
    rig: VisibleCard[],
    credits: number,
    root: VisibleCard[],
  ) => KnownPathAssessment;
  isBlockedByKnownRezzedIce: (
    ice: VisibleCard | undefined,
    rigDefinitionIds: Set<string>,
  ) => boolean;
  visibleCitySurveillanceSourceCount: (input: AiDecisionInput) => number;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
};

export function createAiFacadeFoundationContext(
  dependencies: AiFacadeFoundationContextDependencies,
) {
  const AI_HINTS = createAiHintsByCard();

  const { rolesForAction, rolesForCardId } = createRoleContext({
    findVisibleCard: dependencies.findVisibleCard,
    aiHints: AI_HINTS,
  });
  const { extractAiFeatures } = createAiFeatureExtractorContext({
    rolesForCardId,
    buildObservedFacts: dependencies.buildObservedFacts,
    buildServerFeatures: dependencies.buildServerFeatures,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    isBlockedByKnownRezzedIce: dependencies.isBlockedByKnownRezzedIce,
    visibleCitySurveillanceSourceCount:
      dependencies.visibleCitySurveillanceSourceCount,
  });

  const {
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    corpScoreTerminalDiagnosticsForSimulationAction,
    corpEconomyBeforeScoreDiagnosticsForSimulationAction,
    definitionForSimulationAction,
    centralRunEventGoodForTarget,
  } = createSimulationActionDiagnosticsContext({
    findVisibleCard: dependencies.findVisibleCard,
    rolesForAction,
  });
  const {
    strongestCorpTagSourceOpportunity,
    corpPunishKindForAction,
    isCorpTagSourceAction,
    isCorpTraceTagSourceAction,
    corpTagPunishOntologyAssessmentForAction,
  } = createCorpTagPunishActionContext({
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    rolesForAction,
  });
  const { corpVisibleTagPayoffCategoryForAction } =
    createCorpVisibleTagPayoffCategoryContext({
      tagPunishAssessmentForAction: corpTagPunishOntologyAssessmentForAction,
      rolesForAction,
    });
  const { applyCorpVisibleTagPunishUnknownSkipDiagnostics } =
    createCorpVisibleTagPunishUnknownSkipDiagnosticsContext({
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
      isCorpTraceTagSourceAction,
    });
  const { corpVisibleTagPunishOpportunities } =
    createCorpVisibleTagPunishOpportunityContext({
      corpPunishKindForAction,
      corpVisibleTagPayoffCategoryForAction,
      sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    });
  const {
    applyCorpTagSourceWindowDiagnostics,
    applyActualTagCreationDiagnostics,
  } = createCorpTagCreationDiagnosticsContext({
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
  });

  return {
    AI_HINTS,
    rolesForAction,
    rolesForCardId,
    extractAiFeatures,
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    corpScoreTerminalDiagnosticsForSimulationAction,
    corpEconomyBeforeScoreDiagnosticsForSimulationAction,
    definitionForSimulationAction,
    centralRunEventGoodForTarget,
    strongestCorpTagSourceOpportunity,
    corpPunishKindForAction,
    isCorpTagSourceAction,
    isCorpTraceTagSourceAction,
    corpTagPunishOntologyAssessmentForAction,
    corpVisibleTagPayoffCategoryForAction,
    applyCorpVisibleTagPunishUnknownSkipDiagnostics,
    corpVisibleTagPunishOpportunities,
    applyCorpTagSourceWindowDiagnostics,
    applyActualTagCreationDiagnostics,
  };
}
