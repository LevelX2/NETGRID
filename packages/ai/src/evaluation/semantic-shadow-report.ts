import type { AiDecision, Side } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { redactSemanticString } from "../diagnostics/semantic-redaction";
import { classifyDecisionTraceMistakes } from "./decision-snapshot-suite";
import type { AiMistakeClass } from "./mistake-taxonomy";

export type SemanticShadowRuntimeComparison = {
  stateVersion: number;
  side: Side;
  runtimeActionId: string;
  shadowTopActionId?: string;
  agreement: boolean;
  runtimeReasonCode: string;
  shadowTopScore?: number;
  shadowTopGoalId?: string;
  calibrationProfileId?: string;
  calibrationMode?: string;
  observedMistakes: AiMistakeClass[];
  mistakeSummary: Partial<Record<AiMistakeClass, number>>;
  evidence: string[];
};

export function compareSemanticShadowToRuntime(params: {
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  runtimeDecision: AiDecision;
}): SemanticShadowRuntimeComparison {
  const legalActionIds = new Set(params.frame.legalActionIds);
  const top = params.trace.rankedActions[0];
  const shadowTopLegal = top ? legalActionIds.has(top.actionId) : false;
  const runtimeLegal = legalActionIds.has(params.runtimeDecision.actionId);
  const shadowTopActionId = top && shadowTopLegal ? top.actionId : undefined;
  const observedMistakes = uniqueMistakes(
    classifyDecisionTraceMistakes(params.frame, params.trace).map(
      (mistake) => mistake.mistakeClass,
    ),
  );
  const mistakeSummary = summarizeMistakes(observedMistakes);
  const comparison: SemanticShadowRuntimeComparison = {
    stateVersion: params.frame.stateVersion,
    side: params.frame.side,
    runtimeActionId: safeReportString(params.runtimeDecision.actionId),
    ...(shadowTopActionId
      ? { shadowTopActionId: safeReportString(shadowTopActionId) }
      : {}),
    agreement: Boolean(runtimeLegal && shadowTopActionId === params.runtimeDecision.actionId),
    runtimeReasonCode: safeReportString(params.runtimeDecision.reasonCode),
    ...(top && shadowTopLegal ? { shadowTopScore: top.score } : {}),
    ...(top?.primaryGoalId && shadowTopLegal
      ? { shadowTopGoalId: safeReportString(top.primaryGoalId) }
      : {}),
    ...(params.trace.frameSummary.calibrationProfileId
      ? {
          calibrationProfileId: safeReportString(
            params.trace.frameSummary.calibrationProfileId,
          ),
        }
      : {}),
    ...(params.trace.frameSummary.calibrationMode
      ? {
          calibrationMode: safeReportString(
            params.trace.frameSummary.calibrationMode,
          ),
        }
      : {}),
    observedMistakes,
    mistakeSummary,
    evidence: safeReportEvidence([
      `runtime_action_legal:${runtimeLegal}`,
      `shadow_top_legal:${shadowTopLegal}`,
      `agreement:${Boolean(runtimeLegal && shadowTopActionId === params.runtimeDecision.actionId)}`,
      `observed_mistake_count:${observedMistakes.length}`,
      ...(top ? [`shadow_top_rank:${top.rank}`] : ["shadow_top:none"]),
      ...(top && shadowTopLegal ? [`shadow_top_score:${top.score}`] : []),
      ...(top?.primaryGoalId && shadowTopLegal
        ? [`shadow_top_goal:${top.primaryGoalId}`]
        : []),
      ...(params.trace.frameSummary.calibrationProfileId
        ? [`calibration_profile:${params.trace.frameSummary.calibrationProfileId}`]
        : []),
      ...(params.trace.frameSummary.calibrationMode
        ? [`calibration_mode:${params.trace.frameSummary.calibrationMode}`]
        : []),
      ...Object.entries(mistakeSummary).map(
        ([mistakeClass, count]) => `mistake_summary:${mistakeClass}=${count}`,
      ),
    ]),
  };
  return comparison;
}

function uniqueMistakes(mistakes: readonly AiMistakeClass[]): AiMistakeClass[] {
  return [...new Set(mistakes)].sort();
}

function summarizeMistakes(
  mistakes: readonly AiMistakeClass[],
): Partial<Record<AiMistakeClass, number>> {
  const summary: Partial<Record<AiMistakeClass, number>> = {};
  for (const mistake of mistakes) {
    summary[mistake] = (summary[mistake] ?? 0) + 1;
  }
  return summary;
}

function safeReportEvidence(evidence: readonly string[]): string[] {
  return evidence.map(safeReportString);
}

function safeReportString(value: string): string {
  return redactSemanticString(value);
}
