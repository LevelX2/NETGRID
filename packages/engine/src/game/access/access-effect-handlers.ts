import type {
  CardInstanceId,
  ChoiceRequest,
  LegalAction,
} from "@netgrid/shared";
import {
  cardImplementationAccessZone,
  executeCardImplementationAccessEffectSteps,
  accessEffectApplies,
  accessEffectId,
  maxRunnerProgramReturnCount,
  runnerInstalledTrashCandidatesForAccessEffect,
  resolveCardImplementationAccessEffects,
  runnerInstalledProgramReturnCandidates,
  selectedCardIdsFromChoice,
  setAccessEffectBasePayload,
  trashInstalledRunnerHardwareAndProgramsForAccessEffect,
} from "./access-effect-execution";
import {
  requireLegalAction,
  type AccessPayload,
  type AccessEffectHandlerHost,
  type AccessEffectHandlerResult,
  type AccessPaymentChoiceResult,
} from "./access-effect-context";

export function handleAccessEffectsForCard(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): AccessEffectHandlerResult {
  const beforePayload = host.legalAction?.payload;
  const suspended = resolveCardImplementationAccessEffects(host, cardId);
  if (suspended) return accessEffectHandlerResult(host, cardId, beforePayload);
  return accessEffectHandlerResult(host, cardId, beforePayload);
}

export function accessEffectHandlerResult(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  beforePayload: LegalAction["payload"] | undefined,
): AccessEffectHandlerResult {
  const definition = host.cards.definitionFor(cardId);
  const payload = host.legalAction?.payload;
  const accessedCardId = host.state.run?.accessedCardId as
    | CardInstanceId
    | undefined;
  const result: AccessEffectHandlerResult = {
    handled: payload !== beforePayload,
    sourceCardId: cardId,
    sourceDefinitionId: definition.id,
    stateChanged: payload !== beforePayload,
    ...(accessedCardId ? { accessedCardId } : {}),
    ...(host.legalAction
      ? { accessZone: cardImplementationAccessZone(host, cardId) }
      : {}),
    ...(payload ? { resolvedPayload: payload as AccessPayload } : {}),
    ...(host.legalAction?.resolvedEffects
      ? { resolvedEffects: host.legalAction.resolvedEffects }
      : {}),
  };
  if (
    payload?.damageType === "net" ||
    payload?.damageType === "meat" ||
    payload?.damageType === "core"
  )
    result.damageType = payload.damageType;
  if (typeof payload?.damageAmount === "number")
    result.damageAmount = Number(payload.damageAmount);
  if (payload?.traceStarted === true) result.traceStarted = true;
  return result;
}

