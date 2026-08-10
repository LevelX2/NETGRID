import type {
  CardDefinition,
  CardInstanceId,
  CardType,
  EventModificationCandidate,
  GameState,
  ImminentEvent,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type {
  CardDamagePreventionSourceImplementation,
  CardTagPreventionSourceImplementation,
  CardTrashPreventionSourceImplementation,
} from "../../ability-engine/definition-types";
import {
  addRunnerFutureActionDebt,
  cardCounter,
  cardHasSubtype,
  corpAgendaPointTotal,
  definitionFor,
  ensureRunnerTurnFlags,
  hiddenRunnerResourceRevealPayload,
  mustInstance,
  numberPayload,
  runnerInstalledCardIds,
  sanitizeId,
  spendCardCounter,
  spendCredits,
  trashRunnerInstalledCardToHeap,
  returnRunnerInstalledCardToGrip,
  damageTypePayload,
} from "./damage-runtime-context";
import { trashTargetIdsFromEvent } from "./damage-event-resolution";
import { damagePreventionUsedThisTurn } from "../state/turn-flags-counters";

export function cybertechThinkTankBoostCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  if (
    event.eventType !== "damage" ||
    event.affectedSide !== "runner" ||
    damageTypePayload(event) !== "meat"
  )
    return [];
  const candidates: EventModificationCandidate[] = [];
  for (const server of state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))) {
    for (const cardId of server.root.slice().sort() as CardInstanceId[]) {
      const instance = state.cardInstances[cardId];
      const implementation = instance
        ? cardImplementationForDefinitionId(instance.definitionId)
        : undefined;
      const sourceText = String(event.payload.source ?? "");
      if (
        !instance?.rezzed ||
        instance.controller !== "corp" ||
        implementation?.corpUtility?.kind !== "meat_damage_boost" ||
        Math.floor(instance.advancementCounters ?? 0) <= 0 ||
        sourceText.includes(cardId) ||
        sourceText.includes(instance.definitionId)
      )
        continue;
      candidates.push({
        candidateId: `cybertech_meat_damage_boost_${cardId}`,
        eventId: event.eventId,
        kind: "increase",
        controller: "corp",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: instance.definitionId,
          label: "Meat-Damage-Boost",
        },
        priority: 80,
        visibility: "public",
        optional: true,
        increaseAmount: 1,
      });
    }
  }
  return candidates;
}

export function collectEventModificationCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  if (event.payload.cannotBePrevented === true) return [];
  if (event.eventType === "damage") {
    const cybertech = cybertechThinkTankBoostCandidates(state, event);
    if (cybertech.length > 0) return cybertech;
    const runtime = collectRuntimeDamagePreventionCandidates(state, event);
    const harness = collectHarnessDamagePreventionCandidates(state, event);
    return [...runtime, ...harness];
  }
  if (event.eventType === "add_tag")
    return collectRuntimeTagPreventionCandidates(state, event);
  if (event.eventType === "runner_installed_trash")
    return collectRuntimeTrashPreventionCandidates(state, event);
  return [];
}

export function collectRuntimeDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const installed = [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
  const candidates: EventModificationCandidate[] = [];
  const runPool = state.run?.damagePreventionPool;
  if (runPool && runPool.remaining > 0) {
    const preventAmount = Math.min(
      amount,
      Math.max(0, Math.floor(runPool.remaining)),
    );
    if (preventAmount > 0) {
      candidates.push({
        candidateId: `run_damage_prevent_${sanitizeId(runPool.sourceDefinitionId)}_${preventAmount}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: { kind: "game_rule", label: "Run damage prevention" },
        priority: 145,
        visibility: "hidden_info_barrier",
        optional: true,
        preventAmount,
        selectablePreventAmount: true,
      });
    }
  }
  if (
    state.runnerPermanentMeatDamagePrevention === true &&
    damageType === "meat"
  ) {
    candidates.push({
      candidateId: `card_implementation_permanent_meat_prevent_${amount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: "runner",
      sourceRef: {
        kind: "game_rule",
        label: "Emergency Self-Construct",
      },
      priority: 141,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount: amount,
    });
  }
  for (const cardId of installed) {
    if (
      state.cancelledDamagePreventionSourceIdsUntilEndOfTurn?.includes(cardId)
    )
      continue;
    const definition = definitionFor(state, cardId);
    const cardImplementationPreventionSources =
      damagePreventionSourcesForDefinition(definition);
    if (cardImplementationPreventionSources.length > 0) {
      candidates.push(
        ...cardImplementationDamagePreventionCandidates(
          state,
          event,
          cardId,
          definition,
          cardImplementationPreventionSources,
        ),
      );
      continue;
    }
  }
  return candidates;
}

export function damagePreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardDamagePreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.damagePreventionSources ??
    []
  );
}

