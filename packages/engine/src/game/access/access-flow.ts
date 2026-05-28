import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
  SpecialZoneState,
} from "@netgrid/shared";
import {
  accessCountPayloadForBreach,
  type BreachStateHost,
} from "./breach-state";
import {
  canFreeTrashCurrentAccessCard,
  effectiveAccessTrashCost,
  freeTrashAccessSourceForCurrentAccessCard,
  type RunnerAccessActionHost,
} from "./access-actions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { quoteStealCostForAccessedAgenda } from "../../ability-engine/steal-cost-modifiers";
import { hiddenRunnerResourceRevealPayload } from "../damage/damage-core";

type ActiveRun = NonNullable<GameState["run"]>;
type ActiveBreach = NonNullable<ActiveRun["breach"]>;
type BreachEntryStatus = ActiveBreach["queue"][number]["status"];
type AccessQueueZone = ActiveBreach["queue"][number]["zone"];

export type AccessFlowHost = {
  state: GameState;
  accessActions: RunnerAccessActionHost;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
    randomHqAccess: () => CardInstanceId | undefined;
  };
  effects: {
    executeAccessEffects: (cardId: CardInstanceId, legalAction: LegalAction) => void;
    archivesAccessRequiresDecisionOrEffect: (cardId: CardInstanceId) => boolean;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    ensureSpecialZones: () => SpecialZoneState;
  };
  payment: {
    spendRunnerCredits: (amount: number) => void;
    spendRunnerAccessTrashCredits: (
      amount: number,
      accessedCardId: CardInstanceId,
    ) => { recurringSpent: number; runnerCreditsSpent: number };
  };
  steal: {
    agendaPointsForScoredCard: (cardId: CardInstanceId) => number;
    snapshotPersistentStealCostModifiersForSource: (
      cardId: CardInstanceId,
      serverId: Exclude<ServerId, "new_remote">,
      legalAction?: LegalAction,
    ) => void;
  };
  trash: {
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  run: {
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    startExpertScheduleAnalyzerPostAccessChoice: (
      run: ActiveRun,
      legalAction?: LegalAction,
    ) => boolean;
  };
  access: {
    installedRevealHelperCount: () => number;
  };
};

export type AccessExecutionResult = {
  handled: boolean;
  accessedCardId?: CardInstanceId;
  serverId?: Exclude<ServerId, "new_remote">;
  breachQueueAdvanced?: boolean;
  accessFinished?: boolean;
  runFinished?: boolean;
  stolenAgendaId?: CardInstanceId;
  trashedCardId?: CardInstanceId;
  paidCredits?: number;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
  stateChanged?: boolean;
};

export function handleAccessExecution(
  host: AccessFlowHost,
  legalAction: LegalAction,
): AccessExecutionResult {
  if (
    !host.state.run &&
    (legalAction.type === "access_card" ||
      legalAction.type === "steal_agenda" ||
      legalAction.type === "trash_accessed_card" ||
      legalAction.type === "decline_trash")
  ) {
    return { handled: false };
  }
  switch (legalAction.type) {
    case "access_card":
      return accessCurrentCard(host, legalAction);
    case "steal_agenda": {
      const paidCredits = revalidateStealAgendaCost(host, legalAction);
      host.payment.spendRunnerCredits(paidCredits);
      const result = stealAgenda(
        host,
        host.state.run?.accessedCardId ?? "",
        legalAction,
      );
      return { ...result, paidCredits };
    }
    case "trash_accessed_card":
      return trashAccessedCard(
        host,
        host.state.run?.accessedCardId ?? "",
        legalAction,
      );
    case "decline_trash":
      return declineCurrentAccess(host, legalAction);
    default:
      return { handled: false };
  }
}

function accessFlowBreachStateHost(host: AccessFlowHost): BreachStateHost {
  return {
    state: host.state,
    cards: {
      definitionFor: host.cards.definitionFor,
      cardInstanceFor: host.cards.cardInstanceFor,
    },
    servers: {
      mustServer: host.servers.mustServer,
    },
    rng: {
      nextRandom: () => 0,
    },
  };
}

