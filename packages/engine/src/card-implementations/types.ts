import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardCorpUtilityImplementation,
  CardDamagePreventionSourceImplementation,
  CardFortRunWindowImplementation,
  CardFortCapacityModifierImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardInstallCapabilityImplementation,
  CardLeavePlayCleanupImplementation,
  CardIcebreakerAbilityImplementation,
  CardIceEncounterImplementation,
  CardInstallAdditionalCostImplementation,
  CardInstallTargetBindingImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  CardRegionBaselineImplementation,
  CardRemainingReplacementLongtailImplementation,
  CardRunEncounterInterventionImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardSuccessfulRunFollowupImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVirusCounterImplementation,
  HostedProgramCapacityImplementation,
  HostedProgramModifierImplementation,
  RestrictedHostedCreditSourceImplementation,
  RunnerTraceCounterEffectImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  advanceable?: {
    while: "installed_before_and_after_rez";
  };
  printedSubroutines?: readonly CardPrintedSubroutineImplementation[];
  iceEncounter?: CardIceEncounterImplementation;
  icebreakerAbilities?: readonly CardIcebreakerAbilityImplementation[];
  hostedProgramCapacity?: HostedProgramCapacityImplementation;
  hostedProgramModifiers?: readonly HostedProgramModifierImplementation[];
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
  accessEffects?: readonly CardAccessEffectImplementation[];
  accessHooks?: readonly CardAccessHookImplementation[];
  lifecycle?: CardLifecycleImplementation;
  runnerCounterEffects?: readonly RunnerTraceCounterEffectImplementation[];
  restrictedHostedCreditSource?: RestrictedHostedCreditSourceImplementation;
  installAdditionalCosts?: readonly CardInstallAdditionalCostImplementation[];
  installTargetBinding?: CardInstallTargetBindingImplementation;
  damagePreventionSources?: readonly CardDamagePreventionSourceImplementation[];
  flatlineReplacementSources?: readonly CardFlatlineReplacementSourceImplementation[];
  tagPreventionSources?: readonly CardTagPreventionSourceImplementation[];
  trashPreventionSources?: readonly CardTrashPreventionSourceImplementation[];
  successfulRunFollowups?: readonly CardSuccessfulRunFollowupImplementation[];
  fortRunWindows?: readonly CardFortRunWindowImplementation[];
  runEncounterInterventions?: readonly CardRunEncounterInterventionImplementation[];
  regionBaseline?: CardRegionBaselineImplementation;
  installCapabilities?: readonly CardInstallCapabilityImplementation[];
  fortCapacityModifiers?: readonly CardFortCapacityModifierImplementation[];
  leavePlayCleanup?: readonly CardLeavePlayCleanupImplementation[];
  virusCounter?: CardVirusCounterImplementation;
  scoredAgenda?: CardScoredAgendaImplementation;
  corpUtility?: CardCorpUtilityImplementation;
  hiddenReplacementLongtail?: CardHiddenReplacementLongtailImplementation;
  runnerUtilityLongtail?: CardRunnerUtilityLongtailImplementation;
  runnerEventLongtail?: CardRunnerEventLongtailImplementation;
  uniqueDirectLongtail?: CardUniqueDirectLongtailImplementation;
  remainingReplacementLongtail?: CardRemainingReplacementLongtailImplementation;
  hardwareDeck?: true;
  unique?: {
    kind: "unique_by_title";
    controller: "runner" | "corp";
  };
};
