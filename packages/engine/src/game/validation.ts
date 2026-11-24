import { isRandomHistory, PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES, type GameState, type ValidationResult } from "@netgrid/shared";
import { runnerMemoryLimit } from "../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import { runnerMemoryCheckpointChoiceStateIsValid } from "./checkpoints/runner-memory-checkpoint";
import { validateCardPlacement, validateRigAndCounters } from "./state-validation/board-invariants";
import { validateRunState } from "./state-validation/run-invariants";
import { validateTraceState } from "./state-validation/trace-invariants";
import { validateIdentityAbilityUsage, validateTurnState } from "./state-validation/turn-invariants";
import { validateChoiceContinuations, validateEventWindows, validatePendingDrawAndPayment } from "./state-validation/window-invariants";
import { isTraceRulesProfile } from "./trace/trace-rules-profile";

const purgeableVirusCounterTypes = new Set<string>(PURGEABLE_RUNNER_VIRUS_COUNTER_TYPES);

export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];
  validateRandomState(errors, state);
  validateCorpActionDebt(errors, state);
  validatePurgeableRunnerVirusCounters(errors, state);
  validateBrokenIceVirusCounterChoice(errors, state);
  if (
    state.traceRulesProfile !== undefined &&
    !isTraceRulesProfile(state.traceRulesProfile)
  )
    errors.push("Trace rules profile is invalid.");
  validateCardPlacement(errors, state);
  validatePendingDrawAndPayment(errors, state);
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
  if (
    state.runner.memoryUsed > runnerMemoryLimit(state) &&
    !runnerMemoryCheckpointChoiceStateIsValid(state) &&
    !runnerMemoryCheckpointDeferredByGripSearchChoiceStateIsValid(state)
  )
    errors.push("Runner memory limit exceeded.");
  validateRigAndCounters(errors, state);
  validateRunState(errors, state);
  validateTraceState(errors, state);
  validateIdentityAbilityUsage(errors, state);
  validateChoiceContinuations(errors, state);
  validateTurnState(errors, state);
  validateEventWindows(errors, state);
  return { ok: errors.length === 0, errors };
}

function validateRandomState(errors: string[], state: GameState): void {
  if (!isRandomHistory(state.randomCounter, state.randomDrawRecords, "engine"))
    errors.push("Engine random history must contain contiguous domain-bound draw records.");
  if (!isRandomHistory(state.aiTurnPlanRandomCounter, state.aiTurnPlanRandomDrawRecords, "ai_turn_plan_selection"))
    errors.push("AI random history must contain contiguous domain-bound draw records.");
}

function validateCorpActionDebt(errors: string[], state: GameState): void {
  const debt = state.corpActionDebt;
  if (!debt) return;
  if (
    !Number.isSafeInteger(debt.forgoActionsPending) ||
    debt.forgoActionsPending < 0 ||
    !Array.isArray(debt.entries)
  ) {
    errors.push("Corp action debt is invalid.");
    return;
  }
  let entryTotal = 0;
  for (const [index, entry] of debt.entries.entries()) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !Number.isSafeInteger(entry.remaining) ||
      entry.remaining <= 0 ||
      !Number.isSafeInteger(entry.createdAtStateVersion) ||
      entry.createdAtStateVersion < 0 ||
      entry.createdAtStateVersion > state.stateVersion ||
      typeof entry.reason !== "string" ||
      entry.reason.trim().length === 0 ||
      typeof entry.source !== "string" ||
      entry.source.trim().length === 0
    )
      errors.push(`Corp action debt entry ${index} is invalid.`);
    else entryTotal += entry.remaining;
  }
  if (entryTotal !== debt.forgoActionsPending)
    errors.push("Corp action debt total must equal its entry total.");
}

function validatePurgeableRunnerVirusCounters(
  errors: string[],
  state: GameState,
): void {
  const counters = state.purgeableRunnerVirusCounters;
  if (!counters) return;
  const validateBucket = (path: string, bucket: unknown): void => {
    if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
      errors.push(`${path} must be a counter bucket.`);
      return;
    }
    for (const [counterType, amount] of Object.entries(bucket)) {
      if (
        !purgeableVirusCounterTypes.has(counterType) ||
        !Number.isSafeInteger(amount) ||
        Number(amount) < 0
      )
        errors.push(
          `${path}.${counterType} must be a non-negative safe integer.`,
        );
    }
  };
  if (counters.corp)
    validateBucket("purgeableRunnerVirusCounters.corp", counters.corp);
  const serverIds = new Set<string>(
    state.corp.servers.map((server) => server.id),
  );
  for (const [serverId, bucket] of Object.entries(counters.servers ?? {})) {
    if (!serverIds.has(serverId))
      errors.push(
        `Purgeable Runner virus counter server ${serverId} is invalid.`,
      );
    validateBucket(`purgeableRunnerVirusCounters.servers.${serverId}`, bucket);
  }
  for (const [effectId, effect] of Object.entries(counters.effects ?? {})) {
    if (
      effectId.trim().length === 0 ||
      !effect ||
      typeof effect !== "object" ||
      !purgeableVirusCounterTypes.has(effect.counterType) ||
      !Number.isSafeInteger(effect.amount) ||
      effect.amount < 0 ||
      (effect.serverId !== undefined && !serverIds.has(effect.serverId))
    )
      errors.push(
        `Purgeable Runner virus counter effect ${effectId} is invalid.`,
      );
  }
}

