import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceRequest,
  DamageType,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type {
  CardAccessEffectImplementation,
  CardAccessEffectStepImplementation,
  CardAccessZone,
  CardTraceSuccessEffectImplementation,
} from "../../ability-engine/definition-types";
import {
  requireLegalAction,
  sanitizeId,
  type AccessEffectHandlerHost,
} from "./access-effect-context";

export function cardHasImplementationAccessEffects(
  host: AccessEffectHandlerHost,
  definition: CardDefinition,
): boolean {
  return host.cards.accessEffectsForDefinition(definition.id).length > 0;
}

export function cardImplementationAccessZone(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): CardAccessZone {
  const legalAction = requireLegalAction(host);
  const serverId = String(legalAction.payload?.serverId ?? "");
  if (serverId === "hq" || serverId === "rd" || serverId === "archives")
    return serverId;
  const instance = host.cards.mustInstance(cardId);
  if (instance.zone.side === "corp") {
    if (instance.zone.zone === "hq") return "hq";
    if (instance.zone.zone === "rd") return "rd";
    if (instance.zone.zone === "archives") return "archives";
  }
  if (host.state.corp.hq.includes(cardId)) return "hq";
  if (host.state.corp.rd.includes(cardId)) return "rd";
  if (host.state.corp.archives.includes(cardId)) return "archives";
  return "installed";
}

export function accessConditionMet(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  condition: CardAccessEffectImplementation["condition"],
): boolean {
  if (!condition) return true;
  switch (condition.kind) {
    case "runner_is_tagged":
      return host.state.runner.tags > 0;
    case "runner_tags_at_least":
      return host.state.runner.tags >= condition.amount;
    case "source_has_advancement_counters":
      return (
        host.cards.mustInstance(cardId).advancementCounters >= condition.minimum
      );
    case "source_has_hosted_credits":
      return host.counters.cardCounter(cardId, "bit") > 0;
    case "runner_attempted_run_last_turn":
      return (
        Math.max(
          0,
          Math.floor(host.state.runnerTurnFlags?.runAttemptsLastTurn ?? 0),
        ) >= condition.minimumRuns
      );
    default: {
      const unknown = condition as { kind?: string };
      throw new Error(
        `Unsupported CardImplementation access condition: ${
          unknown.kind ?? "unknown"
        }`,
      );
    }
  }
}

export function accessEffectApplies(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  effect: CardAccessEffectImplementation,
  accessZone: CardAccessZone,
): boolean {
  return (
    effect.sourceZones.includes(accessZone) &&
    !(effect.ignoreIfAccessedFrom ?? []).includes(accessZone) &&
    installedAccessActivationMet(host, cardId, effect, accessZone) &&
    accessConditionMet(host, cardId, effect.condition)
  );
}

export function installedAccessActivationMet(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  effect: CardAccessEffectImplementation,
  accessZone: CardAccessZone,
): boolean {
  if (accessZone !== "installed") return true;
  const rezzed = host.cards.mustInstance(cardId).rezzed === true;
  switch (effect.installedSourceActivation ?? "requires_rezzed") {
    case "requires_rezzed":
      return rezzed;
    case "unrezzed_only":
      return !rezzed;
    case "any_rez_state":
      return true;
    default: {
      const unknown = effect as { installedSourceActivation?: string };
      throw new Error(
        `Unsupported CardImplementation installed access activation: ${
          unknown.installedSourceActivation ?? "unknown"
        }`,
      );
    }
  }
}

