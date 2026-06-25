import type { AiDecisionInput } from "@netgrid/shared";
import {
  buildObservedFacts as buildObservedFactsRuntime,
  type AiObservedFacts,
} from "./runtime/observed-facts";

export type { AiObservedFacts };

export function buildObservedFacts(input: AiDecisionInput): AiObservedFacts {
  return buildObservedFactsRuntime(input);
}
