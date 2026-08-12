import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { canFreeTrashCurrentAccessCard } from "./access-actions";
import { accessCountPayloadForBreach } from "./breach-state";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { credits } from "../state/economy-mutation";
import {
  accessFlowBreachStateHost,
  accessQueueZone,
  isBreachEntryHidden,
  mustRun,
  publicAccessOrigin,
  recordArchivesAutoAccess,
  revealAccessedCard,
  type AccessQueueZone,
  type BreachEntryStatus,
  type AccessExecutionResult,
  type AccessFlowHost,
} from "./access-flow-context";

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
      accessOrigin: publicAccessOrigin(breach.serverId, entry.zone),
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
    accessOrigin: publicAccessOrigin(server.id, accessQueueZone(server.id)),
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
  applyHqAccessExposeInstalledCorpCards(host, server.id, legalAction);
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

export function applyPrearrangedDropAgendaAccess(
  host: AccessFlowHost,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  if (definition.type !== "agenda") return;
  const effects = consumeRunnerDelayedAgendaAccessEffects(
    host.state,
    cardIdForAccess(host),
    "next_agenda_access_credit_gain",
  );
  if (effects.length === 0) return;
  const amount = effects.reduce((sum, effect) => sum + effect.amount, 0);
  const gain = credits(host.state, "runner", amount, {
    kind: "access_effect",
    reason: "next_agenda_access_credit_gain",
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    nextAgendaAccessCreditGainResolved: true,
    delayedEffectInstanceIds: effects
      .map((effect) => effect.effectInstanceId)
      .join(","),
    sourceDefinitionIds: effects
      .map((effect) => effect.sourceDefinitionId)
      .join(","),
    gainedCredits:
      Number(legalAction.payload?.gainedCredits ?? 0) + gain.creditedAmount,
    runnerCreditsAfter: gain.creditsAfter,
  };
}

export function applyPromisesPromisesAgendaAccess(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  if (definition.type !== "agenda") return;
  const effects = consumeRunnerDelayedAgendaAccessEffects(
    host.state,
    cardId,
    "next_agenda_access_agenda_point",
  );
  if (effects.length === 0) return;
  const amount = effects.reduce((sum, effect) => sum + effect.amount, 0);
  host.state.run = {
    ...mustRun(host),
    nextAgendaAccessAgendaPointBonus: {
      sourceEffectInstanceIds: effects.map((effect) => effect.effectInstanceId),
      sourceDefinitionIds: effects.map((effect) => effect.sourceDefinitionId),
      sourceTitles: effects.map((effect) => effect.sourceTitle),
      amount,
      cardId,
    },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    nextAgendaAccessAgendaPointConsumed: true,
    delayedEffectInstanceIds: effects
      .map((effect) => effect.effectInstanceId)
      .join(","),
    agendaPointBonusPending: amount,
  };
}

function consumeRunnerDelayedAgendaAccessEffects(
  state: GameState,
  cardId: CardInstanceId,
  kind: "next_agenda_access_credit_gain" | "next_agenda_access_agenda_point",
): NonNullable<GameState["runnerDelayedEffectInstances"]> {
  const effects = state.runnerDelayedEffectInstances ?? [];
  const matches = effects.filter(
    (effect) =>
      !effect.consumed &&
      effect.kind === kind &&
      effect.trigger === "next_agenda_access" &&
      effect.expires === "runner_turn_end",
  );
  if (matches.length === 0) return [];
  const matchIds = new Set(matches.map((effect) => effect.effectInstanceId));
  state.runnerDelayedEffectInstances = effects.map((effect) =>
    matchIds.has(effect.effectInstanceId)
      ? { ...effect, consumed: true, consumedByCardId: cardId }
      : effect,
  );
  return matches;
}

function cardIdForAccess(host: AccessFlowHost): CardInstanceId {
  const cardId = host.state.run?.accessedCardId;
  if (!cardId) throw new Error("agenda_access_card_id_missing");
  return cardId;
}

export function applyHqAccessExposeInstalledCorpCards(
  host: AccessFlowHost,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction: LegalAction,
): void {
  if (serverId !== "hq") return;
  const sourceCardId = host.state.runner.rig.programs
    .slice()
    .sort()
    .find((cardId) => {
      const sourceDefinition = host.cards.definitionFor(cardId);
      return (
        cardImplementationForDefinitionId(sourceDefinition.id)
          ?.runnerUtilityLongtail?.kind ===
        "hq_access_expose_all_installed_corp_cards"
      );
    });
  if (!sourceCardId) return;

  const exposedCardIds = unrezzedInstalledCorpCardIds(host);
  if (exposedCardIds.length === 0) return;

  const existingDefinitionIds =
    typeof legalAction.payload?.publicRevealDefinitionIds === "string" &&
    legalAction.payload.publicRevealDefinitionIds.length > 0
      ? legalAction.payload.publicRevealDefinitionIds.split(",")
      : [];
  const existingTitles =
    typeof legalAction.payload?.publicRevealTitles === "string" &&
    legalAction.payload.publicRevealTitles.length > 0
      ? splitPublicRevealTitles(legalAction.payload.publicRevealTitles)
      : [];
  const existingLabels =
    typeof legalAction.payload?.exposedServerLabels === "string" &&
    legalAction.payload.exposedServerLabels.length > 0
      ? legalAction.payload.exposedServerLabels.split(",")
      : [];
  const existingExposedCardIds =
    typeof legalAction.payload?.exposedCardInstanceIds === "string" &&
    legalAction.payload.exposedCardInstanceIds.length > 0
      ? legalAction.payload.exposedCardInstanceIds.split(",")
      : [];
  const exposedDefinitions = exposedCardIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  const openedReviewChoice = !host.state.pendingChoice;
  if (openedReviewChoice) {
    host.state.pendingChoice = {
      choiceId: `p3_36_schematics_expose_installed_cards_review_${host.state.stateVersion + 1}`,
      side: "runner",
      source:
        `p3_36.expose_installed_cards_review:${exposedCardIds.join("|")}` +
        `:${sourceCardId}:${sourceDefinition.id}:${host.state.stateVersion + 1}`,
      prompt: "Installierte Korp-Karten ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: host.state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
    host.state.activeSide = "runner";
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    runnerUtilityAbility: "hq_access_expose_all_installed_corp_cards",
    effectSide: "runner",
    hiddenZoneBarrier: true,
    hiddenZoneAction: openedReviewChoice
      ? "schematics_search_engine_expose_installed_cards_review"
      : "schematics_search_engine_expose_installed_cards",
    publicRevealKind: "expose",
    sourceDefinitionId: sourceDefinition.id,
    sourceTitle: sourceDefinition.title,
    revealedCount:
      Math.max(0, Math.floor(Number(legalAction.payload?.revealedCount ?? 0))) +
      exposedDefinitions.length,
    publicRevealDefinitionIds: [
      ...existingDefinitionIds,
      ...exposedDefinitions.map((definition) => definition.id),
    ].join(","),
    publicRevealTitles: [
      ...existingTitles,
      ...exposedDefinitions.map((definition) => definition.title),
    ].join("||"),
    exposedServerLabels: [
      ...existingLabels,
      ...exposedCardIds.map((cardId) => installedCorpCardLabel(host, cardId)),
    ].join(","),
    exposedCardInstanceIds: [
      ...new Set([...existingExposedCardIds, ...exposedCardIds]),
    ].join(","),
  };
}

export function splitPublicRevealTitles(value: string): string[] {
  return value.includes("||") ? value.split("||") : value.split(",");
}

export function unrezzedInstalledCorpCardIds(
  host: AccessFlowHost,
): CardInstanceId[] {
  return host.state.corp.servers
    .flatMap((server) => [...server.root, ...server.ice])
    .filter((cardId) => host.state.cardInstances[cardId])
    .filter((cardId) => !host.cards.cardInstanceFor(cardId).rezzed)
    .sort();
}

export function installedCorpCardLabel(
  host: AccessFlowHost,
  cardId: CardInstanceId,
): string {
  const zone = host.cards.cardInstanceFor(cardId).zone;
  if (zone.side !== "corp") return "installed";
  if (zone.zone === "serverRoot") {
    const server = host.servers.mustServer(zone.serverId);
    return `${server.label ?? server.id} root`;
  }
  if (zone.zone === "serverIce") {
    const server = host.servers.mustServer(zone.serverId);
    const index = server.ice.indexOf(cardId);
    return `${server.label ?? server.id} ICE ${index + 1}`;
  }
  return "installed";
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
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      serverId: breach.serverId,
      breachId: breach.breachId,
      accessIndex: breach.currentIndex,
      accessOrigin: publicAccessOrigin(breach.serverId, current.zone),
    };
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
    if (
      host.run.startPostAccessInstalledProgramChoice(completedRun, legalAction)
    )
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
    if (
      host.effects.archivesAccessRequiresDecisionOrEffect(
        current.cardInstanceId,
      )
    )
      break;

    queue = queue.map((entry, index) =>
      index === currentIndex
        ? { ...entry, status: "accessed" as const }
        : entry,
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

export function markV1915InstalledRevealAccess(
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

export function resolveAmbushOnAccessFoundation(
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
