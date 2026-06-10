import type { LegalAction } from "@netgrid/shared";
import type {
  ActionAbilityBindingMethod,
  ActionGateResult,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticSourceKind,
  SideSafeActionAbilityBinding,
} from "../action-semantic-candidate";

export function applyCardActionSourceBinding(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
): ActionSemanticCandidate {
  const sourceCardId = sourceCardIdForAction(action);
  const abilityBinding = abilityBindingForAction(
    action,
    sourceCardId,
    sideSafeAbilityBindings,
  );
  const sourceKind: ActionSemanticSourceKind =
    sourceCardId !== undefined ? "card" : candidate.sourceKind;
  const projectionIssues = reconcileSourceAbilityIssues(
    candidate.projectionIssues,
    action,
    sourceCardId,
    abilityBinding,
  );

  return {
    ...candidate,
    sourceKind,
    ...(sourceCardId !== undefined ? { sourceCardId } : {}),
    ...(abilityBinding?.abilityId !== undefined
      ? { abilityId: abilityBinding.abilityId }
      : {}),
    abilityBindingMethod:
      abilityBinding?.method ?? candidate.abilityBindingMethod,
    projectionIssues,
    hardGates: updateSourceAbilityGates(
      candidate.hardGates,
      sourceCardId,
      abilityBinding,
      action,
    ),
    evidence: [
      ...candidate.evidence,
      ...(sourceCardId !== undefined
        ? [`AI038 source bound from LegalAction: ${sourceCardId}`]
        : []),
      ...(abilityBinding !== undefined ? abilityBinding.evidence : []),
    ],
  };
}

function sourceCardIdForAction(action: LegalAction): string | undefined {
  if (
    action.abilityRef?.sourceCardInstanceId !== undefined &&
    action.abilityRef.sourceCardInstanceId.length > 0
  ) {
    return action.abilityRef.sourceCardInstanceId;
  }
  if (action.source === "basic_action" || action.source === "game_rule") {
    return undefined;
  }
  return action.source;
}

type ResolvedAbilityBinding = {
  abilityId: string;
  method: ActionAbilityBindingMethod;
  evidence: string[];
};

function abilityBindingForAction(
  action: LegalAction,
  sourceCardId: string | undefined,
  sideSafeAbilityBindings: readonly SideSafeActionAbilityBinding[],
): ResolvedAbilityBinding | undefined {
  if (action.abilityRef?.abilityId) {
    return {
      abilityId: action.abilityRef.abilityId,
      method: "explicit_ability_id",
      evidence: [`AI038 abilityRef abilityId: ${action.abilityRef.abilityId}`],
    };
  }

  const payloadAbilityId = stringPayload(action, "abilityId");
  if (payloadAbilityId !== undefined) {
    return {
      abilityId: payloadAbilityId,
      method: "engine_payload",
      evidence: [`AI038 payload abilityId: ${payloadAbilityId}`],
    };
  }

  if (sourceCardId === undefined) return undefined;
  const matchingBindings = sideSafeAbilityBindings.filter(
    (binding) =>
      binding.actionId === action.actionId &&
      binding.sourceCardId === sourceCardId,
  );
  if (matchingBindings.length !== 1) return undefined;
  const [binding] = matchingBindings;
  if (!binding) return undefined;

  return {
    abilityId: binding.abilityId,
    method: binding.method,
    evidence: binding.evidence,
  };
}

function stringPayload(
  action: LegalAction,
  key: string,
): string | undefined {
  const value = action.payload?.[key];
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value;
}

function reconcileSourceAbilityIssues(
  currentIssues: readonly ActionProjectionIssue[],
  action: LegalAction,
  sourceCardId: string | undefined,
  abilityBinding: ResolvedAbilityBinding | undefined,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (requiresCardSource(action) && sourceCardId === undefined) {
    issues.add("source_unresolved");
  } else {
    issues.delete("source_unresolved");
  }

  if (requiresAbilityBinding(action) && abilityBinding === undefined) {
    issues.add("ability_unresolved");
  } else if (abilityBinding !== undefined || !requiresAbilityBinding(action)) {
    issues.delete("ability_unresolved");
  }

  return [...issues];
}

function requiresCardSource(action: LegalAction): boolean {
  return action.source !== "basic_action" && action.source !== "game_rule";
}

function requiresAbilityBinding(action: LegalAction): boolean {
  return [
    "activated_card_ability",
    "trigger_ability",
    "pump_breaker",
    "break_subroutine",
  ].includes(action.type);
}

function updateSourceAbilityGates(
  hardGates: ActionGateResult[],
  sourceCardId: string | undefined,
  abilityBinding: ResolvedAbilityBinding | undefined,
  action: LegalAction,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId === "source_resolution" && sourceCardId !== undefined) {
      return {
        ...gate,
        status: "pass",
        severity: "info",
        reason: "Source card was bound from LegalAction/abilityRef.",
        evidence: [sourceCardId],
      };
    }
    if (gate.gateId === "ability_resolution") {
      if (abilityBinding !== undefined) {
        return {
          ...gate,
          status: "pass",
          severity: "info",
          reason: `Ability bound by ${abilityBinding.method}.`,
          evidence: [abilityBinding.abilityId],
        };
      }
      if (!requiresAbilityBinding(action)) {
        return {
          ...gate,
          status: "not_applicable",
          severity: "info",
          reason: "This action type does not require card ability binding.",
        };
      }
    }
    return gate;
  });
}

