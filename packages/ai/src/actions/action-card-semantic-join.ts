import type {
  ActionCardSemanticProfile,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionTargetContext,
  TargetProfileMatch,
} from "../action-semantic-candidate";

export function applyCardSemanticJoin(
  candidate: ActionSemanticCandidate,
  cardSemanticProfilesByDefinitionId:
    | Readonly<Record<string, ActionCardSemanticProfile>>
    | undefined,
): ActionSemanticCandidate {
  if (cardSemanticProfilesByDefinitionId === undefined) return candidate;
  if (candidate.sourceKind !== "card") return candidate;
  if (candidate.sourceDefinitionId === undefined) {
    return {
      ...candidate,
      projectionIssues: [
        ...new Set([
          ...candidate.projectionIssues,
          "card_semantics_unavailable" as const,
        ]),
      ],
      evidence: [
        ...candidate.evidence,
        "AI041 card semantics unavailable: missing side-safe source definition",
      ],
    };
  }

  const profile = cardSemanticProfilesByDefinitionId[candidate.sourceDefinitionId];
  if (profile === undefined) {
    return {
      ...candidate,
      projectionIssues: [
        ...new Set([
          ...candidate.projectionIssues,
          "card_semantics_unavailable" as const,
        ]),
      ],
      evidence: [...candidate.evidence, "AI041 card semantics unavailable"],
    };
  }

  const abilitySemantics = profile.abilitySemantics ?? [];
  const matchingAbility = candidate.abilityId
    ? abilitySemantics.find((ability) => ability.abilityId === candidate.abilityId)
    : undefined;
  const singleAbility =
    abilitySemantics.length === 1 ? abilitySemantics[0] : undefined;
  const actionAbility =
    matchingAbility ??
    (candidate.abilityBindingMethod === "single_legal_ability_inferred"
      ? singleAbility
      : undefined);
  const abilityUnresolved =
    abilitySemantics.length > 1 && actionAbility === undefined;
  const profileLevelApplies = abilitySemantics.length === 0;
  const cardLevelContextSignals = cardContextSignalsFromProfile(
    profile.tacticSignals,
  );
  const cardLevelContextSignalSet = new Set(cardLevelContextSignals);
  const profileActionTacticSignals =
    profileLevelApplies || abilitySemantics.length === 1
      ? profile.tacticSignals.filter(
          (signal) => !cardLevelContextSignalSet.has(signal),
        )
      : [];
  const profileActionTacticSignalSet = new Set(profileActionTacticSignals);
  const cardContextSignals = uniqueStrings([
    ...candidate.cardContextSignals,
    ...cardLevelContextSignals,
  ]);
  const actionTacticSignals =
    actionAbility !== undefined || profileActionTacticSignals.length > 0
      ? uniqueStrings([
          ...candidate.actionTacticSignals,
          ...profileActionTacticSignals,
          ...(actionAbility?.tacticSignals ?? []),
        ])
      : candidate.actionTacticSignals;
  const compatibilitySignals = uniqueStrings([
    ...(candidate.compatibilitySignals ?? []),
    ...(profile.compatibilitySignals ?? []),
    ...(actionAbility?.compatibilitySignals ?? []),
    ...profile.tacticSignals.filter(
      (signal) =>
        !cardLevelContextSignalSet.has(signal) &&
        !profileActionTacticSignalSet.has(signal),
    ),
  ]);
  const projectionIssues = new Set(candidate.projectionIssues);
  projectionIssues.delete("card_semantics_unavailable");
  if (abilityUnresolved) projectionIssues.add("ability_unresolved");
  if (actionAbility !== undefined) projectionIssues.delete("ability_unresolved");
  const joinedTargetContext = targetContextWithSemanticMatches(
    candidate.targetContext,
    actionAbility?.targetProfileMatches ??
      (profileLevelApplies ? profile.targetProfileMatches : undefined),
  );
  const costProfile =
    actionAbility !== undefined && actionAbility.additionalCosts !== undefined
      ? {
          ...candidate.costProfile,
          additionalCosts: uniqueStrings([
            ...candidate.costProfile.additionalCosts,
            ...actionAbility.additionalCosts,
          ]),
        }
      : candidate.costProfile;

  return {
    ...candidate,
    costProfile,
    cardContextSignals,
    actionTacticSignals,
    ...(compatibilitySignals.length > 0 ? { compatibilitySignals } : {}),
    strategySupport: [
      ...candidate.strategySupport,
      ...(profileLevelApplies ? (profile.strategySupport ?? []) : []),
      ...(actionAbility?.strategySupport ?? []),
    ],
    conditions: [
      ...candidate.conditions,
      ...(profileLevelApplies ? (profile.conditions ?? []) : []),
      ...(actionAbility?.conditions ?? []),
    ],
    risks: [
      ...candidate.risks,
      ...(profileLevelApplies ? (profile.risks ?? []) : []),
      ...(actionAbility?.risks ?? []),
    ],
    constraints: [
      ...candidate.constraints,
      ...(profileLevelApplies ? (profile.constraints ?? []) : []),
      ...(actionAbility?.constraints ?? []),
    ],
    ...(joinedTargetContext !== undefined
      ? { targetContext: joinedTargetContext }
      : {}),
    projectionIssues: [...projectionIssues],
    evidence: [
      ...candidate.evidence,
      `AI041 card semantic profile joined: ${profile.cardId}`,
      ...(actionAbility !== undefined
        ? [`AI041 ability semantic joined: ${actionAbility.abilityId}`]
        : []),
      ...(compatibilitySignals.length > 0
        ? ["AI041 compatibility signals retained outside action scoring"]
        : []),
    ],
  };
}

function cardContextSignalsFromProfile(signals: readonly string[]): string[] {
  return signals.filter(
    (signal) =>
      signal.startsWith("card.context.") || signal.startsWith("remote_role:"),
  );
}

function targetContextWithSemanticMatches(
  targetContext: ActionTargetContext | undefined,
  targetProfileMatches: readonly TargetProfileMatch[] | undefined,
): ActionTargetContext | undefined {
  if (targetContext === undefined || targetProfileMatches === undefined) {
    return targetContext;
  }
  return {
    ...targetContext,
    targetProfileMatches: [
      ...targetContext.targetProfileMatches,
      ...targetProfileMatches,
    ],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
