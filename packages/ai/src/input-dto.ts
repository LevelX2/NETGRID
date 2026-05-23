import {
  LEGACY_ABILITY_PAYLOAD_FIELDS,
  type AiDecisionInput,
  type AiDifficulty,
  type AiDeckDoctrineProfile,
  type ChoiceRequirement,
  type Cost,
  type LegalAction,
  type PlayerView,
  type PublicGameEvent,
  type ResolvedGameEffect,
  type Side,
  type TargetRequirement,
  type VisibleCard,
  type VisibleChoiceRequest,
} from "@netgrid/shared";

type AiPublicPayloadAbilityFamily =
  | "agenda-scoring"
  | "damage-prevention"
  | "hidden-zone"
  | "hosting-counters"
  | "payment-costs"
  | "random-effects"
  | "run-access"
  | "trace-tags";

export type BuildAiDecisionInputDtoParams = {
  side: Side;
  playerView: PlayerView;
  eventTail: PublicGameEvent[];
  legalActions: LegalAction[];
  difficulty: AiDifficulty;
  seed: string;
  decisionId: string;
  actionNumber: number;
  profileId: string;
  ownDeckDoctrine?: AiDeckDoctrineProfile;
};

export const AI_DECISION_INPUT_TOP_LEVEL_FIELDS = [
  "side",
  "playerView",
  "eventTail",
  "legalActions",
  "difficulty",
  "seed",
  "decisionId",
  "actionNumber",
  "profileId",
  "ownDeckDoctrine",
] as const;

// Nested AI-input payloads are positive allowlists. New engine/public payload
// shapes must be added here deliberately instead of being deep-copied.
const LEGAL_ACTION_PAYLOAD_KEYS = new Set<string>([
  "serverId",
  "placement",
  "encounterContinue",
  "unbrokenSubroutineCount",
  "encounterWillEndRun",
  "shellTradersAbility",
  "abilityFamily",
  "abilityId",
  "effectKind",
  "sourceDefinitionId",
  "cardDefinitionId",
  "targetCardDefinitionId",
  "targetCardId",
  "serverLabel",
  "targetServerId",
  "targetServerLabel",
  "cardId",
  "redactedKind",
  "hiddenResourceSlotId",
  "amount",
  "gainedCredits",
  "gainCreditsAmount",
  "addedCounterAmount",
  "addCounterAmount",
  "removedCounterAmount",
  "removeCounterAmount",
  "removePowerCounterAmount",
  "remainingCounters",
  "remainingCountersBefore",
  "shellCounterAmount",
  "counterType",
  "traceStrength",
  "runnerLink",
  "citySurveillanceSourceCount",
  "citySurveillanceDrawDecision",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  ...LEGACY_ABILITY_PAYLOAD_FIELDS,
]);

const PUBLIC_PAYLOAD_PRIMITIVE_KEYS = new Set<string>([
  "actor",
  "side",
  "actionType",
  "label",
  "publicLabel",
  "title",
  "cardTitle",
  "cardDefinitionId",
  "sourceDefinitionId",
  "sourceTitle",
  "targetCardDefinitionId",
  "targetIceDefinitionId",
  "trashedCardDefinitionId",
  "installedProgramDefinitionId",
  "returnedCardDefinitionId",
  "hostDefinitionId",
  "serverId",
  "attackedServerId",
  "targetServerId",
  "server",
  "serverLabel",
  "targetServerLabel",
  "targetVisibility",
  "choiceVisibility",
  "redactedKind",
  "hiddenResourceSlotId",
  "hiddenRunnerResourceInstall",
  "hiddenRunnerResourceRevealed",
  "hiddenZoneAction",
  "discardResolved",
  "revealKind",
  "abilityFamily",
  "abilityId",
  "effectKind",
  "hiddenZoneBarrier",
  "damageType",
  "damageResolved",
  "traceStarted",
  "traceStep",
  "traceStrength",
  "runnerLink",
  "successful",
  "setupStatus",
  "agendaPointsToWin",
  "runnerDeckId",
  "corpDeckId",
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
  "citySurveillanceSourceCount",
  "citySurveillanceDrawDecision",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  "citySurveillanceCreditsPaid",
  "citySurveillanceTagsAdded",
  "addedCounterAmount",
  "removedCounterAmount",
  "remainingCounters",
  "preservedCounterAmount",
  "remainingVirusCounters",
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
  "returnedCount",
  ...LEGACY_ABILITY_PAYLOAD_FIELDS,
]);

