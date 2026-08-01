import type {
  ActionCardSemanticProfile,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionTargetContext,
  TargetProfileMatch,
} from "../action-semantic-candidate-types";
import type { AiHintActionCapacityProfile } from "../hint-ontology";
import type { AiHintStructuredEffect } from "../hint-ontology";

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

  const profile =
    cardSemanticProfilesByDefinitionId[candidate.sourceDefinitionId];
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
    ? abilitySemantics.find(
        (ability) => ability.abilityId === candidate.abilityId,
      )
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
  if (actionAbility !== undefined)
    projectionIssues.delete("ability_unresolved");
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
  const effectTargets = uniqueStrings([
    ...(candidate.effectTargets ?? []),
    ...(profile.effectTargets ?? []),
  ]);
  const functionalEffects = uniqueFunctionalEffects([
    ...(candidate.functionalEffects ?? []),
    ...(profile.functionalEffects ?? []),
  ]);
  const actionCapacityProjection = actionCapacityProjectionWithHintContract(
    candidate,
    profile.actionCapacityProfiles,
  );

  return {
    ...candidate,
    ...(actionCapacityProjection !== undefined
      ? { actionCapacityProjection }
      : {}),
    costProfile,
    ...(functionalEffects.length > 0 ? { functionalEffects } : {}),
    ...(effectTargets.length > 0 ? { effectTargets } : {}),
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

function actionCapacityProjectionWithHintContract(
  candidate: ActionSemanticCandidate,
  profiles: readonly AiHintActionCapacityProfile[] | undefined,
): ActionSemanticCandidate["actionCapacityProjection"] {
  const projection = candidate.actionCapacityProjection;
  if (!projection || !profiles?.length) return projection;
  const relevantProfiles = profiles.filter(
    (profile) => profile.recipient === candidate.actorSide,
  );
  if (relevantProfiles.length === 0) return projection;
  const matching = relevantProfiles.find((profile) =>
    actionCapacityHintMatchesProjection(profile, projection),
  );
  if (!matching) {
    return {
      ...projection,
      evidence: [
        ...projection.evidence,
        "hint_contract:action_capacity_mismatch",
        "hint_contract:legal_action_remains_authoritative",
      ],
    };
  }
  return {
    ...projection,
    repeatable: matching.repeatable,
    bankable: matching.bankable,
    evidence: [
      ...projection.evidence,
      "hint_contract:action_capacity_confirmed",
      `hint_contract:class:${matching.class}`,
      `hint_contract:bankable:${matching.bankable}`,
      `hint_contract:repeatable:${matching.repeatable}`,
    ],
  };
}

function actionCapacityHintMatchesProjection(
  profile: AiHintActionCapacityProfile,
  projection: NonNullable<ActionSemanticCandidate["actionCapacityProjection"]>,
): boolean {
  if (projection.source === "unknown") return false;
  if (!hintClassMatchesProjection(profile, projection)) return false;
  if (profile.timing !== projection.timing) return false;
  if (profile.restriction !== projection.restriction) return false;
  if (
    profile.reliability !== projection.reliability &&
    !(profile.reliability === "mandatory" &&
      projection.reliability === "guaranteed")
  ) {
    return false;
  }
  if (
    profile.amountKind === "fixed" &&
    profile.amount !== undefined &&
    profile.amount !== projectedActionCapacityAmount(projection)
  ) {
    return false;
  }
  return (
    !profile.actionTypes?.length ||
    profile.actionTypes.every((actionType) =>
      projection.allowedActionTypes.includes(actionType),
    )
  );
}

function hintClassMatchesProjection(
  profile: AiHintActionCapacityProfile,
  projection: NonNullable<ActionSemanticCandidate["actionCapacityProjection"]>,
): boolean {
  switch (profile.class) {
    case "immediate_gain":
      return projection.kind === "immediate_unrestricted_gain";
    case "restricted_gain":
      return projection.kind === "immediate_restricted_gain";
    case "future_recurring_gain":
    case "recurring_gain":
      return projection.kind === "future_recurring_gain";
    case "action_debt":
    case "action_loss":
    case "action_cost":
    case "action_lock":
      return projection.kind === "action_debt";
    case "finite_bank":
    case "random_gain":
    case "mandatory_gain":
      return false;
  }
}

function projectedActionCapacityAmount(
  projection: NonNullable<ActionSemanticCandidate["actionCapacityProjection"]>,
): number {
  if (projection.kind === "action_debt") return projection.actionDebt;
  if (projection.kind === "future_recurring_gain") {
    return projection.gainAmountPerTurn ?? 0;
  }
  return projection.grossActionsGained;
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

function uniqueFunctionalEffects(
  effects: readonly AiHintStructuredEffect[],
): AiHintStructuredEffect[] {
  const bySignature = new Map<string, AiHintStructuredEffect>();
  for (const effect of effects) {
    const signature = JSON.stringify([
      effect.kind,
      effect.timing,
      effect.scope,
      effect.resource ?? null,
      effect.amount ?? null,
      effect.amountKind ?? null,
      effect.economyMode ?? null,
      effect.target ?? null,
      effect.repeatable ?? null,
      effect.finite ?? null,
    ]);
    if (!bySignature.has(signature)) bySignature.set(signature, { ...effect });
  }
  return [...bySignature.values()];
}
