import type { CandidatePathBinding } from "./candidate-path-binding";
import type { LegalActionWitness } from "./legalaction-witness";
import {
  targetRefIsCompleteOrIrrelevant,
  type TargetRef,
} from "./target-ref";

export type WitnessOpportunityProjectionStatus = "projected" | "blocked";

export type WitnessOpportunityProjection = {
  schemaVersion: "witness-opportunity-projection-v1";
  status: WitnessOpportunityProjectionStatus;
  candidatePathBindingKey: string;
  signatureKey: string;
  actionType: string;
  stateVersion: number;
  redactedActionRef?: string;
  actionId?: string;
  targetRef: TargetRef;
  legalActionWitness?: LegalActionWitness;
  candidatePathBindingFromWitness: boolean;
  blockers: string[];
  evidence: string[];
};

export type BuildWitnessOpportunityProjectionInput = {
  binding: CandidatePathBinding;
  targetRef: TargetRef;
  legalActionWitness?: LegalActionWitness;
};

export function buildWitnessOpportunityProjection(
  input: BuildWitnessOpportunityProjectionInput,
): WitnessOpportunityProjection {
  const blockers = projectionBlockers(input);
  return {
    schemaVersion: "witness-opportunity-projection-v1",
    status: blockers.length === 0 ? "projected" : "blocked",
    candidatePathBindingKey: input.binding.bindingKey,
    signatureKey: input.binding.signatureKey,
    actionType: input.binding.actionType,
    stateVersion: input.binding.stateVersion,
    ...(input.binding.redactedActionRef
      ? { redactedActionRef: input.binding.redactedActionRef }
      : {}),
    ...(input.binding.actionId ? { actionId: input.binding.actionId } : {}),
    targetRef: input.targetRef,
    ...(input.legalActionWitness ? { legalActionWitness: input.legalActionWitness } : {}),
    candidatePathBindingFromWitness:
      blockers.length === 0 && input.legalActionWitness !== undefined,
    blockers,
    evidence: [
      "candidate_path_binding_present",
      "targetref_v1_present",
      input.legalActionWitness
        ? "legalaction_witness_present"
        : "legalaction_witness_absent",
      input.binding.actionId ? "action_id_present" : "action_id_missing",
    ],
  };
}

function projectionBlockers(
  input: BuildWitnessOpportunityProjectionInput,
): string[] {
  const blockers = new Set<string>();
  if (!input.binding.actionId) blockers.add("legalaction_witness_missing_real_action_id");
  if (!input.legalActionWitness) blockers.add("legalaction_witness_missing");
  if (!targetRefIsCompleteOrIrrelevant(input.targetRef)) {
    blockers.add(input.targetRef.blocker ?? "targetref_not_complete");
  }
  if (input.binding.proofStatus !== "bound") {
    for (const blocker of input.binding.blockers) {
      blockers.add(`binding:${blocker}`);
    }
  }
  return [...blockers].sort();
}
