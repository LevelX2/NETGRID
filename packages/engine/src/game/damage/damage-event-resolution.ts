import type {
  CardDefinitionId,
  CardInstanceId,
  DamageType,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  Phase,
  Side,
  TimingPointId,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { maxHandSize } from "../../ability-engine/effective-values";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  addRunnerFutureActionDebt,
  assertPositiveIntegerAmount,
  credits,
  damageTypePayload,
  definitionFor,
  drawRunnerCard,
  ensureRunnerTurnFlags,
  mustArrayValue,
  mustInstance,
  nextRandom,
  numberPayload,
  recordRunnerDamageDuringCurrentAction,
  removeFromAllZones,
  requireDamageCoreHost,
  sanitizeId,
  scoredAgendaKindForDefinition,
  scoredCorpAgendaIds,
  stringPayload,
  trashRunnerInstalledCardToHeap,
  runnerInstalledCardIds,
  type DamageSummary,
} from "./damage-runtime-context";

export function doDamage(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
    runnerActionOrdinal?: number;
  },
): DamageSummary {
  // Dieser Finalresolver zieht sofort Zufall. Fenster müssen vor dem Aufruf
  // vollständig abgearbeitet sein, damit Replay und RandomCounter stabil bleiben.
  assertPositiveIntegerAmount(request.amount);
  const runnerGripBefore = state.runner.grip.length;
  if (request.amount > runnerGripBefore) {
    state.winner = "corp";
    state.gameEndReason = "flatline";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.activeSide = "corp";
    delete state.run;
    return {
      damageType: request.damageType,
      amount: request.amount,
      cardsTrashed: 0,
      flatline: true,
      runnerGripBefore,
      runnerGripAfter: 0,
    };
  }

  const available = state.runner.grip.slice();
  const selected: CardInstanceId[] = [];
  for (let index = 0; index < request.amount; index += 1) {
    const value = nextRandom(
      state,
      `damage:${request.damageId}:${request.damageType}:${request.source}:${request.amount}:selection:${index}`,
    );
    const selectedIndex = Math.floor(value * available.length);
    const cardId = mustArrayValue(
      available,
      selectedIndex,
      "Damage-Auswahl fehlt.",
    );
    available.splice(selectedIndex, 1);
    selected.push(cardId);
  }

  for (const cardId of selected) {
    removeFromAllZones(state, cardId);
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
  }

  if (request.damageType === "core") state.runner.coreDamage += request.amount;
  recordRunnerDamageDuringCurrentAction(state, request.runnerActionOrdinal);

  const summary = {
    damageType: request.damageType,
    amount: request.amount,
    cardsTrashed: selected.length,
    flatline: false,
    runnerGripBefore,
    runnerGripAfter: state.runner.grip.length,
    ...(request.damageType === "core"
      ? {
          coreDamageAfter: state.runner.coreDamage,
          runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
        }
      : {}),
  };
  if (request.damageType === "meat" && selected.length > 0 && !state.winner)
    requireDamageCoreHost().reactions?.openPostMeatDamageReactionWindow(
      state,
      summary,
    );
  return summary;
}

export function isCorpDamageSource(source: string): boolean {
  return (
    source.includes("corp") ||
    source.startsWith("scored_agenda:") ||
    source.startsWith("trace:") ||
    source.startsWith("subroutine:") ||
    source.startsWith("ice:") ||
    source.startsWith("operation:") ||
    source.startsWith("asset:")
  );
}

export function scoredPdcaAgendaIds(state: GameState): CardInstanceId[] {
  return state.corp.scoreArea
    .slice()
    .sort()
    .filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        scoredAgendaKindForDefinition(definition) ===
        "corp_damage_replacement_pdca_action_counter"
      );
    });
}

export function pdcaEventWithReturnContext(
  state: GameState,
  event: ImminentEvent,
): ImminentEvent {
  return {
    ...event,
    modificationWindowId: `proteus_pdca_${event.eventId}`,
    payload: {
      ...event.payload,
      pdcaReturnPhase: state.phase,
      pdcaReturnTimingPoint: state.timingPoint,
      pdcaReturnActiveSide: state.activeSide,
    },
  };
}

export function restorePdcaReturnContext(
  state: GameState,
  event: ImminentEvent,
): void {
  if (state.winner || state.phase === "game_over") return;
  const phase = event.payload.pdcaReturnPhase;
  const timingPoint = event.payload.pdcaReturnTimingPoint;
  const activeSide = event.payload.pdcaReturnActiveSide;
  if (!isPhase(phase) || !isTimingPointId(timingPoint) || !isSide(activeSide))
    return;
  state.phase = phase;
  state.timingPoint = timingPoint;
  state.activeSide = activeSide;
}

