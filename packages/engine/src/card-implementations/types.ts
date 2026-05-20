import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardAccessHookImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
  RunnerTraceCounterEffectImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  printedSubroutines?: readonly CardPrintedSubroutineImplementation[];
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
  accessHooks?: readonly CardAccessHookImplementation[];
  lifecycle?: CardLifecycleImplementation;
  runnerCounterEffects?: readonly RunnerTraceCounterEffectImplementation[];
};