export function accessCurrentCard(
  host: AccessFlowHost,
  legalAction: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  if (run.breach) {
    const breach = run.breach;
    const entry = breach.queue[breach.currentIndex];
    if (!entry || entry.status !== "pending") {
      host.run.finishRun(true, legalAction);
      return { handled: true, runFinished: true, accessFinished: true };
    }
    const cardId = entry.cardInstanceId;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessedCardId: cardId,
      serverId: breach.serverId,
      breachId: breach.breachId,
      accessIndex: breach.currentIndex,
      ...accessCountPayloadForBreach(accessFlowBreachStateHost(host), breach),
    };
    markV1915InstalledRevealAccess(host, entry, legalAction);
    const updatedQueue = breach.queue.map((candidate, index) =>
      index === breach.currentIndex
        ? { ...candidate, status: "accessed" as const }
        : candidate,
    );
    host.state.run = {
      ...run,
      accessedCardId: cardId,
      breach: {
        ...breach,
        queue: updatedQueue,
      },
    };
    revealAccessedCard(host, cardId);
    resolveAmbushOnAccessFoundation(host, cardId, legalAction);
    host.effects.executeAccessEffects(cardId, legalAction);
    const definition = host.cards.definitionFor(cardId);
    applyPrearrangedDropAgendaAccess(host, definition, legalAction);
    applyPromisesPromisesAgendaAccess(host, cardId, definition, legalAction);
    const freeTrashAccess = canFreeTrashCurrentAccessCard(
      host.accessActions,
      run,
      definition,
    );
    if (
      definition.type !== "agenda" &&
      definition.type !== "asset" &&
      definition.type !== "upgrade" &&
      !freeTrashAccess
    ) {
      const completeResult = completeCurrentBreachAccess(
        host,
        "accessed",
        legalAction,
      );
      return {
        ...completeResult,
        accessedCardId: cardId,
        serverId: breach.serverId,
        resolvedPayload: legalAction.payload,
        stateChanged: true,
      };
    }
    return {
      handled: true,
      accessedCardId: cardId,
      serverId: breach.serverId,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }
  const server = host.servers.mustServer(run.attackedServerId);
  let cardId: CardInstanceId | undefined;
  if (server.id === "rd") cardId = host.state.corp.rd[0];
  else if (server.id === "hq") cardId = host.servers.randomHqAccess();
  else if (server.id === "archives") cardId = host.state.corp.archives[0];
  else cardId = server.root[0];
  if (!cardId) {
    host.run.finishRun(true, legalAction);
    return { handled: true, runFinished: true, accessFinished: true };
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    accessedCardId: cardId,
    serverId: server.id,
  };
  markV1915InstalledRevealAccess(
    host,
    {
      hiddenInfo: isBreachEntryHidden(host, cardId),
      zone: accessQueueZone(server.id),
    },
    legalAction,
  );
  host.state.run = { ...run, accessedCardId: cardId };
  revealAccessedCard(host, cardId);
  resolveAmbushOnAccessFoundation(host, cardId, legalAction);
  host.effects.executeAccessEffects(cardId, legalAction);
  const definition = host.cards.definitionFor(cardId);
  applyPrearrangedDropAgendaAccess(host, definition, legalAction);
  applyPromisesPromisesAgendaAccess(host, cardId, definition, legalAction);
  const freeTrashAccess = canFreeTrashCurrentAccessCard(
    host.accessActions,
    run,
    definition,
  );
  if (
    definition.type !== "agenda" &&
    definition.type !== "asset" &&
    definition.type !== "upgrade" &&
    !freeTrashAccess
  ) {
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessedCardId: cardId,
      serverId: server.id,
      runFinished: true,
      accessFinished: true,
      resolvedPayload: legalAction.payload,
      stateChanged: true,
    };
  }
  return {
    handled: true,
    accessedCardId: cardId,
    serverId: server.id,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

function applyPrearrangedDropAgendaAccess(
  host: AccessFlowHost,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  const flags = host.state.runnerTurnFlags;
  if (!flags?.prearrangedDropPending || definition.type !== "agenda") return;
  flags.prearrangedDropPending = false;
  host.state.runner.credits += 6;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    prearrangedDropResolved: true,
    gainedCredits: Number(legalAction.payload?.gainedCredits ?? 0) + 6,
    runnerCreditsAfter: host.state.runner.credits,
  };
}

