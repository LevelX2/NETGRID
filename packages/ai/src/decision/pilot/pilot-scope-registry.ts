import type { LegalAction } from "@netgrid/shared";
import { containsForbiddenSemanticMarker } from "../../diagnostics/semantic-redaction";
import type { SemanticRuntimeChoice } from "../../runtime/semantic-runtime-types";
import { semanticShadowCalibrationProfileFromEnv } from "../semantic-shadow-calibration";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import type { SemanticDecisionTrace } from "../semantic-decision-trace";
import { basicSetupDecision } from "./basic-setup-pilot";
import { corpScoreWindowDecision } from "./corp-score-window-pilot";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type AiPlayStrengthPilotScope,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";
import { runnerSafeAccessDecision } from "./runner-safe-access-pilot";

export {
  AI_PLAY_STRENGTH_PILOT_ENV,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
};
export type { AiPlayStrengthPilotScope, PilotScopeDecision };

export type SemanticBasicSetupPilotResult = {
  choice: SemanticRuntimeChoice;
  evidence: string[];
};

const PILOT_SCOPES = [
  BASIC_SETUP_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
] as const satisfies readonly AiPlayStrengthPilotScope[];

export function parsePilotScopes(env: string | undefined): AiPlayStrengthPilotScope[] {
  if (!env) return [];
  const seen = new Set<AiPlayStrengthPilotScope>();
  const scopes: AiPlayStrengthPilotScope[] = [];
  for (const token of env.split(/[,\s;]+/)) {
    if (!isPilotScope(token) || seen.has(token)) continue;
    seen.add(token);
    scopes.push(token);
  }
  return scopes;
}

export function semanticBasicSetupPilotEnabled(): boolean {
  return parsePilotScopes(process.env[AI_PLAY_STRENGTH_PILOT_ENV]).includes(
    BASIC_SETUP_PILOT_MODE,
  );
}

export function semanticPlayStrengthPilotEnabled(): boolean {
  return parsePilotScopes(process.env[AI_PLAY_STRENGTH_PILOT_ENV]).length > 0;
}

export function semanticPilotChoice(params: {
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  currentChoice: SemanticRuntimeChoice;
  choices: readonly SemanticRuntimeChoice[];
}): SemanticBasicSetupPilotResult | undefined {
  const scopes = parsePilotScopes(process.env[AI_PLAY_STRENGTH_PILOT_ENV]);
  if (scopes.length === 0) return undefined;
  const top = params.trace.rankedActions[0];
  if (!top) return undefined;
  if (!params.frame.legalActionIds.includes(top.actionId)) return undefined;
  if (top.blockers.length > 0) return undefined;
  const minimumScoreGap =
    semanticShadowCalibrationProfileFromEnv().pilotMinimumScoreGap;
  if (top.score - params.currentChoice.score < minimumScoreGap) {
    return undefined;
  }
  const matchingChoice = params.choices.find(
    (choice) => !choice.exclusion && choice.action.actionId === top.actionId,
  );
  if (!matchingChoice) return undefined;
  if (!traceIsHiddenInfoSafe(params.trace)) return undefined;

  for (const scope of scopes) {
    const decision = pilotScopeAllowsAction({
      scope,
      frame: params.frame,
      action: matchingChoice.action,
      top,
    });
    if (!decision.allowed) continue;
    return buildPilotResult({
      scope,
      decision,
      matchingChoice,
      top,
      scoreGap: top.score - params.currentChoice.score,
    });
  }

  return undefined;
}

export function pilotScopeAllowsAction(params: {
  scope: AiPlayStrengthPilotScope;
  frame: SemanticDecisionFrame;
  action: LegalAction;
  top: RankedAction;
}): PilotScopeDecision {
  switch (params.scope) {
    case BASIC_SETUP_PILOT_MODE:
      return basicSetupDecision(params.action, params.top);
    case RUNNER_SAFE_ACCESS_PILOT_MODE:
      return runnerSafeAccessDecision(params.frame, params.action, params.top);
    case CORP_SCORE_WINDOW_PILOT_MODE:
      return corpScoreWindowDecision(params.frame, params.action, params.top);
  }
}

function buildPilotResult(input: {
  scope: AiPlayStrengthPilotScope;
  decision: PilotScopeDecision;
  matchingChoice: SemanticRuntimeChoice;
  top: RankedAction;
  scoreGap: number;
}): SemanticBasicSetupPilotResult {
  const scopeLabel = `ai_play_strength_pilot:${input.scope}`;
  return {
    choice: {
      ...input.matchingChoice,
      reasonCode: reasonCodeForScope(input.scope),
      explanation: explanationForScope(input.scope, input.matchingChoice.action.type),
      evidence: [
        ...input.matchingChoice.evidence,
        scopeLabel,
        `ai_play_strength_pilot_score:${input.top.score}`,
        `ai_play_strength_pilot_score_gap:${input.scoreGap}`,
        `ai_play_strength_pilot_goal:${input.top.primaryGoalId ?? "unknown"}`,
        ...input.decision.evidence,
      ],
    },
    evidence: [
      scopeLabel,
      `top_action:${input.top.actionId}`,
      `score_gap:${input.scoreGap}`,
      `pilot_scope_reason:${input.decision.reason}`,
    ],
  };
}

function traceIsHiddenInfoSafe(trace: SemanticDecisionTrace): boolean {
  return !containsForbiddenSemanticMarker(trace);
}

function reasonCodeForScope(scope: AiPlayStrengthPilotScope): string {
  switch (scope) {
    case BASIC_SETUP_PILOT_MODE:
      return "ai_play_strength.basic_setup_pilot";
    case RUNNER_SAFE_ACCESS_PILOT_MODE:
      return "ai_play_strength.runner_safe_access_pilot";
    case CORP_SCORE_WINDOW_PILOT_MODE:
      return "ai_play_strength.corp_score_window_pilot";
  }
}

function explanationForScope(
  scope: AiPlayStrengthPilotScope,
  actionType: LegalAction["type"],
): string {
  switch (scope) {
    case BASIC_SETUP_PILOT_MODE:
      return `Basic/setup pilot selected ${actionType} from semantic shadow ranking.`;
    case RUNNER_SAFE_ACCESS_PILOT_MODE:
      return `Runner safe-access pilot selected ${actionType} from semantic shadow ranking.`;
    case CORP_SCORE_WINDOW_PILOT_MODE:
      return `Corp score-window pilot selected ${actionType} from semantic shadow ranking.`;
  }
}

function isPilotScope(value: string): value is AiPlayStrengthPilotScope {
  return PILOT_SCOPES.some((scope) => scope === value);
}
