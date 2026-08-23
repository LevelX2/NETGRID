import type {
  CardDefinition,
  CardInstanceId,
  ChoiceRequest,
  GameState,
  ImminentEvent,
  LegalAction,
  PlayerAction,
  ReplacementCandidate,
  ReplacementWindow,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { maxHandSize } from "../../ability-engine/effective-values";
import type { CardFlatlineReplacementSourceImplementation } from "../../ability-engine/definition-types";
import {
  addRunnerFutureActionDebt,
  clearReplacementState,
  compareReplacementCandidate,
  credits,
  definitionFor,
  drawRunnerCard,
  hasReplacementConflict,
  mustArrayValue,
  mustInstance,
  numberPayload,
  removeFromAllZones,
  sanitizeId,
  trashRunnerInstalledCardToHeap,
  damageTypePayload,
} from "./damage-runtime-context";
import {
  openPdcaDamageReplacementChoice,
  resolveDamageImminentEvent,
  setDamagePayload,
} from "./damage-event-resolution";

export function flatlineReplacementSourcesForDefinition(
  definition: CardDefinition,
): readonly CardFlatlineReplacementSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)
      ?.flatlineReplacementSources ?? []
  );
}

function flatlineReplacementSourceForCandidate(
  state: GameState,
  candidate: ReplacementCandidate,
):
  | Extract<
      CardFlatlineReplacementSourceImplementation,
      | { kind: "flatline_replacement_from_grip" }
      | { kind: "flatline_replacement_installed" }
    >
  | undefined {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || candidate.sourceRef.kind !== "card") return undefined;
  return flatlineReplacementSourcesForDefinition(
    definitionFor(state, cardId),
  ).find(
    (
      source,
    ): source is Extract<
      CardFlatlineReplacementSourceImplementation,
      | { kind: "flatline_replacement_from_grip" }
      | { kind: "flatline_replacement_installed" }
    > =>
      (source.kind === "flatline_replacement_from_grip" &&
        candidate.replacementEventType === "add_tag") ||
      (source.kind === "flatline_replacement_installed" &&
        candidate.replacementEventType === "prevent_damage"),
  );
}

