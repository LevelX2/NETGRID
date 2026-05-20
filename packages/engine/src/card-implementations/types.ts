import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
  CardPrintedSubroutineImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  printedSubroutines?: readonly CardPrintedSubroutineImplementation[];
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
  lifecycle?: CardLifecycleImplementation;
};
