import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

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

export type AiFacadeFoundationContextDependencies = {
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  buildServerFeatures: (input: AiDecisionInput) => Map<string, ServerFeatures>;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string;
};

export function createAiFacadeFoundationContext(
  dependencies: AiFacadeFoundationContextDependencies,
) {
  const AI_HINTS = createAiHintsByCard();
  const hintForDefinitionId = (definitionId: string) =>
    AI_HINTS.get(definitionId);

  const { rolesForAction, rolesForCardId } = createRoleContext({
    findVisibleCard: dependencies.findVisibleCard,
    aiHints: AI_HINTS,
  });
  const { extractAiFeatures } = createAiFeatureExtractorContext({
    rolesForCardId,
    buildServerFeatures: dependencies.buildServerFeatures,
  });

  const {
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    definitionForSimulationAction,
  } = createSimulationActionDiagnosticsContext({
    findVisibleCard: dependencies.findVisibleCard,
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
    hintForDefinitionId,
    rolesForAction,
    rolesForCardId,
    extractAiFeatures,
    sourceDefinitionIdForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction,
    definitionForSimulationAction,
    strongestCorpTagSourceOpportunity,
    corpTagPunishOntologyAssessmentForAction,
    applyCorpVisibleTagPunishUnknownSkipDiagnostics,
    corpVisibleTagPunishOpportunities,
    applyCorpTagSourceWindowDiagnostics,
    applyActualTagCreationDiagnostics,
  };
}
