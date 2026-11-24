import {
  isDamageRandomSource,
  isEventWindowId,
  isRunnerPaymentWindowId,
  type GameState,
} from "@netgrid/shared";
import { parseCanonicalCapabilityId } from "@netgrid/cards/engine";

export function validatePendingDrawAndPayment(
  errors: string[],
  state: GameState,
): void {
  const paymentWindow = state.runnerCostPenaltySupportWindow;
  if (
    paymentWindow &&
    (!isRunnerPaymentWindowId(paymentWindow.windowId) ||
      paymentWindow.windowId !== paymentWindow.createdAtStateVersion + 1)
  )
    errors.push("Runner payment window requires its opening state version.");

  if (state.pendingCorpDraw) {
    const transaction = state.pendingCorpDraw;
    if (
      !Number.isSafeInteger(transaction.transactionId) ||
      transaction.transactionId < 1
    )
      errors.push("Pending Corp draw requires a transactionId.");
    if (
      !Number.isInteger(transaction.baseDrawCount) ||
      transaction.baseDrawCount <= 0
    )
      errors.push("Pending Corp draw baseDrawCount must be positive.");
    if (
      !Number.isInteger(transaction.replacementDrawCount) ||
      transaction.replacementDrawCount < 0
    )
      errors.push(
        "Pending Corp draw replacementDrawCount must be non-negative.",
      );
    if (
      transaction.baseDrawCount + transaction.replacementDrawCount !==
      transaction.drawnCardIds.length
    )
      errors.push("Pending Corp draw counts must match its drawn cards.");
    if (
      new Set(transaction.drawnCardIds).size !== transaction.drawnCardIds.length
    )
      errors.push("Pending Corp draw cards must be unique.");
    if (
      transaction.continuation?.kind === "effect_commands" &&
      transaction.continuation.remainingCommands.length === 0
    )
      errors.push(
        "Pending Corp draw effect-command continuation must not be empty.",
      );
    if (
      transaction.continuation?.kind === "card_effect_on_play" ||
      transaction.continuation?.kind === "card_effect_activated"
    ) {
      if (
        transaction.continuation.nextEffectIndex !==
          transaction.continuation.drawEffectIndex + 1 ||
        transaction.continuation.creditGainOrdinal < 0
      )
        errors.push("Pending Corp draw card-effect continuation is invalid.");
    }
    if (transaction.continuation?.kind === "card_effect_activated") {
      const continuation = transaction.continuation;
      try {
        const parsed = parseCanonicalCapabilityId(continuation.sourceAbilityId);
        if (parsed.cardDefinitionId !== continuation.sourceDefinitionId)
          errors.push(
            "Pending Corp draw activated continuation capability belongs to another definition.",
          );
      } catch {
        errors.push(
          "Pending Corp draw activated continuation capability identity is invalid.",
        );
      }
    }
    if (transaction.continuation?.kind === "corp_mandatory_draw") {
      const continuation = transaction.continuation;
      if (
        continuation.totalBaseDrawCount !== transaction.baseDrawCount ||
        continuation.totalBaseDrawCount !==
          continuation.mandatoryCardCount + continuation.additionalCardCount ||
        continuation.additionalCardCount !==
          continuation.mandatoryAgendaCardCount +
            continuation.optionalAgendaCardCount +
            continuation.skivvissCardCount ||
        (continuation.additionalSourceDefinitionIds.length === 0 &&
          continuation.additionalCardCount > 0)
      )
        errors.push("Pending Corp mandatory draw continuation is invalid.");
    }
    for (const cardId of transaction.drawnCardIds) {
      const instance = state.cardInstances[cardId];
      if (!(state.specialZones?.setAside ?? []).includes(cardId))
        errors.push(`Pending Corp draw card ${cardId} must be set aside.`);
      if (
        !instance ||
        instance.owner !== "corp" ||
        instance.controller !== "corp" ||
        instance.zone.side !== "special" ||
        instance.zone.zone !== "set_aside" ||
        instance.zone.visibility !== "side_private" ||
        instance.zone.visibilitySide !== "corp" ||
        instance.zone.returnZone?.side !== "corp" ||
        instance.zone.returnZone.zone !== "hq"
      )
        errors.push(
          `Pending Corp draw card ${cardId} must use the private Corp draw zone.`,
        );
    }
  }
}