function applyPromisesPromisesAgendaAccess(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  const flags = host.state.runnerTurnFlags;
  if (!flags?.promisesPromisesNextAgendaAccess || definition.type !== "agenda")
    return;
  flags.promisesPromisesNextAgendaAccess = false;
  host.state.run = {
    ...mustRun(host),
    promisesPromisesAgendaPointBonus: {
      sourceDefinitionId:
        flags.promisesPromisesSourceDefinitionId ??
        ("card_implementation" as CardDefinition["id"]),
      sourceTitle: flags.promisesPromisesSourceTitle ?? "Promises, Promises",
      amount: 1,
      cardId,
    },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    promisesPromisesConsumed: true,
    agendaPointBonusPending: 1,
  };
}

function revalidateStealAgendaCost(
  host: AccessFlowHost,
  legalAction: LegalAction,
): number {
  const run = mustRun(host);
  const accessedCardId = run.accessedCardId;
  if (!accessedCardId)
    throw new Error("Keine aktuell accessete Agenda zum Stehlen.");
  const definition = host.cards.definitionFor(accessedCardId);
  if (definition.type !== "agenda")
    throw new Error("Die aktuell accessete Karte ist keine Agenda.");
  const accessServerId =
    run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
  const quote = quoteStealCostForAccessedAgenda(
    host.state,
    accessServerId,
    definition,
  );
  const paidCredits = legalAction.costs[0]?.credits ?? 0;
  if (paidCredits !== quote.totalCost)
    throw new Error("Die Steal-Kosten sind nicht mehr gueltig.");
  if (host.state.runner.credits < paidCredits)
    throw new Error("Der Runner kann die Steal-Kosten nicht zahlen.");
  return paidCredits;
}

export function completeCurrentBreachAccess(
  host: AccessFlowHost,
  status: BreachEntryStatus,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const breach = run.breach;
  if (!breach) {
    host.run.finishRun(true, legalAction);
    return { handled: true, runFinished: true, accessFinished: true };
  }
  const current = breach.queue[breach.currentIndex];
  if (!current) {
    host.run.finishRun(true, legalAction);
    return { handled: true, runFinished: true, accessFinished: true };
  }
  const finalStatus: BreachEntryStatus =
    status === "pending" ? "accessed" : status;
  const queue = breach.queue.map((entry, index) =>
    index === breach.currentIndex ? { ...entry, status: finalStatus } : entry,
  );
  const nextIndex = queue.findIndex(
    (entry, index) => index > breach.currentIndex && entry.status === "pending",
  );
  const accessedSummaries = [
    ...breach.accessedSummaries,
    {
      entryId: current.entryId,
      status: finalStatus,
      cardDefinitionId: host.cards.definitionFor(current.cardInstanceId).id,
    },
  ];
  const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
  void _accessedCardId;
  if (nextIndex === -1) {
    const completedRun = {
      ...runWithoutAccessedCard,
      breach: {
        ...breach,
        queue,
        completed: true,
        accessedSummaries,
      },
    };
    host.state.run = completedRun;
    if (host.run.startExpertScheduleAnalyzerPostAccessChoice(completedRun, legalAction))
      return {
        handled: true,
        accessFinished: true,
        breachQueueAdvanced: true,
        stateChanged: true,
      };
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      runFinished: true,
      accessFinished: true,
      breachQueueAdvanced: true,
      stateChanged: true,
    };
  }
  host.state.run = {
    ...runWithoutAccessedCard,
    breach: {
      ...breach,
      queue,
      currentIndex: nextIndex,
      accessedSummaries,
    },
  };
  advanceArchivesBreachPastNonDecisionCards(host, legalAction);
  if (!host.state.run)
    return {
      handled: true,
      runFinished: true,
      accessFinished: true,
      breachQueueAdvanced: true,
      stateChanged: true,
    };
  host.state.timingPoint = "access.resolve_card";
  host.state.activeSide = "runner";
  return {
    handled: true,
    breachQueueAdvanced: true,
    stateChanged: true,
  };
}