const PUBLIC_PAYLOAD_STRING_ARRAY_KEYS = new Set([
  "cardDefinitionIds",
  "targetCardDefinitionIds",
  "returnedCardDefinitionIds",
  "revealedCardDefinitionIds",
  "exposedCardDefinitionIds",
]);

const PUBLIC_AMOUNT_KEYS = new Set([
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
  "citySurveillanceSourceCount",
  "citySurveillanceProjectedCreditsPaid",
  "citySurveillanceProjectedTagsAdded",
  "citySurveillanceCreditsPaid",
  "citySurveillanceTagsAdded",
  "addedCounterAmount",
  "removedCounterAmount",
  "remainingCounters",
  "preservedCounterAmount",
  "remainingVirusCounters",
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
  "returnedCount",
]);

const PUBLIC_TARGET_KEYS = new Set([
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
]);

const PUBLIC_BASELINE_KEYS = new Set([
  "rulesVersion",
  "engineSchemaVersion",
  "playerViewSchemaVersion",
  "aiControllerSchemaVersion",
  "simulationSchemaVersion",
  "multiplayerSchemaVersion",
  "cardTextSnapshotId",
  "cardTextSource",
  "cardImplementationVersion",
  "deviationRegistryVersion",
]);

const PUBLIC_DECK_METADATA_KEYS = new Set([
  "deckName",
  "deckHash",
  "side",
  "identityCardId",
  "formatProfileId",
  "cardPoolSnapshotId",
]);

const ALLOWED_ABILITY_FAMILIES: ReadonlySet<AiPublicPayloadAbilityFamily> = new Set([
  "agenda-scoring",
  "damage-prevention",
  "hidden-zone",
  "hosting-counters",
  "payment-costs",
  "random-effects",
  "run-access",
  "trace-tags",
]);

export function buildAiDecisionInputDto(params: BuildAiDecisionInputDtoParams): AiDecisionInput {
  return {
    side: params.side,
    playerView: sanitizePlayerView(params.playerView),
    eventTail: params.eventTail.map(sanitizePublicGameEvent),
    legalActions: params.legalActions.map(sanitizeLegalAction),
    difficulty: params.difficulty,
    seed: params.seed,
    decisionId: params.decisionId,
    actionNumber: params.actionNumber,
    profileId: params.profileId,
    ...(params.ownDeckDoctrine ? { ownDeckDoctrine: sanitizeAiDeckDoctrineProfile(params.ownDeckDoctrine) } : {}),
  };
}

