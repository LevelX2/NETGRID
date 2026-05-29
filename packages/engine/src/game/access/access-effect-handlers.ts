import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  ChoiceRequest,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
} from "@netgrid/shared";
import type {
  CardAccessEffectImplementation,
  CardAccessEffectStepImplementation,
  CardAccessZone,
  CardTraceSuccessEffectImplementation,
} from "../../ability-engine/definition-types";

type DamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

type AccessPayload = Record<string, string | number | boolean>;

type AccessEffectDefinitionIds = {
  setup: CardDefinitionId;
  trap: CardDefinitionId;
  crybaby: CardDefinitionId;
  dedicatedResponseTeam: CardDefinitionId;
  dieterEsslin: CardDefinitionId;
  turbeauDelacroix: CardDefinitionId;
  corprunnersShatteredRemains: CardDefinitionId;
  experimentalAi: CardDefinitionId;
  vacantSoulkiller: CardDefinitionId;
  virusTestSite: CardDefinitionId;
  bizarreEncryptionScheme: CardDefinitionId;
  chimera: CardDefinitionId;
};

export type AccessEffectHandlerHost = {
  state: GameState;
  legalAction?: LegalAction;
  definitions: AccessEffectDefinitionIds;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    accessEffectsForDefinition: (
      definitionId: CardDefinitionId,
    ) => readonly CardAccessEffectImplementation[];
  };
  damage: {
    resolveDamageOperation: (
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    doDamage: (
      damageId: string,
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => DamageSummary;
    setDamagePayload: (summary: DamageSummary) => void;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
  };
  trace: {
    startTraceFromOperation: (
      sourceDefinitionId: CardDefinitionId,
      baseTraceStrength: number,
      successEffect?: unknown,
    ) => void;
    traceSuccessEffectForCardImplementation: (
      effects: readonly CardTraceSuccessEffectImplementation[],
    ) => unknown;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: string) => number;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
    addCounterToAllInstalledRunnerIcebreakers: (
      counterType: CounterType,
      amount: number,
    ) => {
      amount: number;
      counterType: CounterType;
      countersAfter: number;
      publicPayload: Record<string, string | number | boolean>;
    };
  };
  corpCards: {
    shuffleCorpCardIntoRd: (
      cardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
    ) => { publicPayload: Record<string, string | number | boolean> };
  };
  runnerCards: {
    returnInstalledProgramsToGrip: (cardIds: readonly CardInstanceId[]) => {
      publicPayload: Record<string, string | number | boolean>;
    };
  };
  payment: {
    spendCorpCredits: (amount: number) => void;
  };
  trash: {
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
    openRunnerInstalledTrashPreventionWindow: (
      targetIds: CardInstanceId[],
      sourceDefinitionId: CardDefinitionId,
    ) => boolean;
  };
};

export type AccessEffectHandlerResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  accessedCardId?: CardInstanceId;
  accessZone?: CardAccessZone;
  deletePendingChoice?: boolean;
  damageType?: DamageType;
  damageAmount?: number;
  traceStarted?: boolean;
  paidCredits?: number;
  resolvedPayload?: AccessPayload;
  resolvedEffects?: ResolvedGameEffect[];
  stateChanged?: boolean;
};

export type AccessPaymentChoiceResult = AccessEffectHandlerResult & {
  deletePendingChoice?: boolean;
};

