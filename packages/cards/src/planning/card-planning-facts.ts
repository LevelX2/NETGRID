import type {
  CardDefinitionId,
  CardDefinitionNumericFields,
  CardType,
  PlayCostDefinition,
  ResolvedStrengthDefinition,
  Side,
  SubroutineDefinition,
} from "@netgrid/shared";
import type { CardSpec } from "../contracts";
import {
  deriveMechanicTokens,
  projectPrintedSubroutines,
} from "../engine/card-spec-engine-projections";
import type { PlanningCardView } from "../projections";
import { deepFreezeSerializable, type DeepReadonly } from "../serializable";

/** Static facts for a known card. Live legality and costs remain Engine quotes. */
export type CardPlanningFacts = DeepReadonly<{
  id: CardDefinitionId;
  title: string;
  side: Side;
  type: CardType;
  subtypes: readonly string[];
  numeric: CardDefinitionNumericFields;
  playCost: PlayCostDefinition | null;
  cost?: number;
  installCost?: number;
  memoryCost?: number;
  rezCost?: number;
  trashCost?: number;
  advancementRequirement?: number;
  agendaPoints?: number;
  strength?: number;
  strengthModel: ResolvedStrengthDefinition;
  baseLink?: number;
  memoryLimitBonus?: number;
  maxHandSizeBonus?: number;
  recurringCredits?: number;
  rulesText: string;
  subroutines?: readonly CardPlanningSubroutine[];
  mechanics: readonly string[];
}>;

export type CardPlanningSubroutine = DeepReadonly<
  Omit<SubroutineDefinition, "derivedAmount" | "provenance">
>;

export function projectCardPlanningFacts(
  planning: DeepReadonly<PlanningCardView>,
  title: string,
  text: DeepReadonly<CardSpec["text"]>,
): CardPlanningFacts {
  const { cardDefinitionId, side, cardType, engine } = planning;
  const properties = engine.characteristics;
  const { numeric, playCost, strength } = properties;
  const cost = playCost?.kind === "fixed" ? playCost.credits : null;
  const fixedStrength = strength.kind === "fixed" ? strength.value : null;
  const subroutines = projectPrintedSubroutines(engine).map(
    (
      {
        derivedAmount: _authoritativeAmount,
        provenance: _provenance,
        ...subroutine
      },
      index,
    ) => ({
      ...subroutine,
      id: index.toString(36),
    }),
  );

  return deepFreezeSerializable({
    id: cardDefinitionId,
    title,
    side,
    type: cardType,
    subtypes: properties.subtypes,
    numeric: {
      cost,
      installCost: numeric.installCost,
      memoryCost: numeric.memoryCost,
      strength: fixedStrength,
      rezCost: numeric.rezCost,
      trashCost: numeric.trashCost,
      advancementRequirement: numeric.advancementRequirement,
      agendaPoints: numeric.agendaPoints,
    },
    playCost,
    ...(cost === null ? {} : { cost }),
    ...(numeric.installCost === null
      ? {}
      : { installCost: numeric.installCost }),
    ...(numeric.memoryCost === null ? {} : { memoryCost: numeric.memoryCost }),
    ...(numeric.rezCost === null ? {} : { rezCost: numeric.rezCost }),
    ...(numeric.trashCost === null ? {} : { trashCost: numeric.trashCost }),
    ...(numeric.advancementRequirement === null
      ? {}
      : { advancementRequirement: numeric.advancementRequirement }),
    ...(numeric.agendaPoints === null
      ? {}
      : { agendaPoints: numeric.agendaPoints }),
    ...(fixedStrength === null ? {} : { strength: fixedStrength }),
    strengthModel: strength,
    ...(properties.baseLink === undefined
      ? {}
      : { baseLink: properties.baseLink }),
    ...(properties.memoryLimitBonus === undefined
      ? {}
      : { memoryLimitBonus: properties.memoryLimitBonus }),
    ...(properties.maxHandSizeBonus === undefined
      ? {}
      : { maxHandSizeBonus: properties.maxHandSizeBonus }),
    ...(properties.recurringCredits === undefined
      ? {}
      : { recurringCredits: properties.recurringCredits }),
    rulesText: text.rulesText,
    ...(subroutines.length > 0 ? { subroutines } : {}),
    mechanics: deriveMechanicTokens(cardType, engine),
  });
}
