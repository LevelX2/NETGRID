// Read-only Game invariant validation. This module does not execute actions,
// mutate state, or build PublicPayloads.
import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type TraceSuccessEffect,
  type ValidationResult,
} from "@netgrid/shared";
import { runnerMemoryLimit } from "../ability-engine/effective-values";
import { CARD_IMPLEMENTATIONS } from "../card-implementations/registry";

export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  const placements = new Map<CardInstanceId, string>();
  const addPlacement = (id: CardInstanceId, zone: string) => {
    if (placements.has(id))
      errors.push(`CardInstance ${id} appears multiple times.`);
    placements.set(id, zone);
    if (!state.cardInstances[id])
      errors.push(`Zone references missing CardInstance ${id}.`);
  };

  addPlacement(state.corp.identity, "corp.identity");
  addPlacement(state.runner.identity, "runner.identity");
  for (const id of state.corp.hq) addPlacement(id, "corp.hq");
  for (const id of state.corp.rd) addPlacement(id, "corp.rd");
  for (const id of state.corp.archives) addPlacement(id, "corp.archives");
  for (const id of state.corp.scoreArea) addPlacement(id, "corp.scoreArea");
  for (const server of state.corp.servers) {
    for (const id of server.ice) addPlacement(id, `${server.id}.ice`);
    for (const id of server.root) addPlacement(id, `${server.id}.root`);
  }
  for (const id of state.runner.grip) addPlacement(id, "runner.grip");
  for (const id of state.runner.stack) addPlacement(id, "runner.stack");
  for (const id of state.runner.heap) addPlacement(id, "runner.heap");
  for (const id of state.runner.scoreArea) addPlacement(id, "runner.scoreArea");
  for (const id of state.runner.rig.programs)
    addPlacement(id, "runner.rig.programs");
  for (const id of state.runner.rig.hardware)
    addPlacement(id, "runner.rig.hardware");
  for (const id of state.runner.rig.resources)
    addPlacement(id, "runner.rig.resources");
  for (const id of state.specialZones?.setAside ?? [])
    addPlacement(id, "special.set_aside");
  for (const id of state.specialZones?.removedFromGame ?? [])
    addPlacement(id, "special.removed_from_game");

  for (const id of Object.keys(state.cardInstances)) {
    if (!placements.has(id))
      errors.push(`CardInstance ${id} is not in any zone.`);
  }

  for (const [id, instance] of Object.entries(state.cardInstances)) {
    const placement = placements.get(id);
    const expected = placementForZoneRef(instance.zone);
    if (
      id !== state.corp.identity &&
      id !== state.runner.identity &&
      placement &&
      expected &&
      placement !== expected
    ) {
      errors.push(
        `CardInstance ${id} zoneRef ${expected} does not match placement ${placement}.`,
      );
    }
    if (instance.owner !== "corp" && instance.owner !== "runner")
      errors.push(`CardInstance ${id} has invalid owner.`);
    if (instance.controller !== "corp" && instance.controller !== "runner")
      errors.push(`CardInstance ${id} has invalid controller.`);
    if (instance.zone.side === "special") {
      if (
        instance.zone.zone !== "set_aside" &&
        instance.zone.zone !== "removed_from_game"
      )
        errors.push(`CardInstance ${id} has invalid special zone.`);
      if (
        instance.zone.visibility !== "public" &&
        instance.zone.visibility !== "side_private" &&
        instance.zone.visibility !== "hidden" &&
        instance.zone.visibility !== "replay_only"
      ) {
        errors.push(`CardInstance ${id} has invalid special zone visibility.`);
      }
      if (
        instance.zone.zone === "removed_from_game" &&
        instance.zone.returnZone
      )
        errors.push(
          `Removed-from-game CardInstance ${id} must not have a return zone.`,
        );
    }
  }

  if (state.corp.credits < 0 || state.runner.credits < 0)
    errors.push("Credits must not be negative.");
  if (state.corp.clicks < 0 || state.runner.clicks < 0)
    errors.push("Clicks must not be negative.");
  if (!Number.isInteger(state.corp.maxHandSize) || state.corp.maxHandSize < 0)
    errors.push("Corp max hand size must be a non-negative integer.");
  if (
    !Number.isInteger(state.runner.maxHandSize) ||
    state.runner.maxHandSize < 0
  )
    errors.push("Runner base max hand size must be a non-negative integer.");
  if (!Number.isInteger(state.runner.coreDamage) || state.runner.coreDamage < 0)
    errors.push("Runner core damage must be a non-negative integer.");
  if (!Number.isInteger(state.corp.badPublicity) || state.corp.badPublicity < 0)
    errors.push("Corp bad publicity must be a non-negative integer.");
  if (state.runner.tags < 0) errors.push("Runner tags must not be negative.");
  if (
    !Number.isInteger(state.runner.memoryLimit) ||
    state.runner.memoryLimit < 0
  )
    errors.push("Runner memory limit must be a non-negative integer.");
  if (!Number.isInteger(state.runner.memoryUsed) || state.runner.memoryUsed < 0)
    errors.push("Runner memory used must be a non-negative integer.");
  if (state.runner.memoryUsed > runnerMemoryLimit(state))
    errors.push("Runner memory limit exceeded.");
  for (const id of state.runner.rig.programs) {
    if (definitionFor(state, id).type !== "program")
      errors.push(`Runner rig program slot contains non-program ${id}.`);
  }
  for (const id of state.runner.rig.hardware) {
    if (definitionFor(state, id).type !== "hardware")
      errors.push(`Runner rig hardware slot contains non-hardware ${id}.`);
  }
  for (const id of state.runner.rig.resources) {
    if (definitionFor(state, id).type !== "resource")
      errors.push(`Runner rig resource slot contains non-resource ${id}.`);
  }
  for (const [id, instance] of Object.entries(state.cardInstances)) {
    for (const [counterType, amount] of Object.entries(
      instance.counters ?? {},
    )) {
      if (!Number.isInteger(amount) || amount < 0)
        errors.push(
          `Counter ${counterType} on ${id} must be a non-negative integer.`,
        );
    }
    if (instance.hostedOn) {
      if (instance.hostedOn === id)
        errors.push(`CardInstance ${id} cannot host itself.`);
      if (!state.cardInstances[instance.hostedOn])
        errors.push(
          `CardInstance ${id} references missing host ${instance.hostedOn}.`,
        );
      if (hasHostingCycle(state, id))
        errors.push(`CardInstance ${id} has a hosting cycle.`);
    }
  }
  if (
    state.run?.encounteredIceId &&
    !state.cardInstances[state.run.encounteredIceId]
  )
    errors.push("Run references missing encountered ice.");
  if (
    state.run?.approachIceExposeViewingIceId &&
    !state.cardInstances[state.run.approachIceExposeViewingIceId]
  )
    errors.push("Run references missing viewed approached ice.");
  if (
    state.run?.approachIceExposeViewingSourceCardId &&
    !state.cardInstances[state.run.approachIceExposeViewingSourceCardId]
  )
    errors.push("Run references missing approach expose source card.");
  if (
    state.run?.viral15ActiveSourceIceId &&
    !state.cardInstances[state.run.viral15ActiveSourceIceId]
  )
    errors.push("Run Viral 15 source references missing ice.");
  if (
    state.run?.viral15PendingPassedIceId &&
    !state.cardInstances[state.run.viral15PendingPassedIceId]
  )
    errors.push("Run Viral 15 pending passed ice references missing ice.");
  if (state.run && !Array.isArray(state.run.resolvedSubroutineIndexes))
    errors.push("Run resolved subroutine index list is missing.");
  if (state.run?.remainderStrengthBonusByBreaker) {
    for (const [breakerId, amount] of Object.entries(
      state.run.remainderStrengthBonusByBreaker,
    )) {
      if (amount === undefined || !Number.isInteger(amount) || amount < 0) {
        errors.push(
          `Run remainder strength bonus for ${breakerId} must be a non-negative integer.`,
        );
      }
    }
  }
  if (state.run?.breach) {
    const effectiveAccessServerId =
      state.run.accessServerOverride ?? state.run.attackedServerId;
    if (state.run.phase !== "access")
      errors.push("Breach is only valid during access.");
    if (state.run.breach.serverId !== effectiveAccessServerId)
      errors.push("Breach server must match effective access server.");
    if (
      !state.run.breach.completed &&
      (state.run.breach.currentIndex < 0 ||
        state.run.breach.currentIndex >= state.run.breach.queue.length)
    ) {
      errors.push("Breach current index is invalid.");
    }
    const entryIds = new Set<string>();
    for (const entry of state.run.breach.queue) {
      if (entryIds.has(entry.entryId))
        errors.push(`Breach entry ${entry.entryId} appears multiple times.`);
      entryIds.add(entry.entryId);
      if (!state.cardInstances[entry.cardInstanceId])
        errors.push(
          `Breach references missing CardInstance ${entry.cardInstanceId}.`,
        );
      if (entry.serverId !== effectiveAccessServerId)
        errors.push("Breach entry server must match effective access server.");
    }
    const currentEntry = state.run.breach.queue[state.run.breach.currentIndex];
    if (
      state.run.accessedCardId &&
      currentEntry &&
      currentEntry.cardInstanceId !== state.run.accessedCardId
    ) {
      errors.push("Accessed card must match the current breach entry.");
    }
  }
  if (state.trace) {
    if (!state.cardInstances[state.trace.sourceCardInstanceId])
      errors.push("Trace references missing source card.");
    if (
      !Number.isInteger(state.trace.baseTraceStrength) ||
      state.trace.baseTraceStrength < 0
    )
      errors.push("Trace base strength is invalid.");
    if (!isSupportedTraceSuccessEffect(state.trace.successEffect))
      errors.push("Trace success effect is outside supported scope.");
    if (!state.pendingChoice)
      errors.push("Trace requires an open PendingChoice.");
    if (
      state.trace.status === "corp_bid" &&
      state.pendingChoice?.side !== "corp"
    )
      errors.push("Corp trace bid requires Corp choice.");
    if (
      state.trace.status === "base_link" ||
      state.trace.status === "runner_bid" ||
      state.trace.status === "post_bid_link"
    ) {
      if (state.pendingChoice?.side !== "runner")
        errors.push("Runner trace step requires Runner choice.");
      if (
        state.trace.corpBid === undefined ||
        state.trace.traceStrength === undefined ||
        state.trace.runnerLink === undefined
      )
        errors.push("Runner trace step is missing Corp bid context.");
    }
  }
  if (state.identityAbilityUsage) {
    for (const side of ["corp", "runner"] as const) {
      const usage = state.identityAbilityUsage[side];
      if (!usage) continue;
      const setupAbilities = Array.isArray(usage.setupAbilities)
        ? usage.setupAbilities
        : [];
      const usedThisTurn = Array.isArray(usage.usedThisTurn)
        ? usage.usedThisTurn
        : [];
      if (
        !Array.isArray(usage.setupAbilities) ||
        !Array.isArray(usage.usedThisTurn)
      )
        errors.push(`Identity usage for ${side} must contain ability arrays.`);
      if (!Number.isInteger(usage.turn) || usage.turn < 0)
        errors.push(`Identity usage for ${side} has invalid turn.`);
      if (new Set(setupAbilities).size !== setupAbilities.length)
        errors.push(`Identity setup usage for ${side} must be unique.`);
      if (new Set(usedThisTurn).size !== usedThisTurn.length)
        errors.push(`Identity turn usage for ${side} must be unique.`);
      if (
        ![...setupAbilities, ...usedThisTurn].every(
          (id) => typeof id === "string" && id.length > 0,
        )
      ) {
        errors.push(`Identity usage for ${side} has invalid ability ids.`);
      }
    }
  }
  if (state.pendingChoice) {
    if (
      state.pendingChoice.side !== "corp" &&
      state.pendingChoice.side !== "runner"
    )
      errors.push("PendingChoice has invalid side.");
    if (state.pendingChoice.stateVersion !== state.stateVersion)
      errors.push("PendingChoice stateVersion must match current GameState.");
    if (
      state.pendingChoice.minSelections < 0 ||
      state.pendingChoice.maxSelections < state.pendingChoice.minSelections
    )
      errors.push("PendingChoice has invalid selection bounds.");
    const optionIds = new Set(
      state.pendingChoice.options.map((option) => option.id),
    );
    if (optionIds.size !== state.pendingChoice.options.length)
      errors.push("PendingChoice option ids must be unique.");
  }
  if (state.runnerTurnFlags?.incubatorPendingTransforms !== undefined) {
    const pending = state.runnerTurnFlags.incubatorPendingTransforms;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.incubatorPendingTransforms must be a non-negative integer.",
      );
  }
  if (
    state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining !== undefined
  ) {
    const remaining =
      state.runnerTurnFlags.valuPakProgramInstallActionsRemaining;
    if (!Number.isInteger(remaining) || remaining < 0 || remaining > 5)
      errors.push(
        "runnerTurnFlags.valuPakProgramInstallActionsRemaining must be an integer from 0 to 5.",
      );
  }
  if (state.runnerTurnFlags?.forgoNextActionsPending !== undefined) {
    const pending = state.runnerTurnFlags.forgoNextActionsPending;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.forgoNextActionsPending must be a non-negative integer.",
      );
  }
  if (state.runnerTurnFlags?.runLockActionsPending !== undefined) {
    const pending = state.runnerTurnFlags.runLockActionsPending;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.runLockActionsPending must be a non-negative integer.",
      );
  }
  if (state.runnerTurnFlags?.fangRunLockCreditCost !== undefined) {
    const pending = state.runnerTurnFlags.fangRunLockCreditCost;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.fangRunLockCreditCost must be a non-negative integer.",
      );
  }
  if (state.runnerAgendaPointsToForfeit !== undefined) {
    const pending = state.runnerAgendaPointsToForfeit;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerAgendaPointsToForfeit must be a non-negative integer.",
      );
  }
  if (state.acmeSavingsAndLoanObligations !== undefined) {
    const obligations = state.acmeSavingsAndLoanObligations;
    if (!Number.isInteger(obligations) || obligations < 0)
      errors.push(
        "acmeSavingsAndLoanObligations must be a non-negative integer.",
      );
  }
  if (state.corpBonusAgendaPoints !== undefined) {
    const points = state.corpBonusAgendaPoints;
    if (!Number.isInteger(points) || points < 0)
      errors.push("corpBonusAgendaPoints must be a non-negative integer.");
  }
  if (
    state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits !== undefined
  ) {
    const credits = state.runnerTurnFlags.valuPakTemporaryProgramInstallCredits;
    if (!Number.isInteger(credits) || credits < 0 || credits > 1)
      errors.push(
        "runnerTurnFlags.valuPakTemporaryProgramInstallCredits must be an integer from 0 to 1.",
      );
  }
  if (
    state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining !== undefined
  ) {
    const remaining =
      state.corpTurnFlags.edgerunnerTempsInstallActionsRemaining;
    if (!Number.isInteger(remaining) || remaining < 0 || remaining > 3)
      errors.push(
        "corpTurnFlags.edgerunnerTempsInstallActionsRemaining must be an integer from 0 to 3.",
      );
  }
  if (state.eventModificationWindow) {
    if (!state.imminentEvent)
      errors.push("EventModificationWindow requires an ImminentEvent.");
    if (state.eventModificationWindow.eventId !== state.imminentEvent?.eventId)
      errors.push("EventModificationWindow eventId must match ImminentEvent.");
    if (
      state.eventModificationWindow.candidates.some(
        (candidate) =>
          candidate.eventId !== state.eventModificationWindow?.eventId,
      )
    ) {
      errors.push(
        "EventModification candidates must reference the open event.",
      );
    }
  }
  if (state.replacementWindow) {
    if (!state.imminentEvent)
      errors.push("ReplacementWindow requires an ImminentEvent.");
    if (
      state.replacementWindow.originalEventId !== state.imminentEvent?.eventId
    )
      errors.push(
        "ReplacementWindow originalEventId must match ImminentEvent.",
      );
    const consumed = new Set(state.replacementWindow.consumedCandidateIds);
    if (consumed.size !== state.replacementWindow.consumedCandidateIds.length)
      errors.push("Replacement consumedCandidateIds must be unique.");
  }

  return { ok: errors.length === 0, errors };
}