export function handleAccessEffectsForCard(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): AccessEffectHandlerResult {
  const beforePayload = host.legalAction?.payload;
  resolveCardImplementationAccessEffects(host, cardId);
  resolveAccessAmbushAssetEffect(host, cardId);
  resolveUpgradeAccessEffect(host, cardId);
  resolveAssetAccessEffect(host, cardId);
  resolveV199AccessEffect(host, cardId);
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
    throw new Error("Es ist keine CardImplementation-Access-Payment-Choice offen.");
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
  const effect = host.cards.accessEffectsForDefinition(definition.id)[effectIndex];
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
  executeCardImplementationAccessEffectSteps(host, sourceId, definition, effect);
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

export function resolveChimeraDaemonTrashChoice(
  host: AccessEffectHandlerHost,
  selectedOptionId: string,
): AccessEffectHandlerResult {
  const legalAction = requireLegalAction(host);
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v199.chimera_daemon_trash"))
    throw new Error("Es ist keine Chimera-Choice offen.");
  const [, sourceCardId = ""] = choice.source.split(":");
  if (
    !sourceCardId ||
    host.state.run?.accessedCardId !== sourceCardId ||
    !host.state.cardInstances[sourceCardId] ||
    host.state.cardInstances[sourceCardId]?.zone.zone === "archives" ||
    host.cards.definitionFor(sourceCardId as CardInstanceId).id !==
      host.definitions.chimera
  ) {
    throw new Error("Chimera ist nicht mehr die gueltige Access-Quelle.");
  }
  const option = choice.options.find((candidate) => candidate.id === selectedOptionId);
  const daemonId = typeof option?.value === "string" ? option.value : "";
  if (!daemonId || !host.state.runner.rig.programs.includes(daemonId))
    throw new Error("Der gewaehlte Daemon ist nicht installiert.");
  const definition = host.cards.definitionFor(daemonId as CardInstanceId);
  if (
    definition.type !== "program" ||
    !host.cards.cardHasSubtype(definition, "daemon")
  )
    throw new Error("Chimera darf nur einen Daemon trashen.");
  host.trash.trashRunnerInstalledCardToHeap(daemonId as CardInstanceId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    chimeraDaemonTrashed: true,
    chimeraDaemonDefinitionId: definition.id,
  };
  delete host.state.pendingChoice;
  return {
    handled: true,
    sourceCardId: sourceCardId as CardInstanceId,
    sourceDefinitionId: host.definitions.chimera,
    resolvedPayload: legalAction.payload as AccessPayload,
    deletePendingChoice: true,
    stateChanged: true,
  };
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
  const effect = host.cards.accessEffectsForDefinition(definition.id)[effectIndex];
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
      throw new Error("Das gewaehlte Runner-Programm ist nicht mehr installiert.");
  }
  const result = host.runnerCards.returnInstalledProgramsToGrip(selectedIds);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_return_installed_runner_programs_to_grip",
    accessEffectSourceDefinitionId: definition.id,
    ambushDefinitionId: definition.id,
    accessedFromZone: accessZone,
    advancementCounterCount: host.cards.mustInstance(sourceId).advancementCounters,
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

function cardHasImplementationAccessEffects(
  host: AccessEffectHandlerHost,
  definition: CardDefinition,
): boolean {
  return host.cards.accessEffectsForDefinition(definition.id).length > 0;
}

function cardImplementationAccessZone(
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

function accessConditionMet(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  condition: CardAccessEffectImplementation["condition"],
): boolean {
  if (!condition) return true;
  switch (condition.kind) {
    case "runner_is_tagged":
      return host.state.runner.tags > 0;
    case "source_has_advancement_counters":
      return host.cards.mustInstance(cardId).advancementCounters >= condition.minimum;
    case "source_has_hosted_credits":
      return host.counters.cardCounter(cardId, "bit") > 0;
    case "runner_attempted_run_last_turn":
      return (
        Math.max(0, Math.floor(host.state.runnerTurnFlags?.runAttemptsLastTurn ?? 0)) >=
        condition.minimumRuns
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

function accessEffectApplies(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  effect: CardAccessEffectImplementation,
  accessZone: CardAccessZone,
): boolean {
  return (
    effect.sourceZones.includes(accessZone) &&
    !(effect.ignoreIfAccessedFrom ?? []).includes(accessZone) &&
    accessConditionMet(host, cardId, effect.condition)
  );
}

function accessEffectHiddenZoneAction(
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
): string {
  if (
    effect.effects.some(
      (step) => step.kind === "add_runner_counter" && step.counterType === "crying",
    )
  )
    return "v1918_crybaby_access_counter";
  if (
    effect.effects.some(
      (step) =>
        step.kind === "add_runner_counter" &&
        step.counterType === "doppelganger_antibody",
    )
  )
    return "proteus_doppelganger_antibody_access_counter";
  if (
    effect.effects.some(
      (step) => step.kind === "add_counter_to_all_installed_runner_icebreakers",
    )
  )
    return "proteus_pattel_antibody_access_counters";
  if (effect.effects.some((step) => step.kind === "shuffle_source_into_corp_rd"))
    return "proteus_antibody_shuffle_into_rd";
  if (
    effect.effects.some(
      (step) => step.kind === "return_installed_runner_programs_to_grip",
    )
  )
    return "proteus_return_installed_runner_programs_to_grip";
  if (effect.effects.some((step) => step.kind === "trash_installed_runner_cards"))
    return "v1919_access_ambush_trash_installed";
  if (
    effect.effects.some(
      (step) => step.kind === "damage_from_source_advancement_counters",
    )
  )
    return "v1919_access_ambush_damage";
  if (definition.type === "upgrade") return "v1918_upgrade_access_ambush";
  if (effect.sourceZones.some((zone) => zone === "hq" || zone === "rd"))
    return "v1917_access_ambush";
  return "card_implementation_access_effect";
}

function setAccessEffectBasePayload(
  legalAction: LegalAction,
  definition: CardDefinition,
  accessZone: CardAccessZone,
  effect: CardAccessEffectImplementation,
): void {
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: accessEffectHiddenZoneAction(definition, effect),
    ambushDefinitionId: definition.id,
    accessEffectSourceDefinitionId: definition.id,
    accessedFromZone: accessZone,
    ...(effect.revealIfAccessedFrom?.includes(accessZone as "rd")
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
  };
}

function resolveCardImplementationAccessEffects(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const accessEffects = host.cards.accessEffectsForDefinition(definition.id);
  if (accessEffects.length === 0) return;
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
    setAccessEffectBasePayload(legalAction, definition, accessZone, effect);
    if ((effect.ignoreIfAccessedFrom ?? []).includes(accessZone)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ambushSkippedReason: accessZone,
      };
      continue;
    }
    if (!effect.sourceZones.includes(accessZone)) continue;
    if (!accessConditionMet(host, cardId, effect.condition)) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...(effect.condition?.kind === "runner_is_tagged"
          ? {
              tagConditionMet: false,
              damageSkippedReason: "runner_not_tagged",
            }
          : { accessEffectConditionMet: false }),
      };
      continue;
    }
    if (effect.cost?.kind === "corp_may_pay_credits") {
      startCardImplementationAccessPaymentChoice(host, cardId, effectIndex, accessZone, effect);
      continue;
    }
    executeCardImplementationAccessEffectSteps(host, cardId, definition, effect);
  }
}

function startCardImplementationAccessPaymentChoice(
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
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
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

function executeCardImplementationAccessEffectSteps(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
): void {
  const legalAction = requireLegalAction(host);
  const resolvedEffects: ResolvedGameEffect[] = [];
  for (const [index, step] of effect.effects.entries()) {
    executeCardImplementationAccessEffectStep(
      host,
      cardId,
      definition,
      effect,
      step,
      index,
      resolvedEffects,
    );
  }
  if (resolvedEffects.length > 0) {
    legalAction.resolvedEffects = [
      ...(legalAction.resolvedEffects ?? []),
      ...resolvedEffects,
    ];
  }
}

function accessEffectId(
  definition: CardDefinition,
  cardId: CardInstanceId,
  index: number,
  kind: string,
): string {
  return `${definition.id}.${sanitizeId(cardId)}.access_effect.${index}.${kind}`;
}

function executeCardImplementationAccessEffectStep(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  effect: CardAccessEffectImplementation,
  step: CardAccessEffectStepImplementation,
  index: number,
  resolvedEffects: ResolvedGameEffect[],
): void {
  const legalAction = requireLegalAction(host);
  switch (step.kind) {
    case "damage": {
      host.damage.resolveDamageOperation(step.damageType, step.amount, definition.id);
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
      host.damage.resolveDamageOperation(step.damageType, amount, definition.id);
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
        host.trace.traceSuccessEffectForCardImplementation(accessTraceStep.onSuccess),
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
      host.tags.addRunnerTagsWithPrevention(step.amount, definition.id);
      if (legalAction.payload?.eventModificationWindowOpened === true) return;
      resolvedEffects.push({
        effectId: accessEffectId(definition, cardId, index, "add_tags"),
        kind: "add_tags",
        visibility: step.visibility,
        side: "runner",
        amount: step.amount,
        reason: "access_effect",
        runnerTagsAfter: host.state.runner.tags,
        sourceDefinitionId: definition.id,
        sourceTitle: definition.title,
      });
      return;
    }
    case "add_runner_counter": {
      host.counters.addCardCounter(host.state.runner.identity, step.counterType, step.amount);
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
        ...(step.counterType === "doppelganger_antibody"
          ? {
              doppelgangerCountersAfter: remainingCounters,
            }
          : {}),
      };
      resolvedEffects.push({
        effectId: accessEffectId(definition, cardId, index, "add_runner_counter"),
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
      const result = host.corpCards.shuffleCorpCardIntoRd(cardId, definition.id);
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

function runnerInstalledProgramReturnCandidates(
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

function maxRunnerProgramReturnCount(
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

function startInstalledRunnerProgramReturnChoice(
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
    throw new Error("return_installed_runner_programs_to_grip supports only Corp choice.");
  const accessZone = cardImplementationAccessZone(host, cardId);
  const maxSelections = Math.min(
    maxRunnerProgramReturnCount(host, cardId, step),
    runnerInstalledProgramReturnCandidates(host).length,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    advancementCounterCount: host.cards.mustInstance(cardId).advancementCounters,
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

function selectedCardIdsFromChoice(
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
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value as CardInstanceId;
  });
}

function runnerInstalledTrashCandidatesForAccessEffect(
  host: AccessEffectHandlerHost,
  target: "program" | "hardware" | "daemon",
): CardInstanceId[] {
  const candidates =
    target === "hardware" ? host.state.runner.rig.hardware : host.state.runner.rig.programs;
  return candidates
    .filter((candidateId) => {
      const candidateDefinition = host.cards.definitionFor(candidateId);
      if (target === "hardware") return candidateDefinition.type === "hardware";
      if (candidateDefinition.type !== "program") return false;
      return target === "program" || host.cards.cardHasSubtype(candidateDefinition, "daemon");
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

function trashRunnerInstalledTargetsForAccessEffect(
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
    ...(targetDefinitionIds[0] ? { cardDefinitionId: targetDefinitionIds[0] } : {}),
  });
}

function resolveAccessAmbushAssetEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (definition.id !== ids.setup && definition.id !== ids.trap) return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.17-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    host.cards.mustInstance(cardId).zone.zone === "archives";
  if (accessedFromArchives) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_access_ambush",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }
  if (definition.id === ids.trap) host.state.runner.tags += 1;
  const damageAmount = definition.id === ids.setup ? 2 : 3;
  const summary = host.damage.doDamage(
    `v1917.ambush.${host.state.run!.runId}.${cardId}.${host.state.stateVersion + 1}`,
    "net",
    damageAmount,
    definition.id,
  );
  host.damage.setDamagePayload(summary);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1917_access_ambush",
    ambushDefinitionId: definition.id,
    damageAmount,
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
    ...(definition.id === ids.trap
      ? { tagsAdded: 1, runnerTagsAfter: host.state.runner.tags }
      : {}),
  };
}

function resolveUpgradeAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (
    definition.id !== ids.crybaby &&
    definition.id !== ids.dedicatedResponseTeam &&
    definition.id !== ids.dieterEsslin &&
    definition.id !== ids.turbeauDelacroix
  )
    return;
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.18-Upgrade-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  if (!host.cards.mustInstance(cardId).rezzed) return;
  if (cardHasImplementationAccessEffects(host, definition)) return;

  if (definition.id === ids.crybaby) {
    host.counters.addCardCounter(host.state.runner.identity, "crying", 1);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_crybaby_access_counter",
      ambushDefinitionId: definition.id,
      counterType: "crying",
      addedCounterAmount: 1,
      remainingCounters: host.counters.cardCounter(host.state.runner.identity, "crying"),
    };
    return;
  }

  if (definition.id === ids.turbeauDelacroix) {
    const run = host.state.run!;
    const serverId = run.attackedServerId;
    const consumed = run.turbeauAccessTraceConsumedByServer?.[serverId] ?? [];
    if (consumed.includes(cardId)) {
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
    host.trace.startTraceFromOperation(definition.id, 4);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: definition.id,
      oncePerRunConsumed: true,
      baseTraceStrength: 4,
      serverId,
    };
    return;
  }

  const damageType = definition.id === ids.dedicatedResponseTeam ? "meat" : "net";
  const damageAmount = definition.id === ids.dedicatedResponseTeam ? 3 : 1;
  const runnerTagsBefore = host.state.runner.tags;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
    ...(definition.id === ids.dedicatedResponseTeam
      ? { runnerTagsBefore, tagConditionMet: runnerTagsBefore >= 1 }
      : {}),
  };
  if (definition.id === ids.dedicatedResponseTeam && runnerTagsBefore < 1) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      damageSkippedReason: "runner_not_tagged",
    };
    return;
  }
  host.damage.resolveDamageOperation(damageType, damageAmount, definition.id);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_upgrade_access_ambush",
    ambushDefinitionId: definition.id,
    damageType,
    damageAmount,
  };
}

function resolveAssetAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  const ids = host.definitions;
  if (cardHasImplementationAccessEffects(host, definition)) return;
  if (
    definition.id !== ids.corprunnersShatteredRemains &&
    definition.id !== ids.experimentalAi &&
    definition.id !== ids.vacantSoulkiller &&
    definition.id !== ids.virusTestSite
  ) {
    return;
  }
  if (
    legalAction.side !== "runner" ||
    legalAction.type !== "access_card" ||
    host.state.run?.accessedCardId !== cardId
  ) {
    throw new Error(
      "V1.9.19-Asset-Ambush darf nur aus einem legalen Access-Fenster ausloesen.",
    );
  }
  const accessServerId = String(legalAction.payload?.serverId ?? "");
  const accessedFromArchives =
    accessServerId === "archives" ||
    host.cards.mustInstance(cardId).zone.zone === "archives";
  if (accessedFromArchives && definition.id === ids.virusTestSite) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_damage",
      ambushDefinitionId: definition.id,
      ambushSkippedReason: "archives",
    };
    return;
  }

  if (
    definition.id === ids.corprunnersShatteredRemains ||
    definition.id === ids.experimentalAi
  ) {
    resolveInstalledTrashAssetAccessEffect(host, cardId, definition);
    return;
  }

  const advancementCounterCount = Math.max(
    0,
    Math.floor(host.cards.mustInstance(cardId).advancementCounters),
  );
  const damageAmount =
    definition.id === ids.virusTestSite
      ? advancementCounterCount > 0
        ? advancementCounterCount * 2
        : 1
      : advancementCounterCount;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1919_access_ambush_damage",
    ambushDefinitionId: definition.id,
    advancementCounterCount,
    damageAmount,
    ...(accessServerId === "rd"
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionId: definition.id,
        }
      : {}),
  };
  if (damageAmount <= 0) return;
  const summary = host.damage.doDamage(
    `v1919.asset_access.${host.state.run!.runId}.${cardId}.${host.state.stateVersion + 1}`,
    definition.id === ids.vacantSoulkiller ? "core" : "net",
    damageAmount,
    definition.id,
  );
  host.damage.setDamagePayload(summary);
}

function resolveInstalledTrashAssetAccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const legalAction = requireLegalAction(host);
  const ids = host.definitions;
  const candidates =
    definition.id === ids.corprunnersShatteredRemains
      ? host.state.runner.rig.hardware
      : host.state.runner.rig.programs;
  const targetCardIds = candidates.slice().sort((left, right) => {
    const leftDefinition = host.cards.definitionFor(left);
    const rightDefinition = host.cards.definitionFor(right);
    const byInstallCost =
      (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
    return byInstallCost !== 0 ? byInstallCost : left.localeCompare(right);
  });
  const trashLimit = Math.max(
    0,
    host.cards.mustInstance(cardId).advancementCounters,
  );
  const selectedTargetIds = targetCardIds.slice(0, trashLimit);
  if (selectedTargetIds.length > 0) {
    const targetDefinitionIds = selectedTargetIds.map(
      (targetId) => host.cards.definitionFor(targetId).id,
    );
    for (const targetId of selectedTargetIds) {
      host.trash.trashRunnerInstalledCardToHeap(targetId);
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      trashedCount: selectedTargetIds.length,
      trashedCardDefinitionId: targetDefinitionIds[0] ?? "",
      trashedCardDefinitionIds: targetDefinitionIds.join(","),
    };
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1919_access_ambush_trash_installed",
    ambushDefinitionId: definition.id,
    advancementCounterCount: trashLimit,
    trashedCardType:
      definition.id === ids.corprunnersShatteredRemains ? "hardware" : "program",
    trashedCount: selectedTargetIds.length,
  };
  if (selectedTargetIds.length === 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1919_access_ambush_no_target",
      ambushDefinitionId: definition.id,
    };
  }
}

