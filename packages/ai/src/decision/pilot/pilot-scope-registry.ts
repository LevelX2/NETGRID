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
  ALL_PLAY_STRENGTH_PILOT_SCOPES,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  PLAY_STRENGTH_PILOT_ALL_TOKEN,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type AiPlayStrengthPilotScope,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";
import { runnerSafeAccessDecision } from "./runner-safe-access-pilot";
export {
  buildLocalDefaultPilotPolicy,
  type LocalDefaultPilotPolicy,
  type LocalDefaultPilotPolicyScope,
} from "./local-default-pilot-policy";

export {
  AI_PLAY_STRENGTH_PILOT_ENV,
  ALL_PLAY_STRENGTH_PILOT_SCOPES,
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  PLAY_STRENGTH_PILOT_ALL_TOKEN,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
};
export type { AiPlayStrengthPilotScope, PilotScopeDecision };

export type SemanticBasicSetupPilotResult = {
  choice: SemanticRuntimeChoice;
  evidence: string[];
};

export type PilotScopeDecisionMatrix = {
  topActionId: string;
  scoreGap: number;
  scopes: Array<{
    scope: AiPlayStrengthPilotScope;
    allowed: boolean;
    reason: string;
    evidence: string[];
  }>;
};

export function parsePilotScopes(env: string | undefined): AiPlayStrengthPilotScope[] {
  if (!env) return [];
  const seen = new Set<AiPlayStrengthPilotScope>();
  const scopes: AiPlayStrengthPilotScope[] = [];
  for (const token of env.split(/[,\s;]+/)) {
    if (token === PLAY_STRENGTH_PILOT_ALL_TOKEN) {
      appendPilotScopes(scopes, seen, ALL_PLAY_STRENGTH_PILOT_SCOPES);
      continue;
    }
    if (!isPilotScope(token)) continue;
    appendPilotScopes(scopes, seen, [token]);
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
  const scoreGap = top.score - params.currentChoice.score;
  const decisionMatrix = buildPilotScopeDecisionMatrix({
    scopes,
    frame: params.frame,
    action: matchingChoice.action,
    top,
    scoreGap,
  });

  for (const decision of decisionMatrix.scopes) {
    if (!decision.allowed) continue;
    return buildPilotResult({
      decision,
      decisionMatrix,
      matchingChoice,
      top,
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

export function buildPilotScopeDecisionMatrix(params: {
  scopes?: readonly AiPlayStrengthPilotScope[];
  frame: SemanticDecisionFrame;
  action: LegalAction;
  top: RankedAction;
  scoreGap: number;
}): PilotScopeDecisionMatrix {
  const scopes = params.scopes ?? ALL_PLAY_STRENGTH_PILOT_SCOPES;
  return {
    topActionId: params.top.actionId,
    scoreGap: params.scoreGap,
    scopes: scopes.map((scope) => {
      const decision = pilotScopeAllowsAction({
        scope,
        frame: params.frame,
        action: params.action,
        top: params.top,
      });
      return {
        scope,
        allowed: decision.allowed,
        reason: decision.reason,
        evidence: decision.evidence,
      };
    }),
  };
}

function buildPilotResult(input: {
  decision: PilotScopeDecisionMatrix["scopes"][number];
  decisionMatrix: PilotScopeDecisionMatrix;
  matchingChoice: SemanticRuntimeChoice;
  top: RankedAction;
}): SemanticBasicSetupPilotResult {
  const scopeLabel = `ai_play_strength_pilot:${input.decision.scope}`;
  return {
    choice: {
      ...input.matchingChoice,
      reasonCode: reasonCodeForScope(input.decision.scope),
      explanation: explanationForScope(
        input.decision.scope,
        input.matchingChoice.action.type,
      ),
      evidence: [
        ...input.matchingChoice.evidence,
        scopeLabel,
        `ai_play_strength_pilot_score:${input.top.score}`,
        `ai_play_strength_pilot_score_gap:${input.decisionMatrix.scoreGap}`,
        `ai_play_strength_pilot_goal:${input.top.primaryGoalId ?? "unknown"}`,
        ...pilotScopeDecisionMatrixEvidence(input.decisionMatrix),
        ...input.decision.evidence,
      ],
    },
    evidence: [
      scopeLabel,
      `top_action:${input.top.actionId}`,
      `score_gap:${input.decisionMatrix.scoreGap}`,
      `pilot_scope_reason:${input.decision.reason}`,
      ...pilotScopeDecisionMatrixEvidence(input.decisionMatrix),
    ],
  };
}

function pilotScopeDecisionMatrixEvidence(
  matrix: PilotScopeDecisionMatrix,
): string[] {
  return [
    `pilot_scope_matrix_top_action:${matrix.topActionId}`,
    `pilot_scope_matrix_score_gap:${matrix.scoreGap}`,
    `pilot_scope_matrix_scope_count:${matrix.scopes.length}`,
    ...matrix.scopes.map(
      (scopeDecision) =>
        `pilot_scope_matrix:${scopeDecision.scope}:${
          scopeDecision.allowed ? "allowed" : "blocked"
        }:${scopeDecision.reason}`,
    ),
  ];
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
  return ALL_PLAY_STRENGTH_PILOT_SCOPES.some((scope) => scope === value);
}

function appendPilotScopes(
  scopes: AiPlayStrengthPilotScope[],
  seen: Set<AiPlayStrengthPilotScope>,
  nextScopes: readonly AiPlayStrengthPilotScope[],
): void {
  for (const scope of nextScopes) {
    if (seen.has(scope)) continue;
    seen.add(scope);
    scopes.push(scope);
  }
}
