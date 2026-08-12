import type {
  CardInstanceId,
  ChoiceRequest,
  EventModificationCandidate,
  EventModificationWindow,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  clearEventModificationState,
  compareEventModificationCandidate,
  damageTypePayload,
  definitionFor,
  hasEventModificationConflict,
  mustArrayValue,
  numberPayload,
  spendCorpAgendaPointCost,
  spendCredits,
} from "./damage-runtime-context";
import {
  addTagPublicContextFromPayload,
  openPdcaDamageReplacementChoice,
  resolveAddTagImminentEvent,
  resolveDamageImminentEvent,
  resolveRunnerInstalledTrashImminentEvent,
  setDamagePayload,
} from "./damage-event-resolution";
import {
  applyRuntimeDamagePreventionCost,
  applyRuntimeTagPreventionCost,
  applyRuntimeTrashPreventionCost,
  collectEventModificationCandidates,
  damagePreventionSourceForEventCandidate,
  registerDamagePreventionUsage,
  revalidateDamagePreventionCandidateSource,
  revalidateTagPreventionCandidateSource,
  revalidateTrashPreventionCandidateSource,
} from "./prevention-sources";

const DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX = "damage_prevention_bypass_pay_";
const SELECTABLE_PREVENT_AMOUNT_CHOICE_SEPARATOR = "__prevent_amount_";
const SELECTABLE_TRASH_TARGET_CHOICE_PREFIX =
  "v120.event_modification.trash_targets";

export function openEventModificationWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectEventModificationCandidates(state, event);
  if (candidates.length === 0) return false;
  // Die sortierte Kandidatenfolge ist zugleich die persistierte Fensterfolge;
  // spätere Choices dürfen sie nicht aus Registry-Iteration neu ableiten.
  const sorted = candidates.slice().sort(compareEventModificationCandidate);
  if (hasEventModificationConflict(sorted))
    throw new Error("Event-Modification-Konflikt blockiert.");
  const candidate = sorted[0];
  if (!candidate) return false;
  const windowId = `v120_window_${event.eventId}`;
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: event.eventType,
    kind: candidate.kind,
    side: candidate.controller,
    candidates: sorted,
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(
    state,
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    eventModificationWindowOpened: true,
    eventModificationKind: window.kind,
    eventModificationWindowId: window.windowId,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    candidateCount: window.candidates.length,
    redactedKind: "event_modification",
  };
  return true;
}

