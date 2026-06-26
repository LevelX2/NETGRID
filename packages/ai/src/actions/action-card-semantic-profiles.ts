import {
  DEMO_CARDS_BY_ID,
  type AbilityDefinition,
  type CardDefinitionId,
} from "@netgrid/shared";
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
  cachedActionCardSemanticProfiles = Object.fromEntries(entries) as Record<
    CardDefinitionId,
    ActionCardSemanticProfile
  >;
  return cachedActionCardSemanticProfiles;
}

function actionCardSemanticProfileFromHint(
  cardId: string,
  hint: AiCardHint,
): ActionCardSemanticProfile | undefined {
  const extendedHint = hint as ExtendedAiCardHint;
  const effectSignals = (hint.effects ?? []).flatMap(effectTacticSignals);
  const abilitySemantics = (DEMO_CARDS_BY_ID[cardId]?.abilities ?? []).map(
    abilitySemanticProfile,
  );
  return {
    cardId,
    tacticSignals: uniqueStrings([
      ...hint.roles.map((role) => `role:${role}`),
      ...hint.planRoles.map((role) => `plan_role:${role}`),
      ...(hint.lineSupport ?? []).map((line) => `line_support:${line}`),
      ...(extendedHint.strategicRole ?? []).map(
        (role) => `strategic_role:${role}`,
      ),
      ...(extendedHint.riskTags ?? []).map((risk) => `risk:${risk}`),
      ...effectSignals,
      ...(hint.remoteRole ? [`remote_role:${hint.remoteRole.kind}`] : []),
    ]),
    strategySupport: strategySupportFromHint(hint),
    conditions: (hint.conditions ?? []).map(conditionFromHint),
    risks: riskTagsFromHint(hint),
    constraints: constraintsFromHint(hint),
    targetProfileMatches: (hint.targetProfiles ?? []).map(targetProfileMatch),
    ...(abilitySemantics.length > 0 ? { abilitySemantics } : {}),
  };
}

function strategySupportFromHint(hint: AiCardHint): StrategySupportPair[] {
  const extendedHint = hint as ExtendedAiCardHint;
  return uniqueStrings([
    ...(hint.lineSupport ?? []),
    ...(extendedHint.strategicRole ?? []),
  ]).map((strategyId) => ({
    strategyId,
    role: hint.roles[0] ?? hint.planRoles[0] ?? "support",
    confidence: "medium",
    evidence: "ai_hint_semantic_profile",
  }));
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
  ability: AbilityDefinition,
): ActionCardAbilitySemanticProfile {
  return {
    abilityId: ability.id,
    tacticSignals: uniqueStrings([
      `ability.type:${ability.type}`,
      ...(ability.publicActionType
        ? [`ability.action_type:${ability.publicActionType}`]
        : []),
      ...(ability.iceSubtype ? [`ability.ice_subtype:${ability.iceSubtype}`] : []),
    ]),
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

function effectTacticSignals(effect: AiHintStructuredEffect): string[] {
  const scopeSuffix = effect.scope ? `.${effect.scope}` : "";
  const base = [
    `effect:${effect.kind}`,
    `effect_timing:${effect.timing}`,
    `effect_scope:${effect.scope}`,
  ];
  switch (effect.kind) {
    case "economy":
    case "action_economy":
    case "start_of_turn_economy":
    case "recurring_economy":
    case "counter_economy":
    case "advanceable_economy":
    case "finite_economy_pool":
      return [...base, "economy.card"];
    case "draw":
    case "shuffle_draw":
      return [...base, "draw.card"];
    case "search":
      return [...base, "setup.search"];
    case "breaker":
      return [...base, "coverage.breaker"];
    case "tag":
    case "tag_source":
      return [...base, "tag.source"];
    case "trace":
      return [...base, "trace.source"];
    case "trace_credit":
      return [...base, "trace.credit_support"];
    case "tag_punish_payoff":
      return [...base, "tag.payoff", "punish.payoff"];
    case "damage":
      return [
        ...base,
        effect.resource === "meat_damage"
          ? "damage.corp_tagged_meat_payoff"
          : `damage.payoff${scopeSuffix}`,
      ];
    case "program_trash":
      return [...base, "target.runner_program_trash"];
    case "hardware_trash":
      return [...base, "target.runner_hardware_trash"];
    case "resource_trash":
      return [...base, "target.runner_resource_trash"];
    case "access_punish":
      return [...base, "access.corp_access_punish", "punish.payoff"];
    case "ambush":
      return [...base, "access.corp_ambush", "punish.payoff"];
    case "score_acceleration":
    case "scored_agenda_action":
    case "advance":
    case "advance_burst":
      return [...base, "corp.score_progress", "corp.score_closeout"];
    case "remote_protection":
    case "remote_build":
    case "remote_tax":
      return [...base, "corp.remote_protection"];
    case "etr":
    case "run_tax":
      return [...base, "corp.ice_protection"];
    case "multiaccess":
    case "topdeck_info":
    case "hq_info":
      return [...base, "access.payoff"];
    case "damage_prevention":
    case "flatline_prevention":
    case "tag_prevention":
    case "trace_defense":
    case "survival_payoff":
      return [...base, "survival.defense"];
    default:
      return base;
  }
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