function stealAgenda(
  host: AccessFlowHost,
  cardId: string,
  legalAction?: LegalAction,
): AccessExecutionResult {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  if (host.state.run?.bizarreEncryptionSchemeActive) {
    return delayBizarreEncryptionSchemeAgendaScore(
      host,
      cardId as CardInstanceId,
      legalAction,
    );
  }
  const flags = host.runner.ensureTurnFlags();
  flags.stoleAgendaThisTurn = true;
  flags.stolenAgendaAdvancementCountersThisTurn =
    Math.max(0, Math.floor(flags.stolenAgendaAdvancementCountersThisTurn ?? 0)) +
    Math.max(
      0,
      Math.floor(host.cards.cardInstanceFor(cardId as CardInstanceId).advancementCounters),
    );
  const definition = host.cards.definitionFor(cardId as CardInstanceId);
  if (host.cards.cardHasSubtype(definition, "research"))
    flags.stoleResearchAgendaThisTurn = true;
  if (host.cards.cardHasSubtype(definition, "gray_ops"))
    flags.stoleGrayOpsAgendaThisTurn = true;
  if (host.cards.cardHasSubtype(definition, "black_ops"))
    flags.stoleBlackOpsAgendaThisTurn = true;
  applyPendingAgendaPointBonusToStolenAgenda(host, cardId as CardInstanceId, legalAction);
  const agendaPointValue = host.steal.agendaPointsForScoredCard(
    cardId as CardInstanceId,
  );
  const agendaDebt = Math.max(
    0,
    Math.floor(host.state.runnerAgendaPointsToForfeit ?? 0),
  );
  host.zones.removeFromAllZones(cardId as CardInstanceId);
  if (agendaDebt > 0) {
    const paidDebt = Math.min(agendaDebt, agendaPointValue);
    host.state.runnerAgendaPointsToForfeit = agendaDebt - paidDebt;
    host.zones.ensureSpecialZones().removedFromGame.push(cardId as CardInstanceId);
    host.state.cardInstances[cardId] = {
      ...host.cards.cardInstanceFor(cardId as CardInstanceId),
      faceup: true,
      rezzed: true,
      zone: {
        side: "special",
        zone: "removed_from_game",
        visibility: "public",
      },
    };
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919RunnerEventAbility: "arasaka_owns_you_future_agenda_forfeit",
        futureAgendaPointForfeitPaid: paidDebt,
        futureAgendaPointForfeitPending: host.state.runnerAgendaPointsToForfeit,
        specialZone: "removed_from_game",
        specialZoneVisibility: "public",
        specialZoneReason: "v1919_arasaka_owns_you_future_agenda_forfeit",
      };
    }
    if (host.state.run?.breach) {
      return {
        ...completeCurrentBreachAccess(host, "stolen", legalAction),
        stolenAgendaId: cardId as CardInstanceId,
        ...resolvedPayloadFor(legalAction),
      };
    }
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      stolenAgendaId: cardId as CardInstanceId,
      runFinished: true,
      accessFinished: true,
      ...resolvedPayloadFor(legalAction),
      stateChanged: true,
    };
  }
  host.state.runner.scoreArea.push(cardId as CardInstanceId);
  host.state.cardInstances[cardId] = {
    ...host.cards.cardInstanceFor(cardId as CardInstanceId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  if (host.state.run?.breach) {
    return {
      ...completeCurrentBreachAccess(host, "stolen", legalAction),
      stolenAgendaId: cardId as CardInstanceId,
      ...resolvedPayloadFor(legalAction),
    };
  }
  host.run.finishRun(true, legalAction);
  return {
    handled: true,
    stolenAgendaId: cardId as CardInstanceId,
    runFinished: true,
    accessFinished: true,
    ...resolvedPayloadFor(legalAction),
    stateChanged: true,
  };
}

function applyPendingAgendaPointBonusToStolenAgenda(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  const bonus = host.state.run?.promisesPromisesAgendaPointBonus;
  if (!bonus || bonus.cardId !== cardId) return;
  const instance = host.cards.cardInstanceFor(cardId);
  const existing = Math.max(0, Math.floor(instance.counters?.agenda ?? 0));
  host.state.cardInstances[cardId] = {
    ...instance,
    counters: {
      ...(instance.counters ?? {}),
      agenda: existing + bonus.amount,
    },
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      promisesPromisesBonusAgendaPoints: bonus.amount,
      sourceDefinitionId: bonus.sourceDefinitionId,
      sourceTitle: bonus.sourceTitle,
    };
  }
}