export function eventModificationChoice(
  state: GameState,
  window: EventModificationWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Event-Modification-Kandidat fehlt.",
  );
  const amount = numberPayload(event, "amount");
  const corpDamagePreventionCancel = isCorpDamagePreventionCancelCandidate(
    state,
    candidate,
  );
  if (isCorpDamagePreventionBypassCandidate(state, candidate)) {
    const bypassCandidates = corpDamagePreventionBypassCandidatesForStage(
      state,
      window,
    );
    const costPerDamage = totalBypassCostPerDamage(bypassCandidates);
    const maxBypass = Math.min(
      amount,
      costPerDamage > 0 ? Math.floor(state.corp.credits / costPerDamage) : 0,
    );
    const options: ChoiceRequest["options"] = [];
    for (
      let damageAllowed = 0;
      damageAllowed <= maxBypass;
      damageAllowed += 1
    ) {
      const creditCost = damageAllowed * costPerDamage;
      options.push({
        id: `${DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX}${damageAllowed}`,
        label:
          damageAllowed === 0
            ? "0 Credits zahlen: 0 Meat Damage durchlassen"
            : `${creditCost} Credits zahlen: ${damageAllowed} Meat Damage durchlassen`,
        publicLabel: "Event Modification",
        value: damageAllowed,
      });
    }
    return {
      choiceId: `v120_choice_${window.windowId}`,
      side: window.side,
      source: `v120.event_modification.${window.kind}`,
      prompt: "Damage Prevention",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion,
      visibility: candidate.visibility,
    };
  }
  const stageCandidates = eventModificationStageCandidates(window);
  const options: ChoiceRequest["options"] = [
    {
      id: "pass",
      label: corpDamagePreventionCancel
        ? "1 Agenda-Punkt zahlen und Prevention canceln"
        : event.eventType === "add_tag"
          ? "Tag nicht vermeiden"
          : event.eventType === "runner_installed_trash"
            ? "Trash nicht verhindern"
            : window.kind === "increase"
              ? "Nicht erhöhen"
              : "Nicht verhindern",
      publicLabel: "Event Modification",
    },
    ...stageCandidates.flatMap((stageCandidate) => {
      if (
        event.eventType === "damage" &&
        stageCandidate.kind === "prevent" &&
        stageCandidate.selectablePreventAmount === true
      ) {
        const maximum = Math.min(
          amount,
          Math.max(0, Math.floor(stageCandidate.preventAmount ?? 0)),
        );
        if (maximum <= 0)
          throw new Error(
            "Die wählbare Damage-Prevention hat kein positives Maximum.",
          );
        return Array.from({ length: maximum }, (_, index) => {
          const preventedAmount = index + 1;
          return {
            id: `${stageCandidate.candidateId}${SELECTABLE_PREVENT_AMOUNT_CHOICE_SEPARATOR}${preventedAmount}`,
            label: `${stageCandidate.sourceRef.label}: ${preventedAmount} Schaden verhindern`,
            publicLabel: "Event Modification",
            value: preventedAmount,
          };
        });
      }
      return [
        {
          id: stageCandidate.candidateId,
          label: corpDamagePreventionCancel
            ? "Prevention wirken lassen"
            : event.eventType === "add_tag"
              ? `${stageCandidate.sourceRef.label}: ${stageCandidate.preventedTags ?? 1} Tag vermeiden`
              : event.eventType === "runner_installed_trash"
                ? stageCandidate.selectablePreventTrashTargets === true
                  ? `${stageCandidate.sourceRef.label}: geschützte Karten auswählen`
                  : `${stageCandidate.sourceRef.label}: ${stageCandidate.preventedTrashTargetIds?.length ?? 1} Trash verhindern`
                : window.kind === "increase"
                  ? `${stageCandidate.sourceRef.label}: Schaden um ${stageCandidate.increaseAmount ?? 1} erhöhen`
                  : stageCandidate.sourceRef.kind === "card"
                    ? `${stageCandidate.sourceRef.label}: ${stageCandidate.preventAmount ?? amount} Schaden verhindern`
                    : `${stageCandidate.preventAmount ?? amount} Schaden verhindern`,
          publicLabel: "Event Modification",
        },
      ];
    }),
  ];
  return {
    choiceId: `v120_choice_${window.windowId}`,
    side: window.side,
    source: `v120.event_modification.${window.kind}`,
    prompt:
      event.eventType === "add_tag"
        ? "Tag vermeiden"
        : event.eventType === "runner_installed_trash"
          ? "Trash verhindern"
          : "Damage Prevention",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

export function resolveEventModificationChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.eventModificationWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Event-Modification-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected)
    throw new Error("Es wurde keine Event-Modification-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    ...addTagPublicContextFromPayload(event.payload),
    eventModificationWindowId: window.windowId,
    eventModificationKind: window.kind,
    imminentEventId: event.eventId,
    imminentEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "event_modification",
  };
  const trashTargetChoice = state.pendingChoice?.source.startsWith(
    `${SELECTABLE_TRASH_TARGET_CHOICE_PREFIX}:`,
  )
    ? state.pendingChoice
    : undefined;
  const trashTargetCandidateId = trashTargetChoice?.source.split(":")[2];
  const selectedTrashTargetIds = trashTargetChoice
    ? selectedChoiceIds(playerAction.selectedChoices)
    : undefined;
  if (selected === "pass") {
    if (event.eventType === "add_tag") {
      resolveAddTagImminentEvent(state, event, legalAction);
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: numberPayload(event, "amount"),
      };
      clearEventModificationState(state);
      return;
    }
    const remainingCandidates = remainingEventModificationCandidatesAfterStage(
      state,
      window,
      event,
    );
    if (event.eventType === "runner_installed_trash") {
      if (
        continueEventModificationWindow(
          state,
          event,
          window,
          remainingCandidates,
          legalAction,
          {
            ...basePayload,
            eventModificationDecision: "pass",
            eventModificationOutcome: "next_window_opened",
            originalAmount: numberPayload(event, "amount"),
          },
        )
      )
        return;
      const summary = resolveRunnerInstalledTrashImminentEvent(
        state,
        event,
        legalAction,
        [],
      );
      legalAction.payload = {
        ...basePayload,
        ...(legalAction.payload ?? {}),
        eventModificationDecision: "pass",
        eventModificationOutcome: "original_resolved",
        originalAmount: summary.originalCount,
      };
      clearEventModificationState(state);
      return;
    }
    const cancelCandidate = window.candidates[0];
    const corpDamagePreventionCancel =
      !!cancelCandidate &&
      window.side === "corp" &&
      isCorpDamagePreventionCancelCandidate(state, cancelCandidate);
    let agendaPointCost = 0;
    let agendaPointCostPaid = 0;
    let corpBonusAgendaPointsSpent = 0;
    let spentAgendaDefinitionIds = "";
    if (corpDamagePreventionCancel) {
      agendaPointCost =
        damagePreventionSourceForEventCandidate(state, cancelCandidate)
          ?.corpMayCancelUntilEndOfTurn?.agendaPointCost ?? 1;
      const costResult = spendCorpAgendaPointCost(state, agendaPointCost);
      agendaPointCostPaid = costResult.paidPoints;
      if (agendaPointCostPaid < agendaPointCost)
        throw new Error("Damage Prevention kann nicht gecancelt werden.");
      corpBonusAgendaPointsSpent = costResult.bonusPointsSpent;
      spentAgendaDefinitionIds = costResult.spentAgendaDefinitionIds.join(",");
      const sourceInstanceId = cancelCandidate.sourceRef.instanceId;
      if (sourceInstanceId) {
        state.cancelledDamagePreventionSourceIdsUntilEndOfTurn = [
          ...new Set([
            ...(state.cancelledDamagePreventionSourceIdsUntilEndOfTurn ?? []),
            sourceInstanceId,
          ]),
        ];
      }
    }
    if (
      continueEventModificationWindow(
        state,
        event,
        window,
        remainingCandidates,
        legalAction,
        {
          ...basePayload,
          eventModificationDecision: corpDamagePreventionCancel
            ? "cancel"
            : "pass",
          eventModificationOutcome: "next_window_opened",
          originalAmount: numberPayload(event, "amount"),
          ...(corpDamagePreventionCancel
            ? {
                sourceDefinitionId: cancelCandidate.sourceRef.definitionId,
                agendaPointCost,
                agendaPointCostPaid,
                ...(corpBonusAgendaPointsSpent > 0
                  ? { corpBonusAgendaPointsSpent }
                  : {}),
                ...(spentAgendaDefinitionIds
                  ? { spentAgendaDefinitionIds }
                  : {}),
              }
            : {}),
        },
      )
    )
      return;
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: corpDamagePreventionCancel ? "cancel" : "pass",
      eventModificationOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
      ...(corpDamagePreventionCancel
        ? {
            sourceDefinitionId: cancelCandidate.sourceRef.definitionId,
            agendaPointCost,
            agendaPointCostPaid,
            ...(corpBonusAgendaPointsSpent > 0
              ? { corpBonusAgendaPointsSpent }
              : {}),
            ...(spentAgendaDefinitionIds ? { spentAgendaDefinitionIds } : {}),
          }
        : {}),
    };
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, event, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, event);
    setDamagePayload(legalAction, summary);
    return;
  }
  if (selected.startsWith(DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX)) {
    const candidate = window.candidates[0];
    if (
      !candidate ||
      !isCorpDamagePreventionBypassCandidate(state, candidate) ||
      window.side !== "corp" ||
      event.eventType !== "damage" ||
      event.affectedSide !== "runner" ||
      damageTypePayload(event) !== "meat"
    ) {
      throw new Error("Damage-Prevention-Bypass passt nicht zum Fenster.");
    }
    const bypassDamageAllowed = Number(
      selected.replace(DAMAGE_PREVENTION_BYPASS_CHOICE_PREFIX, ""),
    );
    const bypassCandidates = corpDamagePreventionBypassCandidatesForStage(
      state,
      window,
    );
    const bypassCostPerDamage = totalBypassCostPerDamage(bypassCandidates);
    const bypassPaid = bypassDamageAllowed * bypassCostPerDamage;
    const originalAmount = numberPayload(event, "amount");
    if (
      !Number.isInteger(bypassDamageAllowed) ||
      bypassDamageAllowed < 0 ||
      bypassDamageAllowed > originalAmount ||
      bypassCostPerDamage <= 0 ||
      bypassPaid > state.corp.credits
    ) {
      throw new Error("Damage-Prevention-Bypass ist nicht bezahlbar.");
    }
    for (const bypassCandidate of bypassCandidates)
      revalidateDamagePreventionCandidateSource(state, bypassCandidate);
    spendCredits(state, "corp", bypassPaid);
    const preventedAmount = Math.max(0, originalAmount - bypassDamageAllowed);
    const finalAmount = bypassDamageAllowed;
    const finalEvent = {
      ...event,
      payload: { ...event.payload, amount: finalAmount },
    };
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "apply",
      eventModificationOutcome:
        finalAmount === 0
          ? "prevented"
          : finalAmount === originalAmount
            ? "original_resolved"
            : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedAmount,
      finalAmount,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      damagePreventionBypassPaid: bypassPaid,
      damagePreventionBypassCostPerDamage: bypassCostPerDamage,
    };
    if (
      finalAmount > 0 &&
      continueEventModificationWindow(
        state,
        finalEvent,
        window,
        remainingEventModificationCandidatesAfterStage(
          state,
          window,
          finalEvent,
        ),
        legalAction,
        legalAction.payload,
      )
    )
      return;
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, finalEvent);
    setDamagePayload(legalAction, summary);
    return;
  }
  const selectablePreventSelection = selectedPreventAmountSelection(
    window,
    selected,
    event,
  );
  const candidate = trashTargetCandidateId
    ? window.candidates.find(
        (item) => item.candidateId === trashTargetCandidateId,
      )
    : selectablePreventSelection
      ? selectablePreventSelection.candidate
      : window.candidates.find((item) => item.candidateId === selected);
  if (!candidate)
    throw new Error("Dieser Event-Modification-Kandidat ist nicht legal.");
  if (
    !eventModificationStageCandidates(window).some(
      (item) => item.candidateId === candidate.candidateId,
    )
  )
    throw new Error("Dieser Event-Modification-Kandidat ist noch nicht legal.");
  if (
    candidate.eventId !== event.eventId ||
    !(
      candidate.kind === "prevent" ||
      candidate.kind === "increase" ||
      (event.eventType === "add_tag" && candidate.kind === "avoid")
    )
  )
    throw new Error(
      "Dieser Event-Modification-Kandidat passt nicht zum Fenster.",
    );
  if (
    event.eventType === "runner_installed_trash" &&
    candidate.selectablePreventTrashTargets === true &&
    !trashTargetChoice
  ) {
    const targetIds = candidate.preventedTrashTargetIds ?? [];
    if (targetIds.length === 0)
      throw new Error("Die Trash-Prevention hat keine legalen Ziele.");
    state.pendingChoice = {
      choiceId: `v120_trash_targets_${window.windowId}_${candidate.candidateId}`,
      side: candidate.controller,
      source: `${SELECTABLE_TRASH_TARGET_CHOICE_PREFIX}:${window.windowId}:${candidate.candidateId}`,
      prompt: "Eine oder mehrere Resources vor dem Trashen schützen",
      kind: "select_cards",
      options: targetIds.map((cardId) => ({
        id: cardId,
        cardId,
        label: definitionFor(state, cardId).title,
      })),
      minSelections: 1,
      maxSelections: targetIds.length,
      stateVersion: state.stateVersion + 1,
      visibility: candidate.visibility,
    };
    state.activeSide = candidate.controller;
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "select_targets",
      eventModificationOutcome: "target_choice_opened",
      candidateId: candidate.candidateId,
      selectableTrashTargetCount: targetIds.length,
    };
    return;
  }
  if (event.eventType === "add_tag") {
    revalidateTagPreventionCandidateSource(state, candidate);
    const originalAmount = numberPayload(event, "amount");
    const preventedTags = Math.min(
      candidate.preventedTags ?? 0,
      originalAmount,
    );
    const preventionCostPayload = applyRuntimeTagPreventionCost(
      state,
      candidate,
      preventedTags,
    );
    const remainingTags = Math.max(0, originalAmount - preventedTags);
    const decisionPayload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        remainingTags === 0 ? "avoided" : "partially_avoided",
      candidateId: candidate.candidateId,
      originalAmount,
      preventedTags,
      finalAmount: remainingTags,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    if (remainingTags > 0) {
      const remainingEvent = {
        ...event,
        payload: { ...event.payload, amount: remainingTags },
      };
      const remainingCandidates = collectEventModificationCandidates(
        state,
        remainingEvent,
      );
      if (
        continueEventModificationWindow(
          state,
          remainingEvent,
          window,
          remainingCandidates,
          legalAction,
          {
            ...decisionPayload,
            eventModificationOutcome: "next_window_opened",
          },
        )
      )
        return;
    }
    resolveAddTagImminentEvent(state, event, legalAction, preventedTags);
    legalAction.payload = {
      ...decisionPayload,
      ...(legalAction.payload ?? {}),
    };
    clearEventModificationState(state);
    return;
  }
  if (event.eventType === "runner_installed_trash") {
    revalidateTrashPreventionCandidateSource(state, candidate, event);
    const allowedTrashTargetIds = candidate.preventedTrashTargetIds ?? [];
    const preventedTrashTargetIds = selectedTrashTargetIds
      ? selectedTrashTargetIds.map((cardId) => cardId as CardInstanceId)
      : allowedTrashTargetIds;
    if (
      preventedTrashTargetIds.length === 0 ||
      preventedTrashTargetIds.some(
        (cardId) => !allowedTrashTargetIds.includes(cardId),
      )
    )
      throw new Error("Ein Trash-Prevention-Ziel ist nicht mehr legal.");
    const preventionCostPayload = applyRuntimeTrashPreventionCost(
      state,
      candidate,
      preventedTrashTargetIds.length,
    );
    const summary = resolveRunnerInstalledTrashImminentEvent(
      state,
      event,
      legalAction,
      preventedTrashTargetIds,
    );
    legalAction.payload = {
      ...basePayload,
      ...(legalAction.payload ?? {}),
      eventModificationDecision: "apply",
      eventModificationOutcome:
        summary.trashedCount === 0 ? "prevented" : "partially_prevented",
      candidateId: candidate.candidateId,
      originalAmount: summary.originalCount,
      preventedTrashCount: summary.preventedCount,
      trashedCount: summary.trashedCount,
      sourceKind: candidate.sourceRef.kind,
      ...(candidate.sourceRef.definitionId
        ? { sourceDefinitionId: candidate.sourceRef.definitionId }
        : {}),
      ...preventionCostPayload,
    };
    clearEventModificationState(state);
    return;
  }
  if (candidate.kind === "increase") {
    const sourceId = candidate.sourceRef.instanceId;
    const source = sourceId ? state.cardInstances[sourceId] : undefined;
    const implementation = source
      ? cardImplementationForDefinitionId(source.definitionId)
      : undefined;
    if (
      event.eventType !== "damage" ||
      event.affectedSide !== "runner" ||
      damageTypePayload(event) !== "meat" ||
      implementation?.corpUtility?.kind !== "meat_damage_boost"
    )
      throw new Error("Dieser Damage-Boost passt nicht zum Fenster.");
    if (
      !sourceId ||
      !source?.rezzed ||
      source.controller !== "corp" ||
      Math.floor(source.advancementCounters ?? 0) <= 0
    )
      throw new Error("Cybertech Think Tank ist nicht mehr legal.");
    source.advancementCounters = Math.max(
      0,
      Math.floor(source.advancementCounters ?? 0) - 1,
    );
    const originalAmount = numberPayload(event, "amount");
    const increaseAmount = Math.max(
      1,
      Math.floor(candidate.increaseAmount ?? 1),
    );
    const finalAmount = originalAmount + increaseAmount;
    const finalEvent = {
      ...event,
      payload: {
        ...event.payload,
        amount: finalAmount,
        baseDamageAmount: originalAmount,
        cybertechThinkTankModifier: increaseAmount,
        cybertechThinkTankSourceCardId: sourceId,
        cybertechThinkTankSourceDefinitionId: source.definitionId,
      },
    };
    legalAction.payload = {
      ...basePayload,
      eventModificationDecision: "apply",
      eventModificationOutcome: "increased",
      candidateId: candidate.candidateId,
      originalAmount,
      increaseAmount,
      finalAmount,
      sourceKind: candidate.sourceRef.kind,
      sourceDefinitionId: source.definitionId,
      sourceCardId: sourceId,
      remainingCounters: source.advancementCounters,
    };
    clearEventModificationState(state);
    if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, finalEvent);
    setDamagePayload(legalAction, summary);
    return;
  }
  revalidateDamagePreventionCandidateSource(state, candidate);
  const originalAmount = numberPayload(event, "amount");
  const preventedAmount = Math.min(
    selectablePreventSelection?.amount ?? candidate.preventAmount ?? 0,
    originalAmount,
  );
  if (
    selectablePreventSelection &&
    (preventedAmount <= 0 || preventedAmount > (candidate.preventAmount ?? 0))
  )
    throw new Error("Die gewählte Damage-Prevention-Menge ist nicht legal.");
  const finalAmount = Math.max(0, originalAmount - preventedAmount);
  registerDamagePreventionUsage(state, candidate, preventedAmount);
  if (
    candidate.candidateId.startsWith("run_damage_prevent_") &&
    state.run?.damagePreventionPool
  ) {
    state.run.damagePreventionPool.remaining = Math.max(
      0,
      Math.floor(state.run.damagePreventionPool.remaining) - preventedAmount,
    );
  }
  const preventionCostPayload = applyRuntimeDamagePreventionCost(
    state,
    candidate,
    preventedAmount,
  );
  const finalEvent = {
    ...event,
    payload: { ...event.payload, amount: finalAmount },
  };
  legalAction.payload = {
    ...basePayload,
    eventModificationDecision: "apply",
    eventModificationOutcome:
      finalAmount === 0 ? "prevented" : "partially_prevented",
    candidateId: candidate.candidateId,
    originalAmount,
    preventedAmount,
    finalAmount,
    sourceKind: candidate.sourceRef.kind,
    ...(candidate.sourceRef.definitionId
      ? { sourceDefinitionId: candidate.sourceRef.definitionId }
      : {}),
    ...preventionCostPayload,
  };
  if (
    finalAmount > 0 &&
    continueEventModificationWindow(
      state,
      finalEvent,
      window,
      remainingEventModificationCandidatesAfterStage(state, window, finalEvent),
      legalAction,
      legalAction.payload,
    )
  )
    return;
  clearEventModificationState(state);
  if (openPdcaDamageReplacementChoice(state, finalEvent, legalAction)) return;
  const summary = resolveDamageImminentEvent(state, finalEvent);
  setDamagePayload(legalAction, summary);
}

