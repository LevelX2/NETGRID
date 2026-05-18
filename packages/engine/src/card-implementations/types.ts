import type { CardDefinitionId } from "@netgrid/shared";
import type {
  CardAbilityImplementation,
  CardModifierImplementation,
} from "../ability-engine/definition-types";

export type CardImplementationDefinition = {
  cardDefinitionId: CardDefinitionId;
  modifiers?: CardModifierImplementation[];
  abilities?: CardAbilityImplementation[];
};
