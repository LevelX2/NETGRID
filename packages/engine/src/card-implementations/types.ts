import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardLifecycleImplementation,
  CardModifierImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
  lifecycle?: CardLifecycleImplementation;
};
