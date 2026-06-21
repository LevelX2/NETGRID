import {
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  type AiDecision,
  type AiDecisionInput,
} from "@netgrid/shared";
import type {
  AiDecisionRuntimeOptions,
  PracticalMicroRuntimeMode,
  PracticalMicroRuntimeRuleId,
} from "./choose-ai-action";

export type PracticalMicroCandidate = {
  ruleId: PracticalMicroRuntimeRuleId;
  actionId: string;
  actionType: string;
  reasonCode: string;
  explanation: string;
  evidence: string[];
};

export function applyPracticalMicroRuntimeComparator(
  input: AiDecisionInput,
  legacyDecision: AiDecision,
  runtimeDecision: AiDecision,
  options: AiDecisionRuntimeOptions,
  candidates: readonly PracticalMicroCandidate[] = [],
): AiDecision {
  const mode = practicalMicroRuntimeMode(options);
  if (mode === "off") return runtimeDecision;

  const enabledRules = new Set(options.practicalMicroRuntime?.enabledRules ?? []);
  const allowedCandidates = candidates.filter(
    (candidate) =>
      enabledRules.has(candidate.ruleId) &&
      input.legalActions.some((action) => action.actionId === candidate.actionId),
  );
  const selectedCandidate = allowedCandidates[0];
  if (mode === "apply" && selectedCandidate) {
    return practicalMicroDecision(input, runtimeDecision, selectedCandidate, legacyDecision);
  }
  return practicalMicroDebugDecision(
    runtimeDecision,
    legacyDecision,
    selectedCandidate,
    candidates,
  );
}

export function practicalMicroRuntimeMode(
  options: AiDecisionRuntimeOptions,
): PracticalMicroRuntimeMode {
  return options.practicalMicroRuntime?.mode ?? "off";
}

function practicalMicroDecision(
  input: AiDecisionInput,
  runtimeDecision: AiDecision,
  candidate: PracticalMicroCandidate,
  legacyDecision: AiDecision,
): AiDecision {
  const { selectedChoices: _selectedChoices, ...runtimeDecisionWithoutChoices } =
    runtimeDecision;
  return {
    ...runtimeDecisionWithoutChoices,
    actionId: candidate.actionId,
    reasonCode: candidate.reasonCode,
    explanation: candidate.explanation,
    consideredActionIds: input.legalActions.map((action) => action.actionId),
    fallbackUsed: false,
    evidence: [
      ...(runtimeDecision.evidence ?? []),
      ...candidate.evidence,
      `practical_micro_runtime_applied:${candidate.ruleId}`,
      `practical_micro_legacy_action:${legacyDecision.actionId}`,
      `practical_micro_runtime_reference:${runtimeDecision.actionId}`,
    ],
    decisionDebug: practicalMicroDecisionDebug(
      runtimeDecision,
      legacyDecision,
      candidate,
      [candidate],
    ),
  };
}

function practicalMicroDebugDecision(
  runtimeDecision: AiDecision,
  legacyDecision: AiDecision,
  selectedCandidate: PracticalMicroCandidate | undefined,
  candidates: readonly PracticalMicroCandidate[],
): AiDecision {
  return {
    ...runtimeDecision,
    evidence: [
      ...(runtimeDecision.evidence ?? []),
      "practical_micro_runtime_compare:true",
      `practical_micro_legacy_action:${legacyDecision.actionId}`,
      ...(selectedCandidate
        ? [`practical_micro_candidate:${selectedCandidate.ruleId}`]
        : ["practical_micro_candidate:none"]),
    ],
    decisionDebug: practicalMicroDecisionDebug(
      runtimeDecision,
      legacyDecision,
      selectedCandidate,
      candidates,
    ),
  };
}

function practicalMicroDecisionDebug(
  runtimeDecision: AiDecision,
  legacyDecision: AiDecision,
  selectedCandidate: PracticalMicroCandidate | undefined,
  candidates: readonly PracticalMicroCandidate[],
): NonNullable<AiDecision["decisionDebug"]> {
  const base =
    runtimeDecision.decisionDebug ?? {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 1,
      fallbackUsed: runtimeDecision.fallbackUsed,
    };
  return {
    ...base,
    detailSections: [
      ...(base.detailSections ?? []),
      {
        id: "practical_micro_runtime",
        title: "Practical Micro Runtime",
        items: [
          `legacy_action:${legacyDecision.actionId}`,
          `runtime_action:${runtimeDecision.actionId}`,
          selectedCandidate
            ? `micro_candidate:${selectedCandidate.ruleId}:${selectedCandidate.actionId}`
            : "micro_candidate:none",
          `micro_candidate_count:${candidates.length}`,
        ],
      },
    ],
    warnings: [
      ...(base.warnings ?? []),
      ...(selectedCandidate ? [] : ["practical_micro_no_candidate"]),
    ],
  };
}