function sanitizePlayerView(view: PlayerView): PlayerView {
  return {
    side: view.side,
    stateVersion: view.stateVersion,
    timingPoint: view.timingPoint,
    activeSide: view.activeSide,
    phase: view.phase,
    own: {
      identity: sanitizeVisibleCard(view.own.identity),
      credits: view.own.credits,
      clicks: view.own.clicks,
      agendaPoints: view.own.agendaPoints,
      gripOrHq: view.own.gripOrHq.map(sanitizeVisibleCard),
      stackOrRdCount: view.own.stackOrRdCount,
      heapOrArchives: view.own.heapOrArchives.map(sanitizeVisibleCard),
      scoreArea: view.own.scoreArea.map(sanitizeVisibleCard),
      ...(view.own.rig ? { rig: view.own.rig.map(sanitizeVisibleCard) } : {}),
      ...(view.own.memoryUsed !== undefined ? { memoryUsed: view.own.memoryUsed } : {}),
      ...(view.own.memoryLimit !== undefined ? { memoryLimit: view.own.memoryLimit } : {}),
      maxHandSize: view.own.maxHandSize,
      ...(view.own.coreDamage !== undefined ? { coreDamage: view.own.coreDamage } : {}),
      tags: view.own.tags,
    },
    opponent: {
      identity: sanitizeVisibleCard(view.opponent.identity),
      credits: view.opponent.credits,
      clicks: view.opponent.clicks,
      agendaPoints: view.opponent.agendaPoints,
      tags: view.opponent.tags,
      handCount: view.opponent.handCount,
      maxHandSize: view.opponent.maxHandSize,
      ...(view.opponent.coreDamage !== undefined ? { coreDamage: view.opponent.coreDamage } : {}),
      deckCount: view.opponent.deckCount,
      discardCount: view.opponent.discardCount,
      scoreArea: view.opponent.scoreArea.map(sanitizeVisibleCard),
      ...(view.opponent.rig ? { rig: view.opponent.rig.map(sanitizeVisibleCard) } : {}),
    },
    servers: view.servers.map((server) => ({
      id: server.id,
      label: server.label,
      ice: server.ice.map(sanitizeVisibleCard),
      root: server.root.map(sanitizeVisibleCard),
    })),
    ...(view.specialZones
      ? {
          specialZones: {
            setAside: view.specialZones.setAside.map(sanitizeVisibleCard),
            removedFromGame: view.specialZones.removedFromGame.map(sanitizeVisibleCard),
            setAsideCount: view.specialZones.setAsideCount,
            removedFromGameCount: view.specialZones.removedFromGameCount,
          },
        }
      : {}),
    ...(view.run
      ? {
          run: {
            attackedServerId: view.run.attackedServerId,
            phase: view.run.phase,
            ...(view.run.position ? { position: structuredClone(view.run.position) } : {}),
            ...(view.run.encounteredIce ? { encounteredIce: sanitizeVisibleCard(view.run.encounteredIce) } : {}),
            ...(view.run.accessedCard ? { accessedCard: sanitizeVisibleCard(view.run.accessedCard) } : {}),
            ...(view.run.breach
              ? {
                  breach: {
                    breachId: view.run.breach.breachId,
                    serverId: view.run.breach.serverId,
                    currentIndex: view.run.breach.currentIndex,
                    remainingCount: view.run.breach.remainingCount,
                    completed: view.run.breach.completed,
                  },
                }
              : {}),
            ...(view.run.badPublicityCredits !== undefined ? { badPublicityCredits: view.run.badPublicityCredits } : {}),
            successful: view.run.successful,
          },
        }
      : {}),
    ...(view.deckMetadata
      ? {
          deckMetadata: {
            own: { ...view.deckMetadata.own },
            opponent: { ...view.deckMetadata.opponent },
          },
        }
      : {}),
    ...(view.pendingChoice ? { pendingChoice: sanitizeVisibleChoiceRequest(view.pendingChoice) } : {}),
    publicEvents: view.publicEvents.map(sanitizePublicGameEvent),
    legalActions: view.legalActions.map(sanitizeLegalAction),
    winner: view.winner,
    agendaPointsToWin: view.agendaPointsToWin,
    ...(view.gameEndReason ? { gameEndReason: view.gameEndReason } : {}),
  };
}