function delayBizarreEncryptionSchemeAgendaScore(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const definition = host.cards.definitionFor(cardId);
  if (definition.type !== "agenda")
    throw new Error(
      "Bizarre Encryption Scheme kann nur Agenda-Scoring verzögern.",
    );
  const serverId = run.breach?.serverId ?? run.attackedServerId;
  const zone = host.cards.cardInstanceFor(cardId).zone;
  if (
    zone.side !== "corp" ||
    zone.zone !== "serverRoot" ||
    zone.serverId !== serverId
  ) {
    throw new Error("Die verzögerte Agenda liegt nicht im betroffenen Remote.");
  }
  const existing = host.state.bizarreEncryptionDelayedAgendas ?? [];
  if (!existing.some((entry) => entry.agendaId === cardId)) {
    host.state.bizarreEncryptionDelayedAgendas = [
      ...existing,
      { agendaId: cardId, serverId },
    ];
  }
  if (host.state.run?.breach) {
    return completeCurrentBreachAccess(host, "declined", legalAction);
  }
  host.run.finishRun(true, legalAction);
  return {
    handled: true,
    accessFinished: true,
    runFinished: true,
    stateChanged: true,
  };
}

function trashAccessedCard(
  host: AccessFlowHost,
  cardId: string,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const targetCardId = cardId as CardInstanceId;
  if (!cardId || run.accessedCardId !== targetCardId)
    throw new Error("Diese Karte wird aktuell nicht accessed.");
  const definition = host.cards.definitionFor(cardId as CardInstanceId);
  const rawOverride = legalAction?.payload?.accessTrashCostOverride;
  const overrideCost =
    typeof rawOverride === "number"
      ? Math.max(0, Math.floor(rawOverride))
      : undefined;
  const effectiveCost = effectiveAccessTrashCost(
    host.accessActions,
    cardId as CardInstanceId,
  );
  const trashCost = overrideCost ?? effectiveCost.totalCost;
  const sourceZone = host.cards.cardInstanceFor(cardId as CardInstanceId).zone;
  if (sourceZone.side === "corp" && sourceZone.zone === "archives") {
    throw new Error("Karten in Archives können beim Zugriff nicht getrasht werden.");
  }
  const hiddenResourceSourceCardId = String(
    legalAction?.payload?.hiddenResourceSourceCardId ?? "",
  ) as CardInstanceId;
  if (legalAction?.payload?.hiddenResourceCurrentAccessTrash === true) {
    if (definition.type === "agenda")
      throw new Error("Agendas koennen nicht als Hidden-Resource-Trash-Ziel gewaehlt werden.");
    const sourceInstance = host.state.cardInstances[hiddenResourceSourceCardId];
    if (
      !sourceInstance ||
      sourceInstance.controller !== "runner" ||
      !host.state.runner.rig.resources.includes(hiddenResourceSourceCardId)
    )
      throw new Error("Die Mercenary-Subcontract-Quelle ist nicht installiert.");
    if (sourceInstance.tapped === true)
      throw new Error("Die Mercenary-Subcontract-Quelle ist bereits getappt.");
    const sourceDefinition = host.cards.definitionFor(hiddenResourceSourceCardId);
    const utility =
      cardImplementationForDefinitionId(sourceDefinition.id)?.runnerUtilityLongtail;
    if (utility?.kind !== "hidden_resource_current_access_free_trash")
      throw new Error("Die Hidden-Resource-Faehigkeit passt nicht zur Quelle.");
    if (utility.cost.kind !== "credit_and_tap_source")
      throw new Error("Die Hidden-Resource-Kosten passen nicht zur Quelle.");
    const expectedCost = Math.max(0, Math.floor(utility.cost.amount));
    if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
      throw new Error("Die Hidden-Resource-Kosten sind nicht mehr gueltig.");
    if (overrideCost !== 0 || legalAction.payload?.freeAccessTrash !== true)
      throw new Error("Der Hidden-Resource-Trash ist kein gueltiger kostenloser Trash.");
    if (host.state.runner.credits < expectedCost)
      throw new Error("Runner kann die Hidden-Resource-Kosten nicht bezahlen.");
    host.payment.spendRunnerCredits(expectedCost);
    const revealPayload = hiddenRunnerResourceRevealPayload(
      host.state,
      hiddenResourceSourceCardId,
    );
    host.state.cardInstances[hiddenResourceSourceCardId] = {
      ...sourceInstance,
      faceup: true,
      rezzed: true,
      tapped: true,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...revealPayload,
      cardImplementationTapSourceCost: true,
      sourceTapped: true,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "proteus_hidden_current_access_free_trash",
    };
  }
  const trashPayment = host.payment.spendRunnerAccessTrashCredits(
    trashCost,
    cardId as CardInstanceId,
  );
  if (legalAction && overrideCost === undefined) {
    const scatterShotSpent =
      definition.type === "upgrade" ? trashPayment.recurringSpent : 0;
    const poltergeistSpent =
      definition.type === "asset" ? trashPayment.recurringSpent : 0;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessTrashBaseCost: effectiveCost.baseCost,
      accessTrashCostModifier: effectiveCost.modifier,
      accessTrashTotalCost: trashCost,
      ...(effectiveCost.sourceDefinitionIds.length > 0
        ? {
            accessTrashCostSourceDefinitionIds:
              effectiveCost.sourceDefinitionIds.join(","),
            accessTrashCostSourceTitles: effectiveCost.sourceTitles.join(","),
          }
        : {}),
      ...(scatterShotSpent > 0
        ? {
            v1922RunnerProgramAbility:
              "scatter_shot_upgrade_trash_recurring_credit",
            scatterShotRecurringCreditsSpent: scatterShotSpent,
            runnerCreditsSpent: trashPayment.runnerCreditsSpent,
          }
        : {}),
      ...(poltergeistSpent > 0
        ? {
            v1922RunnerProgramAbility:
              "poltergeist_node_trash_recurring_credit",
            poltergeistRecurringCreditsSpent: poltergeistSpent,
            runnerCreditsSpent: trashPayment.runnerCreditsSpent,
          }
        : {}),
    };
  }
  if (
    run &&
    sourceZone.side === "corp" &&
    sourceZone.zone === "serverRoot" &&
    sourceZone.serverId === (run.breach?.serverId ?? run.attackedServerId)
  ) {
    host.steal.snapshotPersistentStealCostModifiersForSource(
      cardId as CardInstanceId,
      sourceZone.serverId,
      legalAction,
    );
  }
  host.trash.trashCorpInstalledCardToArchives(cardId as CardInstanceId, legalAction);
  if (definition.type === "asset" && host.cards.cardHasSubtype(definition, "node")) {
    host.runner.ensureTurnFlags().trashedNodeThisTurn = true;
  }
  if (host.cards.cardHasSubtype(definition, "advertisement")) {
    host.runner.ensureTurnFlags().trashedAdvertisementThisTurn = true;
  }
  if (host.cards.cardHasSubtype(definition, "transactions")) {
    host.runner.ensureTurnFlags().trashedTransactionsThisTurn = true;
  }
  consumeProteusAccessTrashCounters(host, definition, legalAction);
  if (host.state.run?.breach) {
    return {
      ...completeCurrentBreachAccess(host, "trashed", legalAction),
      trashedCardId: cardId as CardInstanceId,
      ...resolvedPayloadFor(legalAction),
    };
  }
  host.run.finishRun(true, legalAction);
  return {
    handled: true,
    trashedCardId: cardId as CardInstanceId,
    accessFinished: true,
    runFinished: true,
    ...resolvedPayloadFor(legalAction),
    stateChanged: true,
  };
}

