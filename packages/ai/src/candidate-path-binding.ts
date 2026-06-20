import type { Side } from "@netgrid/shared";
import type { SemanticActionSignature } from "./semantic-action-signature";

export type CandidatePathBindingStatus = "bound" | "blocked";

export type CandidatePathBinding = {
  schemaVersion: "candidate-path-binding-v1";
  bindingKey: string;
  signatureKey: string;
  actionId?: string;
  redactedActionRef?: string;
  stateVersion: number;
  actionType: string;
  side: Side;
  sourceDefinitionId?: string;
  abilityId?: string;
  targetIdentity: string;
  costClass: string;
  timingClass: string;
  hardGateSummary: string;
  riskGateSummary: string;
  intentContractId: string;
  proofStatus: CandidatePathBindingStatus;
  blockers: string[];
  evidence: string[];
};

export type CandidatePathBindingInput = {
  signature: SemanticActionSignature;
  actionId?: string;
  redactedActionRef?: string;
  stateVersion: number;
  side: Side;
  hardGates?: readonly string[];
  blockedReason?: string;
  riskEvidence?: readonly string[];
  intentContractId: string;
  evidence?: readonly string[];
};

const HIDDEN_INFO_PATTERNS =
  /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|fullGameState|AIInput|DecisionDebug|deckTop|decklist|deckOrder/i;

export function buildCandidatePathBinding(
  input: CandidatePathBindingInput,
): CandidatePathBinding {
  const hardGates = [...(input.hardGates ?? [])].sort();
  const blockers = bindingBlockers(input, hardGates);
  const hardGateSummary =
    hardGates.length === 0 ? "clear" : `blocked:${hardGates.join("+")}`;
  const riskGateSummary =
    input.riskEvidence && input.riskEvidence.length > 0
      ? `risk:${[...input.riskEvidence].sort().join("+")}`
      : "clear";
  const proofStatus: CandidatePathBindingStatus =
    blockers.length === 0 ? "bound" : "blocked";
  const binding: CandidatePathBinding = {
    schemaVersion: "candidate-path-binding-v1" as const,
    bindingKey: [
      input.signature.signatureKey,
      input.actionId ?? input.redactedActionRef ?? "missing-action-ref",
      input.stateVersion,
      input.side,
      input.intentContractId,
    ].join("|"),
    signatureKey: input.signature.signatureKey,
    ...(input.actionId ? { actionId: input.actionId } : {}),
    ...(input.redactedActionRef ? { redactedActionRef: input.redactedActionRef } : {}),
    stateVersion: input.stateVersion,
    actionType: input.signature.actionType,
    side: input.side,
    ...(input.signature.sourceDefinitionId
      ? { sourceDefinitionId: input.signature.sourceDefinitionId }
      : {}),
    ...(input.signature.abilityId ? { abilityId: input.signature.abilityId } : {}),
    targetIdentity: input.signature.targetIdentity,
    costClass: input.signature.costClass,
    timingClass: input.signature.timingClass,
    hardGateSummary,
    riskGateSummary,
    intentContractId: input.intentContractId,
    proofStatus,
    blockers,
    evidence: [
      "semantic_action_signature_present",
      input.actionId ? "action_id_present" : "redacted_action_ref_present",
      ...(input.evidence ?? []),
    ],
  };
  if (!candidatePathBindingIsRedactionSafe(binding)) {
    const { actionId: _actionId, ...redactedBinding } = binding;
    return {
      ...redactedBinding,
      redactedActionRef: "redacted:hidden-info-blocked",
      targetIdentity: "hidden_blocked",
      costClass: "hidden_blocked",
      timingClass: "hidden_blocked",
      proofStatus: "blocked",
      blockers: [...new Set([...binding.blockers, "hidden_info_marker_detected"])],
      evidence: [...binding.evidence, "binding_redacted_after_hidden_marker_scan"],
    };
  }
  return binding;
}

export function candidatePathBindingIsRedactionSafe(value: unknown): boolean {
  return !HIDDEN_INFO_PATTERNS.test(JSON.stringify(value));
}

function bindingBlockers(
  input: CandidatePathBindingInput,
  hardGates: readonly string[],
): string[] {
  const blockers = new Set<string>();
  if (!input.actionId && !input.redactedActionRef) blockers.add("action_ref_missing");
  if (!input.signature.signatureKey) blockers.add("signature_key_missing");
  if (input.signature.targetIdentity === "unknown_target") {
    blockers.add("target_identity_unresolved");
  }
  if (input.signature.targetIdentity === "server:unknown") {
    blockers.add("server_target_missing");
  }
  if (input.signature.targetIdentity === "choice:unknown") {
    blockers.add("choice_option_missing");
  }
  if (input.signature.targetIdentity === "unknown_hidden_blocked") {
    blockers.add("hidden_target_identity_blocked");
  }
  if (input.signature.targetIdentity === "blocked_by_hard_gate") {
    blockers.add("target_blocked_by_hard_gate");
  }
  if (hardGates.length > 0) blockers.add("hard_gate_blocked");
  if (input.blockedReason) blockers.add(`blocked_reason:${input.blockedReason}`);
  return [...blockers].sort();
}
