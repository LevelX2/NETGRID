import { canonicalCapabilityId } from "@netgrid/cards/planning";
import { type CardDefinitionId } from "@netgrid/shared";
import { createAiHintsByCard, type AiCardHint } from "../ai-hints";
import type {
  ActionCardAbilitySemanticProfile,
  ActionCardSemanticProfile,
  SemanticCondition,
  SemanticConstraint,
  SemanticRisk,
  StrategySupportPair,
  TargetProfileMatch,
} from "../action-semantic-candidate";
import type {
  AiHintCondition,
  AiHintActionCapabilitySemantics,
  AiHintActionCapacityProfile,
  AiHintEffectTargetProfile,
  AiHintStructuredEffect,
  AiHintTargetProfileV1,
} from "../hint-ontology";

const AI_HINTS = createAiHintsByCard();
let cachedActionCardSemanticProfiles:
  | Readonly<Record<CardDefinitionId, ActionCardSemanticProfile>>
  | undefined;

type ExtendedAiCardHint = AiCardHint & {
  strategicRole?: string[];
  riskTags?: string[];
  tacticSignals?: string[];
  actionTacticSignals?: string[];
  actionCapacityProfiles?: AiHintActionCapacityProfile[];
};

export function buildActionCardSemanticProfilesByDefinitionId(): Readonly<
  Record<CardDefinitionId, ActionCardSemanticProfile>
> {
  if (cachedActionCardSemanticProfiles !== undefined) {
    return cachedActionCardSemanticProfiles;
  }
  const entries = [...AI_HINTS.entries()]
    .map(([cardId, hint]) => {
      const profile = actionCardSemanticProfileFromHint(cardId, hint);
      return profile ? ([cardId, profile] as const) : undefined;
    })
    .filter(
      (
        entry,
      ): entry is readonly [CardDefinitionId, ActionCardSemanticProfile] =>
        entry !== undefined,
    );
  cachedActionCardSemanticProfiles = deepFreeze(
    Object.fromEntries(entries) as Record<
      CardDefinitionId,
      ActionCardSemanticProfile
    >,
  );
  return cachedActionCardSemanticProfiles;
}

function actionCardSemanticProfileFromHint(
  cardId: string,
  hint: AiCardHint,
): ActionCardSemanticProfile | undefined {
  const extendedHint = hint as ExtendedAiCardHint;
  const abilitySemantics = (hint.actionCapabilitySemantics ?? []).map(
    (semantics) => abilitySemanticProfile(cardId, semantics),
  );
  const compatibilitySignals = uniqueStrings([
    ...(extendedHint.tacticSignals ?? []),
    ...(hint.functionSignals ?? []),
    ...hint.roles.map((role) => `role:${role}`),
    ...hint.planRoles.map((role) => `plan_role:${role}`),
    ...(hint.lineSupport ?? []).map((line) => `line_support:${line}`),
    ...(extendedHint.strategicRole ?? []).map(
      (role) => `strategic_role:${role}`,
    ),
  ]);
  return {
    cardId,
    functionalEffects: (hint.effects ?? []).map((effect) => ({ ...effect })),
    ...(hint.strategicExchangeKinds?.length
      ? { strategicExchangeKinds: [...hint.strategicExchangeKinds] }
      : {}),
    effectTargets: uniqueStrings(
      (hint.effects ?? [])
        .map(hintEffectTarget)
        .filter((target): target is string => target !== undefined),
    ),
    tacticSignals: uniqueStrings(extendedHint.actionTacticSignals ?? []),
    ...(compatibilitySignals.length > 0 ? { compatibilitySignals } : {}),
    strategySupport: strategySupportFromHint(hint),
    conditions: (hint.conditions ?? []).map(conditionFromHint),
    risks: riskTagsFromHint(hint),
    constraints: constraintsFromHint(hint),
    targetProfileMatches: (hint.targetProfiles ?? []).map(targetProfileMatch),
    ...(extendedHint.actionCapacityProfiles?.length
      ? {
          actionCapacityProfiles: extendedHint.actionCapacityProfiles.map(
            (profile) => ({
              ...profile,
              ...(profile.actionTypes
                ? { actionTypes: [...profile.actionTypes] }
                : {}),
            }),
          ),
        }
      : {}),
    ...(hint.actionPlanOwnerBindings?.length
      ? {
          actionPlanOwnerBindings: hint.actionPlanOwnerBindings.map(
            (binding) => ({ ...binding }),
          ),
        }
      : {}),
    ...(abilitySemantics.length > 0 ? { abilitySemantics } : {}),
  };
}