function consumeProteusAccessTrashCounters(
  host: AccessFlowHost,
  definition: CardDefinition,
  legalAction?: LegalAction,
): void {
  const run = host.state.run;
  if (!run || !legalAction?.payload?.freeAccessTrash) return;
  const source = freeTrashAccessSourceForCurrentAccessCard(
    host.accessActions,
    run,
    definition,
  );
  if (source.counterType !== "garbage") return;
  const corpCounters = host.state.purgeableRunnerVirusCounters?.corp;
  const before = Math.max(0, Math.floor(corpCounters?.garbage ?? 0));
  const spent = Math.min(2, before);
  if (!corpCounters || spent <= 0) return;
  const after = before - spent;
  if (after > 0) corpCounters.garbage = after;
  else delete corpCounters.garbage;
  if (
    Object.keys(corpCounters).length === 0 &&
    host.state.purgeableRunnerVirusCounters
  )
    delete host.state.purgeableRunnerVirusCounters.corp;
  if (
    host.state.purgeableRunnerVirusCounters &&
    !host.state.purgeableRunnerVirusCounters.corp &&
    !host.state.purgeableRunnerVirusCounters.servers &&
    !host.state.purgeableRunnerVirusCounters.effects
  )
    delete host.state.purgeableRunnerVirusCounters;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    proteusRunnerVirusFreeTrashCounterType: "garbage",
    garbageCountersSpent: spent,
    garbageCountersAfter: after,
  };
}

function declineCurrentAccess(
  host: AccessFlowHost,
  legalAction?: LegalAction,
): AccessExecutionResult {
  if (host.state.run?.breach) {
    return completeCurrentBreachAccess(host, "declined", legalAction);
  }
  host.run.finishRun(true, legalAction);
  return { handled: true, accessFinished: true, runFinished: true };
}

