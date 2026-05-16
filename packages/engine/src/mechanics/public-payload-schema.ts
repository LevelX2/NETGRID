import {
  LEGACY_ABILITY_PAYLOAD_FIELDS,
  type ActionType,
  type EventVisibilityClass,
} from "@netgrid/shared";

export type AbilityFamily =
  | "agenda-scoring"
  | "damage-prevention"
  | "hidden-zone"
  | "hosting-counters"
  | "payment-costs"
  | "random-effects"
  | "run-access"
  | "trace-tags";

export type PublicAbilitySchemaContext = {
  abilityFamily?: AbilityFamily;
  abilityId?: string;
  effectKind?: string;
  sourceDefinitionId?: string;
  amounts?: Record<string, number>;
  targets?: Record<string, string | number | boolean>;
  visibility?: {
    class: EventVisibilityClass;
    hiddenZoneBarrier?: boolean;
    redactedKind?: string;
  };
};

const AMOUNT_KEYS = [
  "amount",
  "gainedActions",
  "gainedCredits",
  "gainCreditsAmount",
  "damageAmount",
  "baseDamageAmount",
  "preventedAmount",
  "finalAmount",
  "removedTags",
  "tagsAdded",
  "runnerTagsAfter",
  "addedCounterAmount",
  "removedCounterAmount",
  "remainingCounters",
  "recurringCreditsLoaded",
  "paidCredits",
  "rezCostPaid",
  "trashCostPaid",
  "agendaPointCost",
  "agendaPointCostPaid",
  "temporaryCreditsProvided",
  "temporaryCreditsSpent",
  "temporaryCreditsRemaining",
  "corpCreditsAfter",
  "runnerCreditsAfter",
  "randomRoll",
  "dieRoll",
  "randomCounterAfter",
] as const;

const TARGET_KEYS = [
  "sourceDefinitionId",
  "cardDefinitionId",
  "targetCardDefinitionId",
  "targetIceDefinitionId",
  "trashedCardDefinitionId",
  "installedProgramDefinitionId",
  "returnedCardDefinitionId",
  "hostDefinitionId",
  "serverLabel",
  "targetServerLabel",
  "targetVisibility",
  "choiceVisibility",
  "redactedKind",
] as const;

export function buildPublicAbilitySchemaContext(
  actionType: ActionType,
  payload: Record<string, unknown> | undefined,
  context: Record<string, unknown>,
  visibilityClass: EventVisibilityClass,
): PublicAbilitySchemaContext {
  const combined = { ...(payload ?? {}), ...context };
  const abilityId = stringValue(combined.abilityId) ?? legacyAbilityId(combined);
  const hiddenZoneAction = stringValue(combined.hiddenZoneAction);
  const inferredAbilityId = abilityId ?? hiddenZoneAction;
  const family = stringValue(combined.abilityFamily) as AbilityFamily | undefined;
  const abilityFamily =
    isAbilityFamily(family) ? family : inferAbilityFamily(inferredAbilityId, combined);
  const effectKind =
    stringValue(combined.effectKind) ??
    inferEffectKind(actionType, inferredAbilityId, combined);
  const sourceDefinitionId = stringValue(combined.sourceDefinitionId);
  const amounts = publicAmounts(combined);
  const targets = publicTargets(combined);
  const redactedKind = stringValue(combined.redactedKind);
  const hiddenZoneBarrier = combined.hiddenZoneBarrier === true;

  const result: PublicAbilitySchemaContext = {};
  if (abilityFamily) result.abilityFamily = abilityFamily;
  if (inferredAbilityId) result.abilityId = inferredAbilityId;
  if (effectKind) result.effectKind = effectKind;
  if (sourceDefinitionId) result.sourceDefinitionId = sourceDefinitionId;
  if (Object.keys(amounts).length > 0) result.amounts = amounts;
  if (Object.keys(targets).length > 0) result.targets = targets;
  result.visibility = {
    class: visibilityClass,
    ...(hiddenZoneBarrier ? { hiddenZoneBarrier: true } : {}),
    ...(redactedKind ? { redactedKind } : {}),
  };
  return result;
}

function legacyAbilityId(payload: Record<string, unknown>): string | undefined {
  for (const field of LEGACY_ABILITY_PAYLOAD_FIELDS) {
    const value = stringValue(payload[field]);
    if (value) return value;
  }
  return undefined;
}

function inferAbilityFamily(
  abilityId: string | undefined,
  payload: Record<string, unknown>,
): AbilityFamily | undefined {
  const haystack = [
    abilityId,
    stringValue(payload.hiddenZoneAction),
    stringValue(payload.actionType),
  ]
    .filter(Boolean)
    .join(" ");
  if (/hidden|stack|grip|hq|rd|archives|reveal|search|arrange|shuffle|reorder|swap/i.test(haystack))
    return "hidden-zone";
  if (/prevent|avoid|replacement|damage|flatline|hardware-trash/i.test(haystack))
    return "damage-prevention";
  if (/trace|tag|link/i.test(haystack)) return "trace-tags";
  if (/run|access|breach|jack|ice|subroutine|rez|derez/i.test(haystack))
    return "run-access";
  if (/host|counter|recurring|virus|purge|shell/i.test(haystack))
    return "hosting-counters";
  if (/agenda|score|steal|forfeit|overadvance/i.test(haystack))
    return "agenda-scoring";
  if (/cost|credit|pay|gain|loan|tax/i.test(haystack)) return "payment-costs";
  if (/random|die|dice|roll/i.test(haystack)) return "random-effects";
  return undefined;
}

function inferEffectKind(
  actionType: ActionType,
  abilityId: string | undefined,
  payload: Record<string, unknown>,
): string | undefined {
  if (stringValue(payload.damageType) || payload.damageResolved === true)
    return "damage";
  if (payload.traceStarted === true || stringValue(payload.traceStep))
    return "trace";
  if (payload.hiddenZoneBarrier === true) return "hidden_zone";
  if (abilityId?.includes("reveal") || abilityId?.includes("search"))
    return "hidden_zone";
  if (abilityId?.includes("gain") || actionType === "gain_credit")
    return "gain_credits";
  if (abilityId?.includes("trash") || actionType === "trash_accessed_card")
    return "trash_card";
  if (abilityId?.includes("install") || actionType === "install_card")
    return "install_card";
  if (abilityId?.includes("run") || actionType === "start_run")
    return "run";
  if (abilityId?.includes("counter")) return "counter_change";
  if (abilityId?.includes("die") || abilityId?.includes("dice"))
    return "random";
  return undefined;
}

function publicAmounts(payload: Record<string, unknown>): Record<string, number> {
  const amounts: Record<string, number> = {};
  for (const key of AMOUNT_KEYS) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) amounts[key] = value;
  }
  const randomRoll =
    numberValue(payload.randomRoll) ??
    numberValue(payload.dieRoll) ??
    numberValue(payload.v1921DieRoll);
  if (randomRoll !== undefined && amounts.randomRoll === undefined)
    amounts.randomRoll = randomRoll;
  return amounts;
}

function publicTargets(
  payload: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const targets: Record<string, string | number | boolean> = {};
  for (const key of TARGET_KEYS) {
    const value = payload[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      targets[key] = value;
  }
  return targets;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isAbilityFamily(value: string | undefined): value is AbilityFamily {
  return (
    value === "agenda-scoring" ||
    value === "damage-prevention" ||
    value === "hidden-zone" ||
    value === "hosting-counters" ||
    value === "payment-costs" ||
    value === "random-effects" ||
    value === "run-access" ||
    value === "trace-tags"
  );
}