function sanitizeVisibleCard(card: VisibleCard): VisibleCard {
  return {
    instanceId: card.instanceId,
    known: card.known,
    ...(card.title !== undefined ? { title: card.title } : {}),
    ...(card.definitionId !== undefined ? { definitionId: card.definitionId } : {}),
    ...(card.type !== undefined ? { type: card.type } : {}),
    ...(card.subtypes !== undefined ? { subtypes: card.subtypes.slice() } : {}),
    ...(card.rulesText !== undefined ? { rulesText: card.rulesText } : {}),
    ...(card.cost !== undefined ? { cost: card.cost } : {}),
    ...(card.installCost !== undefined ? { installCost: card.installCost } : {}),
    ...(card.memoryCost !== undefined ? { memoryCost: card.memoryCost } : {}),
    ...(card.memoryLimitBonus !== undefined ? { memoryLimitBonus: card.memoryLimitBonus } : {}),
    ...(card.maxHandSizeBonus !== undefined ? { maxHandSizeBonus: card.maxHandSizeBonus } : {}),
    ...(card.rezCost !== undefined ? { rezCost: card.rezCost } : {}),
    ...(card.baseLink !== undefined ? { baseLink: card.baseLink } : {}),
    ...(card.rezzed !== undefined ? { rezzed: card.rezzed } : {}),
    ...(card.advancementCounters !== undefined ? { advancementCounters: card.advancementCounters } : {}),
    ...(card.advancementRequirement !== undefined ? { advancementRequirement: card.advancementRequirement } : {}),
    ...(card.strength !== undefined ? { strength: card.strength } : {}),
    ...(card.agendaPoints !== undefined ? { agendaPoints: card.agendaPoints } : {}),
    ...(card.trashCost !== undefined ? { trashCost: card.trashCost } : {}),
    ...(card.counters !== undefined ? { counters: { ...card.counters } } : {}),
    ...(card.hostedOn !== undefined ? { hostedOn: card.hostedOn } : {}),
    ...(card.owner !== undefined ? { owner: card.owner } : {}),
    ...(card.controller !== undefined ? { controller: card.controller } : {}),
  };
}

function sanitizeVisibleChoiceRequest(choice: VisibleChoiceRequest): VisibleChoiceRequest {
  const stackSearchResolution = sanitizeStackSearchResolution(choice.stackSearchResolution);
  const cardSearchPresentation = sanitizeCardSearchPresentation(choice.cardSearchPresentation);
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => {
      const value = sanitizePrimitive(option.value);
      return {
        id: option.id,
        label: option.label,
        ...(option.publicLabel !== undefined ? { publicLabel: option.publicLabel } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(option.selectable !== undefined ? { selectable: option.selectable } : {}),
        ...(option.card ? { card: sanitizeVisibleCard(option.card) } : {}),
      };
    }),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(stackSearchResolution ? { stackSearchResolution } : {}),
    ...(cardSearchPresentation ? { cardSearchPresentation } : {}),
  };
}

function sanitizeLegalAction(action: LegalAction): LegalAction {
  const payload = action.payload ? sanitizeLegalActionPayload(action.payload as Record<string, unknown>) : undefined;
  return {
    actionId: action.actionId,
    side: action.side,
    type: action.type,
    label: action.label,
    source: action.source,
    timingPoint: action.timingPoint,
    costs: action.costs.map(sanitizeCost),
    targetRequirements: action.targetRequirements.map(sanitizeTargetRequirement),
    ...(action.choiceRequirements ? { choiceRequirements: action.choiceRequirements.map(sanitizeChoiceRequirement) } : {}),
    ...(action.abilityRef ? { abilityRef: { sourceCardInstanceId: action.abilityRef.sourceCardInstanceId, abilityId: action.abilityRef.abilityId } } : {}),
    ...(action.effectRef ? { effectRef: action.effectRef } : {}),
    ...(action.resolvedEffects ? { resolvedEffects: action.resolvedEffects.map(sanitizeResolvedGameEffect) } : {}),
    visibility: action.visibility,
    expiresAtStateVersion: action.expiresAtStateVersion,
    ...(payload ? { payload } : {}),
  };
}

function sanitizeCost(cost: Cost): Cost {
  return {
    ...(cost.clicks !== undefined ? { clicks: cost.clicks } : {}),
    ...(cost.credits !== undefined ? { credits: cost.credits } : {}),
  };
}

