import {
  isRunId,
  isSubroutineProvenance,
  type GameState,
} from "@netgrid/shared";

export function validateRunState(errors: string[], state: GameState): void {
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
    state.run?.activeIceProgramTrashSourceIceId &&
    !state.cardInstances[state.run.activeIceProgramTrashSourceIceId]
  )
    errors.push("Run Active ICE Program Trash source references missing ice.");
  if (
    state.run?.activeIceProgramTrashPendingPassedIceId &&
    !state.cardInstances[state.run.activeIceProgramTrashPendingPassedIceId]
  )
    errors.push(
      "Run Active ICE Program Trash pending passed ice references missing ice.",
    );
  if (state.run && !Array.isArray(state.run.resolvedSubroutineIndexes))
    errors.push("Run resolved subroutine index list is missing.");
  if (state.run && !isRunId(state.run.runId))
    errors.push("Run id must be a positive safe integer.");
  for (const [index, record] of (
    state.run?.encounterAdditionalSubroutines ?? []
  ).entries()) {
    if (
      record.copiedSubroutine &&
      (!isSubroutineProvenance(record.originalSubroutineProvenance) ||
        !isSubroutineProvenance(record.copiedSubroutine.provenance))
    )
      errors.push(
        `run.encounterAdditionalSubroutines[${index}] must bind the copied subroutine provenance.`,
      );
  }
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
  if (state.run?.breakerState) {
    const breakerState = state.run.breakerState;
    for (const [breakerId, modifiers] of Object.entries(
      breakerState.strengthModifiersByBreakerInstanceId ?? {},
    )) {
      if (!state.cardInstances[breakerId])
        errors.push(
          `Run breaker strength modifier references missing ${breakerId}.`,
        );
      for (const modifier of modifiers ?? []) {
        if (
          !Number.isInteger(modifier.amount) ||
          modifier.amount <= 0 ||
          !["current_encounter", "current_run"].includes(modifier.duration) ||
          modifier.source.length === 0
        )
          errors.push(
            `Run breaker strength modifier for ${breakerId} is invalid.`,
          );
      }
    }
    for (const [breakerId, count] of Object.entries(
      breakerState.brokenSubroutineCountByBreakerInstanceId ?? {},
    )) {
      if (!state.cardInstances[breakerId])
        errors.push(`Run breaker count references missing ${breakerId}.`);
      if (count === undefined || !Number.isInteger(count) || count < 0)
        errors.push(`Run breaker count for ${breakerId} is invalid.`);
    }
    for (const pending of breakerState.pendingFreeBreaks ?? []) {
      if (!state.cardInstances[pending.sourceBreakerInstanceId])
        errors.push("Run pending free break references missing breaker.");
      if (
        pending.iceSubtype !== "sentry" ||
        !Number.isInteger(pending.remainingUses) ||
        pending.remainingUses <= 0 ||
        pending.mustBeNextEncounteredIce !== true ||
        (pending.targetIceId !== undefined &&
          !state.cardInstances[pending.targetIceId])
      )
        errors.push("Run pending free break is invalid.");
    }
  }
  for (const modifier of state.temporaryBreakerStrengthModifiersUntilEndOfTurn ??
    []) {
    const source = state.cardInstances[modifier.sourceCardInstanceId];
    const target = state.cardInstances[modifier.targetBreakerId];
    if (!source)
      errors.push("Temporary breaker strength modifier source is missing.");
    if (!target)
      errors.push("Temporary breaker strength modifier target is missing.");
    if (source && source.definitionId !== modifier.sourceDefinitionId)
      errors.push(
        "Temporary breaker strength modifier source definition does not match.",
      );
    if (
      !Number.isInteger(modifier.amount) ||
      modifier.amount <= 0 ||
      !Number.isInteger(modifier.turnSerial) ||
      modifier.turnSerial < 0 ||
      modifier.expires !== "turn_end"
    )
      errors.push("Temporary breaker strength modifier is invalid.");
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
}
