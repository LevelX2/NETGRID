import type { LegalAction } from "@netgrid/shared";
import type {
  ActionProjectionIssue,
  ActionRunProjectionSummary,
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
  const payloadTargets = hiddenTargetRequirement
    ? []
    : payloadTargetsForAction(action);

  if (
    !hasTargetRequirement &&
    availableTargets === undefined &&
    payloadTargets.length === 0
  ) {
    const runProjectionSummary = runProjectionSummaryFromAction(action);
    return {
      ...candidate,
      ...(runProjectionSummary ? { runProjectionSummary } : {}),
      hardGates: updateTargetContextGate(candidate.hardGates, "not_applicable"),
    };
  }

  const sideSafeSelectedTargets =
    hiddenTargetRequirement === true
      ? []
      : selectedLegalTargetsForAction(action, selectedTargets);
  const requirementTargets = hiddenTargetRequirement
    ? []
    : requirementTargetsForAction(action);
  const choiceOptionTargets = choiceOptionTargetsForAction(action);
  const sideSafeAvailableTargets = hiddenTargetRequirement
    ? undefined
    : availableTargets !== undefined ||
        requirementTargets.length > 0 ||
        choiceOptionTargets.length > 0 ||
        payloadTargets.length > 0
      ? uniqueLegalTargetSummaries([
          ...(availableTargets?.map(cloneLegalTargetSummary) ?? []),
          ...requirementTargets,
          ...choiceOptionTargets,
          ...payloadTargets,
        ])
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
  const primaryProjectionStatus = targetProjectionStatusForAction(
    action,
    candidate,
    hasProjectedTargetContext,
    hiddenTargetRequirement,
    projectionIssues,
  );
  const runProjectionSummary =
    runProjectionSummaryFromAction(action, targetContext) ??
    candidate.runProjectionSummary;

  return {
    ...candidate,
    targetContext,
    ...(runProjectionSummary ? { runProjectionSummary } : {}),
    primaryProjectionStatus,
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

function targetProjectionStatusForAction(
  action: LegalAction,
  candidate: ActionSemanticCandidate,
  hasProjectedTargetContext: boolean,
  hiddenTargetRequirement: boolean,
  projectionIssues: readonly ActionProjectionIssue[],
): ActionSemanticCandidate["primaryProjectionStatus"] {
  if (hiddenTargetRequirement) return "hidden_info_blocked";
  if (
    candidate.primaryProjectionStatus === "partial_projected" &&
    hasProjectedTargetContext &&
    projectionIssues.length === 0 &&
    targetContextCompletesPartialProjection(action)
  ) {
    return "projected";
  }
  return candidate.primaryProjectionStatus;
}

function targetContextCompletesPartialProjection(action: LegalAction): boolean {
  return [
    "resolve_choice",
    "trash_accessed_card",
    "trash_resource",
    "rez_ice",
    "advance_card",
    "score_agenda",
  ].includes(action.type);
}

function normalizeServerId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase().replace(/^server[:.]/, "");
  if (normalized === "hq") return "hq";
  if (
    normalized === "rd" ||
    normalized === "rnd" ||
    normalized === "r&d" ||
    normalized === "r_d"
  ) {
    return "rd";
  }
  if (normalized === "archives") return "archives";
  if (normalized.startsWith("remote_")) return normalized;
  return undefined;
}

function stringPayload(action: LegalAction, key: string): string | undefined {
  const value = action.payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberPayload(action: LegalAction, key: string): number | undefined {
  const value = action.payload?.[key];
  return typeof value === "number" ? value : undefined;
}

function hardwareTrashByCounterAction(action: LegalAction): boolean {
  return (
    action.type === "play_operation" &&
    numberPayload(action, "hardwareTrashByCounterTrashCount") !== undefined
  );
}

function serverKindForId(
  serverId: string,
): NonNullable<ActionRunProjectionSummary["serverKind"]> | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function runProjectionSummaryFromAction(
  action: LegalAction,
  targetContext?: ActionTargetContext,
): ActionRunProjectionSummary | undefined {
  const payloadServerId = normalizeServerId(action.payload?.serverId);
  if (payloadServerId) {
    return buildRunProjectionSummary(
      payloadServerId,
      "legal_action_payload",
      [`run_projection_summary_payload_server:${payloadServerId}`],
    );
  }
  const targetServerId = [
    ...(targetContext?.selectedTargets ?? []),
    ...(targetContext?.availableTargets ?? []),
  ]
    .filter((target) => target.targetKind === "server")
    .map((target) => normalizeServerId(target.targetId))
    .find((serverId): serverId is string => serverId !== undefined);
  if (!targetServerId) return undefined;
  return buildRunProjectionSummary(targetServerId, "target_context", [
    `run_projection_summary_target_context:${targetServerId}`,
  ]);
}

function buildRunProjectionSummary(
  serverId: string,
  source: ActionRunProjectionSummary["source"],
  evidence: string[],
): ActionRunProjectionSummary {
  const serverKind = serverKindForId(serverId);
  return {
    serverId,
    ...(serverKind ? { serverKind } : {}),
    source,
    evidence,
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

function requirementTargetsForAction(action: LegalAction): LegalTargetSummary[] {
  return action.targetRequirements.flatMap((requirement): LegalTargetSummary[] => {
    if (requirement.visibility === "engine_only") return [];
    if (requirement.kind === "server") {
      return (requirement.allowedServers ?? []).map((serverId) => ({
        targetId: serverId,
        targetKind: "server" as const,
        targetSide: "corp" as const,
        evidence: [`AI039 legal target server from requirement ${requirement.id}`],
      }));
    }
    if (requirement.sourceIceRef !== undefined) {
      return [
        {
          targetId: requirement.sourceIceRef,
          targetKind: "ice" as const,
          targetSide: requirement.side ?? ("corp" as const),
          ...(requirement.zoneScope?.[0] !== undefined
            ? { targetZone: requirement.zoneScope[0] }
            : {}),
          evidence: [`AI039 legal target ice from requirement ${requirement.id}`],
        },
      ];
    }
    return [];
  });
}

function payloadTargetsForAction(action: LegalAction): LegalTargetSummary[] {
  const targets: LegalTargetSummary[] = [];
  const serverId = normalizeServerId(action.payload?.serverId);
  if (serverId !== undefined) {
    targets.push({
      targetId: serverId,
      targetKind: "server",
      targetSide: "corp",
      targetZone: serverId,
      evidence: [`AI039 legal action payload server target: ${serverId}`],
    });
  }

  const cardTarget = cardPayloadTargetForAction(
    action,
    stringPayload(action, "cardId"),
  );
  if (cardTarget !== undefined) targets.push(cardTarget);

  const iceTarget = icePayloadTargetForAction(
    action,
    stringPayload(action, "iceId"),
  );
  if (iceTarget !== undefined) targets.push(iceTarget);

  return targets;
}

function cardPayloadTargetForAction(
  action: LegalAction,
  cardId: string | undefined,
): LegalTargetSummary | undefined {
  if (cardId === undefined) return undefined;
  if (action.type === "score_agenda") {
    return {
      targetId: cardId,
      targetKind: "agenda",
      targetSide: "corp",
      evidence: [`AI039 legal action payload agenda target: ${cardId}`],
    };
  }
  if (
    action.type === "advance_card" ||
    action.type === "trash_accessed_card"
  ) {
    return {
      targetId: cardId,
      targetKind: "card",
      targetSide: "corp",
      evidence: [`AI039 legal action payload card target: ${cardId}`],
    };
  }
  if (action.type === "trash_resource") {
    return {
      targetId: cardId,
      targetKind: "resource",
      targetSide: "runner",
      evidence: [`AI039 legal action payload resource target: ${cardId}`],
    };
  }
  if (action.type === "rez_ice") {
    return {
      targetId: cardId,
      targetKind: "ice",
      targetSide: "corp",
      evidence: [`AI039 legal action payload ice target: ${cardId}`],
    };
  }
  return undefined;
}

function icePayloadTargetForAction(
  action: LegalAction,
  iceId: string | undefined,
): LegalTargetSummary | undefined {
  if (iceId === undefined) return undefined;
  if (action.type === "break_subroutine") {
    const subroutineIndex = numberPayload(action, "subroutineIndex");
    return {
      targetId:
        subroutineIndex !== undefined
          ? `${iceId}:subroutine:${subroutineIndex}`
          : iceId,
      targetKind: "subroutine",
      targetSide: "corp",
      evidence: [
        subroutineIndex !== undefined
          ? `AI039 legal action payload subroutine target: ${iceId}:${subroutineIndex}`
          : `AI039 legal action payload subroutine target ice: ${iceId}`,
      ],
    };
  }
  if (action.type === "rez_ice") {
    return {
      targetId: iceId,
      targetKind: "ice",
      targetSide: "corp",
      evidence: [`AI039 legal action payload ice target: ${iceId}`],
    };
  }
  return undefined;
}

function uniqueLegalTargetSummaries(
  targets: readonly LegalTargetSummary[],
): LegalTargetSummary[] {
  const byKey = new Map<string, LegalTargetSummary>();
  for (const target of targets) {
    const key = [
      target.targetId,
      target.targetKind,
      target.targetSide,
      target.targetZone ?? "",
    ].join("|");
    const existing = byKey.get(key);
    byKey.set(
      key,
      existing === undefined ? cloneLegalTargetSummary(target) : mergeTargets(existing, target),
    );
  }
  return [...byKey.values()];
}

function cloneLegalTargetSummary(
  target: LegalTargetSummary,
): LegalTargetSummary {
  return {
    ...target,
    ...(target.targetSubtypes !== undefined
      ? { targetSubtypes: [...target.targetSubtypes] }
      : {}),
    ...(target.targetConstraints !== undefined
      ? { targetConstraints: [...target.targetConstraints] }
      : {}),
    evidence: [...target.evidence],
  };
}

function mergeTargets(
  existing: LegalTargetSummary,
  next: LegalTargetSummary,
): LegalTargetSummary {
  const targetSubtypes = uniqueOptionalStrings([
    ...(existing.targetSubtypes ?? []),
    ...(next.targetSubtypes ?? []),
  ]);
  const targetConstraints = uniqueOptionalStrings([
    ...(existing.targetConstraints ?? []),
    ...(next.targetConstraints ?? []),
  ]);
  return {
    ...existing,
    ...(existing.targetDefinitionId ?? next.targetDefinitionId
      ? {
          targetDefinitionId:
            existing.targetDefinitionId ?? next.targetDefinitionId,
        }
      : {}),
    ...(existing.targetTitle ?? next.targetTitle
      ? { targetTitle: existing.targetTitle ?? next.targetTitle }
      : {}),
    ...(targetSubtypes !== undefined ? { targetSubtypes } : {}),
    ...(targetConstraints !== undefined ? { targetConstraints } : {}),
    evidence: [...new Set([...existing.evidence, ...next.evidence])],
  };
}

function uniqueOptionalStrings(values: readonly string[]): string[] | undefined {
  const unique = [...new Set(values.filter((value) => value.length > 0))];
  return unique.length > 0 ? unique : undefined;
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
    targetConstraintResults: targetConstraintResultsForAction(
      action,
      selectedTargets,
      availableTargets,
      hiddenTargetRequirement,
    ),
  };
}

function targetConstraintResultsForAction(
  action: LegalAction,
  selectedTargets: readonly LegalTarget[],
  availableTargets: readonly LegalTargetSummary[] | undefined,
  hiddenTargetRequirement: boolean,
): ActionTargetContext["targetConstraintResults"] {
  if (hiddenTargetRequirement) {
    return [
      {
        constraintId: "engine_only_target_blocked",
        status: "block",
        reason: "Engine-only target requirements are not projected into TargetContext.",
        evidence: ["target_context_constraint:engine_only_target_blocked"],
      },
    ];
  }
  if (!hardwareTrashByCounterAction(action)) {
    return [];
  }
  const targets = [...selectedTargets, ...(availableTargets ?? [])];
  const cyberneticsTargets = targets.filter((target) =>
    targetHasSubtype(target, "cybernetics"),
  );
  if (cyberneticsTargets.length > 0) {
    return [
      {
        constraintId: "not_cybernetics",
        status: "block",
        reason: "Cybernetics hardware is excluded from this legal target set.",
        evidence: cyberneticsTargets.map(
          (target) => `target_constraint:not_cybernetics_block:${target.targetId}`,
        ),
      },
    ];
  }
  if (targets.length === 0) {
    return [
      {
        constraintId: "not_cybernetics",
        status: "unknown",
        reason: "No side-safe hardware targets were projected for the subtype constraint.",
        evidence: ["target_constraint:not_cybernetics:available_targets_missing"],
      },
    ];
  }
  return [
    {
      constraintId: "not_cybernetics",
      status: "pass",
      reason: "Projected hardware targets are side-safe and exclude Cybernetics.",
      evidence: [
        "target_constraint:not_cybernetics:side_safe_target_set",
        ...targets.map((target) => `target_constraint_target:${target.targetId}`),
      ],
    },
  ];
}

function targetHasSubtype(
  target: Pick<LegalTargetSummary, "targetSubtypes">,
  subtype: string,
): boolean {
  return (
    target.targetSubtypes?.some(
      (candidate) => candidate.toLowerCase() === subtype,
    ) === true
  );
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