function sanitizeTargetRequirement(requirement: TargetRequirement): TargetRequirement {
  return {
    id: requirement.id,
    kind: requirement.kind,
    ...(requirement.zoneScope ? { zoneScope: requirement.zoneScope.slice() } : {}),
    ...(requirement.side ? { side: requirement.side } : {}),
    ...(requirement.visibility ? { visibility: requirement.visibility } : {}),
    ...(requirement.allowedServers ? { allowedServers: requirement.allowedServers.slice() } : {}),
    ...(requirement.sourceIceRef ? { sourceIceRef: requirement.sourceIceRef } : {}),
    ...(requirement.allowedSides ? { allowedSides: requirement.allowedSides.slice() } : {}),
  };
}

function sanitizeChoiceRequirement(requirement: ChoiceRequirement): ChoiceRequirement {
  return {
    choiceId: requirement.choiceId,
    minSelections: requirement.minSelections,
    maxSelections: requirement.maxSelections,
    optionIds: requirement.optionIds.slice(),
  };
}

function sanitizeResolvedGameEffect(effect: ResolvedGameEffect): ResolvedGameEffect {
  return {
    effectId: effect.effectId,
    kind: effect.kind,
    visibility: effect.visibility,
    ...(effect.side ? { side: effect.side } : {}),
    ...(effect.amount !== undefined ? { amount: effect.amount } : {}),
    ...(effect.reason ? { reason: effect.reason } : {}),
    ...(effect.counterType ? { counterType: effect.counterType } : {}),
    ...(effect.removedCounterAmount !== undefined ? { removedCounterAmount: effect.removedCounterAmount } : {}),
    ...(effect.remainingCounters !== undefined ? { remainingCounters: effect.remainingCounters } : {}),
    ...(effect.addedCounterAmount !== undefined ? { addedCounterAmount: effect.addedCounterAmount } : {}),
    ...(effect.runnerTagsAfter !== undefined ? { runnerTagsAfter: effect.runnerTagsAfter } : {}),
    ...(effect.redactedKind ? { redactedKind: effect.redactedKind } : {}),
    ...(effect.sourceDefinitionId ? { sourceDefinitionId: effect.sourceDefinitionId } : {}),
    ...(effect.sourceTitle ? { sourceTitle: effect.sourceTitle } : {}),
    ...(effect.cardDefinitionId ? { cardDefinitionId: effect.cardDefinitionId } : {}),
    ...(effect.cardTitle ? { cardTitle: effect.cardTitle } : {}),
    ...(effect.serverId ? { serverId: effect.serverId } : {}),
    ...(effect.serverLabel ? { serverLabel: effect.serverLabel } : {}),
  };
}

function sanitizePublicGameEvent(event: PublicGameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: sanitizePublicPayload(event.publicPayload),
  };
}

function sanitizePublicPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = sanitizeAllowedPrimitiveRecord(payload, PUBLIC_PAYLOAD_PRIMITIVE_KEYS);
  for (const key of PUBLIC_PAYLOAD_STRING_ARRAY_KEYS) {
    const value = sanitizeStringArray(payload[key]);
    if (value) result[key] = value;
  }
  const amounts = sanitizeNumberRecord(payload.amounts, PUBLIC_AMOUNT_KEYS);
  if (amounts) result.amounts = amounts;
  const targets = sanitizeAllowedPrimitiveRecord(payload.targets, PUBLIC_TARGET_KEYS);
  if (Object.keys(targets).length > 0) result.targets = targets;
  const visibility = sanitizePublicVisibility(payload.visibility);
  if (visibility) result.visibility = visibility;
  const baseline = sanitizeAllowedPrimitiveRecord(payload.baseline, PUBLIC_BASELINE_KEYS);
  if (Object.keys(baseline).length > 0) result.baseline = baseline;
  const runnerDeck = sanitizeAllowedPrimitiveRecord(payload.runnerDeck, PUBLIC_DECK_METADATA_KEYS);
  if (Object.keys(runnerDeck).length > 0) result.runnerDeck = runnerDeck;
  const corpDeck = sanitizeAllowedPrimitiveRecord(payload.corpDeck, PUBLIC_DECK_METADATA_KEYS);
  if (Object.keys(corpDeck).length > 0) result.corpDeck = corpDeck;
  return result;
}

