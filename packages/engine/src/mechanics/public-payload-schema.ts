import {
  ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
  type ActionType,
  type AbilityPayloadDiscriminatorField,
  type EventVisibilityClass,
  type PublicAbilityFamily,
  type PublicEventPayload,
} from "@netgrid/shared";

const RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID =
  "runner_program_trash_before_install";

export type PublicAbilitySchemaContext = Pick<
  PublicEventPayload,
  | "abilityFamily"
  | "abilityId"
  | "effectKind"
  | "sourceDefinitionId"
  | "amounts"
  | "targets"
  | "visibility"
>;

export type AbilityPayloadDiscriminatorEntry = {
  field: AbilityPayloadDiscriminatorField;
  abilityId: string;
};

export type PublicAbilityMetadata = {
  abilityField?: AbilityPayloadDiscriminatorField;
  abilityFamily?: PublicAbilityFamily;
  abilityId?: string;
  effectKind?: string;
};

const AMOUNT_KEYS = [
  "amount",
  "gainedActions",
  "gainedCredits",
  "gainCreditsAmount",
  "creditsLost",
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
  "preservedCounterAmount",
  "remainingVirusCounters",
  "purgedVirusCounters",
  "purgedRunnerVirusCounters",
  "actionDebtAdded",
  "actionDebtPaid",
  "corpActionDebtTotalBefore",
  "corpActionDebtTotalAfter",
  "cerberusCounterCount",
  "fortTraceBitPoolAvailable",
  "fortTraceBitPoolSpent",
  "fortTraceBitPoolRemaining",
  "recurringCreditsLoaded",
  "overadvanceRecurringCredits",
  "projectZurichOveradvance",
  "paidCredits",
  "rezCostPaid",
  "trashCostPaid",
  "agendaPointCost",
  "agendaPointCostPaid",
  "corpBonusAgendaPointsSpent",
  "agendaPointsLost",
  "temporaryCreditsProvided",
  "temporaryRunCredits",
  "temporaryCreditsSpent",
  "temporaryCreditsRemaining",
  "temporaryRunCreditsRemaining",
  "temporaryRunCreditsReturned",
  "corpTemporaryRunCreditsRemaining",
  "corpTemporaryRunCreditsReturned",
  "afterRunUnpreventableCoreDamage",
  "corpCreditsAfter",
  "runnerCreditsAfter",
  "corpRezzedIceThisTurnCount",
  "sourceCount",
  "karlSuccessfulRunCreditGain",
  "corpClicksAfter",
  "runnerClicksAfter",
  "hostedCreditsAdded",
  "hostedCreditsTaken",
  "hostedCreditsAfter",
  "randomRoll",
  "dieRoll",
  "randomCounterAfter",
  "returnedCount",
  "returnedProgramCount",
  "maxReturnedProgramCount",
  "eligibleProgramCount",
  "selectedCount",
  "searchedCount",
  "revealedNonAgendaCount",
  "shuffledIntoRdCount",
  "trashedCount",
  "movedToGripCount",
  "daemonHostedTrashCount",
  "trashedInstalledCount",
  "targetTrashCount",
  "hardwareTrashCount",
  "programTrashCount",
  "selfDestructTrashedCount",
  "trashedCorpInstalledCardCount",
  "trashedInstalledRunnerHardwareCount",
  "trashedInstalledRunnerProgramCount",
  "netDamageAmount",
  "movedCardCount",
  "reorderedIceCount",
  "movedIceCount",
  "concealedIceCount",
  "secretHiddenAmountRevealed",
  "secretGuessAmount",
  "chosenIcePosition",
  "passedIcePosition",
  "sourceIceIndex",
  "targetIceIndex",
  "newApproachIceIndex",
  "virusCounterAvoided",
  "counterPreventionCreditsPaid",
  "stolenAgendaAdvancementCountersLastTurn",
  "iceStrengthBefore",
  "iceStrengthAfter",
  "iceStrengthBonusApplied",
  "iceStrengthMaxCap",
  "runnerGripShuffledIntoStackCount",
  "runnerCardsDrawnAfterGripShuffle",
  "runnerStackAfter",
  "valuPakRestrictedActionsForgone",
  "valuPakTemporaryCreditsReturned",
  "investmentFirmRedirectedAmount",
  "investmentFirmCreditsAddedPerSource",
] as const;