export function openReplacementWindow(
  state: GameState,
  event: ImminentEvent,
  legalAction: LegalAction,
): boolean {
  const candidates = collectReplacementCandidates(state, event).sort(
    compareReplacementCandidate,
  );
  if (candidates.length === 0) return false;
  if (hasReplacementConflict(candidates))
    throw new Error("Replacement-Konflikt blockiert.");
  const candidate = candidates[0];
  if (!candidate) return false;
  const windowId = `v121_window_${event.eventId}`;
  const window: ReplacementWindow = {
    windowId,
    originalEventId: event.eventId,
    eventType: event.eventType,
    candidates,
    consumedCandidateIds: [],
    createdAtStateVersion: state.stateVersion + 1,
    optional: candidate.optional,
  };
  state.imminentEvent = { ...event, modificationWindowId: windowId };
  state.replacementWindow = window;
  state.pendingChoice = replacementChoice(
    state,
    window,
    state.imminentEvent,
    state.stateVersion + 1,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementWindowOpened: true,
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    replacementCandidateCount: window.candidates.length,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  return true;
}

export function collectReplacementCandidates(
  state: GameState,
  event: ImminentEvent,
): ReplacementCandidate[] {
  if (event.eventType !== "damage") return [];
  if (event.payload.cannotBePrevented === true) return [];
  const candidates: ReplacementCandidate[] = [];
  const damageAmount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (
    event.affectedSide === "runner" &&
    damageAmount > 0 &&
    damageType === "meat" &&
    isCorpTurnDamageWindow(state)
  ) {
    const identityDonorIds = state.runner.grip.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return flatlineReplacementSourcesForDefinition(definition).some(
        (source) =>
          source.kind === "damage_replacement_from_grip" &&
          source.replacement === "prevent_meat_damage_add_bad_publicity" &&
          source.damageType === "meat" &&
          source.activeOnlyDuring === "corp_turn" &&
          source.badPublicity === 2 &&
          source.visibility === "public",
      );
    });
    for (const identityDonorId of identityDonorIds) {
      const definition = definitionFor(state, identityDonorId);
      candidates.push({
        candidateId: `grip_meat_damage_replacement_${identityDonorId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: identityDonorId,
          definitionId: definition.id,
          label: "Meat-Damage-Replacement",
        },
        replacesEventType: "damage",
        replacementEventType: "prevent_damage",
        priority: 81,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
  }
  if (
    event.affectedSide === "runner" &&
    damageAmount > state.runner.grip.length
  ) {
    const gripFlatlineReplacementIds = state.runner.grip.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return flatlineReplacementSourcesForDefinition(definition).some(
        (source) =>
          source.kind === "flatline_replacement_from_grip" &&
          source.replacement === "flatline_tag_replacement" &&
          source.visibility === "public",
      );
    });
    for (const gripFlatlineReplacementId of gripFlatlineReplacementIds) {
      const definition = definitionFor(state, gripFlatlineReplacementId);
      candidates.push({
        candidateId: `flatline_tag_replacement_from_grip_${gripFlatlineReplacementId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: gripFlatlineReplacementId,
          definitionId: definition.id,
          label: definition.title,
        },
        replacesEventType: "damage",
        replacementEventType: "add_tag",
        priority: 80,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
    const installedFlatlinePreventionIds = state.runner.rig.programs.filter(
      (cardId) => {
        const definition = definitionFor(state, cardId);
        return flatlineReplacementSourcesForDefinition(definition).some(
          (source) =>
            source.kind === "flatline_replacement_installed" &&
            source.replacement === "installed_flatline_prevention" &&
            source.visibility === "public",
        );
      },
    );
    for (const installedFlatlinePreventionId of installedFlatlinePreventionIds) {
      const definition = definitionFor(state, installedFlatlinePreventionId);
      candidates.push({
        candidateId: `installed_flatline_prevention_${installedFlatlinePreventionId}`,
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: installedFlatlinePreventionId,
          definitionId: definition.id,
          label: definition.title,
        },
        replacesEventType: "damage",
        replacementEventType: "prevent_damage",
        priority: 82,
        visibility: "hidden_info_barrier",
        optional: true,
      });
    }
  }
  const harness = state.eventModificationHarness?.damageReplacement;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return candidates;
  const base: ReplacementCandidate = {
    candidateId: `v121_damage_replace_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${harness.tagAmount}`,
    controller: harness.side,
    sourceRef: {
      kind: "test_harness",
      label: harness.sourceLabel ?? "Test-only Damage Replacement",
    },
    replacesEventType: "damage",
    replacementEventType: "add_tag",
    priority: harness.priority ?? 100,
    visibility: harness.visibility ?? "hidden_info_barrier",
    optional: harness.optional ?? true,
    tagAmount: harness.tagAmount,
  };
  if (!state.eventModificationHarness?.damageReplacementConflict)
    return [...candidates, base];
  return [
    ...candidates,
    base,
    {
      ...base,
      candidateId: `${base.candidateId}_conflict`,
      tagAmount: base.tagAmount ? base.tagAmount + 1 : 2,
    },
  ];
}

export function isCorpTurnDamageWindow(state: GameState): boolean {
  return (
    state.phase === "corp_draw_phase" ||
    state.phase === "corp_action_phase" ||
    state.phase === "corp_discard_phase"
  );
}

export function replacementChoice(
  state: GameState,
  window: ReplacementWindow,
  event: ImminentEvent,
  stateVersion: number,
): ChoiceRequest {
  const candidate = mustArrayValue(
    window.candidates,
    0,
    "Replacement-Kandidat fehlt.",
  );
  return {
    choiceId: `v121_choice_${window.windowId}`,
    side: candidate.controller,
    source: "v121.replacement.damage",
    prompt: "Damage Replacement",
    presentationKey: "damage_replacement",
    kind: "select_option",
    options: [
      {
        id: "pass",
        label: "Nicht ersetzen",
        publicLabel: "Replacement",
        metadata: { optionKind: "do_not_replace" },
      },
      ...window.candidates.map((availableCandidate) => ({
        id: availableCandidate.candidateId,
        label: replacementChoiceLabel(state, availableCandidate),
        publicLabel: "Replacement",
        metadata: {
          cardTitle: availableCandidate.sourceRef.label,
          amount: availableCandidate.tagAmount ?? 1,
          optionKind:
            flatlineReplacementSourceForCandidate(state, availableCandidate)
              ?.kind ??
            (isIdentityDonorReplacementCandidateForChoice(availableCandidate)
              ? "play_identity_donor"
              : "replace_damage_with_tags"),
        },
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: candidate.visibility,
  };
}

export function isIdentityDonorReplacementCandidateForChoice(
  candidate: ReplacementCandidate,
): boolean {
  return (
    candidate.replacementEventType === "prevent_damage" &&
    candidate.candidateId.startsWith("grip_meat_damage_replacement_")
  );
}

export function resolveReplacementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const window = state.replacementWindow;
  const event = state.imminentEvent;
  if (!window || !event)
    throw new Error("Es ist kein Replacement-Fenster offen.");
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0];
  if (!selected) throw new Error("Es wurde keine Replacement-Option gewählt.");
  const basePayload = {
    ...(legalAction.payload ?? {}),
    replacementWindowId: window.windowId,
    originalEventId: event.eventId,
    originalEventType: event.eventType,
    affectedSide: event.affectedSide ?? "",
    redactedKind: "replacement",
  };
  if (selected === "pass") {
    legalAction.payload = {
      ...basePayload,
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      originalAmount: numberPayload(event, "amount"),
    };
    clearReplacementState(state);
    if (openPdcaDamageReplacementChoice(state, event, legalAction)) return;
    const summary = resolveDamageImminentEvent(state, event);
    setDamagePayload(legalAction, summary);
    return;
  }
  const candidate = window.candidates.find(
    (item) => item.candidateId === selected,
  );
  if (!candidate)
    throw new Error("Dieser Replacement-Kandidat ist nicht legal.");
  if (window.consumedCandidateIds.includes(candidate.candidateId))
    throw new Error(
      "Dieser Replacement-Kandidat wurde in diesem Fenster bereits genutzt.",
    );
  const flatlineSource = flatlineReplacementSourceForCandidate(
    state,
    candidate,
  );
  if (flatlineSource?.kind === "flatline_replacement_from_grip") {
    resolveGripFlatlineTagReplacement(
      state,
      legalAction,
      event,
      candidate,
      flatlineSource,
    );
    clearReplacementState(state);
    return;
  }
  if (flatlineSource?.kind === "flatline_replacement_installed") {
    resolveInstalledFlatlinePreventionReplacement(
      state,
      legalAction,
      event,
      candidate,
      flatlineSource,
    );
    clearReplacementState(state);
    return;
  }
  if (isIdentityDonorReplacementCandidate(state, candidate)) {
    resolveIdentityDonorReplacement(state, legalAction, event, candidate);
    clearReplacementState(state);
    return;
  }
  if (
    candidate.replacesEventType !== event.eventType ||
    candidate.replacementEventType !== "add_tag"
  ) {
    throw new Error(
      "Dieser Replacement-Kandidat passt nicht zum Originalevent.",
    );
  }
  window.consumedCandidateIds.push(candidate.candidateId);
  const tagAmount = candidate.tagAmount ?? 1;
  state.runner.tags += tagAmount;
  legalAction.payload = {
    ...basePayload,
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "add_tag",
    originalAmount: numberPayload(event, "amount"),
    tagsAdded: tagAmount,
    sourceKind: candidate.sourceRef.kind,
  };
  clearReplacementState(state);
}

export function isIdentityDonorReplacementCandidate(
  state: GameState,
  candidate: ReplacementCandidate,
): boolean {
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.grip.includes(cardId)) return false;
  return flatlineReplacementSourcesForDefinition(
    definitionFor(state, cardId),
  ).some(
    (source) =>
      source.kind === "damage_replacement_from_grip" &&
      source.replacement === "prevent_meat_damage_add_bad_publicity" &&
      source.damageType === "meat" &&
      source.activeOnlyDuring === "corp_turn" &&
      source.badPublicity === 2,
  );
}

export function resolveIdentityDonorReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
): void {
  const cardId = candidate.sourceRef.instanceId;
  if (
    !cardId ||
    !state.runner.grip.includes(cardId) ||
    !isIdentityDonorReplacementCandidate(state, candidate)
  )
    throw new Error("Identity Donor ist nicht in der Grip verfuegbar.");
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    damageTypePayload(event) !== "meat" ||
    !isCorpTurnDamageWindow(state)
  )
    throw new Error("Identity Donor passt nicht zu diesem Damage-Event.");
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const definition = definitionFor(state, cardId);
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  const before = state.corp.badPublicity;
  state.corp.badPublicity += 2;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    runnerEventAbility: "grip_meat_damage_replacement",
    sourceDefinitionId: definition.id,
    cardDefinitionId: definition.id,
    trashedCardDefinitionId: definition.id,
    badPublicityAdded: 2,
    corpBadPublicityBefore: before,
    corpBadPublicityAfter: state.corp.badPublicity,
    sourceKind: "card",
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: `${event.eventId}.${cardId}.identity_donor_bad_publicity`,
      kind: "add_bad_publicity",
      visibility: "public",
      side: "corp",
      amount: 2,
      reason: "identity_donor_replacement",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
    },
  ];
}

export function resolveGripFlatlineTagReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
  source: Extract<
    CardFlatlineReplacementSourceImplementation,
    { kind: "flatline_replacement_from_grip" }
  >,
): void {
  const sourceDefinitionId = candidate.sourceRef.definitionId;
  if (sourceDefinitionId === undefined)
    throw new Error("flatline_replacement_source_definition_missing");
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.grip.includes(cardId))
    throw new Error(
      "Die Flatline-Replacement-Quelle ist nicht in der Grip verfuegbar.",
    );
  if (!source.resolution.trashSource)
    throw new Error(
      "Die Grip-Flatline-Replacement-Aufloesung muss die Quelle trashen.",
    );
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const removedTags = state.runner.tags;
  const coreDamageRemoved = state.runner.coreDamage;
  removeFromAllZones(state, cardId);
  state.runner.heap.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "heap" },
  };
  if (source.resolution.removeAllCoreDamage) state.runner.coreDamage = 0;
  const targetHandSize = source.resolution.refreshGripToMax
    ? maxHandSize(state, "runner")
    : state.runner.grip.length;
  let drawnCards = 0;
  while (
    state.runner.grip.length < targetHandSize &&
    state.runner.stack.length > 0
  ) {
    // "Refresh your hand" does not say "draw" and therefore does not
    // trigger City Surveillance's per-draw additional cost.
    drawRunnerCard(state, "none");
    if (state.winner) break;
    drawnCards += 1;
  }
  credits(state, "runner", source.resolution.gainCredits);
  if (source.resolution.removeAllTags) state.runner.tags = 0;
  addRunnerFutureActionDebt(state, source.resolution.futureActionDebt);
  state.runnerAgendaPointsToForfeit =
    Math.max(0, Math.floor(state.runnerAgendaPointsToForfeit ?? 0)) +
    source.resolution.futureAgendaPointForfeit;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    flatlineReplacementAbility: "flatline_tag_replacement_from_grip",
    sourceDefinitionId,
    cardDefinitionId: sourceDefinitionId,
    trashedCardDefinitionId: sourceDefinitionId,
    coreDamageRemoved,
    drawnCards,
    gainedCredits: source.resolution.gainCredits,
    removedTags,
    runnerTagsAfter: state.runner.tags,
    futureActionDebtAdded: source.resolution.futureActionDebt,
    futureAgendaPointForfeitAdded: source.resolution.futureAgendaPointForfeit,
    futureAgendaPointForfeitPending: state.runnerAgendaPointsToForfeit,
    sourceKind: "card",
  };
}

