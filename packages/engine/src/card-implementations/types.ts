import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardCorpUtilityImplementation,
  CardDamagePreventionSourceImplementation,
  CardFortRunWindowImplementation,
  CardFortCapacityModifierImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardInstallCapabilityImplementation,
  CardLeavePlayCleanupImplementation,
  CardIcebreakerAbilityImplementation,
  CardIceEncounterImplementation,
  CardInstallAdditionalCostImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  CardRegionBaselineImplementation,
  CardRunEncounterInterventionImplementation,
  CardScoredAgendaImplementation,
  CardSuccessfulRunFollowupImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
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
  hardwareDeck?: true;
  unique?: {
    kind: "unique_by_title";
    controller: "runner";
  };
};
