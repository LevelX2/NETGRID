import type { GameState, RestrictedActionGrantBucket } from "@netgrid/shared";

export function validateIdentityAbilityUsage(
  errors: string[],
  state: GameState,
): void {
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
}

export function validateTurnState(errors: string[], state: GameState): void {
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
  if (state.runnerTurnFlags?.runnerRunLockCreditCost !== undefined) {
    const pending = state.runnerTurnFlags.runnerRunLockCreditCost;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerTurnFlags.runnerRunLockCreditCost must be a non-negative integer.",
      );
  }
  if (state.runnerDelayedEffectInstances) {
    const ids = new Set<string>();
    for (const effect of state.runnerDelayedEffectInstances) {
      if (ids.has(effect.effectInstanceId))
        errors.push("Runner delayed effect instance ids must be unique.");
      ids.add(effect.effectInstanceId);
      const source = state.cardInstances[effect.sourceCardInstanceId];
      if (!source || source.definitionId !== effect.sourceDefinitionId)
        errors.push("Runner delayed effect source binding is invalid.");
      if (!effect.sourceCapabilityKey || !effect.sourceTitle)
        errors.push("Runner delayed effect capability binding is invalid.");
      if (!Number.isInteger(effect.amount) || effect.amount <= 0)
        errors.push("Runner delayed effect amount must be positive.");
      if (
        effect.trigger !== "next_agenda_access" ||
        effect.expires !== "runner_turn_end"
      )
        errors.push("Runner delayed effect trigger or expiry is invalid.");
      if (
        !Number.isInteger(effect.createdAtTurnSerial) ||
        effect.createdAtTurnSerial < 0
      )
        errors.push("Runner delayed effect turn serial is invalid.");
      if (effect.consumed !== Boolean(effect.consumedByCardId))
        errors.push("Runner delayed effect consumed binding is invalid.");
    }
  }
  if (state.runnerAgendaPointsToForfeit !== undefined) {
    const pending = state.runnerAgendaPointsToForfeit;
    if (!Number.isInteger(pending) || pending < 0)
      errors.push(
        "runnerAgendaPointsToForfeit must be a non-negative integer.",
      );
  }
  if (state.activeObligationDebtCount !== undefined) {
    const obligations = state.activeObligationDebtCount;
    if (!Number.isInteger(obligations) || obligations < 0)
      errors.push("activeObligationDebtCount must be a non-negative integer.");
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
  if (state.corpTurnFlags?.fortActivityServerIdsSinceCorpTurnStart) {
    const activityServerIds =
      state.corpTurnFlags.fortActivityServerIdsSinceCorpTurnStart;
    const knownServerIds = new Set(
      state.corp.servers.map((server) => server.id),
    );
    if (
      activityServerIds.some((serverId) => !knownServerIds.has(serverId)) ||
      new Set(activityServerIds).size !== activityServerIds.length ||
      activityServerIds.join("\0") !==
        activityServerIds.slice().sort().join("\0")
    )
      errors.push(
        "corpTurnFlags.fortActivityServerIdsSinceCorpTurnStart must contain unique, sorted existing server ids.",
      );
  }
  validateRestrictedActionGrants(
    errors,
    "runnerTurnFlags.restrictedActionGrants",
    state.runnerTurnFlags?.restrictedActionGrants,
  );
  validateRestrictedActionGrants(
    errors,
    "corpTurnFlags.restrictedActionGrants",
    state.corpTurnFlags?.restrictedActionGrants,
  );
}

function validateRestrictedActionGrants(
  errors: string[],
  path: string,
  grants: RestrictedActionGrantBucket | undefined,
): void {
  if (!grants) return;
  for (const [key, grant] of Object.entries(grants)) {
    if (!grant) continue;
    const grantPath = `${path}.${key}`;
    if (typeof grant.sourceCardInstanceId !== "string")
      errors.push(`${grantPath}.sourceCardInstanceId must be a string.`);
    if (typeof grant.sourceDefinitionId !== "number")
      errors.push(`${grantPath}.sourceDefinitionId must be a string.`);
    if (typeof grant.actionType !== "string")
      errors.push(`${grantPath}.actionType must be a string.`);
    if (!Number.isInteger(grant.remainingActions) || grant.remainingActions < 0)
      errors.push(
        `${grantPath}.remainingActions must be a non-negative integer.`,
      );
    if (
      grant.temporaryCredits &&
      (!Number.isInteger(grant.temporaryCredits.amount) ||
        grant.temporaryCredits.amount < 0)
    )
      errors.push(
        `${grantPath}.temporaryCredits.amount must be a non-negative integer.`,
      );
    if (
      grant.spendingCap &&
      (!Number.isInteger(grant.spendingCap.limit) ||
        grant.spendingCap.limit < 0)
    )
      errors.push(
        `${grantPath}.spendingCap.limit must be a non-negative integer.`,
      );
  }
}