export function isPhase(value: unknown): value is Phase {
  return (
    value === "setup" ||
    value === "corp_draw_phase" ||
    value === "corp_action_phase" ||
    value === "corp_discard_phase" ||
    value === "runner_action_phase" ||
    value === "runner_discard_phase" ||
    value === "run" ||
    value === "game_over"
  );
}

export function isTimingPointId(value: unknown): value is TimingPointId {
  return (
    value === "setup.mulligan.runner" ||
    value === "setup.mulligan.corp" ||
    value === "corp_draw.mandatory_draw" ||
    value === "corp_action.main" ||
    value === "corp_discard.select_cards" ||
    value === "corp_discard.complete" ||
    value === "runner_action.main" ||
    value === "runner_discard.flatline_check" ||
    value === "runner_discard.select_cards" ||
    value === "runner_discard.complete" ||
    value === "run.approach_ice" ||
    value === "run.encounter_ice" ||
    value === "run.jack_out_window" ||
    value === "run.movement_rez_window" ||
    value === "access.resolve_card" ||
    value === "game.checkpoint"
  );
}

export function isSide(value: unknown): value is Side {
  return value === "corp" || value === "runner";
}

export function openPdcaDamageReplacementChoice(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    state.pendingChoice ||
    state.winner
  )
    return false;
  const amount = numberPayload(event, "amount");
  const source = stringPayload(event, "source");
  if (amount <= 0 || !isCorpDamageSource(source)) return false;
  const sourceCardId = scoredPdcaAgendaIds(state)[0];
  if (!sourceCardId) return false;
  const definition = definitionFor(state, sourceCardId);
  state.imminentEvent = pdcaEventWithReturnContext(state, event);
  state.pendingChoice = {
    choiceId: `damage_replacement_${state.stateVersion + 1}_${sourceCardId}`,
    side: "corp",
    source: `damage_replacement:${sourceCardId}:${event.eventId}`,
    prompt: "Please Don't Choke Anyone nutzen",
    kind: "select_option",
    options: Array.from({ length: amount + 1 }, (_, preventedAmount) => ({
      id: `replace_${sourceCardId}_${preventedAmount}`,
      label:
        preventedAmount === 0
          ? "Keinen Damage durch PDCA-Counter ersetzen"
          : `${preventedAmount} Damage durch PDCA-Counter ersetzen`,
      publicLabel: "PDCA-Entscheidung",
      value: String(preventedAmount),
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  state.activeSide = "corp";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    pdcaDamageReplacementWindowOpened: true,
    pdcaSourceCardInstanceId: sourceCardId,
    sourceDefinitionId: definition.id,
    originalDamageAmount: amount,
    damageType: damageTypePayload(event),
    imminentEventId: event.eventId,
    replacementModel: "per_damage_unit",
  };
  return true;
}

export function aggregateDamageSummaries(
  summaries: DamageSummary[],
): DamageSummary {
  const first = mustArrayValue(summaries, 0, "Damage-Zusammenfassung fehlt.");
  const lastCoreSummary = summaries
    .slice()
    .reverse()
    .find(
      (summary) =>
        summary.coreDamageAfter !== undefined ||
        summary.runnerMaxHandSizeAfter !== undefined,
    );
  return {
    damageType: first.damageType,
    amount: summaries.reduce((total, summary) => total + summary.amount, 0),
    cardsTrashed: summaries.reduce(
      (total, summary) => total + summary.cardsTrashed,
      0,
    ),
    flatline: summaries.some((summary) => summary.flatline),
    ...(first.runnerGripBefore !== undefined
      ? { runnerGripBefore: first.runnerGripBefore }
      : {}),
    ...(summaries.at(-1)?.runnerGripAfter !== undefined
      ? { runnerGripAfter: summaries.at(-1)!.runnerGripAfter }
      : {}),
    ...(lastCoreSummary?.coreDamageAfter !== undefined
      ? { coreDamageAfter: lastCoreSummary.coreDamageAfter }
      : {}),
    ...(lastCoreSummary?.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: lastCoreSummary.runnerMaxHandSizeAfter }
      : {}),
  };
}

export function setDamagePayload(
  legalAction: LegalAction,
  summary: DamageSummary,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.runnerGripBefore !== undefined
      ? { runnerGripBefore: summary.runnerGripBefore }
      : {}),
    ...(summary.runnerGripAfter !== undefined
      ? { runnerGripAfter: summary.runnerGripAfter }
      : {}),
    ...(summary.coreDamageAfter !== undefined
      ? { coreDamageAfter: summary.coreDamageAfter }
      : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
      : {}),
  };
}

