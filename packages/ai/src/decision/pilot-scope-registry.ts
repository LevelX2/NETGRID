import type { LegalAction } from "@netgrid/shared";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import type { SemanticRuntimeChoice } from "../runtime/semantic-runtime-types";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";
import type { SemanticDecisionTrace } from "./semantic-decision-trace";

export const AI_PLAY_STRENGTH_PILOT_ENV = "NETGRID_AI_PLAY_STRENGTH_PILOT";
export const BASIC_SETUP_PILOT_MODE = "basic_setup";
export const RUNNER_SAFE_ACCESS_PILOT_MODE = "runner_safe_access";
export const CORP_SCORE_WINDOW_PILOT_MODE = "corp_score_window";

export type AiPlayStrengthPilotScope =
  | typeof BASIC_SETUP_PILOT_MODE
  | typeof RUNNER_SAFE_ACCESS_PILOT_MODE
  | typeof CORP_SCORE_WINDOW_PILOT_MODE;

export type PilotScopeDecision = {
  scope: AiPlayStrengthPilotScope;
  allowed: boolean;
  reason: string;
  evidence: string[];
};

export type SemanticBasicSetupPilotResult = {
  choice: SemanticRuntimeChoice;
  evidence: string[];
};

type RankedAction = SemanticDecisionTrace["rankedActions"][number];

const MINIMUM_PILOT_SCORE_GAP = 20;
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
  if (top.score - params.currentChoice.score < MINIMUM_PILOT_SCORE_GAP) {
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

function basicSetupDecision(action: LegalAction, top: RankedAction): PilotScopeDecision {
  const baseEvidence = [
    `pilot_scope:${BASIC_SETUP_PILOT_MODE}`,
    `action_type:${action.type}`,
  ];
  switch (action.type) {
    case "gain_credit":
    case "draw_card":
      return allow(BASIC_SETUP_PILOT_MODE, "basic_setup_resource_action", baseEvidence);
    case "install_card": {
      const allowed = hasUtilityFamily(top, "setup") || hasUtilityFamily(top, "coverage");
      return decision(
        BASIC_SETUP_PILOT_MODE,
        allowed,
        allowed ? "basic_setup_install_allowed" : "basic_setup_install_family_blocked",
        [...baseEvidence, ...utilityFamilyEvidence(top)],
      );
    }
    case "remove_tag": {
      const allowed = hasUtilityFamily(top, "survival") || hasUtilityFamily(top, "cleanup");
      return decision(
        BASIC_SETUP_PILOT_MODE,
        allowed,
        allowed ? "basic_setup_remove_tag_allowed" : "basic_setup_remove_tag_family_blocked",
        [...baseEvidence, ...utilityFamilyEvidence(top)],
      );
    }
    case "end_turn":
      return decision(
        BASIC_SETUP_PILOT_MODE,
        top.score >= 80,
        top.score >= 80 ? "basic_setup_high_score_end_turn" : "basic_setup_low_score_end_turn",
        [...baseEvidence, `top_score:${top.score}`],
      );
    default:
      return block(BASIC_SETUP_PILOT_MODE, "basic_setup_action_type_blocked", baseEvidence);
  }
}

function corpScoreWindowDecision(
  frame: SemanticDecisionFrame,
  action: LegalAction,
  top: RankedAction,
): PilotScopeDecision {
  const evidence = [
    `pilot_scope:${CORP_SCORE_WINDOW_PILOT_MODE}`,
    `frame_side:${frame.side}`,
    `action_type:${action.type}`,
    ...utilityFamilyEvidence(top),
  ];
  if (frame.side !== "corp") {
    return block(CORP_SCORE_WINDOW_PILOT_MODE, "corp_score_window_wrong_side", evidence);
  }
  if (action.type !== "score_agenda") {
    return block(
      CORP_SCORE_WINDOW_PILOT_MODE,
      "corp_score_window_action_type_blocked",
      evidence,
    );
  }
  return decision(
    CORP_SCORE_WINDOW_PILOT_MODE,
    hasUtilityFamily(top, "corp_scoreline"),
    hasUtilityFamily(top, "corp_scoreline")
      ? "corp_score_window_scoreline_allowed"
      : "corp_score_window_scoreline_missing",
    evidence,
  );
}

function runnerSafeAccessDecision(
  frame: SemanticDecisionFrame,
  action: LegalAction,
  top: RankedAction,
): PilotScopeDecision {
  const targetServerId = action.payload?.serverId;
  const evidence = [
    `pilot_scope:${RUNNER_SAFE_ACCESS_PILOT_MODE}`,
    `frame_side:${frame.side}`,
    `action_type:${action.type}`,
    ...(typeof targetServerId === "string" ? [`target_server:${targetServerId}`] : []),
  ];
  if (frame.side !== "runner") {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_wrong_side", evidence);
  }
  if (action.type !== "start_run") {
    return block(
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      "runner_safe_access_action_type_blocked",
      evidence,
    );
  }
  if (typeof targetServerId !== "string") {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_missing_target", evidence);
  }
  const matchingRunTarget = frame.runner?.runTargets?.find(
    (target) =>
      target.actionId === top.actionId && target.targetServerId === targetServerId,
  );
  if (!matchingRunTarget) {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_target_missing", evidence);
  }
  const targetEvidence = [
    ...evidence,
    `target_kind:${matchingRunTarget.targetKind}`,
    `recommendation:${matchingRunTarget.recommendation}`,
    `path_passability:${matchingRunTarget.pathPassability}`,
    `score_threat:${matchingRunTarget.scoreThreat}`,
  ];
  const allowed =
    (matchingRunTarget.targetKind === "hq" ||
      matchingRunTarget.targetKind === "rd") &&
    matchingRunTarget.recommendation === "run_now" &&
    matchingRunTarget.pathPassability === "reachable" &&
    matchingRunTarget.scoreThreat === false;
  return decision(
    RUNNER_SAFE_ACCESS_PILOT_MODE,
    allowed,
    allowed ? "runner_safe_access_central_reachable_allowed" : "runner_safe_access_gate_blocked",
    targetEvidence,
  );
}

function decision(
  scope: AiPlayStrengthPilotScope,
  allowed: boolean,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return {
    scope,
    allowed,
    reason,
    evidence: [`pilot_scope_allowed:${allowed}`, ...evidence],
  };
}

function allow(
  scope: AiPlayStrengthPilotScope,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return decision(scope, true, reason, evidence);
}

function block(
  scope: AiPlayStrengthPilotScope,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return decision(scope, false, reason, evidence);
}

function hasUtilityFamily(top: RankedAction, family: string): boolean {
  return top.components.some(
    (component) =>
      component.component === "goal_fit" &&
      component.evidence.some((entry) => entry === `utility_family:${family}`),
  );
}

function utilityFamilyEvidence(top: RankedAction): string[] {
  return top.components
    .filter((component) => component.component === "goal_fit")
    .flatMap((component) =>
      component.evidence.filter((entry) => entry.startsWith("utility_family:")),
    );
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