export function accessEffectHiddenZoneAction(
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
): string {
  if (
    effect.effects.some(
      (step) =>
        step.kind === "add_runner_counter" && step.counterType === "crying",
    )
  )
    return "v1918_crybaby_access_counter";
  if (
    effect.effects.some(
      (step) =>
        step.kind === "add_runner_counter" &&
        step.counterType === "link_reduction_counter",
    )
  )
    return "proteus_link_reduction_counter_access_counter";
  if (
    effect.effects.some(
      (step) => step.kind === "add_counter_to_all_installed_runner_icebreakers",
    )
  )
    return "proteus_breaker_strength_penalty_access_counters";
  if (
    effect.effects.some((step) => step.kind === "shuffle_source_into_corp_rd")
  )
    return "proteus_antibody_shuffle_into_rd";
  if (
    effect.effects.some(
      (step) => step.kind === "return_installed_runner_programs_to_grip",
    )
  )
    return "proteus_return_installed_runner_programs_to_grip";
  if (
    effect.effects.some((step) => step.kind === "trash_installed_runner_cards")
  )
    return "v1919_access_ambush_trash_installed";
  if (
    effect.effects.some(
      (step) => step.kind === "trash_installed_runner_hardware_and_programs",
    )
  )
    return "classic_shock_treatment_access_trash";
  if (
    effect.effects.some(
      (step) =>
        step.kind ===
        "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
    )
  )
    return "classic_self_destruct_access";
  if (
    effect.effects.some(
      (step) => step.kind === "damage_from_source_advancement_counters",
    )
  )
    return "v1919_access_ambush_damage";
  if (
    effect.installedSourceActivation === "unrezzed_only" &&
    effect.effects.some((step) => step.kind === "damage")
  )
    return "v1919_access_ambush_damage";
  if (definition.type === "upgrade") return "v1918_upgrade_access_ambush";
  if (effect.sourceZones.some((zone) => zone === "hq" || zone === "rd"))
    return "v1917_access_ambush";
  return "card_implementation_access_effect";
}

export function setAccessEffectBasePayload(
  legalAction: LegalAction,
  definition: CardDefinition,
  accessZone: CardAccessZone,
  effect: CardAccessEffectImplementation,
  includePublicReveal = true,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: accessEffectHiddenZoneAction(definition, effect),
    ambushDefinitionId: definition.id,
    accessEffectSourceDefinitionId: definition.id,
    accessedFromZone: accessZone,
    ...(includePublicReveal &&
    effect.revealIfAccessedFrom?.includes(accessZone as "rd")
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
  };
}

export function resolveCardImplementationAccessEffects(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): boolean {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const accessEffects = host.cards.accessEffectsForDefinition(definition.id);
  if (accessEffects.length === 0) return false;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "CardImplementation-Access-Effekt darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  const accessZone = cardImplementationAccessZone(host, cardId);
  for (const [effectIndex, effect] of accessEffects.entries()) {
    if ((effect.ignoreIfAccessedFrom ?? []).includes(accessZone)) {
      setAccessEffectBasePayload(legalAction, definition, accessZone, effect);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ambushSkippedReason: accessZone,
      };
      continue;
    }
    if (!effect.sourceZones.includes(accessZone)) continue;
    if (!installedAccessActivationMet(host, cardId, effect, accessZone))
      continue;
    setAccessEffectBasePayload(legalAction, definition, accessZone, effect);
    if (!accessConditionMet(host, cardId, effect.condition)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...(effect.condition?.kind === "runner_is_tagged"
          ? {
              tagConditionMet: false,
              damageSkippedReason: "runner_not_tagged",
            }
          : effect.condition?.kind === "runner_tags_at_least"
            ? {
                tagConditionMet: false,
                requiredTags: effect.condition.amount,
                runnerTagsBefore: host.state.runner.tags,
                damageSkippedReason: "runner_tags_below_threshold",
              }
            : { accessEffectConditionMet: false }),
      };
      continue;
    }
    if (effect.cost?.kind === "corp_may_pay_credits") {
      startCardImplementationAccessPaymentChoice(
        host,
        cardId,
        effectIndex,
        accessZone,
        effect,
      );
      continue;
    }
    if (
      executeCardImplementationAccessEffectSteps(
        host,
        cardId,
        definition,
        effect,
        effectIndex,
      )
    )
      return true;
  }
  return false;
}

