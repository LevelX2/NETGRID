import type { LegalAction } from "@netgrid/shared";
import type {
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionGateResult,
  ActionTargetContext,
  LegalTarget,
  LegalTargetSummary,
} from "../action-semantic-candidate";

export function applyTargetContextProjection(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  selectedTargets: Readonly<Record<string, string>> | undefined,
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionSemanticCandidate {
  const hasTargetRequirement =
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0;
  const hiddenTargetRequirement = action.targetRequirements.some(
    (requirement) => requirement.visibility === "engine_only",
  );

  if (!hasTargetRequirement && availableTargets === undefined) {
    return {
      ...candidate,
      hardGates: updateTargetContextGate(candidate.hardGates, "not_applicable"),
    };
  }

  const sideSafeSelectedTargets =
    hiddenTargetRequirement === true
      ? []
      : selectedLegalTargetsForAction(action, selectedTargets);
  const choiceOptionTargets = choiceOptionTargetsForAction(action);
  const sideSafeAvailableTargets =
    availableTargets !== undefined || choiceOptionTargets.length > 0
      ? [
          ...(availableTargets?.map((target) => ({
            ...target,
            evidence: [...target.evidence],
          })) ?? []),
          ...choiceOptionTargets,
        ]
      : undefined;
  const targetContext = targetContextForAction(
    action,
    sideSafeSelectedTargets,
    sideSafeAvailableTargets,
    hiddenTargetRequirement,
  );
  const hasProjectedTargetContext =
    targetContext.selectedTargets.length > 0 ||
    (targetContext.availableTargets?.length ?? 0) > 0;
  const projectionIssues = reconcileTargetProjectionIssues(
    candidate.projectionIssues,
    hasProjectedTargetContext,
    hasTargetRequirement,
    hiddenTargetRequirement,
  );

  return {
    ...candidate,
    targetContext,
    primaryProjectionStatus: hiddenTargetRequirement
      ? "hidden_info_blocked"
      : hasProjectedTargetContext
        ? candidate.primaryProjectionStatus
        : candidate.primaryProjectionStatus,
    projectionIssues,
    hardGates: updateTargetContextGate(
      candidate.hardGates,
      hasProjectedTargetContext ? "pass" : "unknown",
      hiddenTargetRequirement
        ? "TargetContext touches an engine-only target requirement and is not projected."
        : undefined,
    ),
    evidence: [
      ...candidate.evidence,
      ...(hasProjectedTargetContext
        ? ["AI039 target context projected from side-safe input"]
        : ["AI039 target context unavailable"]),
    ],
  };
}

function selectedLegalTargetsForAction(
  action: LegalAction,
  selectedTargets: Readonly<Record<string, string>> | undefined,
): LegalTarget[] {
  if (selectedTargets === undefined) return [];

  return Object.entries(selectedTargets).map(([requirementId, targetId]) => {
    const requirement = action.targetRequirements.find(
      (candidate) => candidate.id === requirementId,
    );
    return {
      targetId,
      targetKind: targetKindFromRequirement(requirement?.kind),
      targetSide: targetSideFromRequirement(requirement?.side),
      ...(requirement?.zoneScope?.[0] !== undefined
        ? { targetZone: requirement.zoneScope[0] }
        : {}),
      visibilityScope: "actor_private",
      evidence: [`AI039 selected target for requirement ${requirementId}`],
    };
  });
}

function choiceOptionTargetsForAction(
  action: LegalAction,
): LegalTargetSummary[] {
  return [
    ...new Set(
      (action.choiceRequirements ?? []).flatMap(
        (requirement) => requirement.optionIds,
      ),
    ),
  ]
    .sort()
    .map((optionId) => ({
      targetId: optionId,
      targetKind: "choice",
      targetSide: action.side,
      evidence: ["AI039 legal ChoiceRequirement option id"],
    }));
}

function targetContextForAction(
  action: LegalAction,
  selectedTargets: LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
  hiddenTargetRequirement: boolean,
): ActionTargetContext {
  const targetKind = firstTargetKind(action, selectedTargets, availableTargets);
  const targetZones = [
    ...new Set([
      ...selectedTargets.flatMap((target) =>
        target.targetZone !== undefined ? [target.targetZone] : [],
      ),
      ...(availableTargets?.flatMap((target) =>
        target.targetZone !== undefined ? [target.targetZone] : [],
      ) ?? []),
      ...action.targetRequirements.flatMap(
        (requirement) => requirement.zoneScope ?? [],
      ),
    ]),
  ];

  return {
    selectedTargets,
    ...(availableTargets !== undefined
      ? { availableTargets: [...availableTargets] }
      : {}),
    targetKind,
    targetZones,
    targetSide: firstTargetSide(action, selectedTargets, availableTargets),
    hiddenInfoPolicy: hiddenTargetRequirement
      ? "hidden_info_blocked"
      : "side_safe_engine_input_only",
    availableTargetsStatus:
      availableTargets !== undefined
        ? "engine_provided"
        : selectedTargets.length > 0
          ? "not_available"
          : "target_context_unavailable",
    targetProfileMatches: [],
    targetConstraintResults: [],
  };
}

function targetKindFromRequirement(
  kind: LegalAction["targetRequirements"][number]["kind"] | undefined,
): LegalTarget["targetKind"] {
  if (kind === "card") return "card";
  if (kind === "server") return "server";
  if (kind === "subroutine") return "subroutine";
  if (kind === "side") return "unknown";
  return "unknown";
}

function targetSideFromRequirement(
  side: LegalAction["targetRequirements"][number]["side"] | undefined,
): LegalTarget["targetSide"] {
  if (side === "runner" || side === "corp") return side;
  return "unknown";
}

function firstTargetKind(
  action: LegalAction,
  selectedTargets: readonly LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionTargetContext["targetKind"] {
  return (
    selectedTargets[0]?.targetKind ??
    availableTargets?.[0]?.targetKind ??
    targetKindFromRequirement(action.targetRequirements[0]?.kind)
  );
}

function firstTargetSide(
  action: LegalAction,
  selectedTargets: readonly LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
): ActionTargetContext["targetSide"] {
  return (
    selectedTargets[0]?.targetSide ??
    availableTargets?.[0]?.targetSide ??
    targetSideFromRequirement(action.targetRequirements[0]?.side)
  );
}

function reconcileTargetProjectionIssues(
  currentIssues: readonly ActionProjectionIssue[],
  hasProjectedTargetContext: boolean,
  hasTargetRequirement: boolean,
  hiddenTargetRequirement: boolean,
): ActionProjectionIssue[] {
  const issues = new Set(currentIssues);
  if (hiddenTargetRequirement) {
    issues.add("hidden_info_blocked");
    issues.delete("target_context_unavailable");
    return [...issues];
  }
  if (hasTargetRequirement && !hasProjectedTargetContext) {
    issues.add("target_context_unavailable");
  } else if (hasProjectedTargetContext) {
    issues.delete("target_context_unavailable");
  }
  return [...issues];
}

function updateTargetContextGate(
  hardGates: ActionGateResult[],
  status: ActionGateResult["status"],
  reason?: string,
): ActionGateResult[] {
  return hardGates.map((gate) => {
    if (gate.gateId !== "target_context") return gate;
    return {
      ...gate,
      status,
      severity:
        status === "pass" || status === "not_applicable" ? "info" : "warning",
      reason:
        reason ??
        (status === "pass"
          ? "TargetContext was projected from side-safe selected or engine-provided targets."
          : status === "not_applicable"
            ? "LegalAction has no target or choice requirement."
            : "TargetContext is not side-safe available."),
    };
  });
}