export function tagPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTagPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.tagPreventionSources ?? []
  );
}

export function trashPreventionSourcesForDefinition(
  definition: CardDefinition,
): readonly CardTrashPreventionSourceImplementation[] {
  return (
    cardImplementationForDefinitionId(definition.id)?.trashPreventionSources ??
    []
  );
}

export function isRunnerHardwareDeckDefinition(
  definition: CardDefinition,
): boolean {
  return (
    definition.type === "hardware" &&
    (cardHasSubtype(definition, "deck") ||
      cardImplementationForDefinitionId(definition.id)?.hardwareDeck === true)
  );
}

export function cardImplementationDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
  cardId: CardInstanceId,
  definition: CardDefinition,
  sources: readonly CardDamagePreventionSourceImplementation[],
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  const damageType = damageTypePayload(event);
  const candidates: EventModificationCandidate[] = [];
  sources.forEach((source, sourceIndex) => {
    if (
      source.kind !== "damage_prevention" ||
      source.visibility !== "public" ||
      !source.damageTypes.includes(damageType)
    )
      return;
    if (!cardImplementationDamagePreventionSourceCanPay(state, cardId, source))
      return;
    const sourceAmount = source.amount === "all" ? amount : source.amount;
    const preventAmount =
      source.limit?.kind === "per_turn"
        ? Math.min(
            amount,
            Math.max(
              0,
              source.limit.amount - damagePreventionUsedThisTurn(state, cardId),
            ),
          )
        : Math.min(amount, sourceAmount);
    if (preventAmount <= 0) return;
    candidates.push({
      candidateId: `card_implementation_damage_prevent_${sanitizeId(cardId)}_${sourceIndex}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: source.corpMayPayToBypass
        ? "corp"
        : source.corpMayCancelUntilEndOfTurn &&
            corpAgendaPointTotal(state) >=
              source.corpMayCancelUntilEndOfTurn.agendaPointCost
          ? "corp"
          : "runner",
      sourceRef: {
        kind: "card",
        instanceId: cardId,
        definitionId: definition.id,
        label: definition.title,
      },
      priority: source.priority,
      visibility: "hidden_info_barrier",
      optional: true,
      preventAmount,
      ...(source.amountMode === "up_to"
        ? { selectablePreventAmount: true }
        : {}),
      preventionSourceIndex: sourceIndex,
      ...(source.corpMayPayToBypass
        ? {
            bypassCostPerDamage: source.corpMayPayToBypass.costPerDamage,
            bypassPaymentSide: "corp" as const,
          }
        : {}),
    });
  });
  return candidates;
}

export function cardImplementationDamagePreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardDamagePreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "none") return true;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "tap_source")
    return state.cardInstances[cardId]?.tapped !== true;
  if (source.cost.kind === "credit_and_tap_source")
    return (
      state.runner.credits >= source.cost.amount &&
      state.cardInstances[cardId]?.tapped !== true
    );
  if (source.cost.kind === "credit")
    return state.runner.credits >= source.cost.amount;
  return (
    cardCounter(state, cardId, source.cost.counterType) >= source.cost.amount
  );
}

export function collectRuntimeTagPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const amount = numberPayload(event, "amount");
  if (amount <= 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = tagPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "avoid_tag" ||
        source.visibility !== "public" ||
        !cardImplementationTagPreventionSourceCanPay(state, cardId, source)
      )
        return;
      candidates.push({
        candidateId: `card_implementation_avoid_tag_${sanitizeId(cardId)}_${sourceIndex}`,
        eventId: event.eventId,
        kind: "avoid",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTags: Math.min(amount, source.amount),
        tagPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

export function collectRuntimeTrashPreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const targetIds = trashTargetIdsFromEvent(event);
  if (targetIds.length === 0 || event.affectedSide !== "runner") return [];
  const candidates: EventModificationCandidate[] = [];
  for (const cardId of runnerInstalledCardIds(state)) {
    const definition = definitionFor(state, cardId);
    const sources = trashPreventionSourcesForDefinition(definition);
    sources.forEach((source, sourceIndex) => {
      if (
        source.kind !== "prevent_installed_card_trash" ||
        source.visibility !== "public" ||
        (source.activeOnlyDuring === "corp_turn" &&
          !(
            state.phase === "corp_draw_phase" ||
            state.phase === "corp_action_phase" ||
            state.phase === "corp_discard_phase"
          )) ||
        !cardImplementationTrashPreventionSourceCanPay(state, cardId, source)
      )
        return;
      const protectedTargets = targetIds.filter((targetId) =>
        cardImplementationTrashPreventionProtectsTarget(
          state,
          cardId,
          source,
          targetId,
        ),
      );
      const preventedTrashTargetIds =
        source.mode === "one_card"
          ? protectedTargets.slice(0, 1)
          : protectedTargets;
      if (preventedTrashTargetIds.length === 0) return;
      candidates.push({
        candidateId: `card_implementation_prevent_trash_${sanitizeId(cardId)}_${sourceIndex}_${preventedTrashTargetIds.length}`,
        eventId: event.eventId,
        kind: "prevent",
        controller: "runner",
        sourceRef: {
          kind: "card",
          instanceId: cardId,
          definitionId: definition.id,
          label: definition.title,
        },
        priority: source.priority,
        visibility: "hidden_info_barrier",
        optional: true,
        preventedTrashTargetIds,
        trashPreventionSourceIndex: sourceIndex,
      });
    });
  }
  return candidates;
}

export function cardImplementationTagPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTagPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "credit_and_trash_source")
    return state.runner.credits >= source.cost.amount;
  if (source.cost.kind === "credit_and_tap_source")
    return (
      state.runner.credits >= source.cost.amount &&
      state.cardInstances[cardId]?.tapped !== true
    );
  if (source.cost.kind === "credit_and_forgo_next_action")
    return state.runner.credits >= source.cost.amount;
  return state.runner.credits >= source.cost.amount;
}

export function cardImplementationTrashPreventionSourceCanPay(
  state: GameState,
  cardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
): boolean {
  if (!runnerInstalledCardIds(state).includes(cardId)) return false;
  if (source.cost.kind === "trash_source") return true;
  if (source.cost.kind === "tap_source")
    return state.cardInstances[cardId]?.tapped !== true;
  return state.runner.credits >= source.cost.amount;
}

export function cardImplementationTrashPreventionProtectsTarget(
  state: GameState,
  sourceCardId: CardInstanceId,
  source: CardTrashPreventionSourceImplementation,
  targetCardId: CardInstanceId,
): boolean {
  if (source.excludesSelf === true && sourceCardId === targetCardId)
    return false;
  if (!runnerInstalledCardIds(state).includes(targetCardId)) return false;
  const targetDefinition = definitionFor(state, targetCardId);
  return source.protectsCardTypes.includes(
    targetDefinition.type as Extract<
      CardType,
      "program" | "hardware" | "resource"
    >,
  );
}

export function collectHarnessDamagePreventionCandidates(
  state: GameState,
  event: ImminentEvent,
): EventModificationCandidate[] {
  const harness = state.eventModificationHarness?.damagePrevention;
  const amount = numberPayload(event, "amount");
  if (!harness || amount <= 0) return [];
  const preventAmount = Math.min(harness.preventAmount, amount);
  if (!Number.isInteger(preventAmount) || preventAmount <= 0) return [];
  return [
    {
      candidateId: `v120_damage_prevent_${sanitizeId(String(harness.sourceLabel ?? "test_harness"))}_${preventAmount}`,
      eventId: event.eventId,
      kind: "prevent",
      controller: harness.side,
      sourceRef: {
        kind: "test_harness",
        label: harness.sourceLabel ?? "Test-only Damage Prevention",
      },
      priority: 100,
      visibility: harness.visibility ?? "hidden_info_barrier",
      optional: harness.optional ?? true,
      preventAmount,
    },
  ];
}

export function registerDamagePreventionUsage(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): void {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return;
  const flags = ensureRunnerTurnFlags(state);
  const usage = (flags.damagePreventionUsage ??= {});
  usage[candidate.sourceRef.instanceId] =
    (usage[candidate.sourceRef.instanceId] ?? 0) + preventedAmount;
}

export function applyRuntimeDamagePreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  ) {
    return {};
  }
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const implementationSource =
    cardImplementationDamagePreventionSourceForCandidate(definition, candidate);
  if (implementationSource) {
    if (implementationSource.cost.kind === "none") return {};
    if (implementationSource.cost.kind === "trash_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      trashRunnerInstalledCardToHeap(state, sourceCardId);
      return {
        ...hiddenRevealPayload,
        sourceTrashed: true,
        trashedCardDefinitionId: definition.id,
      };
    }
    if (implementationSource.cost.kind === "credit") {
      spendCredits(state, "runner", implementationSource.cost.amount);
      return {
        paidCredits: implementationSource.cost.amount,
        runnerCreditsAfter: state.runner.credits,
      };
    }
    if (implementationSource.cost.kind === "tap_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
      if (sourceInstance.tapped)
        throw new Error("Die Prevention-Quelle ist bereits getappt.");
      sourceInstance.faceup = true;
      sourceInstance.rezzed = true;
      sourceInstance.tapped = true;
      return {
        ...hiddenRevealPayload,
        sourceTapped: true,
      };
    }
    if (implementationSource.cost.kind === "credit_and_tap_source") {
      const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
        state,
        sourceCardId,
      );
      const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
      if (sourceInstance.tapped)
        throw new Error("Die Prevention-Quelle ist bereits getappt.");
      spendCredits(state, "runner", implementationSource.cost.amount);
      sourceInstance.faceup = true;
      sourceInstance.rezzed = true;
      sourceInstance.tapped = true;
      return {
        ...hiddenRevealPayload,
        paidCredits: implementationSource.cost.amount,
        runnerCreditsAfter: state.runner.credits,
        sourceTapped: true,
      };
    }
    const { counterType, amount, trashSourceWhenEmpty } =
      implementationSource.cost;
    if (cardCounter(state, sourceCardId, counterType) < amount)
      throw new Error("Die Prevention-Quelle hat nicht genug Counter.");
    spendCardCounter(state, sourceCardId, counterType, amount);
    const remainingCounters = cardCounter(state, sourceCardId, counterType);
    const sourceTrashed =
      trashSourceWhenEmpty === true && remainingCounters <= 0;
    if (sourceTrashed) trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      counterType,
      removedCounterAmount: amount,
      remainingCounters,
      sourceTrashed,
      ...(sourceTrashed ? { trashedCardDefinitionId: definition.id } : {}),
    };
  }
  return {};
}

export function applyRuntimeTagPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedAmount: number,
): Record<string, unknown> {
  if (
    preventedAmount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTagPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      ...hiddenRevealPayload,
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  if (source.cost.kind === "credit_and_trash_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    spendCredits(state, "runner", source.cost.amount);
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      ...hiddenRevealPayload,
      paidCredits: source.cost.amount,
      runnerCreditsAfter: state.runner.credits,
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  if (source.cost.kind === "credit_and_tap_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
    if (sourceInstance.tapped)
      throw new Error("Die Tag-Prevention-Quelle ist bereits getappt.");
    spendCredits(state, "runner", source.cost.amount);
    sourceInstance.faceup = true;
    sourceInstance.rezzed = true;
    sourceInstance.tapped = true;
    return {
      ...hiddenRevealPayload,
      paidCredits: source.cost.amount,
      runnerCreditsAfter: state.runner.credits,
      sourceTapped: true,
    };
  }
  if (source.cost.kind === "credit_and_forgo_next_action") {
    spendCredits(state, "runner", source.cost.amount);
    addRunnerFutureActionDebt(state, 1);
    return {
      paidCredits: source.cost.amount,
      runnerCreditsAfter: state.runner.credits,
      runnerForgoNextActions: 1,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  return {
    paidCredits: source.cost.amount,
    runnerCreditsAfter: state.runner.credits,
  };
}

export function applyRuntimeTrashPreventionCost(
  state: GameState,
  candidate: EventModificationCandidate,
  preventedCount: number,
): Record<string, unknown> {
  if (
    preventedCount <= 0 ||
    candidate.sourceRef.kind !== "card" ||
    !candidate.sourceRef.instanceId
  )
    return {};
  const sourceCardId = candidate.sourceRef.instanceId;
  const definition = definitionFor(state, sourceCardId);
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definition,
    candidate,
  );
  if (!source) return {};
  if (source.cost.kind === "trash_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    trashRunnerInstalledCardToHeap(state, sourceCardId);
    return {
      ...hiddenRevealPayload,
      sourceTrashed: true,
      trashedCardDefinitionId: definition.id,
    };
  }
  if (source.cost.kind === "tap_source") {
    const hiddenRevealPayload = hiddenRunnerResourceRevealPayload(
      state,
      sourceCardId,
    );
    const sourceInstance = mustInstance(state.cardInstances, sourceCardId);
    if (sourceInstance.tapped)
      throw new Error("Die Trash-Prevention-Quelle ist bereits getappt.");
    sourceInstance.faceup = true;
    sourceInstance.rezzed = true;
    sourceInstance.tapped = true;
    return {
      ...hiddenRevealPayload,
      sourceTapped: true,
    };
  }
  spendCredits(state, "runner", source.cost.amount);
  returnRunnerInstalledCardToGrip(state, sourceCardId);
  return {
    paidCredits: source.cost.amount,
    returnedSourceToGrip: true,
    runnerCreditsAfter: state.runner.credits,
  };
}

export function cardImplementationDamagePreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardDamagePreventionSourceImplementation | undefined {
  const sourceIndex = candidate.preventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return damagePreventionSourcesForDefinition(definition)[sourceIndex];
}

export function cardImplementationTagPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTagPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.tagPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return tagPreventionSourcesForDefinition(definition)[sourceIndex];
}

export function cardImplementationTrashPreventionSourceForCandidate(
  definition: CardDefinition,
  candidate: EventModificationCandidate,
): CardTrashPreventionSourceImplementation | undefined {
  const sourceIndex = candidate.trashPreventionSourceIndex;
  if (
    typeof sourceIndex !== "number" ||
    !Number.isInteger(sourceIndex) ||
    sourceIndex < 0
  )
    return undefined;
  return trashPreventionSourcesForDefinition(definition)[sourceIndex];
}

export function revalidateDamagePreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    return;
  const sourceCardId = candidate.sourceRef.instanceId;
  const expectedDefinitionId = candidate.sourceRef.definitionId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Prevention-Quelle ist nicht mehr installiert.");
  if (
    expectedDefinitionId &&
    definitionFor(state, sourceCardId).id !== expectedDefinitionId
  ) {
    throw new Error("Die Prevention-Quelle passt nicht mehr zur Karte.");
  }
  const implementationSource =
    cardImplementationDamagePreventionSourceForCandidate(
      definitionFor(state, sourceCardId),
      candidate,
    );
  if (
    implementationSource &&
    !cardImplementationDamagePreventionSourceCanPay(
      state,
      sourceCardId,
      implementationSource,
    )
  )
    throw new Error("Die Prevention-Quelle kann die Kosten nicht mehr zahlen.");
}

export function revalidateTagPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Tag-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Tag-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Tag-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTagPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    !source ||
    !cardImplementationTagPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Tag-Prevention-Quelle kann nicht mehr zahlen.");
}

export function revalidateTrashPreventionCandidateSource(
  state: GameState,
  candidate: EventModificationCandidate,
  event: ImminentEvent,
): void {
  if (candidate.sourceRef.kind !== "card" || !candidate.sourceRef.instanceId)
    throw new Error("Die Trash-Prevention-Quelle fehlt.");
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!runnerInstalledCardIds(state).includes(sourceCardId))
    throw new Error("Die Trash-Prevention-Quelle ist nicht mehr installiert.");
  if (
    candidate.sourceRef.definitionId &&
    definitionFor(state, sourceCardId).id !== candidate.sourceRef.definitionId
  )
    throw new Error("Die Trash-Prevention-Quelle passt nicht mehr.");
  const source = cardImplementationTrashPreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
  if (
    source?.activeOnlyDuring === "corp_turn" &&
    !(
      state.phase === "corp_draw_phase" ||
      state.phase === "corp_action_phase" ||
      state.phase === "corp_discard_phase"
    )
  )
    throw new Error("Die Trash-Prevention ist nur im Korp-Zug nutzbar.");
  if (
    !source ||
    !cardImplementationTrashPreventionSourceCanPay(state, sourceCardId, source)
  )
    throw new Error("Die Trash-Prevention-Quelle kann nicht mehr zahlen.");
  const legalTargets = new Set(trashTargetIdsFromEvent(event));
  const protectedIds = candidate.preventedTrashTargetIds ?? [];
  if (
    protectedIds.length === 0 ||
    protectedIds.some(
      (targetId) =>
        !legalTargets.has(targetId) ||
        !cardImplementationTrashPreventionProtectsTarget(
          state,
          sourceCardId,
          source,
          targetId,
        ),
    )
  )
    throw new Error("Die Trash-Prevention-Ziele sind nicht mehr gueltig.");
}

export function damagePreventionSourceForEventCandidate(
  state: GameState,
  candidate: EventModificationCandidate,
): CardDamagePreventionSourceImplementation | undefined {
  const sourceCardId = candidate.sourceRef.instanceId;
  if (!sourceCardId || !state.cardInstances[sourceCardId]) return undefined;
  return cardImplementationDamagePreventionSourceForCandidate(
    definitionFor(state, sourceCardId),
    candidate,
  );
}