export function advanceArchivesBreachPastNonDecisionCards(
  host: AccessFlowHost,
  legalAction?: LegalAction,
): void {
  const run = host.state.run;
  const breach = run?.breach;
  if (!run || !breach || breach.serverId !== "archives" || breach.completed)
    return;

  let queue = breach.queue.slice();
  let currentIndex = breach.currentIndex;
  let accessedSummaries = breach.accessedSummaries.slice();
  let autoAccessedCount = 0;

  while (true) {
    const current = queue[currentIndex];
    if (!current || current.status !== "pending") break;
    if (host.effects.archivesAccessRequiresDecisionOrEffect(current.cardInstanceId))
      break;

    queue = queue.map((entry, index) =>
      index === currentIndex ? { ...entry, status: "accessed" as const } : entry,
    );
    accessedSummaries = [
      ...accessedSummaries,
      {
        entryId: current.entryId,
        status: "accessed" as const,
        cardDefinitionId: host.cards.definitionFor(current.cardInstanceId).id,
      },
    ];
    autoAccessedCount += 1;

    const nextIndex = queue.findIndex(
      (entry, index) => index > currentIndex && entry.status === "pending",
    );
    if (nextIndex === -1) {
      host.state.run = {
        ...run,
        breach: {
          ...breach,
          queue,
          completed: true,
          accessedSummaries,
        },
      };
      recordArchivesAutoAccess(legalAction, autoAccessedCount);
      host.run.finishRun(true, legalAction);
      return;
    }
    currentIndex = nextIndex;
  }

  if (autoAccessedCount === 0) return;
  host.state.run = {
    ...run,
    breach: {
      ...breach,
      queue,
      currentIndex,
      accessedSummaries,
    },
  };
  recordArchivesAutoAccess(legalAction, autoAccessedCount);
}

function markV1915InstalledRevealAccess(
  host: AccessFlowHost,
  entry: { hiddenInfo: boolean; zone: AccessQueueZone },
  legalAction: LegalAction,
): void {
  if (!entry.hiddenInfo || !["rd", "hq", "archives"].includes(entry.zone))
    return;
  const helperCount = host.access.installedRevealHelperCount();
  if (helperCount === 0) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1915_installed_access_reveal",
    revealHelperCount: helperCount,
  };
}

function resolveAmbushOnAccessFoundation(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const harness = host.state.ambushHarness;
  if (!harness?.enabled) return;
  const definition = host.cards.definitionFor(cardId);
  const triggered =
    !harness.triggerDefinitionId ||
    harness.triggerDefinitionId === definition.id;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "ambush_on_access_foundation",
    ambushFoundationChecked: true,
    ambushFoundationTriggered: triggered,
    ...(triggered ? { ambushFoundationDefinitionId: definition.id } : {}),
  };
}

function isBreachEntryHidden(
  host: AccessFlowHost,
  cardId: CardInstanceId,
): boolean {
  const instance = host.cards.cardInstanceFor(cardId);
  if (host.state.corp.archives.includes(cardId)) return !instance.faceup;
  return !instance.rezzed && !instance.faceup;
}

function accessQueueZone(
  serverId: Exclude<ServerId, "new_remote">,
): AccessQueueZone {
  if (serverId === "rd") return "rd";
  if (serverId === "hq") return "hq";
  if (serverId === "archives") return "archives";
  return "remote_root";
}

function revealAccessedCard(host: AccessFlowHost, cardId: CardInstanceId): void {
  const instance = host.cards.cardInstanceFor(cardId);
  host.state.cardInstances[cardId] = { ...instance, faceup: true };
}

function recordArchivesAutoAccess(
  legalAction: LegalAction | undefined,
  count: number,
): void {
  if (!legalAction || count <= 0) return;
  const previousCount =
    typeof legalAction.payload?.archivesAutoAccessedCount === "number"
      ? legalAction.payload.archivesAutoAccessedCount
      : 0;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    archivesAutoAccessedCount: previousCount + count,
  };
}

function resolvedPayloadFor(
  legalAction: LegalAction | undefined,
): Pick<AccessExecutionResult, "resolvedPayload"> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}

function mustRun(host: AccessFlowHost): ActiveRun {
  if (!host.state.run) throw new Error("Es laeuft kein Run.");
  return host.state.run;
}
