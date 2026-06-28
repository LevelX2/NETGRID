import type { AiDecisionInput } from "@netgrid/shared";
import { FORBIDDEN_AI_INPUT_FIELDS } from "../runtime/ai-decision-input";

const SIDE_SAFE_AI_INPUT_MARKERS = FORBIDDEN_AI_INPUT_FIELDS.map((field) =>
  field.toLocaleLowerCase("en-US"),
);

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  const serialized = JSON.stringify(input);
  return !sideSafeInputContainsForbiddenMarker(serialized);
}

function sideSafeInputContainsForbiddenMarker(value: string): boolean {
  const tokenSet = new Set(sideSafeInputTokens(value));
  return SIDE_SAFE_AI_INPUT_MARKERS.some((marker) => tokenSet.has(marker));
}

function sideSafeInputTokens(value: string): string[] {
  const tokens: string[] = [];
  let current = "";
  for (const character of value) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLocaleLowerCase("en-US");
    } else {
      if (current.length > 0) tokens.push(current);
      current = "";
    }
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}