export function startCardImplementationAccessPaymentChoice(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  effectIndex: number,
  accessZone: CardAccessZone,
  effect: CardAccessEffectImplementation,
): void {
  const legalAction = requireLegalAction(host);
  const cost = effect.cost;
  if (!cost || cost.kind !== "corp_may_pay_credits") return;
  if (host.state.corp.credits < cost.amount) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ambushPaymentAvailable: false,
      ambushPaidCost: 0,
      corpCreditsAfter: host.state.corp.credits,
    };
    return;
  }
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  host.state.pendingChoice = {
    choiceId: `p3_35_access_payment_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `p3_35.access_payment:${cardId}:${effectIndex}:${accessZone}:${host.state.stateVersion + 1}`,
    prompt: "Access-Ambush bezahlen",
    kind: "select_option",
    options: [
      {
        id: "pay",
        label: `${cost.amount} Credits zahlen`,
        publicLabel: "Access-Ambush bezahlen",
        value: "pay",
      },
      {
        id: "decline",
        label: "Nicht zahlen",
        publicLabel: "Access-Ambush nicht bezahlen",
        value: "decline",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  } satisfies ChoiceRequest;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushPaymentAvailable: true,
    ambushPaymentChoiceOpened: true,
    ambushPaymentAmount: cost.amount,
  };
}

export function executeCardImplementationAccessEffectSteps(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
  effectIndex: number,
  startStepIndex = 0,
): boolean {
  const legalAction = requireLegalAction(host);
  const resolvedEffects: ResolvedGameEffect[] = [];
  for (const [index, step] of effect.effects.entries()) {
    if (index < startStepIndex) continue;
    executeCardImplementationAccessEffectStep(
      host,
      cardId,
      definition,
      effect,
      step,
      index,
      effectIndex,
      resolvedEffects,
    );
    if (host.state.pendingAddTagContinuation) {
      if (resolvedEffects.length > 0) {
        legalAction.resolvedEffects = [
          ...(legalAction.resolvedEffects ?? []),
          ...resolvedEffects,
        ];
      }
      return true;
    }
  }
  if (resolvedEffects.length > 0) {
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      ...resolvedEffects,
    ];
  }
  return false;
}

export function accessEffectId(
  definition: CardDefinition,
  cardId: CardInstanceId,
  index: number,
  kind: string,
): string {
  return `${definition.id}.${sanitizeId(cardId)}.access_effect.${index}.${kind}`;
}

export function executeCardImplementationAccessEffectStep(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
  step: CardAccessEffectStepImplementation,
  index: number,
  effectIndex: number,
  resolvedEffects: ResolvedGameEffect[],
): void {
  const legalAction = requireLegalAction(host);
  switch (step.kind) {
    case "damage": {
      host.damage.resolveDamageOperation(
        step.damageType,
        step.amount,
        definition.id,
      );
      if (legalAction.payload?.damageResolved === true) {
        resolvedEffects.push({
          effectId: accessEffectId(definition, cardId, index, "damage"),
          kind: "damage",
          visibility: step.visibility,
          side: "runner",
          amount: Number(legalAction.payload.damageAmount ?? step.amount),
          damageType: step.damageType,
          cardsTrashed: Number(legalAction.payload.cardsTrashed ?? 0),
          reason: "access_effect",
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
        });
      }
      return;
    }
    case "damage_from_source_advancement_counters": {
      const advancementCounterCount = Math.max(
        0,
        Math.floor(host.cards.mustInstance(cardId).advancementCounters),
      );
      const amount =
        advancementCounterCount > 0
          ? advancementCounterCount * step.amountPerCounter
          : step.minimumAmount;
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        advancementCounterCount,
        damageAmount: amount,
      };
      if (amount <= 0) return;
      host.damage.resolveDamageOperation(
        step.damageType,
        amount,
        definition.id,
      );
      if (legalAction.payload?.damageResolved === true) {
        resolvedEffects.push({
          effectId: accessEffectId(
            definition,
            cardId,
            index,
            "damage_from_source_advancement_counters",
          ),
          kind: "damage",
          visibility: step.visibility,
          side: "runner",
          amount: Number(legalAction.payload.damageAmount ?? amount),
          damageType: step.damageType,
          cardsTrashed: Number(legalAction.payload.cardsTrashed ?? 0),
          reason: "access_effect",
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
        });
      }
      return;
    }
    case "trace": {
      const accessTraceStep = step as {
        kind: "trace";
        baseTraceStrength: number;
        onSuccess: readonly CardTraceSuccessEffectImplementation[];
        limit: "once_per_run_on_this_fort_per_source";
      };
      const run = host.state.run;
      if (!run || run.accessedCardId !== cardId)
        throw new Error("Access-Trace braucht einen aktiven Access-Kontext.");
      const serverId = run.attackedServerId;
      const consumed = run.turbeauAccessTraceConsumedByServer?.[serverId] ?? [];
      if (
        accessTraceStep.limit === "once_per_run_on_this_fort_per_source" &&
        consumed.includes(cardId)
      ) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          hiddenZoneBarrier: true,
          hiddenZoneAction: "v1918_upgrade_access_trace",
          ambushDefinitionId: definition.id,
          oncePerRunConsumed: true,
          serverId,
        };
        return;
      }
      run.turbeauAccessTraceConsumedByServer = {
        ...(run.turbeauAccessTraceConsumedByServer ?? {}),
        [serverId]: [...consumed, cardId],
      };
      legalAction.payload = { ...(legalAction.payload ?? {}), cardId };
      host.trace.startTraceFromOperation(
        definition.id,
        accessTraceStep.baseTraceStrength,
        host.trace.traceSuccessEffectForCardImplementation(
          accessTraceStep.onSuccess,
        ),
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1918_upgrade_access_trace",
        ambushDefinitionId: definition.id,
        oncePerRunConsumed: true,
        baseTraceStrength: accessTraceStep.baseTraceStrength,
        serverId,
      };
      return;
    }
    case "add_tags": {
      const runnerTagsBefore = host.state.runner.tags;
      const suspended = host.tags.addRunnerTagsWithPrevention(
        step.amount,
        definition.id,
      );
      if (suspended) {
        host.state.pendingAddTagContinuation = {
          kind: "access_effect",
          sourceCardId: cardId,
          effectIndex,
          tagStepIndex: index,
          nextStepIndex: index + 1,
          accessZone: cardImplementationAccessZone(host, cardId),
          runnerTagsBefore,
        };
        return;
      }
      const tagsAdded = Math.max(0, host.state.runner.tags - runnerTagsBefore);
      resolvedEffects.push({
        effectId: accessEffectId(definition, cardId, index, "add_tags"),
        kind: "add_tags",
        visibility: step.visibility,
        side: "runner",
        amount: tagsAdded,
        reason: "access_effect",
        runnerTagsAfter: host.state.runner.tags,
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
      });
      return;
    }
    case "add_runner_counter": {
      host.counters.addCardCounter(
        host.state.runner.identity,
        step.counterType,
        step.amount,
      );
      const remainingCounters = host.counters.cardCounter(
        host.state.runner.identity,
        step.counterType,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        counterType: step.counterType,
        addedCounterAmount: step.amount,
        remainingCounters,
        ...(step.counterType === "crying"
          ? {
              cryingCountersAfter: remainingCounters,
              linkModifierAmount: -2 * remainingCounters,
            }
          : {}),
        ...(step.counterType === "link_reduction_counter"
          ? {
              doppelgangerCountersAfter: remainingCounters,
            }
          : {}),
      };
      resolvedEffects.push({
        effectId: accessEffectId(
          definition,
          cardId,
          index,
          "add_runner_counter",
        ),
        kind: "counter_change",
        visibility: step.visibility,
        side: "runner",
        counterType: step.counterType,
        addedCounterAmount: step.amount,
        remainingCounters,
        reason: "access_effect",
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
      });
      return;
    }
    case "add_counter_to_all_installed_runner_icebreakers": {
      const result = host.counters.addCounterToAllInstalledRunnerIcebreakers(
        step.counterType,
        step.amount,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...result.publicPayload,
      };
      resolvedEffects.push({
        effectId: accessEffectId(
          definition,
          cardId,
          index,
          "add_counter_to_all_installed_runner_icebreakers",
        ),
        kind: "counter_change",
        visibility: step.visibility,
        side: "runner",
        amount: result.amount,
        counterType: result.counterType,
        addedCounterAmount: result.amount,
        remainingCounters: result.countersAfter,
        reason: "access_effect",
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
      });
      return;
    }
    case "shuffle_source_into_corp_rd": {
      const result = host.corpCards.shuffleCorpCardIntoRd(
        cardId,
        definition.id,
      );
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...result.publicPayload,
      };
      return;
    }
    case "return_installed_runner_programs_to_grip": {
      startInstalledRunnerProgramReturnChoice(
        host,
        cardId,
        definition,
        effect,
        step,
        index,
      );
      return;
    }
    case "trash_installed_runner_cards": {
      const amount =
        typeof step.amount === "number"
          ? step.amount
          : Math.max(
              0,
              Math.floor(host.cards.mustInstance(cardId).advancementCounters),
            );
      trashRunnerInstalledTargetsForAccessEffect(
        host,
        definition,
        step.target,
        amount,
        resolvedEffects,
        index,
      );
      return;
    }
    case "trash_installed_runner_hardware_and_programs": {
      trashInstalledRunnerHardwareAndProgramsForAccessEffect(
        host,
        definition,
        step.hardwareAmount,
        step.programAmount,
        resolvedEffects,
        index,
      );
      return;
    }
    case "trash_other_corp_installed_cards_in_source_server_and_damage_runner": {
      trashOtherCorpInstalledCardsInSourceServerAndDamageRunner(
        host,
        cardId,
        definition,
        step.damageType,
        step.amountPerTrashed,
        resolvedEffects,
        index,
      );
      return;
    }
    case "reduce_current_access_queue": {
      const run = host.state.run;
      const breach = run?.breach;
      if (
        !run ||
        !breach ||
        run.accessedCardId !== cardId ||
        step.target !== "remaining_stored_cards_in_this_fort" ||
        step.amount !== 1
      )
        throw new Error("Access-Queue-Reduktion braucht den aktuellen Access.");
      const serverId = run.accessServerOverride ?? run.attackedServerId;
      const targetIndex = breach.queue.findIndex((entry, entryIndex) => {
        if (entryIndex <= breach.currentIndex || entry.status !== "pending")
          return false;
        if (serverId !== "hq" && serverId !== "rd") return false;
        return entry.zone === serverId;
      });
      if (targetIndex >= 0) {
        breach.queue = breach.queue.map((entry, entryIndex) =>
          entryIndex === targetIndex ? { ...entry, status: "skipped" } : entry,
        );
      }
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenZoneBarrier: step.visibility === "hidden_info_barrier",
        hiddenZoneAction: "reduce_current_access_queue",
        sourceDefinitionId: definition.id,
        reducedAccessCount: targetIndex >= 0 ? 1 : 0,
      };
      return;
    }
    default: {
      const unsupported = step as { kind?: string };
      throw new Error(
        `Unsupported CardImplementation access effect step: ${
          unsupported.kind ?? "unknown"
        }`,
      );
    }
  }
}

export function runnerInstalledProgramReturnCandidates(
  host: AccessEffectHandlerHost,
): CardInstanceId[] {
  return host.state.runner.rig.programs
    .filter((cardId) => host.cards.definitionFor(cardId).type === "program")
    .slice()
    .sort((left, right) => {
      const leftDefinition = host.cards.definitionFor(left);
      const rightDefinition = host.cards.definitionFor(right);
      return (
        leftDefinition.title.localeCompare(rightDefinition.title) ||
        left.localeCompare(right)
      );
    });
}

export function maxRunnerProgramReturnCount(
  host: AccessEffectHandlerHost,
  sourceCardId: CardInstanceId,
  step: Extract<
    CardAccessEffectStepImplementation,
    { kind: "return_installed_runner_programs_to_grip" }
  >,
): number {
  const counters = Math.max(
    0,
    Math.floor(host.cards.mustInstance(sourceCardId).advancementCounters),
  );
  return Math.max(0, counters * step.amount.multiplier);
}

export function startInstalledRunnerProgramReturnChoice(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
  step: Extract<
    CardAccessEffectStepImplementation,
    { kind: "return_installed_runner_programs_to_grip" }
  >,
  effectIndex: number,
): void {
  const legalAction = requireLegalAction(host);
  if (step.chooser !== "corp")
    throw new Error(
      "return_installed_runner_programs_to_grip supports only Corp choice.",
    );
  const accessZone = cardImplementationAccessZone(host, cardId);
  const maxSelections = Math.min(
    maxRunnerProgramReturnCount(host, cardId, step),
    runnerInstalledProgramReturnCandidates(host).length,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    advancementCounterCount:
      host.cards.mustInstance(cardId).advancementCounters,
    maxReturnedProgramCount: maxSelections,
  };
  if (maxSelections <= 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      returnProgramChoiceSkipped: true,
      returnedProgramCount: 0,
      eligibleProgramCount: runnerInstalledProgramReturnCandidates(host).length,
    };
    return;
  }
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Access-Choice offen.");
  const candidates = runnerInstalledProgramReturnCandidates(host);
  host.state.pendingChoice = {
    choiceId: `proteus_return_runner_programs_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `proteus.return_runner_programs:${cardId}:${effectIndex}:${accessZone}:${host.state.stateVersion + 1}`,
    prompt: `${definition.title}: Runner-Programme zurueckgeben`,
    kind: "select_cards",
    minSelections: 0,
    maxSelections,
    stateVersion: host.state.stateVersion + 1,
    visibility: effect.visibility,
    options: candidates.map((candidateId) => {
      const candidateDefinition = host.cards.definitionFor(candidateId);
      return {
        id: `card_${candidateId}`,
        label: candidateDefinition.title,
        publicLabel: candidateDefinition.title,
        value: candidateId,
      };
    }),
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    returnProgramChoiceOpened: true,
    eligibleProgramCount: candidates.length,
  };
}

