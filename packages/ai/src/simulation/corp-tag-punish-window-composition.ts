import {
  createCorpTagPunishPayoffProfileContext,
  type CorpTagPunishPayoffProfileDependencies,
} from "../runtime/corp-tag-punish-payoff-profiles";
import {
  createCorpTagSourcePayoffContext,
  type CorpTagSourcePayoffContextDependencies,
} from "../runtime/corp-tag-source-payoff-context";
import {
  createCorpTaggedRunnerPayoffComposition,
  type CorpTaggedRunnerPayoffCompositionDependencies,
} from "../runtime/corp-tagged-runner-payoff-composition";
import {
  createTagPunishWindowDiagnosticsContext,
  type TagPunishWindowDiagnosticsContextDependencies,
} from "./tag-punish-window-diagnostics-context";

export type CorpTagPunishWindowCompositionDependencies =
  CorpTagPunishPayoffProfileDependencies &
    CorpTagSourcePayoffContextDependencies &
    Omit<
      CorpTaggedRunnerPayoffCompositionDependencies,
      | "immediateTagSourceAvailable"
      | "unprotectedPersistentTagAssetSetup"
      | "immediateTagSourceVisiblePayoffProfile"
      | "installedEconomyActionProfile"
      | "tagPunishPayoffFundingProfile"
    > &
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

  const {
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpTaggedRunnerPayoffPressure,
  } = createCorpTaggedRunnerPayoffComposition({
    runnerRigTrashTarget: dependencies.runnerRigTrashTarget,
    visibleCardStoredCredits: dependencies.visibleCardStoredCredits,
    runnerResourceTrashEvidence:
      dependencies.runnerResourceTrashEvidence,
    tagPunishAssessmentForAction:
      dependencies.tagPunishAssessmentForAction,
    sourceDefinitionIdForAction: dependencies.sourceDefinitionIdForAction,
    actionCreditCost: dependencies.actionCreditCost,
    runnerDamagePreventionEvidence:
      dependencies.runnerDamagePreventionEvidence,
    runnerHardwareTrashTarget:
      dependencies.runnerHardwareTrashTarget,
    runnerHardwarePayoffEvidence:
      dependencies.runnerHardwarePayoffEvidence,
    immediateTagSourceAvailable: corpImmediateTagSourceAvailable,
    unprotectedPersistentTagAssetSetup:
      corpUnprotectedPersistentTagAssetSetup,
    advanceCompletesScore: dependencies.advanceCompletesScore,
    actionIsScoreLine: dependencies.actionIsScoreLine,
    visibleMeatDamagePayoff: dependencies.visibleMeatDamagePayoff,
    immediateTagSourceVisiblePayoffProfile:
      corpImmediateTagSourceVisiblePayoffProfile,
    installedEconomyActionProfile: corpInstalledEconomyActionProfile,
    tagPunishPayoffFundingProfile: corpTagPunishPayoffFundingProfile,
  });

  return {
    corpOntologyPayoffAvailableForTagSource,
    tagPunishWindowDiagnosticsForSimulationAction,
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpTaggedRunnerPayoffPressure,
  };
}
