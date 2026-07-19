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
  resolveCardImplementationAccessEffects,
  runnerInstalledProgramReturnCandidates,
  selectedCardIdsFromChoice,
  setAccessEffectBasePayload,
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
  if (!choice || !choice.source.startsWith("p3_35.access_payment"))
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
  if (!effect?.cost || effect.cost.kind !== "corp_may_pay_credits")
    throw new Error("Die Access-Payment-Choice passt nicht zur Karte.");
  const accessZone = cardImplementationAccessZone(host, sourceId);
  if (
    accessZone !== accessZoneRaw ||
    !accessEffectApplies(host, sourceId, effect, accessZone)
  )
    throw new Error("Der Access-Payment-Kontext ist nicht mehr gueltig.");
  if (selectedOptionId !== "pay" && selectedOptionId !== "decline")
    throw new Error("Die Access-Payment-Auswahl ist ungueltig.");
  setAccessEffectBasePayload(legalAction, definition, accessZone, effect);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushPaymentAmount: effect.cost.amount,
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
  if (host.state.corp.credits < effect.cost.amount)
    throw new Error("Die Korp kann die Access-Ambush-Kosten nicht bezahlen.");
  host.payment.spendCorpCredits(effect.cost.amount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushPaidCost: effect.cost.amount,
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
    paidCredits: effect.cost.amount,
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

export type {
  AccessEffectHandlerHost,
  AccessEffectHandlerResult,
  AccessPaymentChoiceResult,
} from "./access-effect-context";