export function selectedCardIdsFromChoice(
  choice: ChoiceRequest,
  selectedOptionIds: readonly string[],
): CardInstanceId[] {
  if (
    selectedOptionIds.length < choice.minSelections ||
    selectedOptionIds.length > choice.maxSelections
  )
    throw new Error("Die Anzahl der gewaehlten Karten ist ungueltig.");
  const optionIds = new Set(choice.options.map((option) => option.id));
  if (selectedOptionIds.some((optionId) => !optionIds.has(optionId)))
    throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length)
    throw new Error("Kartenoptionen duerfen nicht doppelt gewaehlt werden.");
  return selectedOptionIds.map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value as CardInstanceId;
  });
}

export function runnerInstalledTrashCandidatesForAccessEffect(
  host: AccessEffectHandlerHost,
  target: "program" | "hardware" | "daemon",
): CardInstanceId[] {
  const candidates =
    target === "hardware"
      ? host.state.runner.rig.hardware
      : host.state.runner.rig.programs;
  return candidates
    .filter((candidateId) => {
      const candidateDefinition = host.cards.definitionFor(candidateId);
      if (target === "hardware") return candidateDefinition.type === "hardware";
      if (candidateDefinition.type !== "program") return false;
      return (
        target === "program" ||
        host.cards.cardHasSubtype(candidateDefinition, "daemon")
      );
    })
    .slice()
    .sort((left, right) => {
      const leftDefinition = host.cards.definitionFor(left);
      const rightDefinition = host.cards.definitionFor(right);
      const byInstallCost =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      if (byInstallCost !== 0) return byInstallCost;
      const byMemory =
        (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
      if (byMemory !== 0) return byMemory;
      return left.localeCompare(right);
    });
}

export function trashInstalledRunnerHardwareAndProgramsForAccessEffect(
  host: AccessEffectHandlerHost,
  sourceDefinition: CardDefinition,
  hardwareAmount: "all",
  programAmount: number,
  resolvedEffects: ResolvedGameEffect[],
  effectIndex: number,
): void {
  const legalAction = requireLegalAction(host);
  const hardwareTargets =
    hardwareAmount === "all"
      ? runnerInstalledTrashCandidatesForAccessEffect(host, "hardware")
      : [];
  const programTargets = runnerInstalledTrashCandidatesForAccessEffect(
    host,
    "program",
  ).slice(0, Math.max(0, Math.floor(programAmount)));
  const selectedTargetIds = [...hardwareTargets, ...programTargets];
  if (selectedTargetIds.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneAction: "v1919_access_ambush_no_target",
      trashedCount: 0,
      hardwareTrashCount: 0,
      programTrashCount: 0,
      accessEffectNoTarget: true,
    };
    return;
  }
  if (
    host.trash.openRunnerInstalledTrashPreventionWindow(
      selectedTargetIds,
      sourceDefinition.id,
    )
  )
    return;
  for (const targetId of selectedTargetIds) {
    host.trash.trashRunnerInstalledCardToHeap(targetId);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    targetTrashCount: selectedTargetIds.length,
    trashedCount: selectedTargetIds.length,
    hardwareTrashCount: hardwareTargets.length,
    programTrashCount: programTargets.length,
  };
  resolvedEffects.push({
    effectId: `${sourceDefinition.id}.access_effect.${effectIndex}.trash_installed_runner_hardware_and_programs`,
    kind: "trash_card",
    visibility: "hidden_info_barrier",
    side: "runner",
    amount: selectedTargetIds.length,
    reason: "access_effect",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
  });
}

