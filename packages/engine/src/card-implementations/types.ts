import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardDamagePreventionSourceImplementation,
  CardInstallAdditionalCostImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
  RestrictedHostedCreditSourceImplementation,
  RunnerTraceCounterEffectImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  advanceable?: {
    while: "installed_before_and_after_rez";
  };
  printedSubroutines?: readonly CardPrintedSubroutineImplementation[];
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
  accessEffects?: readonly CardAccessEffectImplementation[];
  accessHooks?: readonly CardAccessHookImplementation[];
  lifecycle?: CardLifecycleImplementation;
  runnerCounterEffects?: readonly RunnerTraceCounterEffectImplementation[];
  restrictedHostedCreditSource?: RestrictedHostedCreditSourceImplementation;
  installAdditionalCosts?: readonly CardInstallAdditionalCostImplementation[];
  damagePreventionSources?: readonly CardDamagePreventionSourceImplementation[];
  tagPreventionSources?: readonly CardTagPreventionSourceImplementation[];
  trashPreventionSources?: readonly CardTrashPreventionSourceImplementation[];
  hardwareDeck?: true;
};