const TARGET_KEYS = [
  "sourceDefinitionId",
  "cardDefinitionId",
  "targetCardDefinitionId",
  "targetCardDefinitionIds",
  "publicTargetCount",
  "hiddenTargetCount",
  "advancementCounterSourceVisibility",
  "advancementCounterTargetVisibility",
  "targetIceDefinitionId",
  "runStartBypassPassedIceDefinitionId",
  "trashedCardDefinitionId",
  "installedProgramDefinitionId",
  "returnedCardDefinitionId",
  "returnedCardDefinitionIds",
  "returnedProgramDefinitionIds",
  "publicTrashedCardDefinitionIds",
  "classicIndiscriminateResponseTeamSourceDefinitionIds",
  "classicIndiscriminateResponseTeam",
  "hostDefinitionId",
  "scoredFromServerId",
  "serverLabel",
  "targetServerLabel",
  "targetVisibility",
  "publicRevealKind",
  "publicRevealDefinitionIds",
  "publicRevealTitles",
  "exposedCardInstanceIds",
  "revealedAgendaDefinitionIds",
  "spentAgendaCardId",
  "spentAgendaDefinitionIds",
  "storedAgendaDefinitionId",
  "agendaStoredInHq",
  "choiceVisibility",
  "restrictedActionSequence",
  "hiddenOrderChoice",
  "revealedSource",
  "newApproachIceRevealed",
  "autoPassChosenIce",
  "runStartBypassAutoPassedIce",
  "stackShuffled",
  "shufflePerformed",
  "shuffled",
  "secretSpendGuessRunGuessCorrect",
  "secretSpendGuessRunNoIceTarget",
  "redactedKind",
  "sourceTrashed",
  "newDataFortCreationLockRemoved",
  "karlSuccessfulRunSourceDefinitionIds",
  "purgedCounterType",
  "purgedCounterSummary",
  "purgeModel",
  "timingWindowId",
  "timingFamily",
  "valuPakSequenceStopped",
] as const;

export function abilityPayloadDiscriminatorEntries(
  payload: Record<string, unknown> | undefined,
  fields: readonly AbilityPayloadDiscriminatorField[] = ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS,
): AbilityPayloadDiscriminatorEntry[] {
  if (!payload) return [];
  const entries: AbilityPayloadDiscriminatorEntry[] = [];
  for (const field of fields) {
    const abilityId = stringValue(payload[field]);
    if (abilityId) entries.push({ field, abilityId });
  }
  return entries;
}

export function publicAbilityMetadata(
  actionType: ActionType,
  payload: Record<string, unknown> | undefined,
  context: Record<string, unknown> = {},
): PublicAbilityMetadata {
  const combined = { ...(payload ?? {}), ...context };
  const discriminator = abilityPayloadDiscriminatorEntries(combined)[0];
  const abilityId = stringValue(combined.abilityId) ?? discriminator?.abilityId;
  const hiddenZoneAction = stringValue(combined.hiddenZoneAction);
  const inferredAbilityId = abilityId ?? hiddenZoneAction;
  const family = stringValue(combined.abilityFamily) as
    | PublicAbilityFamily
    | undefined;
  const abilityFamily = isAbilityFamily(family)
    ? family
    : inferAbilityFamily(inferredAbilityId, combined);
  const effectKind =
    stringValue(combined.effectKind) ??
    inferEffectKind(actionType, inferredAbilityId, combined);

  return {
    ...(discriminator ? { abilityField: discriminator.field } : {}),
    ...(abilityFamily ? { abilityFamily } : {}),
    ...(inferredAbilityId ? { abilityId: inferredAbilityId } : {}),
    ...(effectKind ? { effectKind } : {}),
  };
}

