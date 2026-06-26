import {
  createCorpTagPunishPayoffProfileContext,
  type CorpTagPunishPayoffProfileDependencies,
} from "../runtime/corp-tag-punish-payoff-profiles";
import {
  createCorpTagSourcePayoffContext,
  type CorpTagSourcePayoffContextDependencies,
} from "../runtime/corp-tag-source-payoff-context";
import {
  createTagPunishWindowDiagnosticsContext,
  type TagPunishWindowDiagnosticsContextDependencies,
} from "./tag-punish-window-diagnostics-context";

export type CorpTagPunishWindowCompositionDependencies =
  CorpTagPunishPayoffProfileDependencies &
    CorpTagSourcePayoffContextDependencies &
    Omit<
      TagPunishWindowDiagnosticsContextDependencies,
      "corpOntologyPayoffAvailableForTagSource"
    >;

export function createCorpTagPunishWindowComposition(
  dependencies: CorpTagPunishWindowCompositionDependencies,
) {
  const {
    corpInstalledEconomyActionProfile,
    corpTagPunishPayoffFundingProfile,
  } = createCorpTagPunishPayoffProfileContext({
    installedEconomyCreditAmount:
      dependencies.installedEconomyCreditAmount,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    actionSourceCard: dependencies.actionSourceCard,
    visibleCardStoredCredits: dependencies.visibleCardStoredCredits,
    visibleMeatDamagePayoff: dependencies.visibleMeatDamagePayoff,
  });

  const {
    corpImmediateTagSourceVisiblePayoffProfile,
    corpImmediateTagSourceAvailable,
    corpUnprotectedPersistentTagAssetSetup,
    corpOntologyPayoffAvailableForTagSource,
  } = createCorpTagSourcePayoffContext({
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    visibleMeatDamagePayoff: dependencies.visibleMeatDamagePayoff,
    tagPunishAssessmentForAction:
      dependencies.tagPunishAssessmentForAction,
    payoffProfileForDefinition:
      dependencies.payoffProfileForDefinition,
  });

  const { tagPunishWindowDiagnosticsForSimulationAction } =
    createTagPunishWindowDiagnosticsContext({
      corpVisibleTagPunishOpportunities:
        dependencies.corpVisibleTagPunishOpportunities,
      runnerSurvivalCounterContextForInput:
        dependencies.runnerSurvivalCounterContextForInput,
      corpTagPunishOntologyAssessmentForAction:
        dependencies.corpTagPunishOntologyAssessmentForAction,
      applyTagPunishOntologyDiagnostics:
        dependencies.applyTagPunishOntologyDiagnostics,
      applyCorpVisibleTagPunishTakenWindowDiagnostics:
        dependencies.applyCorpVisibleTagPunishTakenWindowDiagnostics,
      applyCorpVisibleTagPunishUnknownSkipDiagnostics:
        dependencies.applyCorpVisibleTagPunishUnknownSkipDiagnostics,
      strongestCorpTagSourceOpportunity:
        dependencies.strongestCorpTagSourceOpportunity,
      corpOntologyPayoffAvailableForTagSource,
      applyCorpTagSourceWindowDiagnostics:
        dependencies.applyCorpTagSourceWindowDiagnostics,
      applyActualTagCreationDiagnostics:
        dependencies.applyActualTagCreationDiagnostics,
    });

  return {
    corpInstalledEconomyActionProfile,
    corpTagPunishPayoffFundingProfile,
    corpImmediateTagSourceVisiblePayoffProfile,
    corpImmediateTagSourceAvailable,
    corpUnprotectedPersistentTagAssetSetup,
    corpOntologyPayoffAvailableForTagSource,
    tagPunishWindowDiagnosticsForSimulationAction,
  };
}