export function resolveInstalledFlatlinePreventionReplacement(
  state: GameState,
  legalAction: LegalAction,
  event: ImminentEvent,
  candidate: ReplacementCandidate,
  source: Extract<
    CardFlatlineReplacementSourceImplementation,
    { kind: "flatline_replacement_installed" }
  >,
): void {
  const sourceDefinitionId = candidate.sourceRef.definitionId;
  if (sourceDefinitionId === undefined)
    throw new Error("flatline_replacement_source_definition_missing");
  const cardId = candidate.sourceRef.instanceId;
  if (!cardId || !state.runner.rig.programs.includes(cardId))
    throw new Error(
      "Die installierte Flatline-Prevention ist nicht installiert.",
    );
  if (source.cost.kind !== "trash_source")
    throw new Error(
      "Die installierte Flatline-Prevention muss die Quelle trashen.",
    );
  windowConsumeReplacementCandidate(state, candidate.candidateId);
  const originalAmount = numberPayload(event, "amount");
  const coreDamageRemoved = state.runner.coreDamage;
  const gripCardsLost = state.runner.grip.length;
  if (source.resolution.trashAllGrip)
    for (const gripCardId of state.runner.grip.slice()) {
      removeFromAllZones(state, gripCardId);
      state.runner.heap.push(gripCardId);
      state.cardInstances[gripCardId] = {
        ...mustInstance(state.cardInstances, gripCardId),
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "heap" },
      };
    }
  if (source.resolution.removeAllCoreDamage) state.runner.coreDamage = 0;
  state.runner.maxHandSize = Math.max(
    0,
    state.runner.maxHandSize + source.resolution.maxHandSizeModifier,
  );
  state.runnerActionsPerTurnOverride =
    source.resolution.runnerActionsPerTurnOverride;
  state.runnerPermanentMeatDamagePrevention =
    source.resolution.permanentMeatDamagePrevention;
  trashRunnerInstalledCardToHeap(state, cardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    replacementDecision: "apply",
    replacementOutcome: "replaced",
    candidateId: candidate.candidateId,
    replacementEventId: `replacement_${event.eventId}`,
    replacementEventType: "prevent_damage",
    originalAmount,
    preventedAmount: originalAmount,
    flatlineReplacementAbility: "installed_flatline_prevention",
    sourceDefinitionId,
    cardDefinitionId: sourceDefinitionId,
    trashedCardDefinitionId: sourceDefinitionId,
    coreDamageRemoved,
    gripCardsLost,
    runnerActionsPerTurnOverride: state.runnerActionsPerTurnOverride,
    permanentMeatDamagePrevention: true,
    runnerMaxHandSizeAfter: maxHandSize(state, "runner"),
    sourceKind: "card",
  };
}

function replacementChoiceLabel(
  state: GameState,
  candidate: ReplacementCandidate,
): string {
  const source = flatlineReplacementSourceForCandidate(state, candidate);
  if (source?.kind === "flatline_replacement_from_grip")
    return `${candidate.sourceRef.label} spielen`;
  if (source?.kind === "flatline_replacement_installed")
    return `${candidate.sourceRef.label} ausloesen`;
  if (isIdentityDonorReplacementCandidateForChoice(candidate))
    return "Identity Donor spielen";
  return `Damage durch ${candidate.tagAmount ?? 1} Tag ersetzen`;
}

export function windowConsumeReplacementCandidate(
  state: GameState,
  candidateId: string,
): void {
  const consumed = state.replacementWindow?.consumedCandidateIds;
  if (consumed && !consumed.includes(candidateId)) consumed.push(candidateId);
}
