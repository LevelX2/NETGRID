import type { AiDecisionDebug, LegalAction } from "@netgrid/shared";

import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
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
  return evidence.filter((entry) => !containsForbiddenSemanticMarker(entry));
}

export function roundSemanticRuntimeScore(value: number): number {
  return Math.round(value * 100) / 100;
}

export function semanticRuntimeScoreFromComponents(
  components: NonNullable<AiDecisionDebug["scoreBreakdown"]>,
): number {
  return components.reduce((sum, component) => sum + component.value, 0);
}

// Historical action-type priority is order metadata. Runtime scoring should use
// this only as a small fallback/tie-breaker after goals, gates, target context,
// cost, timing and boardstate components have done the real work.
export function semanticRuntimeTypeTieBreakerScore(
  type: LegalAction["type"],
): number {
  return Math.round(semanticRuntimeTypePriority(type) / 100);
}

export function semanticRuntimeTypePriority(type: LegalAction["type"]): number {
  switch (type) {
    case "resolve_choice":
      return 10000;
    case "mandatory_draw":
      return 9800;
    case "steal_agenda":
      return 9600;
    case "score_agenda":
      return 9400;
    case "access_card":
      return 9000;
    case "remove_tag":
      return 8800;
    case "break_subroutine":
      return 8500;
    case "pump_breaker":
      return 8300;
    case "trash_accessed_card":
      return 8000;
    case "continue_run":
      return 7800;
    case "jack_out":
      return 7400;
    case "rez_ice":
      return 7200;
    case "advance_card":
      return 7000;
    case "start_run":
      return 6800;
    case "install_card":
      return 6400;
    case "play_event":
    case "play_operation":
    case "trigger_ability":
    case "activated_card_ability":
      return 6200;
    case "trash_resource":
      return 6000;
    case "purge_virus_counters":
    case "purge_runner_virus_counters":
      return 5800;
    case "gain_credit":
      return 5400;
    case "draw_card":
      return 5300;
    case "decline_trash":
    case "decline_rez":
      return 3000;
    case "end_turn":
      return 1000;
    default:
      return 4000;
  }
}
