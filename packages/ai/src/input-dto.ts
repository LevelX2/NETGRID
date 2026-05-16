import type {
  AiDecisionInput,
  AiDifficulty,
  AiDeckDoctrineProfile,
  ChoiceRequirement,
  Cost,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  ResolvedGameEffect,
  Side,
  TargetRequirement,
  VisibleCard,
  VisibleChoiceRequest,
} from "@netgrid/shared";

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
  return {
    choiceId: choice.choiceId,
    side: choice.side,
    source: choice.source,
    prompt: choice.prompt,
    kind: choice.kind,
    options: choice.options.map((option) => ({
      id: option.id,
      label: option.label,
      ...(option.publicLabel !== undefined ? { publicLabel: option.publicLabel } : {}),
      ...(option.value !== undefined ? { value: option.value } : {}),
      ...(option.selectable !== undefined ? { selectable: option.selectable } : {}),
      ...(option.card ? { card: sanitizeVisibleCard(option.card) } : {}),
    })),
    minSelections: choice.minSelections,
    maxSelections: choice.maxSelections,
    stateVersion: choice.stateVersion,
    visibility: choice.visibility,
    ...(choice.stackSearchResolution ? { stackSearchResolution: { ...choice.stackSearchResolution } } : {}),
  };
}

function sanitizeLegalAction(action: LegalAction): LegalAction {
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
    ...(action.payload ? { payload: { ...action.payload } } : {}),
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
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const sanitized = sanitizeJsonValue(value);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeJsonValue(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(sanitizeJsonValue).filter((entry) => entry !== undefined);
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const sanitized = sanitizeJsonValue(nested);
      if (sanitized !== undefined) result[key] = sanitized;
    }
    return result;
  }
  return undefined;
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
