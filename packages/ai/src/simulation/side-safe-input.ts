import type { AiDecisionInput } from "@netgrid/shared";
import { FORBIDDEN_AI_INPUT_FIELDS } from "../runtime/ai-decision-input";

const SIDE_SAFE_AI_INPUT_MARKERS = new Set(
  FORBIDDEN_AI_INPUT_FIELDS.map((field) => field.toLowerCase()),
);

export function assertAiInputIsSideSafe(input: AiDecisionInput): boolean {
  return !sideSafeInputContainsForbiddenMarker(
    input,
    new WeakSet<object>(),
    new WeakSet<object>(),
  );
}

function sideSafeInputContainsForbiddenMarker(
  value: unknown,
  visited: WeakSet<object>,
  visiting: WeakSet<object>,
): boolean {
  if (typeof value === "string") return stringContainsForbiddenMarker(value);
  if (typeof value === "bigint")
    throw new TypeError("BigInt is not supported in AI decision input");
  if (value === null || typeof value !== "object") return false;
  if (visiting.has(value))
    throw new TypeError("Cyclic value is not supported in AI decision input");
  if (visited.has(value)) return false;

  if (Object.prototype.toString.call(value) === "[object String]")
    return stringContainsForbiddenMarker(String(value));
  const toJSON = (value as { toJSON?: unknown }).toJSON;
  if (typeof toJSON === "function") {
    const jsonValue = toJSON.call(value, "");
    if (jsonValue !== value)
      return sideSafeInputContainsForbiddenMarker(jsonValue, visited, visiting);
  }

  visiting.add(value);
  try {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (sideSafeInputContainsForbiddenMarker(entry, visited, visiting))
          return true;
      }
      return false;
    }

    for (const key of Object.keys(value)) {
      if (stringContainsForbiddenMarker(key)) return true;
      const entry = (value as Record<string, unknown>)[key];
      if (
        entry !== undefined &&
        typeof entry !== "function" &&
        typeof entry !== "symbol" &&
        sideSafeInputContainsForbiddenMarker(entry, visited, visiting)
      ) {
        return true;
      }
    }
    return false;
  } finally {
    visiting.delete(value);
    visited.add(value);
  }
}

function stringContainsForbiddenMarker(value: string): boolean {
  let current = "";
  for (const character of value) {
    if (isAsciiLetterOrDigit(character)) {
      current += character.toLowerCase();
    } else {
      if (SIDE_SAFE_AI_INPUT_MARKERS.has(current)) return true;
      current = "";
    }
  }
  return SIDE_SAFE_AI_INPUT_MARKERS.has(current);
}

function isAsciiLetterOrDigit(character: string): boolean {
  return (
    (character >= "a" && character <= "z") ||
    (character >= "A" && character <= "Z") ||
    (character >= "0" && character <= "9")
  );
}
