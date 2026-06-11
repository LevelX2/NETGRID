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
  const sourceCardInstanceId = sourceCardInstanceIdForAction(action);
  const primitiveMetadata =
    cardImplementationPrimitiveMetadataForAction(action);
  const abilityBinding = abilityBindingForAction(
    action,
    sourceCardInstanceId,
    sideSafeAbilityBindings,
  );
  const sourceDefinitionId =
    sourceDefinitionIdForAction(action) ?? abilityBinding?.sourceDefinitionId;
  const sourceKind: ActionSemanticSourceKind =
    sourceCardInstanceId !== undefined ? "card" : candidate.sourceKind;
  const projectionIssues = reconcileSourceAbilityIssues(
    candidate.projectionIssues,
    action,
    sourceCardInstanceId,
    abilityBinding,
  );

  return {
    ...candidate,
    sourceKind,
    ...(sourceCardInstanceId !== undefined
      ? {
          sourceCardId: sourceCardInstanceId,
          sourceCardInstanceId,
        }
      : {}),
    ...(sourceDefinitionId !== undefined ? { sourceDefinitionId } : {}),
    ...(abilityBinding?.abilityId !== undefined
      ? { abilityId: abilityBinding.abilityId }
      : {}),
    ...(primitiveMetadata.abilityKey !== undefined
      ? { abilityKey: primitiveMetadata.abilityKey }
      : {}),
    ...(primitiveMetadata.primitiveKind !== undefined
      ? { primitiveKind: primitiveMetadata.primitiveKind }
      : {}),
    ...(primitiveMetadata.effectKind !== undefined
      ? { effectKind: primitiveMetadata.effectKind }
      : {}),
    abilityBindingMethod:
      abilityBinding?.method ?? candidate.abilityBindingMethod,
    projectionIssues,
    hardGates: updateSourceAbilityGates(
      candidate.hardGates,
      sourceCardInstanceId,
      abilityBinding,
      action,
    ),
    evidence: [
      ...candidate.evidence,
      ...(sourceCardInstanceId !== undefined
        ? [
            `AI038 source instance bound from LegalAction: ${sourceCardInstanceId}`,
          ]
        : []),
      ...(sourceDefinitionId !== undefined
        ? [
            `AI038 source definition bound from LegalAction: ${sourceDefinitionId}`,
          ]
        : []),
      ...(abilityBinding !== undefined ? abilityBinding.evidence : []),
      ...primitiveMetadata.evidence,
    ],
  };
}

function sourceCardInstanceIdForAction(
  action: LegalAction,
): string | undefined {
  if (
    action.abilityRef?.sourceCardInstanceId !== undefined &&
    action.abilityRef.sourceCardInstanceId.length > 0
  ) {
    return action.abilityRef.sourceCardInstanceId;
  }
  const payloadSourceCardId = stringPayload(action, "sourceCardId");
  if (payloadSourceCardId !== undefined) return payloadSourceCardId;
  if (action.source === "basic_action" || action.source === "game_rule") {
    return undefined;
  }
  return action.source;
}

type ResolvedAbilityBinding = {
  abilityId: string;
  method: ActionAbilityBindingMethod;
  sourceDefinitionId?: string;
  evidence: string[];
};

function abilityBindingForAction(
  action: LegalAction,
  sourceCardInstanceId: string | undefined,
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

  const cardImplementationAbilityId = stringPayload(
    action,
    "cardImplementationAbilityId",
  );
  if (cardImplementationAbilityId !== undefined) {
    return {
      abilityId: cardImplementationAbilityId,
      method: "engine_payload",
      evidence: [
        `AI038 payload cardImplementationAbilityId: ${cardImplementationAbilityId}`,
      ],
    };
  }

  if (sourceCardInstanceId === undefined) return undefined;
  const matchingBindings = sideSafeAbilityBindings.filter(
    (binding) =>
      binding.actionId === action.actionId &&
      (binding.sourceCardInstanceId ?? binding.sourceCardId) ===
        sourceCardInstanceId,
  );
  if (matchingBindings.length !== 1) return undefined;
  const [binding] = matchingBindings;
  if (!binding) return undefined;

  return {
    abilityId: binding.abilityId,
    method: binding.method,
    ...(binding.sourceDefinitionId !== undefined
      ? { sourceDefinitionId: binding.sourceDefinitionId }
      : {}),
    evidence: binding.evidence,
  };
}

function cardImplementationPrimitiveMetadataForAction(action: LegalAction): {
  abilityKey?: string;
  primitiveKind?: string;
  effectKind?: string;
  evidence: string[];
} {
  const abilityKey = stringPayload(action, "cardImplementationAbilityKey");
  const primitiveKind = stringPayload(
    action,
    "cardImplementationPrimitiveKind",
  );
  const effectKind = stringPayload(action, "cardImplementationEffectKind");
  return {
    ...(abilityKey !== undefined ? { abilityKey } : {}),
    ...(primitiveKind !== undefined ? { primitiveKind } : {}),
    ...(effectKind !== undefined ? { effectKind } : {}),
    evidence: [
      ...(abilityKey !== undefined
        ? [`AI038 payload cardImplementationAbilityKey: ${abilityKey}`]
        : []),
      ...(primitiveKind !== undefined
        ? [`AI038 payload cardImplementationPrimitiveKind: ${primitiveKind}`]
        : []),
      ...(effectKind !== undefined
        ? [`AI038 payload cardImplementationEffectKind: ${effectKind}`]
        : []),
    ],
  };
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value;
}

function sourceDefinitionIdForAction(action: LegalAction): string | undefined {
  return (
    stringPayload(action, "sourceDefinitionId") ??
    stringPayload(action, "sourceCardDefinitionId")
  );
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
  sourceCardInstanceId: string | undefined,
  abilityBinding: ResolvedAbilityBinding | undefined,
  action: LegalAction,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (
      gate.gateId === "source_resolution" &&
      sourceCardInstanceId !== undefined
    ) {
      return {
        ...gate,
        status: "pass",
        severity: "info",
        reason: "Source card was bound from LegalAction/abilityRef.",
        evidence: [sourceCardInstanceId],
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