export function resolveAccessPaymentChoice(
  host: AccessEffectHandlerHost,
  selectedOptionId: string,
): AccessPaymentChoiceResult {
  const legalAction = requireLegalAction(host);
  const choice = host.state.pendingChoice;
  if (
    !choice ||
    (!choice.source.startsWith("p3_35.access_payment") &&
      !choice.source.startsWith("p3_35.access_activation"))
  )
    throw new Error(
      "Es ist keine CardImplementation-Access-Payment-Choice offen.",
    );
  const [, sourceCardId = "", effectIndexRaw = "", accessZoneRaw = ""] =
    choice.source.split(":");
  const effectIndex = Number(effectIndexRaw);
  if (
    !sourceCardId ||
    !host.state.cardInstances[sourceCardId] ||
    host.state.run?.accessedCardId !== sourceCardId ||
    !Number.isInteger(effectIndex) ||
    effectIndex < 0
  )
    throw new Error("Die Access-Payment-Choice ist nicht mehr gueltig.");
  const sourceId = sourceCardId as CardInstanceId;
  const definition = host.cards.definitionFor(sourceId);
  const effect = host.cards.accessEffectsForDefinition(definition.id)[
    effectIndex
  ];
  if (!effect?.cost)
    throw new Error("Die Access-Payment-Choice passt nicht zur Karte.");
  const accessZone = cardImplementationAccessZone(host, sourceId);
  if (
    accessZone !== accessZoneRaw ||
    !accessEffectApplies(host, sourceId, effect, accessZone)
  )
    throw new Error("Der Access-Payment-Kontext ist nicht mehr gueltig.");
  const useOption = effect.cost.kind === "corp_may_pay_credits" ? "pay" : "use";
  if (selectedOptionId !== useOption && selectedOptionId !== "decline")
    throw new Error("Die Access-Payment-Auswahl ist ungueltig.");
  setAccessEffectBasePayload(legalAction, definition, accessZone, effect);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(effect.cost.kind === "corp_may_pay_credits"
      ? { ambushPaymentAmount: effect.cost.amount }
      : {}),
  };
  if (selectedOptionId === "decline") {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ambushPaymentDeclined: true,
      ambushPaidCost: 0,
      corpCreditsAfter: host.state.corp.credits,
    };
    delete host.state.pendingChoice;
    return {
      handled: true,
      sourceCardId: sourceId,
      sourceDefinitionId: definition.id,
      accessZone,
      paidCredits: 0,
      deletePendingChoice: true,
      resolvedPayload: legalAction.payload as AccessPayload,
    };
  }
  if (effect.cost.kind === "corp_may_pay_credits") {
    if (host.state.corp.credits < effect.cost.amount)
      throw new Error("Die Korp kann die Access-Ambush-Kosten nicht bezahlen.");
    host.payment.spendCorpCredits(effect.cost.amount);
  } else {
    const source = host.cards.mustInstance(sourceId);
    if (effect.cost.kind === "tap_source" && source.tapped)
      throw new Error("Die Access-Ambush-Quelle ist bereits getappt.");
    if (effect.cost.kind === "tap_source") source.tapped = true;
    const sourceServerId =
      source.zone.side === "corp" &&
      (source.zone.zone === "serverRoot" || source.zone.zone === "serverIce")
        ? source.zone.serverId
        : undefined;
    if (effect.cost.kind === "trash_source")
      host.trash.trashCorpInstalledCardToArchives(sourceId);
    if (sourceServerId) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        accessEffectSourceServerId: sourceServerId,
      };
    }
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(effect.cost.kind === "corp_may_pay_credits"
      ? { ambushPaidCost: effect.cost.amount }
      : effect.cost.kind === "tap_source"
        ? { accessEffectSourceTapped: true }
        : { accessEffectSourceTrashed: true }),
    corpCreditsAfter: host.state.corp.credits,
  };
  delete host.state.pendingChoice;
  executeCardImplementationAccessEffectSteps(
    host,
    sourceId,
    definition,
    effect,
    effectIndex,
  );
  return {
    handled: true,
    sourceCardId: sourceId,
    sourceDefinitionId: definition.id,
    accessZone,
    paidCredits:
      effect.cost.kind === "corp_may_pay_credits" ? effect.cost.amount : 0,
    deletePendingChoice: true,
    resolvedPayload: legalAction.payload as AccessPayload,
    ...(host.legalAction?.resolvedEffects
      ? { resolvedEffects: host.legalAction.resolvedEffects }
      : {}),
  };
}

export function resumeAccessEffectAfterTagPrevention(
  host: AccessEffectHandlerHost,
): void {
  const legalAction = requireLegalAction(host);
  const continuation = host.state.pendingAddTagContinuation;
  if (!continuation || continuation.kind !== "access_effect")
    throw new Error("Es ist keine Access-Tag-Fortsetzung offen.");
  if (
    host.state.pendingChoice ||
    host.state.eventModificationWindow ||
    host.state.run?.accessedCardId !== continuation.sourceCardId
  )
    throw new Error("Der Access-Tag-Kontext ist nicht mehr gueltig.");
  const definition = host.cards.definitionFor(continuation.sourceCardId);
  const effect = host.cards.accessEffectsForDefinition(definition.id)[
    continuation.effectIndex
  ];
  const accessZone = cardImplementationAccessZone(
    host,
    continuation.sourceCardId,
  );
  if (
    !effect ||
    accessZone !== continuation.accessZone ||
    !effect.sourceZones.includes(accessZone) ||
    (effect.ignoreIfAccessedFrom ?? []).includes(accessZone)
  )
    throw new Error("Die Access-Tag-Fortsetzung ist veraltet.");
  const tagStep = effect.effects[continuation.tagStepIndex];
  if (!tagStep || tagStep.kind !== "add_tags")
    throw new Error("Die Access-Tag-Fortsetzung passt nicht zur Karte.");

  delete host.state.pendingAddTagContinuation;
  setAccessEffectBasePayload(
    legalAction,
    definition,
    accessZone,
    effect,
    false,
  );
  const tagsAdded = Math.max(
    0,
    host.state.runner.tags - continuation.runnerTagsBefore,
  );
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: accessEffectId(
        definition,
        continuation.sourceCardId,
        continuation.tagStepIndex,
        "add_tags",
      ),
      kind: "add_tags",
      visibility: tagStep.visibility,
      side: "runner",
      amount: tagsAdded,
      reason: "access_effect",
      runnerTagsAfter: host.state.runner.tags,
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
    },
  ];
  if (host.state.winner) return;
  executeCardImplementationAccessEffectSteps(
    host,
    continuation.sourceCardId,
    definition,
    effect,
    continuation.effectIndex,
    continuation.nextStepIndex,
  );
}

