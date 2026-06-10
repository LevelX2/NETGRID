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
  const cardContextSignals = uniqueStrings([
    ...candidate.cardContextSignals,
    ...profile.tacticSignals,
  ]);
  const actionTacticSignals =
    actionAbility !== undefined
      ? uniqueStrings([
          ...candidate.actionTacticSignals,
          ...actionAbility.tacticSignals,
        ])
      : candidate.actionTacticSignals;
  const projectionIssues = new Set(candidate.projectionIssues);
  projectionIssues.delete("card_semantics_unavailable");
  if (abilityUnresolved) projectionIssues.add("ability_unresolved");
  if (actionAbility !== undefined) projectionIssues.delete("ability_unresolved");
  const joinedTargetContext = targetContextWithSemanticMatches(
    candidate.targetContext,
    actionAbility?.targetProfileMatches ?? profile.targetProfileMatches,
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
    strategySupport:
      actionAbility !== undefined
        ? [...candidate.strategySupport, ...(actionAbility.strategySupport ?? [])]
        : candidate.strategySupport,
    conditions:
      actionAbility !== undefined
        ? [...candidate.conditions, ...(actionAbility.conditions ?? [])]
        : candidate.conditions,
    risks:
      actionAbility !== undefined
        ? [...candidate.risks, ...(actionAbility.risks ?? [])]
        : candidate.risks,
    constraints:
      actionAbility !== undefined
        ? [...candidate.constraints, ...(actionAbility.constraints ?? [])]
        : candidate.constraints,
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
    ],
  };
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
