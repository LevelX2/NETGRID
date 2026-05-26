import proteusCardsData from "../../../../data/cards/proteus-cards.json";
import type { CardDefinition, CardDefinitionId } from "@netgrid/shared";

type ProteusCatalogCard = {
  cardId: string;
  title: string;
  side: CardDefinition["side"];
  type: CardDefinition["type"];
  subtypes?: string[];
  numeric?: {
    cost?: number | null;
    installCost?: number | null;
    memoryCost?: number | null;
    strength?: number | null;
    rezCost?: number | null;
    trashCost?: number | null;
    advancementRequirement?: number | null;
    agendaPoints?: number | null;
  };
  text?: string;
};

function numberField<K extends keyof CardDefinition>(
  key: K,
  value: number | null | undefined,
): Partial<Pick<CardDefinition, K>> {
  return typeof value === "number"
    ? ({ [key]: value } as Partial<Pick<CardDefinition, K>>)
    : {};
}

function toCardDefinition(card: ProteusCatalogCard): CardDefinition {
  const numeric = card.numeric ?? {};
  return {
    id: card.cardId as CardDefinitionId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: card.subtypes ?? [],
    implementationStatus: "playable_mvp",
    ...numberField("cost", numeric.cost),
    ...numberField("installCost", numeric.installCost),
    ...numberField("memoryCost", numeric.memoryCost),
    ...numberField("strength", numeric.strength),
    ...numberField("rezCost", numeric.rezCost),
    ...numberField("trashCost", numeric.trashCost),
    ...numberField("advancementRequirement", numeric.advancementRequirement),
    ...numberField("agendaPoints", numeric.agendaPoints),
    rulesText: card.text ?? "",
    mechanics: ["proteus_test_catalog"],
  };
}

export const PROTEUS_TEST_CARD_DEFINITIONS_BY_ID: Record<
  CardDefinitionId,
  CardDefinition
> = Object.fromEntries(
  (proteusCardsData.cards as ProteusCatalogCard[]).map((card) => {
    const definition = toCardDefinition(card);
    return [definition.id, definition] as const;
  }),
);

export function proteusTestCardDefinition(
  cardId: CardDefinitionId,
): CardDefinition {
  const definition = PROTEUS_TEST_CARD_DEFINITIONS_BY_ID[cardId];
  if (!definition) throw new Error(`Unknown Proteus test card: ${cardId}`);
  return definition;
}
