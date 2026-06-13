import { FORBIDDEN_AI_INPUT_FIELDS } from "./ai-decision-input";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export function semanticRuntimeChoiceWithEvidence(
  choice: SemanticRuntimeChoice,
  options: {
    evidence: string[];
    minimumScore?: number;
    reasonCode?: string;
    explanation?: string;
  },
): SemanticRuntimeChoice {
  const score = roundSemanticRuntimeScore(
    options.minimumScore !== undefined
      ? Math.max(choice.score, options.minimumScore)
      : choice.score,
  );
  return {
    ...choice,
    score,
    reasonCode: options.reasonCode ?? choice.reasonCode,
    explanation: options.explanation ?? choice.explanation,
    evidence: scrubEvidence([...options.evidence, ...choice.evidence]),
    confidence: semanticRuntimeConfidence(choice.scopeId, score),
  };
}

export function semanticRuntimeConfidence(
  scopeId: string,
  score: number,
): number {
  if (scopeId === "choice_resolution" || scopeId === "mandatory_draw")
    return 0.95;
  if (score >= 9000) return 0.86;
  if (score >= 7000) return 0.76;
  if (score >= 5000) return 0.66;
  return 0.51;
}

export function scrubEvidence(evidence: readonly string[]): string[] {
  return evidence.filter(
    (entry) =>
      !FORBIDDEN_AI_INPUT_FIELDS.some((needle) => entry.includes(needle)) &&
      !entry.includes("_1"),
  );
}

export function roundSemanticRuntimeScore(value: number): number {
  return Math.round(value * 100) / 100;
}