export function trashOtherCorpInstalledCardsInSourceServerAndDamageRunner(
  host: AccessEffectHandlerHost,
  sourceCardId: CardInstanceId,
  sourceDefinition: CardDefinition,
  damageType: Extract<DamageType, "net">,
  amountPerTrashed: 1,
  resolvedEffects: ResolvedGameEffect[],
  effectIndex: number,
): void {
  const legalAction = requireLegalAction(host);
  const sourceInstance = host.cards.mustInstance(sourceCardId);
  const serverId =
    sourceInstance.zone.side === "corp" &&
    (sourceInstance.zone.zone === "serverRoot" ||
      sourceInstance.zone.zone === "serverIce")
      ? sourceInstance.zone.serverId
      : undefined;
  if (!serverId) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      selfDestructSkippedReason: "source_not_installed_in_server",
    };
    return;
  }
  const server = host.state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Self-Destruct-Server fehlt.");
  const targetIds = [...server.root, ...server.ice]
    .filter((targetId) => targetId !== sourceCardId)
    .sort();
  if (targetIds.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      selfDestructSourceTapped: true,
      selfDestructTrashedCount: 0,
      damageAmount: 0,
    };
    host.cards.mustInstance(sourceCardId).tapped = true;
    return;
  }
  host.cards.mustInstance(sourceCardId).tapped = true;
  let trashedCount = 0;
  for (const targetId of targetIds) {
    const before = host.state.corp.archives.length;
    host.trash.trashCorpInstalledCardToArchives(targetId);
    if (host.state.corp.archives.length > before) trashedCount += 1;
  }
  const damageAmount = trashedCount * amountPerTrashed;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    selfDestructSourceTapped: true,
    selfDestructTrashedCount: trashedCount,
    damageType,
    damageAmount,
  };
  if (damageAmount > 0) {
    host.damage.resolveDamageOperation(
      damageType,
      damageAmount,
      sourceDefinition.id,
    );
  }
  resolvedEffects.push({
    effectId: `${sourceDefinition.id}.access_effect.${effectIndex}.trash_other_corp_installed_cards_in_source_server_and_damage_runner`,
    kind: "trash_card",
    visibility: "hidden_info_barrier",
    side: "corp",
    amount: trashedCount,
    reason: "access_effect",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
  });
  if (legalAction.payload?.damageResolved === true) {
    resolvedEffects.push({
      effectId: accessEffectId(
        sourceDefinition,
        sourceCardId,
        effectIndex,
        "self_destruct_damage",
      ),
      kind: "damage",
      visibility: "hidden_info_barrier",
      side: "runner",
      amount: Number(legalAction.payload.damageAmount ?? damageAmount),
      damageType,
      cardsTrashed: Number(legalAction.payload.cardsTrashed ?? 0),
      reason: "access_effect",
      sourceDefinitionId: sourceDefinition.id,
      sourceTitle: sourceDefinition.title,
    });
  }
}

