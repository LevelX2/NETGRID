import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessEffectImplementation,
  CardAccessHookImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
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
};
