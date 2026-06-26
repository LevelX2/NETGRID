import {
  createCorpTaggedPayoffWindowContext,
  type CorpTaggedPayoffWindowDependencies,
} from "./corp-tagged-payoff-window";
import {
  createCorpTaggedRunnerPayoffPressureContext,
  type CorpTaggedRunnerPayoffPressureDependencies,
} from "./corp-tagged-runner-payoff-pressure";
import {
  createCorpTaggedRunnerPayoffProfileContext,
  type CorpTaggedRunnerPayoffProfileDependencies,
} from "./corp-tagged-runner-payoff-profile";

export type CorpTaggedRunnerPayoffCompositionDependencies =
  CorpTaggedRunnerPayoffProfileDependencies &
    Omit<CorpTaggedPayoffWindowDependencies, "taggedRunnerPayoffProfile"> &
    Omit<
      CorpTaggedRunnerPayoffPressureDependencies,
      "taggedRunnerPayoffProfile"
    >;

export function createCorpTaggedRunnerPayoffComposition(
  dependencies: CorpTaggedRunnerPayoffCompositionDependencies,
) {
  const { corpTaggedRunnerPayoffProfile } =
    createCorpTaggedRunnerPayoffProfileContext({
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
    });

  const { corpTaggedPayoffWindowPassiveActionPenalty } =
    createCorpTaggedPayoffWindowContext({
      immediateTagSourceAvailable:
        dependencies.immediateTagSourceAvailable,
      unprotectedPersistentTagAssetSetup:
        dependencies.unprotectedPersistentTagAssetSetup,
      taggedRunnerPayoffProfile: corpTaggedRunnerPayoffProfile,
      advanceCompletesScore: dependencies.advanceCompletesScore,
      actionIsScoreLine: dependencies.actionIsScoreLine,
      visibleMeatDamagePayoff: dependencies.visibleMeatDamagePayoff,
    });

  const { corpTaggedRunnerPayoffPressure } =
    createCorpTaggedRunnerPayoffPressureContext({
      immediateTagSourceVisiblePayoffProfile:
        dependencies.immediateTagSourceVisiblePayoffProfile,
      installedEconomyActionProfile:
        dependencies.installedEconomyActionProfile,
      tagPunishPayoffFundingProfile:
        dependencies.tagPunishPayoffFundingProfile,
      taggedRunnerPayoffProfile: corpTaggedRunnerPayoffProfile,
    });

  return {
    corpTaggedRunnerPayoffProfile,
    corpTaggedPayoffWindowPassiveActionPenalty,
    corpTaggedRunnerPayoffPressure,
  };
}
