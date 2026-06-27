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
    return practicalMicroCompareDecision(
      runtimeDecision,
      legacyDecision,
      selectedCandidate,
      [selectedCandidate],
      true,
    );
  }
  return practicalMicroCompareDecision(
    runtimeDecision,
    legacyDecision,
    selectedCandidate,
    candidates,
    false,
  );
}

export function practicalMicroRuntimeMode(
  options: AiDecisionRuntimeOptions,
): PracticalMicroRuntimeMode {
  return options.practicalMicroRuntime?.mode ?? "off";
}

function practicalMicroCompareDecision(
  runtimeDecision: AiDecision,
  legacyDecision: AiDecision,
  selectedCandidate: PracticalMicroCandidate | undefined,
  candidates: readonly PracticalMicroCandidate[],
  applyRequested: boolean,
): AiDecision {
  return {
    ...runtimeDecision,
    evidence: [
      ...(runtimeDecision.evidence ?? []),
      "practical_micro_runtime_compare:true",
      `practical_micro_runtime_apply_requested:${applyRequested}`,
      "practical_micro_runtime_actual_override:false",
      `practical_micro_legacy_action:${legacyDecision.actionId}`,
      `practical_micro_runtime_reference:${runtimeDecision.actionId}`,
      ...(selectedCandidate
        ? [
            ...selectedCandidate.evidence,
            `practical_micro_candidate:${selectedCandidate.ruleId}`,
          ]
        : ["practical_micro_candidate:none"]),
    ],
    decisionDebug: practicalMicroDecisionDebug(
      runtimeDecision,
      legacyDecision,
      selectedCandidate,
      candidates,
      applyRequested,
    ),
  };
}

function practicalMicroDecisionDebug(
  runtimeDecision: AiDecision,
  legacyDecision: AiDecision,
  selectedCandidate: PracticalMicroCandidate | undefined,
  candidates: readonly PracticalMicroCandidate[],
  applyRequested: boolean,
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
          `apply_requested:${applyRequested}`,
          "actual_override:false",
        ],
      },
    ],
    warnings: [
      ...(base.warnings ?? []),
      ...(selectedCandidate ? [] : ["practical_micro_no_candidate"]),
    ],
  };
}