export function trashRunnerInstalledTargetsForAccessEffect(
  host: AccessEffectHandlerHost,
  sourceDefinition: CardDefinition,
  target: "program" | "hardware" | "daemon",
  amount: number,
  resolvedEffects: ResolvedGameEffect[],
  effectIndex: number,
): void {
  const legalAction = requireLegalAction(host);
  const selectedTargetIds = runnerInstalledTrashCandidatesForAccessEffect(
    host,
    target,
  ).slice(0, amount);
  if (selectedTargetIds.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneAction: "v1919_access_ambush_no_target",
      targetTrashCount: amount,
      trashedCount: 0,
      trashedCardType: target,
      accessEffectNoTarget: true,
    };
    return;
  }
  const targetDefinitionIds = selectedTargetIds.map(
    (targetId) => host.cards.definitionFor(targetId).id,
  );
  if (
    host.trash.openRunnerInstalledTrashPreventionWindow(
      selectedTargetIds,
      sourceDefinition.id,
    )
  )
    return;
  for (const targetId of selectedTargetIds) {
    host.trash.trashRunnerInstalledCardToHeap(targetId);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    advancementCounterCount: amount,
    targetTrashCount: amount,
    trashedCount: selectedTargetIds.length,
    trashedCardDefinitionId: targetDefinitionIds[0] ?? "",
    trashedCardDefinitionIds: targetDefinitionIds.join(","),
    trashedCardType: target,
  };
  resolvedEffects.push({
    effectId: `${sourceDefinition.id}.access_effect.${effectIndex}.trash_installed_runner_cards`,
    kind: "trash_card",
    visibility: "hidden_info_barrier",
    side: "runner",
    amount: selectedTargetIds.length,
    reason: "access_effect",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    ...(targetDefinitionIds[0]
      ? { cardDefinitionId: targetDefinitionIds[0] }
      : {}),
  });
}