function selectedPreventAmountSelection(
  window: EventModificationWindow,
  selected: string,
  event: ImminentEvent,
): { candidate: EventModificationCandidate; amount: number } | undefined {
  if (event.eventType !== "damage") return undefined;
  const separatorIndex = selected.lastIndexOf(
    SELECTABLE_PREVENT_AMOUNT_CHOICE_SEPARATOR,
  );
  if (separatorIndex <= 0) return undefined;
  const candidateId = selected.slice(0, separatorIndex);
  const amount = Number(
    selected.slice(
      separatorIndex + SELECTABLE_PREVENT_AMOUNT_CHOICE_SEPARATOR.length,
    ),
  );
  const candidate = window.candidates.find(
    (entry) =>
      entry.candidateId === candidateId &&
      entry.kind === "prevent" &&
      entry.selectablePreventAmount === true,
  );
  if (!candidate || !Number.isInteger(amount))
    throw new Error("Die gewählte Damage-Prevention-Menge ist nicht legal.");
  return { candidate, amount };
}

export function isCorpDamagePreventionCancelCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): boolean {
  return (
    candidate.controller === "corp" &&
    damagePreventionSourceForEventCandidate(state, candidate)
      ?.corpMayCancelUntilEndOfTurn !== undefined
  );
}

export function eventModificationStageCandidates(
  window: EventModificationWindow,
): EventModificationCandidate[] {
  const first = window.candidates[0];
  if (!first) return [];
  return window.candidates.filter(
    (candidate) =>
      candidate.kind === first.kind &&
      candidate.controller === first.controller &&
      candidate.priority === first.priority,
  );
}