function resolveV199AccessEffect(
  host: AccessEffectHandlerHost,
  cardId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  const definition = host.cards.definitionFor(cardId);
  if (definition.id === host.definitions.bizarreEncryptionScheme && host.state.run) {
    host.state.run.bizarreEncryptionSchemeActive = true;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      bizarreEncryptionSchemeAccessed: true,
    };
  }
  if (
    definition.id === host.definitions.chimera &&
    !cardHasImplementationAccessEffects(host, definition)
  ) {
    startChimeraDaemonTrashChoice(host, cardId);
  }
}

function startChimeraDaemonTrashChoice(
  host: AccessEffectHandlerHost,
  chimeraId: CardInstanceId,
): void {
  const legalAction = requireLegalAction(host);
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = host.state.runner.rig.programs
    .filter((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return (
        definition.type === "program" &&
        host.cards.cardHasSubtype(definition, "daemon")
      );
    })
    .sort((left, right) => {
      const leftDefinition = host.cards.definitionFor(left);
      const rightDefinition = host.cards.definitionFor(right);
      const costCompare =
        (rightDefinition.installCost ?? 0) - (leftDefinition.installCost ?? 0);
      if (costCompare !== 0) return costCompare;
      const memoryCompare =
        (rightDefinition.memoryCost ?? 0) - (leftDefinition.memoryCost ?? 0);
      if (memoryCompare !== 0) return memoryCompare;
      return left.localeCompare(right);
    })
    .map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return {
        id: `card_${cardId}`,
        label: definition.title,
        publicLabel: "Daemon",
        value: cardId,
      };
    });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    chimeraAccessed: true,
    chimeraDaemonCandidateCount: options.length,
  };
  if (options.length === 0) return;
  host.state.pendingChoice = {
    choiceId: `v199_chimera_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v199.chimera_daemon_trash:${chimeraId}:${host.state.stateVersion + 1}`,
    prompt: "Daemon für Chimera trashen",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
}

function requireLegalAction(host: AccessEffectHandlerHost): LegalAction {
  if (!host.legalAction) throw new Error("LegalAction fehlt.");
  return host.legalAction;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
