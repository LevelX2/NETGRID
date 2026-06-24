import { aiBoonImplementation } from "../card-implementations/onr-v1/runner/programs/ai-boon";
import { boardwalkImplementation } from "../card-implementations/onr-v1/runner/programs/boardwalk";
import { questForCattekinImplementation } from "../card-implementations/onr-v1/runner/resources/quest-for-cattekin";

export const AI_BOON_RANDOM_BREAKER_SOURCE =
  aiBoonImplementation.cardDefinitionId;

export const BOARDWALK_RANDOM_PROGRAM_SOURCE =
  boardwalkImplementation.cardDefinitionId;

export const QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_SOURCE =
  questForCattekinImplementation.cardDefinitionId;

export const RUNNER_RANDOM_PROGRAM_SOURCES = new Set([
  AI_BOON_RANDOM_BREAKER_SOURCE,
  BOARDWALK_RANDOM_PROGRAM_SOURCE,
]);