export function resumeAccessEffectAfterDamagePrevention(
  host: AccessEffectHandlerHost,
): void {
  const legalAction = requireLegalAction(host);
  const continuation = host.state.pendingAccessEffectDamageContinuation;
  if (!continuation)
    throw new Error("Es ist keine Access-Damage-Fortsetzung offen.");
  if (
    host.state.pendingChoice ||
    host.state.replacementWindow ||
    host.state.eventModificationWindow ||
    host.state.run?.accessedCardId !== continuation.sourceCardId
  )
    throw new Error("Der Access-Damage-Kontext ist nicht mehr gültig.");
  const definition = host.cards.definitionFor(continuation.sourceCardId);
  const effect = host.cards.accessEffectsForDefinition(definition.id)[
    continuation.effectIndex
  ];
  const accessZone = cardImplementationAccessZone(
    host,
    continuation.sourceCardId,
  );
  const damageStep = effect?.effects[continuation.damageStepIndex];
  if (
    !effect ||
    accessZone !== continuation.accessZone ||
    !effect.sourceZones.includes(accessZone) ||
    (effect.ignoreIfAccessedFrom ?? []).includes(accessZone) ||
    (damageStep?.kind !== "damage" &&
      damageStep?.kind !== "damage_from_source_advancement_counters")
  )
    throw new Error("Die Access-Damage-Fortsetzung ist veraltet.");

  delete host.state.pendingAccessEffectDamageContinuation;
  setAccessEffectBasePayload(
    legalAction,
    definition,
    accessZone,
    effect,
    false,
  );
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    {
      effectId: accessEffectId(
        definition,
        continuation.sourceCardId,
        continuation.damageStepIndex,
        damageStep.kind,
      ),
      kind: "damage",
      visibility: damageStep.visibility,
      side: "runner",
      amount: Number(legalAction.payload?.damageAmount ?? 0),
      damageType: damageStep.damageType,
      cardsTrashed: Number(legalAction.payload?.cardsTrashed ?? 0),
      reason: "access_effect",
      sourceDefinitionId: definition.id,
      sourceTitle: definition.title,
    },
  ];
  if (host.state.winner) return;
  executeCardImplementationAccessEffectSteps(
    host,
    continuation.sourceCardId,
    definition,
    effect,
    continuation.effectIndex,
    continuation.nextStepIndex,
  );
}

export function resolveAccessInstalledRunnerProgramReturnChoice(
  host: AccessEffectHandlerHost,
  selectedOptionIds: readonly string[],
): AccessEffectHandlerResult {
  const legalAction = requireLegalAction(host);
  const choice = host.state.pendingChoice;
  if (choice?.source.startsWith("classic.shock_treatment_programs"))
    return resolveShockTreatmentProgramChoice(host, selectedOptionIds);
  if (!choice || !choice.source.startsWith("proteus.return_runner_programs"))
    throw new Error("Es ist keine Runner-Program-Return-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf diese Access-Choice resolven.");
  const [, sourceCardId = "", effectIndexRaw = "", accessZoneRaw = ""] =
    choice.source.split(":");
  const effectIndex = Number(effectIndexRaw);
  if (
    !sourceCardId ||
    host.state.run?.accessedCardId !== sourceCardId ||
    !Number.isInteger(effectIndex) ||
    effectIndex < 0
  )
    throw new Error("Die Runner-Program-Return-Choice ist nicht mehr gueltig.");
  const sourceId = sourceCardId as CardInstanceId;
  const definition = host.cards.definitionFor(sourceId);
  const effect = host.cards.accessEffectsForDefinition(definition.id)[
    effectIndex
  ];
  const accessZone = cardImplementationAccessZone(host, sourceId);
  if (
    accessZone !== accessZoneRaw ||
    !effect ||
    !accessEffectApplies(host, sourceId, effect, accessZone)
  )
    throw new Error("Der Access-Return-Kontext ist nicht mehr gueltig.");
  const returnStep = effect.effects.find(
    (step) => step.kind === "return_installed_runner_programs_to_grip",
  );
  if (!returnStep)
    throw new Error("Die Access-Choice passt nicht zur Kartenimplementierung.");
  const selectedIds = selectedCardIdsFromChoice(choice, selectedOptionIds);
  const maxSelections = maxRunnerProgramReturnCount(host, sourceId, returnStep);
  if (selectedIds.length > maxSelections)
    throw new Error("Zu viele Runner-Programme gewaehlt.");
  for (const selectedId of selectedIds) {
    if (!runnerInstalledProgramReturnCandidates(host).includes(selectedId))
      throw new Error(
        "Das gewaehlte Runner-Programm ist nicht mehr installiert.",
      );
  }
  const result = host.runnerCards.returnInstalledProgramsToGrip(selectedIds);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_return_installed_runner_programs_to_grip",
    accessEffectSourceDefinitionId: definition.id,
    ambushDefinitionId: definition.id,
    accessedFromZone: accessZone,
    advancementCounterCount:
      host.cards.mustInstance(sourceId).advancementCounters,
    maxReturnedProgramCount: maxSelections,
    ...result.publicPayload,
  };
  delete host.state.pendingChoice;
  return {
    handled: true,
    sourceCardId: sourceId,
    sourceDefinitionId: definition.id,
    accessZone,
    deletePendingChoice: true,
    resolvedPayload: legalAction.payload as AccessPayload,
    stateChanged: true,
  };
}