export function validateGameStateForDebug(state: GameState): ValidationResult {
  return validateGameState(state);
}

function placementForZoneRef(zone: CardInstance["zone"]): string | undefined {
  if (zone.side === "corp" && zone.zone === "hq") return "corp.hq";
  if (zone.side === "corp" && zone.zone === "rd") return "corp.rd";
  if (zone.side === "corp" && zone.zone === "archives") return "corp.archives";
  if (zone.side === "corp" && zone.zone === "scoreArea")
    return "corp.scoreArea";
  if (zone.side === "corp" && zone.zone === "serverIce")
    return `${zone.serverId}.ice`;
  if (zone.side === "corp" && zone.zone === "serverRoot")
    return `${zone.serverId}.root`;
  if (zone.side === "runner" && zone.zone === "grip") return "runner.grip";
  if (zone.side === "runner" && zone.zone === "stack") return "runner.stack";
  if (zone.side === "runner" && zone.zone === "heap") return "runner.heap";
  if (zone.side === "runner" && zone.zone === "scoreArea")
    return "runner.scoreArea";
  if (zone.side === "runner" && zone.zone === "rig") {
    return undefined;
  }
  if (zone.side === "special" && zone.zone === "set_aside")
    return "special.set_aside";
  if (zone.side === "special" && zone.zone === "removed_from_game")
    return "special.removed_from_game";
  return undefined;
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function hasHostingCycle(state: GameState, cardId: CardInstanceId): boolean {
  const seen = new Set<CardInstanceId>([cardId]);
  let current = state.cardInstances[cardId]?.hostedOn;
  while (current) {
    if (seen.has(current)) return true;
    seen.add(current);
    current = state.cardInstances[current]?.hostedOn;
  }
  return false;
}

type RunnerTraceCounterEffectRuntime =
  NonNullable<(typeof CARD_IMPLEMENTATIONS)[number]["runnerCounterEffects"]>[number] & {
    sourceDefinitionId: CardDefinitionId;
  };

function runnerTraceCounterEffectDefinitions(): RunnerTraceCounterEffectRuntime[] {
  return CARD_IMPLEMENTATIONS.flatMap((implementation) =>
    (implementation.runnerCounterEffects ?? []).map((counterEffect) => ({
      ...counterEffect,
      sourceDefinitionId: implementation.cardDefinitionId,
    })),
  );
}

function traceCounterEffectDefinitionFor(
  counterType: unknown,
): RunnerTraceCounterEffectRuntime | undefined {
  return runnerTraceCounterEffectDefinitions().find(
    (effect) => effect.counterType === counterType,
  );
}

function isSupportedTraceSuccessEffect(effect: TraceSuccessEffect): boolean {
  if (effect.type === "none") return true;
  if (effect.type === "add_counter") {
    return (
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (effect.type === "add_tag_and_counter") {
    return (
      Number.isInteger(effect.tagAmount) &&
      effect.tagAmount >= 0 &&
      Number.isInteger(effect.amount) &&
      effect.amount >= 0 &&
      traceCounterEffectDefinitionFor(effect.counterType) !== undefined
    );
  }
  if (
    effect.type === "end_run_and_run_lock" ||
    effect.type === "end_run_trash_program_and_run_lock"
  ) {
    return Number.isInteger(effect.amount) && effect.amount > 0;
  }
  if (effect.type === "end_run_trash_hardware_and_unpreventable_meat_damage")
    return Number.isInteger(effect.amount) && effect.amount > 0;
  return (
    effect.type === "add_tag" &&
    Number.isInteger(effect.amount) &&
    effect.amount >= 0
  );
}
