import type { AccessIntent, AccessTargetKind } from "./access-decision-types";

export type AccessDecisionInvariantInput = {
  target: AccessTargetKind;
  intendedAccessAction: AccessIntent;
  trashCost?: number;
  stealCost?: number;
  generalTrashCost?: number;
  targetChoiceWouldSelect?: {
    selectedChoicesCreated: boolean;
    selectedTargetsCreated: boolean;
  };
};

export function assertAccessDecisionInvariants(
  input: AccessDecisionInvariantInput,
): void {
  const violations = accessDecisionInvariantViolations(input);
  if (violations.length === 0) return;
  throw new Error(
    `Access decision invariant violation: ${violations.join(", ")}`,
  );
}

export function accessDecisionInvariantViolations(
  input: AccessDecisionInvariantInput,
): string[] {
  const violations: string[] = [];
  if (input.intendedAccessAction === "steal" && input.target !== "agenda") {
    violations.push("steal_requires_agenda_target");
  }
  if (input.target === "agenda" && input.intendedAccessAction === "trash") {
    violations.push("agenda_cannot_be_trashed");
  }
  if (
    input.stealCost !== undefined &&
    input.stealCost > 0 &&
    input.intendedAccessAction !== "steal"
  ) {
    violations.push("steal_cost_requires_steal_intent");
  }
  if (
    input.trashCost !== undefined &&
    input.trashCost > 0 &&
    input.generalTrashCost === 0 &&
    input.intendedAccessAction !== "trash"
  ) {
    violations.push("free_trash_requires_trash_intent");
  }
  if (
    input.trashCost !== undefined &&
    input.generalTrashCost !== undefined &&
    input.generalTrashCost < input.trashCost &&
    input.intendedAccessAction !== "trash"
  ) {
    violations.push("trash_cost_waiver_requires_trash_intent");
  }
  if (
    input.intendedAccessAction === "decline" &&
    input.targetChoiceWouldSelect?.selectedChoicesCreated === true
  ) {
    violations.push("dry_run_must_not_create_selected_choices");
  }
  if (input.targetChoiceWouldSelect?.selectedTargetsCreated === true) {
    violations.push("dry_run_must_not_create_selected_targets");
  }
  return violations;
}
