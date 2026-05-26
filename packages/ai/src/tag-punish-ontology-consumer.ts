import type { LegalAction } from "@netgrid/shared";
import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import type {
  AiHintCondition,
  AiHintStructuredEffect,
  KnownHintConditionKind,
  KnownHintEffectKind,
} from "./hint-ontology";

const AI_HINTS = createAiHintsByCard();

export type StructuredTagPunishProfile = {
  tagSource: boolean;
  traceTagSource: boolean;
  payoff: boolean;
  requiresRunnerTagged: boolean;
  requiresTraceSuccess: boolean;
  effectKinds: KnownHintEffectKind[];
  conditionKinds: KnownHintConditionKind[];
  payoffKinds: StructuredTagPunishPayoffKind[];
  evidence: string[];
};

export type StructuredTagPunishPayoffKind =
  | "damage"
  | "economic"
  | "resource_trash"
  | "hardware_trash"
  | "scored_agenda_damage_like"
  | "scored_agenda_trace_tag_like"
  | "unknown";

export type StructuredTagPunishLegalActionAssessment = {
  profile: StructuredTagPunishProfile;
  sourceDefinitionId: string;
  isTagSource: boolean;
  isPunishPayoff: boolean;
  isTraceTagSource: boolean;
  playablePayoff: boolean;
  blockedByMissingTag: boolean;
  conflictWithLegacy: boolean;
  payoffKind: StructuredTagPunishPayoffKind;
  evidence: string[];
};

export function getStructuredTagPunishProfileForCard(
  cardId: string | undefined,
): StructuredTagPunishProfile | undefined {
  if (!cardId) return undefined;
  return tagPunishProfileFromHint(AI_HINTS.get(cardId));
}

export function classifyTagSourceFromOntology(
  cardIdOrHint: string | AiCardHint | undefined,
): StructuredTagPunishProfile | undefined {
  const profile =
    typeof cardIdOrHint === "string"
      ? getStructuredTagPunishProfileForCard(cardIdOrHint)
      : tagPunishProfileFromHint(cardIdOrHint);
  return profile?.tagSource ? profile : undefined;
}

export function classifyTagPunishPayoffFromOntology(
  cardIdOrHint: string | AiCardHint | undefined,
): StructuredTagPunishProfile | undefined {
  const profile =
    typeof cardIdOrHint === "string"
      ? getStructuredTagPunishProfileForCard(cardIdOrHint)
      : tagPunishProfileFromHint(cardIdOrHint);
  return profile?.payoff ? profile : undefined;
}

export function classifyTagPunishLegalActionFromOntology(
  action: LegalAction,
  sourceDefinitionId: string | undefined,
  visibleState: {
    runnerTagged: boolean;
    legacyRoles?: string[];
    scoredAgendaKind?: "trace_tag" | "damage_punish" | undefined;
  },
): StructuredTagPunishLegalActionAssessment | undefined {
  const profile = getStructuredTagPunishProfileForCard(sourceDefinitionId);
  if (!profile) return undefined;
  const legalActionCanCarryTagPunish = canActionCarryTagPunish(action);
  if (!legalActionCanCarryTagPunish) return undefined;

  const blockedByMissingTag =
    profile.payoff &&
    profile.requiresRunnerTagged &&
    visibleState.runnerTagged !== true;
  const isPunishPayoff = profile.payoff && !blockedByMissingTag;
  const isTagSource = profile.tagSource;
  const isTraceTagSource = profile.traceTagSource;
  const payoffKind = structuredPayoffKind(
    profile,
    visibleState.scoredAgendaKind,
  );
  const conflictWithLegacy = tagPunishOntologyConflictWithLegacy(
    profile,
    visibleState.legacyRoles ?? [],
  );
  return {
    profile,
    sourceDefinitionId: sourceDefinitionId ?? "",
    isTagSource,
    isPunishPayoff,
    isTraceTagSource,
    playablePayoff: isPunishPayoff,
    blockedByMissingTag,
    conflictWithLegacy,
    payoffKind,
    evidence: [
      "corp_tag_punish_ontology_profile_seen:true",
      ...(profile.tagSource
        ? ["corp_tag_source_ontology_profile_seen:true"]
        : []),
      ...(profile.payoff
        ? ["corp_tag_punish_payoff_ontology_profile_seen:true"]
        : []),
      ...profile.effectKinds.map(
        (kind) => `corp_tag_punish_ontology_kind:${kind}`,
      ),
      ...profile.conditionKinds.map(
        (kind) => `corp_tag_punish_condition:${kind}`,
      ),
      ...(isTagSource ? ["corp_tag_source_ontology_used:true"] : []),
      ...(isPunishPayoff ? ["corp_tag_punish_payoff_ontology_used:true"] : []),
      ...(profile.tagSource
        ? ["corp_tag_source_legal_action_classified_by_ontology:true"]
        : []),
      ...(isPunishPayoff
        ? [
            "corp_punish_legal_action_classified_by_ontology:true",
            "corp_punish_opportunity_confirmed_by_ontology:true",
          ]
        : []),
      ...(blockedByMissingTag
        ? ["corp_tag_punish_payoff_blocked_by_missing_visible_tag:true"]
        : []),
      ...(conflictWithLegacy ? ["corp_tag_punish_ontology_conflict:true"] : []),
    ],
  };
}

