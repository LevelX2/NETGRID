import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardDamagePreventionSourceImplementation,
  CardFlatlineReplacementSourceImplementation,
  CardIcebreakerAbilityImplementation,
  CardInstallAdditionalCostImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
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
  hardwareDeck?: true;
  unique?: {
    kind: "unique_by_title";
    controller: "runner";
  };
};