function sanitizeLegalActionPayload(payload: Record<string, unknown>): Record<string, string | number | boolean> {
  return sanitizeAllowedPrimitiveRecord(payload, LEGAL_ACTION_PAYLOAD_KEYS);
}

function sanitizeAllowedPrimitiveRecord(value: unknown, allowedKeys: ReadonlySet<string>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const key of allowedKeys) {
    const sanitized = sanitizePrimitive((value as Record<string, unknown>)[key]);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  if (typeof result.abilityFamily === "string" && !ALLOWED_ABILITY_FAMILIES.has(result.abilityFamily as AiPublicPayloadAbilityFamily)) delete result.abilityFamily;
  return result;
}

function sanitizePrimitive(value: unknown): string | number | boolean | undefined {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function sanitizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries = value.filter((entry): entry is string => typeof entry === "string");
  return entries.length > 0 ? entries : undefined;
}

function sanitizeNumberRecord(value: unknown, allowedKeys: ReadonlySet<string>): Record<string, number> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const result: Record<string, number> = {};
  for (const key of allowedKeys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) result[key] = candidate;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizePublicVisibility(value: unknown): Record<string, string | boolean> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const result: Record<string, string | boolean> = {};
  if (typeof raw.class === "string") result.class = raw.class;
  if (typeof raw.hiddenZoneBarrier === "boolean") result.hiddenZoneBarrier = raw.hiddenZoneBarrier;
  if (typeof raw.redactedKind === "string") result.redactedKind = raw.redactedKind;
  return Object.keys(result).length > 0 ? result : undefined;
}

function sanitizeStackSearchResolution(value: VisibleChoiceRequest["stackSearchResolution"]): VisibleChoiceRequest["stackSearchResolution"] | undefined {
  if (!value) return undefined;
  return {
    reveal: value.reveal,
    destination: value.destination,
    shuffleAfter: value.shuffleAfter,
    ...(value.publicRevealKind ? { publicRevealKind: value.publicRevealKind } : {}),
  };
}

function sanitizeCardSearchPresentation(value: VisibleChoiceRequest["cardSearchPresentation"]): VisibleChoiceRequest["cardSearchPresentation"] | undefined {
  if (!value) return undefined;
  return {
    sourceZone: value.sourceZone,
    selectableFilter: value.selectableFilter,
    reveal: value.reveal,
    destination: value.destination,
    shuffleAfter: value.shuffleAfter,
    showNonMatchingCards: value.showNonMatchingCards,
    ...(value.publicRevealKind ? { publicRevealKind: value.publicRevealKind } : {}),
    ...(value.temporaryReturnAtEndOfTurn
      ? { temporaryReturnAtEndOfTurn: value.temporaryReturnAtEndOfTurn }
      : {}),
  };
}

function sanitizeAiDeckDoctrineProfile(profile: AiDeckDoctrineProfile): AiDeckDoctrineProfile {
  return {
    schemaVersion: profile.schemaVersion,
    deckSnapshotId: profile.deckSnapshotId,
    deckHash: profile.deckHash,
    side: profile.side,
    ...(profile.formatProfileId ? { formatProfileId: profile.formatProfileId } : {}),
    confidence: profile.confidence,
    archetypeTags: profile.archetypeTags.slice(),
    roleCounts: { ...profile.roleCounts },
    roleDensity: { ...profile.roleDensity },
    planWeights: { ...profile.planWeights },
    mulliganWeights: { ...profile.mulliganWeights },
    riskFlags: profile.riskFlags.slice(),
    evidence: profile.evidence.map((entry) => ({
      kind: entry.kind,
      label: entry.label,
      value: entry.value,
    })),
  };
}