export function validateChoiceContinuations(
  errors: string[],
  state: GameState,
): void {
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
  if (state.hqInstallRezSequence) {
    const sequence = state.hqInstallRezSequence;
    if (!state.corp.scoreArea.includes(sequence.sourceAgendaId))
      errors.push(
        "Data Fort Reclamation sequence requires a scored source agenda.",
      );
    if (
      sequence.selectedCardIds.length === 0 ||
      sequence.selectedCardIds.length > 4 ||
      new Set(sequence.selectedCardIds).size !== sequence.selectedCardIds.length
    )
      errors.push("Data Fort Reclamation sequence has invalid selected cards.");
    if (
      !Number.isInteger(sequence.nextCardIndex) ||
      sequence.nextCardIndex < 1 ||
      sequence.nextCardIndex > sequence.selectedCardIds.length
    )
      errors.push("Data Fort Reclamation sequence has an invalid card index.");
    if (
      !Number.isInteger(sequence.temporaryCreditsProvided) ||
      sequence.temporaryCreditsProvided < 0 ||
      !Number.isInteger(sequence.temporaryCreditsRemaining) ||
      sequence.temporaryCreditsRemaining < 0 ||
      sequence.temporaryCreditsRemaining > sequence.temporaryCreditsProvided
    )
      errors.push(
        "Data Fort Reclamation sequence has invalid temporary credits.",
      );
    const server = state.corp.servers.find(
      (candidate) => candidate.id === sequence.serverId,
    );
    if (!server || server.kind !== "remote")
      errors.push("Data Fort Reclamation sequence requires its remote server.");
    const currentCardId = sequence.selectedCardIds[sequence.nextCardIndex - 1];
    const sourceParts = state.pendingChoice?.source.split(":") ?? [];
    if (
      sourceParts[0] !==
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez" ||
      sourceParts[1] !== sequence.sourceAgendaId ||
      sourceParts[2] !== sequence.serverId ||
      sourceParts[3] !== currentCardId
    )
      errors.push(
        "Data Fort Reclamation sequence requires its current rez choice.",
      );
  } else if (
    state.pendingChoice?.source.startsWith(
      "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:",
    )
  ) {
    errors.push(
      "Data Fort Reclamation rez choice requires its sequence state.",
    );
  }
  if (
    state.pendingAddTagContinuation &&
    state.pendingAddTagContinuation.kind !== "corp_start_turn_satellite_choice"
  ) {
    if (state.imminentEvent?.eventType !== "add_tag")
      errors.push("Add-tag continuation requires an Add-Tag imminent event.");
    if (!state.eventModificationWindow)
      errors.push(
        "Add-tag continuation requires an event modification window.",
      );
    if (!state.pendingChoice?.source.startsWith("v120.event_modification"))
      errors.push("Add-tag continuation requires its pending choice.");
  }
  if (
    state.pendingAddTagContinuation?.kind === "end_turn_tag" &&
    (!Number.isSafeInteger(
      state.pendingAddTagContinuation.accumulatedTagsAddedBeforeCurrentSource,
    ) ||
      state.pendingAddTagContinuation.accumulatedTagsAddedBeforeCurrentSource <
        0)
  )
    errors.push("End-turn tag continuation has an invalid accumulator.");
  if (state.runnerDrawSequence) {
    const sequence = state.runnerDrawSequence;
    if (!Number.isSafeInteger(sequence.sequenceId) || sequence.sequenceId < 1)
      errors.push("Runner draw sequence requires an id.");
    if (!sequence.originActionId)
      errors.push("Runner draw sequence requires its origin action id.");
    for (const [field, value] of [
      ["remainingDrawCount", sequence.remainingDrawCount],
      ["currentDrawTaxSourceIndex", sequence.currentDrawTaxSourceIndex],
      ["drawTaxSourceCount", sequence.drawTaxSourceCount],
      ["drawTaxCreditsPaid", sequence.drawTaxCreditsPaid],
      ["drawTaxTagsAdded", sequence.drawTaxTagsAdded],
    ] as const) {
      if (!Number.isInteger(value) || value < 0)
        errors.push(`Runner draw sequence has invalid ${field}.`);
    }
    if (typeof sequence.preDrawRezWindowPassed !== "boolean")
      errors.push("Runner draw sequence has invalid pre-draw rez state.");
    const resolvingDrawTax = state.pendingChoice?.source.startsWith(
      "runner_draw.draw_tax:",
    );
    const resolvingDrawTaxRez = state.pendingChoice?.source.startsWith(
      "runner_draw.draw_tax_rez:",
    );
    const resolvingDrawTaxTag =
      state.pendingAddTagContinuation?.kind === "runner_draw_tax";
    if (
      resolvingDrawTax &&
      sequence.currentDrawTaxSourceIndex >=
        sequence.currentDrawTaxSourceIds.length
    )
      errors.push("Runner draw sequence requires an unresolved tax source.");
    if (
      new Set(sequence.currentDrawTaxSourceIds).size !==
      sequence.currentDrawTaxSourceIds.length
    )
      errors.push("Runner draw sequence tax sources must be unique.");
    if (!resolvingDrawTax && !resolvingDrawTaxRez && !resolvingDrawTaxTag)
      errors.push("Runner draw sequence requires its pending choice.");
  } else if (
    state.pendingChoice?.source.startsWith("runner_draw.draw_tax:") ||
    state.pendingChoice?.source.startsWith("runner_draw.draw_tax_rez:")
  ) {
    errors.push("City Surveillance choice requires a runner draw sequence.");
  }
}

export function validateEventWindows(errors: string[], state: GameState): void {
  if (
    state.imminentEvent?.eventType === "damage" &&
    !isDamageRandomSource(state.imminentEvent.payload.randomSource)
  )
    errors.push(
      "imminentEvent.payload.randomSource must identify the damage source.",
    );
  const modificationWindowId = state.imminentEvent?.modificationWindowId;
  if (
    modificationWindowId !== undefined &&
    (!isEventWindowId(modificationWindowId) ||
      modificationWindowId > state.stateVersion)
  )
    errors.push(
      "ImminentEvent modificationWindowId must identify an opened window.",
    );
  if (state.eventModificationWindow) {
    if (
      state.eventModificationWindow.windowId !==
        state.eventModificationWindow.createdAtStateVersion ||
      state.eventModificationWindow.windowId !== modificationWindowId
    )
      errors.push(
        "EventModificationWindow windowId must match its opening version and ImminentEvent.",
      );
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
    if (
      state.replacementWindow.windowId !==
        state.replacementWindow.createdAtStateVersion ||
      state.replacementWindow.windowId !== modificationWindowId
    )
      errors.push(
        "ReplacementWindow windowId must match its opening version and ImminentEvent.",
      );
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
}
