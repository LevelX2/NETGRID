import { aiBoonImplementation } from "../card-implementations/onr-v1/runner/programs/ai-boon";
import { boardwalkImplementation } from "../card-implementations/onr-v1/runner/programs/boardwalk";
import { questForCattekinImplementation } from "../card-implementations/onr-v1/runner/resources/quest-for-cattekin";

export const AI_BOON_RANDOM_BREAKER_CARD_ID =
  aiBoonImplementation.cardDefinitionId;

export const BOARDWALK_RANDOM_PROGRAM_CARD_ID =
  boardwalkImplementation.cardDefinitionId;

export const QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID =
  questForCattekinImplementation.cardDefinitionId;

export const RUNNER_RANDOM_PROGRAM_CARD_IDS = new Set([
  AI_BOON_RANDOM_BREAKER_CARD_ID,
  BOARDWALK_RANDOM_PROGRAM_CARD_ID,
]);
