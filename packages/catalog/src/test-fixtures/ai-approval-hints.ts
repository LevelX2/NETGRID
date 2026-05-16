import activeAiHintsData from "../../../../data/ai/ai-card-hints-active.json";
import {
  DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V195_TO_V198_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V199_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1911_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1912_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1913_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1914_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1915_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1916_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1917_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1918_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1919_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1920_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
  DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
  KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
} from "../catalog-gates";
import type { AiCardHintsV2 } from "../index";

const activeAiHints = activeAiHintsData as unknown as AiCardHintsV2;

function activeHintsForCardIds(cardIds: Iterable<string>): AiCardHintsV2 {
  const approved = new Set(cardIds);
  return {
    ...activeAiHints,
    cards: activeAiHints.cards.filter((hint) => approved.has(hint.cardId)),
  };
}

export const kingOfTheRoadAiHintsData = activeHintsForCardIds(
  KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
);
export const deckLegalBatchAAiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
);
export const corpTagSliceAiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS,
);
export const deckLegalV161V170AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V161_TO_V170_CARD_IDS,
);
export const deckLegalV171V181Open64AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V171_TO_V181_OPEN64_CARD_IDS,
);
export const deckLegalLegacyOpen64AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_LEGACY_OPEN64_CARD_IDS,
);
export const deckLegalV190AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V190_CARD_IDS,
);
export const deckLegalV191V194AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V191_TO_V194_CARD_IDS,
);
export const deckLegalV195V198AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V195_TO_V198_CARD_IDS,
);
export const deckLegalV199AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V199_CARD_IDS,
);
export const deckLegalV1911AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1911_CARD_IDS,
);
export const deckLegalV1912AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1912_CARD_IDS,
);
export const deckLegalV1913AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1913_CARD_IDS,
);
export const deckLegalV1914AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1914_CARD_IDS,
);
export const deckLegalV1915AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1915_CARD_IDS,
);
export const deckLegalV1916AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1916_CARD_IDS,
);
export const deckLegalV1917AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1917_CARD_IDS,
);
export const deckLegalV1918AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1918_CARD_IDS,
);
export const deckLegalV1919AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1919_CARD_IDS,
);
export const deckLegalV1920AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1920_CARD_IDS,
);
export const deckLegalV1921AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1921_CARD_IDS,
);
export const deckLegalV1922AiHintsData = activeHintsForCardIds(
  DECK_LEGAL_AI_APPROVAL_V1922_CARD_IDS,
);
