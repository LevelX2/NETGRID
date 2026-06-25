import type { AiDecisionInput } from "@netgrid/shared";
import { FORBIDDEN_AI_INPUT_FIELDS } from "../runtime/ai-decision-input";

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  if (FORBIDDEN_AI_INPUT_FIELDS.some((needle) => serialized.includes(needle)))
    return false;
  return true;
}