export function corpDamagePreventionBypassCandidatesForStage(
  state: GameState,
  window: EventModificationWindow,
): EventModificationCandidate[] {
  return eventModificationStageCandidates(window).filter((candidate) =>
    isCorpDamagePreventionBypassCandidate(state, candidate),
  );
}

export function remainingEventModificationCandidatesAfterStage(
  state: GameState,
  window: EventModificationWindow,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const stageIds = new Set(
    eventModificationStageCandidates(window).map(
      (candidate) => candidate.candidateId,
    ),
  );
  return clampEventModificationCandidatesToEventAmount(
    window.candidates.filter(
      (candidate) => !stageIds.has(candidate.candidateId),
    ),
    numberPayload(event, "amount"),
  );
}

export function clampEventModificationCandidatesToEventAmount(
  candidates: EventModificationCandidate[],
  amount: number,
): EventModificationCandidate[] {
  return candidates.map((candidate) => ({
    ...candidate,
    ...(typeof candidate.preventAmount === "number"
      ? { preventAmount: Math.min(candidate.preventAmount, amount) }
      : {}),
  }));
}

export function continueEventModificationWindow(
  state: GameState,
  event: ImminentEvent,
  previousWindow: EventModificationWindow,
  candidates: EventModificationCandidate[],
  legalAction: LegalAction,
  payload: LegalAction["payload"],
): boolean {
  const sorted = candidates
    .filter((candidate) => candidate.eventId === event.eventId)
    .filter(
      (candidate) =>
        candidate.preventAmount === undefined || candidate.preventAmount > 0,
    )
    .sort(compareEventModificationCandidate);
  if (sorted.length === 0) return false;
  if (hasEventModificationConflict(sorted))
    throw new Error("Event-Modification-Konflikt blockiert.");
  const candidate = sorted[0];
  if (!candidate) return false;
  const windowId = `${previousWindow.windowId}_next_${candidate.priority}_${candidate.controller}`;
  const window: EventModificationWindow = {
    windowId,
    eventId: event.eventId,
    eventType: event.eventType,
    kind: candidate.kind,
    side: candidate.controller,
    candidates: sorted,
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.eventModificationWindow = window;
  state.pendingChoice = eventModificationChoice(
    state,
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(payload ?? {}),
    nextEventModificationWindowOpened: true,
    nextEventModificationWindowId: window.windowId,
    nextEventModificationKind: window.kind,
  };
  return true;
}

export function totalBypassCostPerDamage(
  candidates: EventModificationCandidate[],
): number {
  return candidates.reduce(
    (sum, candidate) => sum + Math.max(0, candidate.bypassCostPerDamage ?? 0),
    0,
  );
}

export function isCorpDamagePreventionBypassCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): boolean {
  const source = damagePreventionSourceForEventCandidate(state, candidate);
  return (
    source?.corpMayPayToBypass !== undefined &&
    candidate.bypassPaymentSide === "corp" &&
    candidate.bypassCostPerDamage === source.corpMayPayToBypass.costPerDamage
  );
}