function validateBrokenIceVirusCounterChoice(
  errors: string[],
  state: GameState,
): void {
  const pending = state.pendingBrokenIceVirusCounterChoice;
  if (!pending) return;
  const choice = state.pendingChoice;
  if (
    !choice ||
    choice.side !== "runner" ||
    choice.kind !== "select_option" ||
    choice.source !== `broken_ice.virus_counter:${choice.stateVersion}` ||
    choice.stateVersion !== state.stateVersion
  ) {
    errors.push("Broken-ICE virus counter choice binding is invalid.");
    return;
  }
  if (
    pending.counterType !== "pattel" ||
    !Array.isArray(pending.sources) ||
    !Array.isArray(pending.targetIceIds) ||
    pending.sources.length === 0 ||
    pending.targetIceIds.length === 0 ||
    new Set(pending.sources.map((source) => source.sourceCardId)).size !==
      pending.sources.length ||
    new Set(pending.targetIceIds).size !== pending.targetIceIds.length
  ) {
    errors.push("Broken-ICE virus counter choice state is invalid.");
    if (!Array.isArray(pending.sources) || !Array.isArray(pending.targetIceIds))
      return;
  }

  const sourceIds = new Set(
    pending.sources.map((source) => source.sourceCardId),
  );
  const targetIds = new Set(pending.targetIceIds);
  for (const source of pending.sources) {
    if (
      !state.cardInstances[source.sourceCardId] ||
      !Number.isSafeInteger(source.amount) ||
      source.amount <= 0
    )
      errors.push(
        `Broken-ICE virus counter source ${source.sourceCardId} is invalid.`,
      );
  }
  for (const targetId of pending.targetIceIds) {
    if (!state.cardInstances[targetId])
      errors.push(`Broken-ICE virus counter target ${targetId} is invalid.`);
  }
  const expectedOptionCount = sourceIds.size * targetIds.size;
  const optionBindings = new Set<string>();
  for (const option of choice.options) {
    const sourceId = option.metadata?.sourceCardInstanceId;
    const targetId = option.metadata?.targetCardInstanceId;
    if (
      !sourceId ||
      !targetId ||
      !sourceIds.has(sourceId) ||
      !targetIds.has(targetId) ||
      option.value !== targetId
    ) {
      errors.push(`Broken-ICE virus counter option ${option.id} is invalid.`);
      continue;
    }
    optionBindings.add(`${sourceId}:${targetId}`);
  }
  if (
    choice.options.length !== expectedOptionCount ||
    optionBindings.size !== expectedOptionCount ||
    choice.minSelections !== sourceIds.size ||
    choice.maxSelections !== sourceIds.size
  )
    errors.push("Broken-ICE virus counter choice options are incomplete.");
}

function runnerMemoryCheckpointDeferredByGripSearchChoiceStateIsValid(
  state: GameState,
): boolean {
  const choice = state.pendingChoice;
  if (
    !choice ||
    choice.side !== "runner" ||
    choice.kind !== "select_cards" ||
    !choice.source.startsWith("p3_37.search_stack_to_grip:") ||
    choice.visibility !== "hidden_info_barrier" ||
    choice.stateVersion !== state.stateVersion ||
    choice.minSelections < 1 ||
    choice.minSelections !== choice.maxSelections ||
    choice.cardSearchPresentation?.sourceZone !== "stack" ||
    choice.cardSearchPresentation.destination !== "grip" ||
    choice.cardSearchPresentation.shuffleAfter !== true
  )
    return false;
  const sourceCardId = choice.sourceCardInstanceId;
  const sourceDefinitionId = choice.sourceCardDefinitionId;
  if (
    !sourceCardId ||
    !sourceDefinitionId ||
    !state.runner.heap.includes(sourceCardId) ||
    state.cardInstances[sourceCardId]?.definitionId !== sourceDefinitionId ||
    cardImplementationForDefinitionId(sourceDefinitionId)?.runnerEventLongtail
      ?.kind !== "trash_grip_search_stack_to_grip_equal_count"
  )
    return false;
  const selectableStackIds = new Set(state.runner.stack);
  const optionValues = choice.options
    .filter((option) => option.selectable !== false)
    .map((option) => option.value);
  return (
    optionValues.length >= choice.minSelections &&
    optionValues.every(
      (value) => typeof value === "string" && selectableStackIds.has(value),
    ) &&
    new Set(optionValues).size === optionValues.length
  );
}

export function validateGameStateForDebug(state: GameState): ValidationResult {
  return validateGameState(state);
}
