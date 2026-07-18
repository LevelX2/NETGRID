/**
 * Defines top-level CardImplementation ability and modifier unions.
 *
 * This module is declarative only: it must not execute effects, query
 * GameState, or contain concrete card IDs.
 */
import type {
  ActivatedCardAbilityImplementation,
  OnPlayCardAbilityImplementation,
} from "./definition-ability-contracts";
import type {
  CardAccessCountModifierImplementation,
  CardAdditionalSubroutineModifierImplementation,
  CardAgendaDifficultyModifierImplementation,
  CardBreakSubroutineCostModifierImplementation,
  CardHandSizeModifierImplementation,
  CardIceStrengthModifierImplementation,
  CardInstallCostModifierImplementation,
  CardMemoryUnitsModifierImplementation,
  CardNewDataFortCreationLockModifierImplementation,
  CardRezCostModifierImplementation,
  CardStealCostModifierImplementation,
  CardTrashCostModifierImplementation,
} from "./definition-modifier-contracts";

export type CardModifierImplementation =
  | CardRezCostModifierImplementation
  | CardInstallCostModifierImplementation
  | CardNewDataFortCreationLockModifierImplementation
  | CardStealCostModifierImplementation
  | CardIceStrengthModifierImplementation
  | CardAdditionalSubroutineModifierImplementation
  | CardHandSizeModifierImplementation
  | CardMemoryUnitsModifierImplementation
  | CardAgendaDifficultyModifierImplementation
  | CardTrashCostModifierImplementation
  | CardBreakSubroutineCostModifierImplementation
  | CardAccessCountModifierImplementation;

export type CardAbilityImplementation =
  | OnPlayCardAbilityImplementation
  | ActivatedCardAbilityImplementation;