export function tagPunishOntologyConflictWithLegacy(
  profile: StructuredTagPunishProfile | undefined,
  legacyRoles: string[],
): boolean {
  if (!profile) return false;
  const legacyClaimsTag = legacyRoles.some(
    (role) =>
      role.includes("tag_source") ||
      role.includes("tag_enabler") ||
      role.includes("trace_tag") ||
      role === "trace" ||
      role === "trace_ice" ||
      role === "tag_ice",
  );
  const legacyClaimsPayoff = legacyRoles.some(
    (role) =>
      role.includes("tag_punishment") ||
      role.includes("damage_operation") ||
      role.includes("black_ops") ||
      role.includes("resource_trash") ||
      role.includes("hardware_trash"),
  );
  return (
    (profile.tagSource && legacyClaimsPayoff && !legacyClaimsTag) ||
    (profile.payoff && legacyClaimsTag && !legacyClaimsPayoff)
  );
}

function tagPunishProfileFromHint(
  hint: AiCardHint | undefined,
): StructuredTagPunishProfile | undefined {
  if (!hint) return undefined;
  const effects = hint.effects ?? [];
  const conditions = hint.conditions ?? [];
  const effectKinds = sortedUnique(
    effects.map((effect) => effect.kind).filter(isTagPunishRelevantEffectKind),
  );
  const conditionKinds = sortedUnique(
    conditions
      .map((condition) => condition.kind)
      .filter(isTagPunishRelevantConditionKind),
  );
  const tagSource = effects.some(isTagSourceEffect);
  const traceTagSource = effects.some(isTraceTagSourceEffect);
  const payoff = effects.some(isTagPunishPayoffEffect);
  if (!tagSource && !payoff && effectKinds.length === 0) return undefined;
  const requiresRunnerTagged = conditions.some(
    (condition) => condition.kind === "requires_runner_tagged",
  );
  const requiresTraceSuccess = conditions.some(
    (condition) => condition.kind === "requires_trace_success",
  );
  const payoffKinds = sortedUnique(
    effects
      .map(payoffKindForEffect)
      .filter(
        (kind): kind is StructuredTagPunishPayoffKind => kind !== undefined,
      ),
  );
  return {
    tagSource,
    traceTagSource,
    payoff,
    requiresRunnerTagged,
    requiresTraceSuccess,
    effectKinds,
    conditionKinds,
    payoffKinds,
    evidence: [
      ...effectKinds.map((kind) => `tag_punish_ontology_effect:${kind}`),
      ...conditionKinds.map((kind) => `tag_punish_ontology_condition:${kind}`),
    ],
  };
}

function canActionCarryTagPunish(action: LegalAction): boolean {
  return (
    action.type === "play_operation" ||
    action.type === "activated_card_ability" ||
    action.type === "trigger_ability" ||
    action.type === "trash_resource" ||
    action.type === "rez_ice"
  );
}

function isTagSourceEffect(effect: AiHintStructuredEffect): boolean {
  return (
    effect.kind === "tag_source" ||
    effect.kind === "tag" ||
    effect.kind === "trace"
  );
}

function isTraceTagSourceEffect(effect: AiHintStructuredEffect): boolean {
  return (
    effect.kind === "trace" ||
    (effect.kind === "tag_source" && effect.timing === "trace_success")
  );
}

function isTagPunishPayoffEffect(effect: AiHintStructuredEffect): boolean {
  return (
    effect.kind === "tag_punish_payoff" ||
    effect.kind === "damage" ||
    effect.kind === "resource_trash" ||
    effect.kind === "hardware_trash"
  );
}

function isTagPunishRelevantEffectKind(
  kind: KnownHintEffectKind,
): kind is KnownHintEffectKind {
  return (
    kind === "tag_source" ||
    kind === "tag_punish_payoff" ||
    kind === "trace" ||
    kind === "tag" ||
    kind === "damage" ||
    kind === "resource_trash" ||
    kind === "hardware_trash"
  );
}

function isTagPunishRelevantConditionKind(
  kind: KnownHintConditionKind,
): kind is KnownHintConditionKind {
  return kind === "requires_runner_tagged" || kind === "requires_trace_success";
}

function payoffKindForEffect(
  effect: AiHintStructuredEffect,
): StructuredTagPunishPayoffKind | undefined {
  if (effect.kind === "damage") return "damage";
  if (effect.kind === "resource_trash") return "resource_trash";
  if (effect.kind === "hardware_trash") return "hardware_trash";
  if (effect.kind !== "tag_punish_payoff") return undefined;
  if (effect.resource === "damage") return "damage";
  if (effect.resource === "credits") return "economic";
  return "unknown";
}

function structuredPayoffKind(
  profile: StructuredTagPunishProfile,
  scoredAgendaKind: "trace_tag" | "damage_punish" | undefined,
): StructuredTagPunishPayoffKind {
  if (scoredAgendaKind === "damage_punish") return "scored_agenda_damage_like";
  if (scoredAgendaKind === "trace_tag") return "scored_agenda_trace_tag_like";
  return profile.payoffKinds[0] ?? "unknown";
}

function sortedUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}
