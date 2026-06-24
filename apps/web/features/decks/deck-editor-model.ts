export type DeckEditorSide = "runner" | "corp";

export type DeckEditorCardEntry = {
  cardId: string;
  quantity: number;
};

export type DeckEditorDeckForAgenda = {
  side: DeckEditorSide;
  formatProfileId: string;
  cards: DeckEditorCardEntry[];
};

export type DeckEditorCardDetailForAgenda = {
  type: string;
  numeric: Record<string, number | null>;
};

export type DeckAgendaRule = {
  minimumDeckCards: number;
  minimumAgendaPoints: number;
  additionalAgendaPointEveryCards: number;
};

export type DeckAgendaStatus = {
  agendaPoints: number | null;
  minimumAgendaPoints: number;
  missingAgendaPoints: number | null;
  totalCards: number;
  effectiveCardsForMinimum: number;
  detailsComplete: boolean;
};

const DEFAULT_DECK_AGENDA_RULE: DeckAgendaRule = {
  minimumDeckCards: 18,
  minimumAgendaPoints: 7,
  additionalAgendaPointEveryCards: 5
};

export const DECK_AGENDA_RULES_BY_PROFILE: Record<string, DeckAgendaRule> = {
  "local-demo-v0.6": {
    minimumDeckCards: 18,
    minimumAgendaPoints: 6,
    additionalAgendaPointEveryCards: 5
  },
  "local-demo-v0.8": {
    minimumDeckCards: 18,
    minimumAgendaPoints: 6,
    additionalAgendaPointEveryCards: 5
  },
  netgrid_private_local_v1: {
    minimumDeckCards: 18,
    minimumAgendaPoints: 7,
    additionalAgendaPointEveryCards: 5
  }
};

export function deckAgendaStatusForEditor(
  deck: DeckEditorDeckForAgenda | null,
  detailsById: Record<string, DeckEditorCardDetailForAgenda | undefined>,
  cardLookup: ReadonlyMap<string, { type: string }> = new Map()
): DeckAgendaStatus | null {
  if (!deck || deck.side !== "corp") return null;
  const rule = DECK_AGENDA_RULES_BY_PROFILE[deck.formatProfileId] ?? DEFAULT_DECK_AGENDA_RULE;
  const totalCards = deck.cards.reduce((sum, entry) => sum + safeQuantity(entry.quantity), 0);
  const detailsComplete = deck.cards.every((entry) => {
    const detail = detailsById[entry.cardId];
    const type = detail?.type ?? cardLookup.get(entry.cardId)?.type;
    return type !== undefined && (type !== "agenda" || detail !== undefined);
  });
  const agendaPoints = deck.cards.reduce((sum, entry) => {
    const detail = detailsById[entry.cardId];
    const type = detail?.type ?? cardLookup.get(entry.cardId)?.type;
    if (type !== "agenda") return sum;
    if (!detail) return sum;
    return sum + (detail.numeric.agendaPoints ?? 0) * safeQuantity(entry.quantity);
  }, 0);
  const effectiveCardsForMinimum = Math.max(totalCards, rule.minimumDeckCards);
  const additionalAgendaPoints = Math.floor(Math.max(0, effectiveCardsForMinimum - rule.minimumDeckCards) / rule.additionalAgendaPointEveryCards);
  const minimumAgendaPoints = rule.minimumAgendaPoints + additionalAgendaPoints;
  return {
    agendaPoints: detailsComplete ? agendaPoints : null,
    minimumAgendaPoints,
    missingAgendaPoints: detailsComplete ? Math.max(0, minimumAgendaPoints - agendaPoints) : null,
    totalCards,
    effectiveCardsForMinimum,
    detailsComplete
  };
}

function safeQuantity(quantity: number): number {
  return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
}