export function buildPublicAbilitySchemaContext(
  actionType: ActionType,
  payload: Record<string, unknown> | undefined,
  context: Record<string, unknown>,
  visibilityClass: EventVisibilityClass,
): PublicAbilitySchemaContext {
  const combined = { ...(payload ?? {}), ...context };
  if (isAdvancementCardTargetProjection(payload)) {
    delete combined.targetCardDefinitionId;
    delete combined.targetCardDefinitionIds;
    const publicTargetDefinitionId = stringValue(
      context.targetCardDefinitionId,
    );
    const publicTargetDefinitionIds = stringValue(
      context.targetCardDefinitionIds,
    );
    if (publicTargetDefinitionId)
      combined.targetCardDefinitionId = publicTargetDefinitionId;
    if (publicTargetDefinitionIds)
      combined.targetCardDefinitionIds = publicTargetDefinitionIds;
  }
  const metadata = publicAbilityMetadata(actionType, payload, context);
  const sourceDefinitionId = stringValue(combined.sourceDefinitionId);
  const amounts = publicAmounts(combined);
  const targets = publicTargets(combined);
  if (
    metadata.abilityId === RUNNER_PROGRAM_TRASH_BEFORE_INSTALL_ABILITY_ID
  ) {
    for (const key of ["memoryUsedAfter", "memoryLimitAfter"] as const) {
      const value = context[key];
      if (typeof value === "number" && Number.isFinite(value))
        amounts[key] = value;
    }
    for (const key of [
      "installedProgramDefinitionId",
      "trashedCardDefinitionIds",
      "installed",
      "installCancelled",
      "installBlockedReason",
      "installDeferredForMemory",
    ] as const) {
      const value = context[key];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      )
        targets[key] = value;
    }
  }
  const redactedKind = stringValue(combined.redactedKind);
  const hiddenZoneBarrier = combined.hiddenZoneBarrier === true;

  const result: PublicAbilitySchemaContext = {};
  if (metadata.abilityFamily) result.abilityFamily = metadata.abilityFamily;
  if (metadata.abilityId) result.abilityId = metadata.abilityId;
  if (metadata.effectKind) result.effectKind = metadata.effectKind;
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

function isAdvancementCardTargetProjection(
  payload: Record<string, unknown> | undefined,
): boolean {
  return (
    payload?.v1919OperationAbility === "add_advancement_counters" ||
    payload?.v1919OperationAbility === "move_advancement_counters" ||
    payload?.fortRunWindowAbility ===
      "add_advancement_counters_after_passing_last_ice_on_this_fort"
  );
}

function inferAbilityFamily(
  abilityId: string | undefined,
  payload: Record<string, unknown>,
): PublicAbilityFamily | undefined {
  const haystack = [
    abilityId,
    stringValue(payload.hiddenZoneAction),
    stringValue(payload.actionType),
  ]
    .filter(Boolean)
    .join(" ");
  if (
    /hidden|stack|grip|hq|rd|archives|reveal|search|arrange|shuffle|reorder|swap/i.test(
      haystack,
    )
  )
    return "hidden-zone";
  if (
    /prevent|avoid|replacement|damage|flatline|hardware-trash/i.test(haystack)
  )
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
  if (abilityId?.includes("lose") || typeof payload.creditsLost === "number")
    return "lose_credits";
  if (abilityId?.includes("gain") || actionType === "gain_credit")
    return "gain_credits";
  if (abilityId?.includes("trash") || actionType === "trash_accessed_card")
    return "trash_card";
  if (abilityId?.includes("install") || actionType === "install_card")
    return "install_card";
  if (abilityId?.includes("run") || actionType === "start_run") return "run";
  if (abilityId?.includes("counter")) return "counter_change";
  if (abilityId?.includes("die") || abilityId?.includes("dice"))
    return "random";
  return undefined;
}

function publicAmounts(
  payload: Record<string, unknown>,
): Record<string, number> {
  const amounts: Record<string, number> = {};
  for (const key of AMOUNT_KEYS) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value))
      amounts[key] = value;
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
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isAbilityFamily(
  value: string | undefined,
): value is PublicAbilityFamily {
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
