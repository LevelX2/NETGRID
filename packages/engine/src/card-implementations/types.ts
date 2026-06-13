import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardCorpUtilityImplementation,
  CardCorpTrashInstalledRunnerSourceImplementation,
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
  CardRelativeIceImplementation,
  CardRunEncounterInterventionImplementation,
  CardRunnerEventLongtailImplementation,
  CardRunnerUtilityLongtailImplementation,
  CardScoredAgendaImplementation,
  CardSelfStealCostImplementation,
  CardSuccessfulRunFollowupImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
  CardUniqueDirectLongtailImplementation,
  CardVariableRezImplementation,
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
  selfStealCosts?: readonly CardSelfStealCostImplementation[];
  abilities?: CardAbilityImplementation[];
  accessEffects?: readonly CardAccessEffectImplementation[];
  accessHooks?: readonly CardAccessHookImplementation[];
  lifecycle?: CardLifecycleImplementation;
  runnerCounterEffects?: readonly RunnerTraceCounterEffectImplementation[];
  restrictedHostedCreditSource?: RestrictedHostedCreditSourceImplementation;
  installAdditionalCosts?: readonly CardInstallAdditionalCostImplementation[];
  installTargetBinding?: CardInstallTargetBindingImplementation;
  icebreakerEncounterStrengthBonus?: {
    kind: "against_selected_installed_ice";
    amount: number;
    visibility: "public";
  };
  icebreakerSubtypeChange?: {
    timing: "runner_main" | "during_run" | "runner_cost_penalty_support" | "access_start";
    cost: { clicks: 0 | 1; credits: number };
    choices: readonly ("code_gate" | "sentry" | "wall")[];
    limit?: "once_until_selected";
    visibility: "public";
  };
  runnerRunStrengthBoost?: {
    timing: "during_run";
    cost: { tap: true };
    target: "installed_runner_icebreaker";
    amount: number;
    duration: "current_run";
    visibility: "public";
  };
  runnerEventTargetedEffect?: {
    kind: "add_strength_counter_to_installed_icebreaker";
    counterType: "power";
    amount: number;
    visibility: "public";
  };
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
  variableRez?: CardVariableRezImplementation;
  relativeIce?: CardRelativeIceImplementation;
  virusCounter?: CardVirusCounterImplementation;
  scoredAgenda?: CardScoredAgendaImplementation;
  corpUtility?: CardCorpUtilityImplementation;
  corpTrashInstalledRunnerSource?: CardCorpTrashInstalledRunnerSourceImplementation;
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