export function resolveShockTreatmentProgramChoice(
  host: AccessEffectHandlerHost,
  selectedOptionIds: readonly string[],
): AccessEffectHandlerResult {
  const legalAction = requireLegalAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("classic.shock_treatment_programs"))
    throw new Error("Es ist keine Shock-Treatment-Programm-Choice offen.");
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Shock-Treatment-Ziele wählen.");
  const [, sourceCardId = "", effectIndexRaw = "", accessZoneRaw = ""] =
    choice.source.split(":");
  const effectIndex = Number(effectIndexRaw);
  if (
    !sourceCardId ||
    host.state.run?.accessedCardId !== sourceCardId ||
    !Number.isInteger(effectIndex) ||
    effectIndex < 0
  )
    throw new Error("Die Shock-Treatment-Choice ist nicht mehr gültig.");
  const sourceId = sourceCardId as CardInstanceId;
  const definition = host.cards.definitionFor(sourceId);
  const effect = host.cards.accessEffectsForDefinition(definition.id)[
    effectIndex
  ];
  const accessZone = cardImplementationAccessZone(host, sourceId);
  if (
    accessZone !== accessZoneRaw ||
    !effect ||
    !accessEffectApplies(host, sourceId, effect, accessZone)
  )
    throw new Error(
      "Der Shock-Treatment-Access-Kontext ist nicht mehr gültig.",
    );
  const step = effect.effects.find(
    (candidate) =>
      candidate.kind === "trash_installed_runner_hardware_and_programs",
  );
  if (!step || step.chooser !== "corp")
    throw new Error("Die Shock-Treatment-Choice passt nicht zur Karte.");
  const selectedIds = selectedCardIdsFromChoice(choice, selectedOptionIds);
  const candidates = runnerInstalledTrashCandidatesForAccessEffect(
    host,
    "program",
  );
  if (selectedIds.length !== Math.min(step.programAmount, candidates.length))
    throw new Error("Die falsche Anzahl Runner-Programme wurde gewählt.");
  for (const selectedId of selectedIds) {
    if (!candidates.includes(selectedId))
      throw new Error(
        "Das gewählte Runner-Programm ist nicht mehr installiert.",
      );
  }
  delete host.state.pendingChoice;
  trashInstalledRunnerHardwareAndProgramsForAccessEffect(
    host,
    definition,
    step.hardwareAmount,
    step.programAmount,
    legalAction.resolvedEffects ?? (legalAction.resolvedEffects = []),
    effectIndex,
    selectedIds,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    shockTreatmentProgramChoiceResolved: true,
    selectedProgramCount: selectedIds.length,
  };
  return {
    handled: true,
    sourceCardId: sourceId,
    sourceDefinitionId: definition.id,
    accessZone,
    deletePendingChoice: true,
    resolvedPayload: legalAction.payload as AccessPayload,
    stateChanged: true,
  };
}

export type {
  AccessEffectHandlerHost,
  AccessEffectHandlerResult,
  AccessPaymentChoiceResult,
} from "./access-effect-context";