function hintEffectTarget(effect: AiHintStructuredEffect): string | undefined {
  return effect.target;
}

function strategySupportFromHint(hint: AiCardHint): StrategySupportPair[] {
  return strategySupportFromPairs(hint.actionStrategySupportPairs ?? []);
}

function strategySupportFromPairs(
  pairs: readonly NonNullable<
    AiCardHint["actionStrategySupportPairs"]
  >[number][],
): StrategySupportPair[] {
  return uniqueStrategySupportPairs(
    pairs.map((pair) => ({
      strategyId: pair.strategyId,
      role: pair.role,
      confidence: pair.confidence,
      evidence: pair.evidence.join("|"),
    })),
  );
}

function conditionFromHint(condition: AiHintCondition): SemanticCondition {
  return {
    kind: condition.kind,
    status: "not_evaluated",
    evidence: [`ai_hint_condition:${condition.kind}`],
  };
}

function riskTagsFromHint(hint: AiCardHint): SemanticRisk[] {
  const extendedHint = hint as ExtendedAiCardHint;
  return (extendedHint.riskTags ?? []).map((risk) => ({
    kind: risk,
    severity: "unknown",
    evidence: [`ai_hint_risk:${risk}`],
  }));
}

function abilitySemanticProfile(
  cardId: string,
  semantics: AiHintActionCapabilitySemantics,
): ActionCardAbilitySemanticProfile {
  const mechanicalSignals = (semantics.effects ?? []).flatMap((effect) => [
    `effect:${effect.kind}`,
    `effect_scope:${effect.scope}`,
    `effect_timing:${effect.timing}`,
  ]);
  return {
    abilityId: canonicalCapabilityId(
      cardId as CardDefinitionId,
      semantics.capabilityKey as Parameters<typeof canonicalCapabilityId>[1],
    ),
    tacticSignals: uniqueStrings([
      ...(semantics.functionSignals ?? []),
      ...mechanicalSignals,
    ]),
    ...(semantics.effects?.length
      ? {
          functionalEffects: semantics.effects.map((effect) => ({
            ...effect,
          })),
        }
      : {}),
    ...(semantics.strategySupportPairs?.length
      ? {
          strategySupport: strategySupportFromPairs(
            semantics.strategySupportPairs,
          ),
        }
      : {}),
    ...(semantics.conditions?.length
      ? { conditions: semantics.conditions.map(conditionFromHint) }
      : {}),
    ...(semantics.targetProfiles?.length
      ? {
          targetProfileMatches:
            semantics.targetProfiles.map(targetProfileMatch),
        }
      : {}),
  };
}

function constraintsFromHint(hint: AiCardHint): SemanticConstraint[] {
  return [
    ...(hint.breakerProfile?.restrictions ?? []).map((restriction) => ({
      kind: restriction,
      status: "not_evaluated" as const,
      evidence: [`ai_hint_breaker_restriction:${restriction}`],
    })),
  ];
}

function targetProfileMatch(
  profile: AiHintEffectTargetProfile | AiHintTargetProfileV1,
): TargetProfileMatch {
  if ("schemaVersion" in profile) {
    return {
      targetProfileId: `${profile.kind}:${profile.targetType}:${profile.purpose}`,
      status: "unknown",
      issues: [],
      evidence: [
        `ai_hint_target_profile:${profile.kind}:${profile.targetType}`,
        `ai_hint_target_hidden_info_policy:${profile.hiddenInfoPolicy}`,
      ],
    };
  }
  return {
    targetProfileId: `${profile.zone}:${profile.targetCardType ?? "any"}`,
    status: "unknown",
    issues: [],
    evidence: [`ai_hint_effect_target:${profile.zone}`],
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function uniqueStrategySupportPairs(
  pairs: readonly StrategySupportPair[],
): StrategySupportPair[] {
  const seen = new Set<string>();
  const result: StrategySupportPair[] = [];
  for (const pair of pairs) {
    const key = `${pair.strategyId}:${pair.role}:${pair.evidence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(pair);
  }
  return result;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    deepFreeze(nested);
  }
  Object.freeze(value);
  return value;
}
