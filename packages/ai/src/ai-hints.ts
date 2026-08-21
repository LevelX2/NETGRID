import { createRuntimeCardsById } from "@netgrid/catalog";

export {
  AI_HINTS_BY_CARD,
  cardIdHasGeneratedCardSpecAiHint,
  createAiHintsByCard,
  validateGeneratedArtifact,
} from "./catalog-ai-hint-authority";
export type {
  AiCardHint,
  AiRuntimeValueHintKey,
  AiRuntimeValueHints,
} from "./catalog-ai-hint-authority";

export const RUNTIME_CARDS = createRuntimeCardsById();