export function createDamageImminentEvent(
  state: GameState,
  request: {
    damageId: string;
    damageType: DamageType;
    amount: number;
    source: string;
  },
): ImminentEvent {
  const damageAmountModifier =
    request.damageType === "meat" ? corpScoredMeatDamageBonus(state) : 0;
  const amount = request.amount + damageAmountModifier;
  return {
    eventId: `imminent_damage_${state.stateVersion + 1}_${sanitizeId(request.damageId)}`,
    eventType: "damage",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      damageId: request.damageId,
      damageType: request.damageType,
      amount,
      ...(damageAmountModifier > 0
        ? {
            baseDamageAmount: request.amount,
            damageAmountModifier: damageAmountModifier,
          }
        : {}),
      source: request.source,
      ...((state.run?.runnerActionOrdinal ??
        state.runnerTurnFlags?.currentRunnerActionOrdinal) !== undefined
        ? {
            runnerActionOrdinal:
              state.run?.runnerActionOrdinal ??
              state.runnerTurnFlags?.currentRunnerActionOrdinal,
          }
        : {}),
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

export function corpHasScoredMeatDamageBonusAgenda(state: GameState): boolean {
  return corpScoredMeatDamageBonus(state) > 0;
}

export function corpScoredMeatDamageBonus(state: GameState): number {
  return scoredCorpAgendaIds(state).reduce((total, cardId) => {
    const definition = definitionFor(state, cardId);
    if (scoredAgendaKindForDefinition(definition) !== "meat_damage_bonus")
      return total;
    const scoredAgenda = cardImplementationForDefinitionId(
      definition.id,
    )?.scoredAgenda;
    return scoredAgenda?.kind === "meat_damage_bonus"
      ? total + Math.max(0, Math.floor(scoredAgenda.amount))
      : total;
  }, 0);
}

export function createAddTagImminentEvent(
  state: GameState,
  amount: number,
  source: string,
  publicContext: Record<string, unknown> = {},
): ImminentEvent {
  return {
    eventId: `imminent_tag_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "add_tag",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      amount,
      source,
      ...publicContext,
    },
    visibility: "public",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

export function addTagPublicContextFromPayload(
  payload: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  if (!payload) return context;
  if (payload.hiddenZoneBarrier === true) context.hiddenZoneBarrier = true;
  for (const key of [
    "hiddenZoneAction",
    "ambushDefinitionId",
    "accessEffectSourceDefinitionId",
    "accessedFromZone",
  ] as const) {
    const value = payload[key];
    if (typeof value === "string") context[key] = value;
  }
  return context;
}

export function resolveAddTagImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTags = 0,
): void {
  if (event.eventType !== "add_tag")
    throw new Error("Nur Add-Tag-ImminentEvents koennen Tags geben.");
  const amount = numberPayload(event, "amount");
  const tagsAdded = Math.max(0, amount - preventedTags);
  state.runner.tags += tagsAdded;
  recordRunnerReceivedTags(state, tagsAdded);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    tagsAdded,
    ...(preventedTags > 0 ? { preventedTags } : {}),
    runnerTagsAfter: state.runner.tags,
  };
}

export function recordRunnerReceivedTags(
  state: GameState,
  amount: number,
): void {
  if (amount > 0) ensureRunnerTurnFlags(state).runnerReceivedTagThisTurn = true;
}

export function resolveDamageImminentEvent(
  state: GameState,
  event: ImminentEvent,
): DamageSummary {
  if (event.eventType !== "damage")
    throw new Error("Nur Damage-ImminentEvents sind in V1.2.0 auflösbar.");
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0)
    return { damageType, amount: 0, cardsTrashed: 0, flatline: false };
  return doDamage(state, {
    damageId: stringPayload(event, "damageId"),
    damageType,
    amount,
    source: stringPayload(event, "source"),
    ...(numberPayload(event, "runnerActionOrdinal") > 0
      ? {
          runnerActionOrdinal: numberPayload(event, "runnerActionOrdinal"),
        }
      : {}),
  });
}

export function resolvePdcaDamageReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  const event = state.imminentEvent;
  if (!choice || !choice.source.startsWith("damage_replacement:") || !event)
    throw new Error("Es ist kein PDCA-Damage-Replacement-Fenster offen.");
  if (choice.side !== "corp" || legalAction.side !== "corp")
    throw new Error("Nur die Korp darf PDCA-Damage ersetzen.");
  if (event.eventType !== "damage" || event.affectedSide !== "runner")
    throw new Error("PDCA passt nicht zu diesem Event.");
  const amount = numberPayload(event, "amount");
  if (amount <= 0 || !isCorpDamageSource(stringPayload(event, "source")))
    throw new Error("PDCA passt nicht zu diesem Damage-Event.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const sourceId = choice.source.split(":")[1] as CardInstanceId | undefined;
  if (!sourceId || !scoredPdcaAgendaIds(state).includes(sourceId))
    throw new Error("Die PDCA-Quelle ist nicht mehr gescored.");
  const source = mustInstance(state.cardInstances, sourceId);
  const basePayload = {
    ...(legalAction.payload ?? {}),
    pdcaDamageReplacementChoiceResolved: true,
    pdcaSourceCardInstanceId: sourceId,
    sourceDefinitionId: source.definitionId,
    originalDamageAmount: amount,
    damageType: damageTypePayload(event),
    imminentEventId: event.eventId,
    replacementModel: "per_damage_unit",
  };
  const replacementPrefix = `replace_${sourceId}_`;
  if (!selected.startsWith(replacementPrefix))
    throw new Error("Die PDCA-Auswahl ist nicht legal.");
  const preventedAmount = Number(selected.slice(replacementPrefix.length));
  if (
    !Number.isInteger(preventedAmount) ||
    preventedAmount < 0 ||
    preventedAmount > amount
  )
    throw new Error("Die PDCA-Auswahl ist nicht legal.");
  if (preventedAmount === 0) {
    delete state.pendingChoice;
    delete state.imminentEvent;
    const summary = resolveDamageImminentEvent(state, event);
    legalAction.payload = {
      ...basePayload,
      pdcaDecision: "replace_0",
      replacementOutcome: "original_resolved",
      preventedAmount: 0,
      addedCounterAmount: 0,
    };
    setDamagePayload(legalAction, summary);
    restorePdcaReturnContext(state, event);
    return;
  }
  source.counters = {
    ...(source.counters ?? {}),
    pdca: Math.max(0, Math.floor(source.counters?.pdca ?? 0)) + preventedAmount,
  };
  const remainingCounters = Math.max(0, Math.floor(source.counters.pdca ?? 0));
  delete state.pendingChoice;
  delete state.imminentEvent;
  const summary = resolveDamageImminentEvent(state, {
    ...event,
    payload: {
      ...event.payload,
      amount: amount - preventedAmount,
    },
  });
  legalAction.payload = {
    ...basePayload,
    pdcaDecision: "replace_partial",
    replacementOutcome:
      preventedAmount === amount ? "replaced" : "partially_replaced",
    preventedAmount,
    addedCounterAmount: preventedAmount,
    counterType: "pdca",
    remainingCounters,
  };
  setDamagePayload(legalAction, summary);
  restorePdcaReturnContext(state, event);
}

export function trashTargetIdsFromEvent(
  event: ImminentEvent,
): CardInstanceId[] {
  const raw = stringPayload(event, "targetCardIds");
  if (!raw) return [];
  return raw.split(",").filter((cardId) => cardId.length > 0);
}

export function createRunnerInstalledTrashImminentEvent(
  state: GameState,
  targetCardIds: CardInstanceId[],
  source: string,
): ImminentEvent {
  return {
    eventId: `imminent_runner_trash_${state.stateVersion + 1}_${sanitizeId(source)}`,
    eventType: "runner_installed_trash",
    source: { kind: "game_rule" },
    controller: "corp",
    affectedSide: "runner",
    payload: {
      targetCardIds: targetCardIds.join(","),
      targetDefinitionIds: targetCardIds
        .map((cardId) => definitionFor(state, cardId).id)
        .join(","),
      amount: targetCardIds.length,
      source,
    },
    visibility: "hidden_info_barrier",
    createdAtStateVersion: state.stateVersion + 1,
  };
}

export function resolveRunnerInstalledTrashImminentEvent(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
  preventedTargetIds: CardInstanceId[],
): { originalCount: number; preventedCount: number; trashedCount: number } {
  if (event.eventType !== "runner_installed_trash")
    throw new Error("Nur Runner-Trash-ImminentEvents koennen Trash aufloesen.");
  const targetIds = trashTargetIdsFromEvent(event);
  const prevented = new Set(preventedTargetIds);
  const trashedDefinitionIds: CardDefinitionId[] = [];
  let trashedCount = 0;
  for (const targetId of targetIds) {
    if (prevented.has(targetId)) continue;
    if (!runnerInstalledCardIds(state).includes(targetId)) continue;
    trashedDefinitionIds.push(definitionFor(state, targetId).id);
    trashRunnerInstalledCardToHeap(state, targetId, legalAction);
    trashedCount += 1;
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    preventedTrashCount: preventedTargetIds.length,
    trashedCount,
    trashedCardDefinitionId: trashedDefinitionIds[0] ?? "",
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
  };
  return {
    originalCount: targetIds.length,
    preventedCount: preventedTargetIds.length,
    trashedCount,
  };
}
