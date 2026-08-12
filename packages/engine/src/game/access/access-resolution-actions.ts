import type {
  CardDefinition,
  CardInstanceId,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import {
  availableRunnerAccessTrashCredits,
  canFreeTrashCurrentAccessCard,
  effectiveAccessTrashCost,
  freeTrashAccessSourceForCurrentAccessCard,
} from "./access-actions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { quoteStealCostForAccessedAgenda } from "../../ability-engine/steal-cost-modifiers";
import { hiddenRunnerResourceRevealPayload } from "../damage/damage-core";
import {
  closeRunnerCostPenaltySupportWindowForPayment,
  openRunnerCostPenaltySupportWindow,
} from "../payment/runner-payment-support";
import { selectedChoiceIds } from "../choices/choice-validation";
import {
  buildRunnerProgramInstallMemoryChoice,
  resolveRunnerProgramInstallMemoryTrashSelection,
  runnerProgramInstallMemoryDeficit,
  RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX,
} from "../install/runner-program-install-memory";
import {
  accessCurrentCard,
  completeCurrentBreachAccess,
} from "./access-breach-lifecycle";
import {
  mustRun,
  resolvedPayloadFor,
  type ActiveRun,
  type AccessExecutionResult,
  type AccessFlowHost,
} from "./access-flow-context";

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
      if (
        legalAction.payload?.agendaAccessReplacement ===
        "install_as_runner_program"
      )
        return installAccessedAgendaAsRunnerProgram(
          host,
          host.state.run?.accessedCardId ?? "",
          legalAction,
        );
      const paidCredits = revalidateStealAgendaCost(host, legalAction);
      if (paidCredits > 0) {
        if (
          openRunnerCostPenaltySupportWindow(host.state, legalAction, {
            amount: paidCredits,
            availableWithoutSupport: host.state.runner.credits,
            context: "runner_access_trash",
          })
        )
          return { handled: true, stateChanged: true };
        closeRunnerCostPenaltySupportWindowForPayment(
          host.state,
          legalAction,
          paidCredits,
        );
      }
      host.payment.spendRunnerCredits(paidCredits);
      const result = stealAgenda(
        host,
        host.state.run?.accessedCardId ?? "",
        legalAction,
      );
      return { ...result, paidCredits };
    }
    case "trash_accessed_card":
      if (legalAction.payload?.hiddenResourceCurrentAccessTrash === true)
        return openMercenaryCurrentAccessTrashChoice(host, legalAction);
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

const MERCENARY_CURRENT_ACCESS_TRASH_CHOICE_PREFIX =
  "card_implementation.current_access_free_trash";

function mercenaryCurrentAccessEligibleCardIds(
  host: AccessFlowHost,
): CardInstanceId[] {
  const run = mustRun(host);
  const breach = run.breach;
  const candidates = breach
    ? breach.queue
        .filter(
          (entry, index) =>
            index <= breach.currentIndex &&
            (entry.status === "accessed" || entry.status === "declined"),
        )
        .map((entry) => entry.cardInstanceId)
    : run.accessedCardId
      ? [run.accessedCardId]
      : [];
  return [...new Set(candidates)].filter((cardId) => {
    const instance = host.state.cardInstances[cardId];
    return (
      instance?.zone.side === "corp" && instance.zone.zone !== "archives"
    );
  });
}

function openMercenaryCurrentAccessTrashChoice(
  host: AccessFlowHost,
  legalAction: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const sourceCardId = String(
    legalAction.payload?.hiddenResourceSourceCardId ?? "",
  ) as CardInstanceId;
  const sourceInstance = host.state.cardInstances[sourceCardId];
  if (
    !sourceInstance ||
    sourceInstance.controller !== "runner" ||
    !host.state.runner.rig.resources.includes(sourceCardId)
  )
    throw new Error("Die Mercenary-Subcontract-Quelle ist nicht installiert.");
  const sourceDefinition = host.cards.definitionFor(sourceCardId);
  const utility = cardImplementationForDefinitionId(sourceDefinition.id)
    ?.runnerUtilityLongtail;
  if (utility?.kind !== "hidden_resource_current_access_free_trash")
    throw new Error("Die Hidden-Resource-Faehigkeit passt nicht zur Quelle.");
  if (utility.cost.kind !== "credit_and_trash_source")
    throw new Error("Die Hidden-Resource-Kosten passen nicht zur Quelle.");
  const expectedCost = Math.max(0, Math.floor(utility.cost.amount));
  if ((legalAction.costs[0]?.credits ?? 0) !== expectedCost)
    throw new Error("Die Hidden-Resource-Kosten sind nicht mehr gueltig.");
  if (
    legalAction.payload?.accessTrashCostOverride !== 0 ||
    legalAction.payload?.freeAccessTrash !== true
  )
    throw new Error(
      "Der Hidden-Resource-Trash ist kein gueltiger kostenloser Trash.",
    );
  const eligibleCardIds = mercenaryCurrentAccessEligibleCardIds(host);
  if (eligibleCardIds.length === 0)
    throw new Error("Es gibt keine aktuell zugreifbare Karte fuer diese Faehigkeit.");
  if (
    expectedCost > 0 &&
    openRunnerCostPenaltySupportWindow(host.state, legalAction, {
      amount: expectedCost,
      availableWithoutSupport: host.state.runner.credits,
      context: "runner_access_trash",
    })
  )
    return { handled: true, stateChanged: true };
  if (host.state.runner.credits < expectedCost)
    throw new Error("Runner kann die Hidden-Resource-Kosten nicht bezahlen.");
  closeRunnerCostPenaltySupportWindowForPayment(
    host.state,
    legalAction,
    expectedCost,
  );
  host.payment.spendRunnerCredits(expectedCost);
  const revealPayload = hiddenRunnerResourceRevealPayload(
    host.state,
    sourceCardId,
  );
  host.zones.trashRunnerInstalledCardToHeap(sourceCardId);
  const choiceId = `current_access_free_trash_${host.state.stateVersion + 1}`;
  host.state.pendingChoice = {
    choiceId,
    side: "runner",
    source: `${MERCENARY_CURRENT_ACCESS_TRASH_CHOICE_PREFIX}:${run.runId}:${sourceCardId}:${sourceDefinition.id}`,
    prompt: "Eine oder mehrere aktuell zugreifbare Karten trashen",
    kind: "select_cards",
    options: eligibleCardIds.map((cardId) => ({
      id: cardId,
      label: host.cards.definitionFor(cardId).title,
      cardId,
    })),
    minSelections: 1,
    maxSelections: eligibleCardIds.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...revealPayload,
    choiceId,
    sourceTrashed: true,
    trashedCardDefinitionId: sourceDefinition.id,
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_hidden_current_access_free_trash_choice",
    currentAccessTrashCandidateCount: eligibleCardIds.length,
  };
  return {
    handled: true,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function resolveMercenaryCurrentAccessTrashChoice(
  host: AccessFlowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (
    !choice?.source.startsWith(
      `${MERCENARY_CURRENT_ACCESS_TRASH_CHOICE_PREFIX}:`,
    )
  )
    throw new Error("Die Current-Access-Trash-Choice ist nicht offen.");
  const [, runId, sourceCardId, sourceDefinitionId] = choice.source.split(":");
  const run = mustRun(host);
  if (run.runId !== runId)
    throw new Error("Die Current-Access-Trash-Choice gehoert zu einem anderen Run.");
  const sourceInstance = host.state.cardInstances[sourceCardId as CardInstanceId];
  if (
    !sourceInstance ||
    sourceInstance.definitionId !== sourceDefinitionId ||
    sourceInstance.zone.side !== "runner" ||
    sourceInstance.zone.zone !== "heap"
  )
    throw new Error("Die bezahlte Current-Access-Trash-Quelle ist ungueltig.");
  const selectedIds = selectedChoiceIds(playerAction.selectedChoices).map(
    (id) => id as CardInstanceId,
  );
  const eligibleIds = new Set(mercenaryCurrentAccessEligibleCardIds(host));
  if (selectedIds.some((cardId) => !eligibleIds.has(cardId)))
    throw new Error("Ein Current-Access-Trash-Ziel ist nicht mehr gueltig.");

  const currentCardId = run.accessedCardId;
  const priorSelectedIds = selectedIds.filter(
    (cardId) => cardId !== currentCardId,
  );
  if (run.breach && priorSelectedIds.length > 0) {
    const selectedSet = new Set(priorSelectedIds);
    run.breach = {
      ...run.breach,
      queue: run.breach.queue.map((entry) =>
        selectedSet.has(entry.cardInstanceId)
          ? { ...entry, status: "trashed" as const }
          : entry,
      ),
      accessedSummaries: run.breach.accessedSummaries.map((summary) => {
        const entry = run.breach?.queue.find(
          (candidate) => candidate.entryId === summary.entryId,
        );
        return entry && selectedSet.has(entry.cardInstanceId)
          ? { ...summary, status: "trashed" as const }
          : summary;
      }),
    };
  }

  const trashedDefinitionIds: string[] = [];
  for (const cardId of selectedIds) {
    const definition = host.cards.definitionFor(cardId);
    const instance = host.cards.cardInstanceFor(cardId);
    if (
      instance.zone.side === "corp" &&
      instance.zone.zone === "serverRoot" &&
      instance.zone.serverId === (run.breach?.serverId ?? run.attackedServerId)
    )
      host.steal.snapshotPersistentStealCostModifiersForSource(
        cardId,
        instance.zone.serverId,
        legalAction,
      );
    host.trash.trashCorpInstalledCardToArchives(cardId, legalAction);
    recordAccessTrashConsequences(host, cardId, definition);
    trashedDefinitionIds.push(definition.id);
  }
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "proteus_hidden_current_access_free_trash_resolved",
    currentAccessTrashCount: selectedIds.length,
    currentAccessTrashDefinitionIds: trashedDefinitionIds.join(","),
  };

  if (currentCardId && selectedIds.includes(currentCardId)) {
    completeCurrentBreachAccess(host, "trashed", legalAction);
    return;
  }
  host.state.activeSide = "runner";
}

export function revalidateStealAgendaCost(
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

export function stealAgenda(
  host: AccessFlowHost,
  cardId: string,
  legalAction?: LegalAction,
): AccessExecutionResult {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  const run = mustRun(host);
  attachAccessOriginPayload(legalAction, run);
  if (delayedAgendaAccessReplacementEffect(run)) {
    return delayAgendaAccessReplacementScore(
      host,
      cardId as CardInstanceId,
      legalAction,
    );
  }
  const flags = host.runner.ensureTurnFlags();
  flags.stoleAgendaThisTurn = true;
  flags.stolenAgendaAdvancementCountersThisTurn =
    Math.max(
      0,
      Math.floor(flags.stolenAgendaAdvancementCountersThisTurn ?? 0),
    ) +
    Math.max(
      0,
      Math.floor(
        host.cards.cardInstanceFor(cardId as CardInstanceId)
          .advancementCounters,
      ),
    );
  const definition = host.cards.definitionFor(cardId as CardInstanceId);
  if (host.cards.cardHasSubtype(definition, "research"))
    flags.stoleResearchAgendaThisTurn = true;
  if (host.cards.cardHasSubtype(definition, "gray_ops"))
    flags.stoleGrayOpsAgendaThisTurn = true;
  if (host.cards.cardHasSubtype(definition, "black_ops")) {
    flags.stoleBlackOpsAgendaThisTurn = true;
    if (host.state.run)
      host.state.run.liberatedBlackOpsAgendaCount =
        Math.max(
          0,
          Math.floor(host.state.run.liberatedBlackOpsAgendaCount ?? 0),
        ) + 1;
  }
  applyPendingAgendaPointBonusToStolenAgenda(
    host,
    cardId as CardInstanceId,
    legalAction,
  );
  const agendaPointValue = host.steal.agendaPointsForScoredCard(
    cardId as CardInstanceId,
  );
  const agendaDebt = Math.max(
    0,
    Math.floor(host.state.runnerAgendaPointsToForfeit ?? 0),
  );
  host.zones.removeFromAllZones(cardId as CardInstanceId);
  let paidDebt = 0;
  if (agendaDebt > 0) {
    paidDebt = Math.min(agendaDebt, agendaPointValue);
    host.state.runnerAgendaPointsToForfeit = agendaDebt - paidDebt;
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        v1919RunnerEventAbility: "future_agenda_point_forfeit",
        futureAgendaPointForfeitPaid: paidDebt,
        futureAgendaPointForfeitPending: host.state.runnerAgendaPointsToForfeit,
        spentAgendaCardId: cardId,
      };
    }
  }
  flags.stolenAgendaIdsThisTurn = [
    ...new Set([
      ...(flags.stolenAgendaIdsThisTurn ?? []),
      cardId as CardInstanceId,
    ]),
  ];
  host.state.runner.scoreArea.push(cardId as CardInstanceId);
  host.state.cardInstances[cardId] = {
    ...host.cards.cardInstanceFor(cardId as CardInstanceId),
    faceup: true,
    rezzed: true,
    ...(paidDebt > 0
      ? {
          agendaPointsSpent:
            Math.max(
              0,
              Math.floor(
                host.cards.cardInstanceFor(cardId as CardInstanceId)
                  .agendaPointsSpent ?? 0,
              ),
            ) + paidDebt,
        }
      : {}),
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

export function installAccessedAgendaAsRunnerProgram(
  host: AccessFlowHost,
  cardId: string,
  legalAction: LegalAction,
): AccessExecutionResult {
  if (!cardId) throw new Error("Keine Agenda wird accessed.");
  const sourceCardId = cardId as CardInstanceId;
  const run = mustRun(host);
  attachAccessOriginPayload(legalAction, run);
  const definition = host.cards.definitionFor(sourceCardId);
  const replacement = cardImplementationForDefinitionId(
    definition.id,
  )?.agendaAccessReplacement;
  if (
    definition.type !== "agenda" ||
    replacement?.kind !== "install_as_runner_program" ||
    !replacement.scoreAsAgendaAction ||
    !replacement.removeFromGameOnLeavePlay
  )
    throw new Error(
      "Diese Agenda kann nicht als Runner-Programm installiert werden.",
    );
  const memoryCost = Math.max(0, Math.floor(replacement.memoryCost));
  if (
    Number(legalAction.payload?.installedRunnerProgramMemoryCost) !== memoryCost
  )
    throw new Error("Die Installationskosten passen nicht mehr zur Agenda.");
  const memoryDeficit = runnerProgramInstallMemoryDeficit({
    memoryUsed: host.state.runner.memoryUsed,
    targetMemoryCost: memoryCost,
    memoryLimit: host.state.runner.memoryLimit,
  });
  if (memoryDeficit > 0) {
    const trashableIds = host.state.runner.rig.programs.filter((cardId) =>
      host.cards.runnerProgramUsesMemory(cardId),
    );
    host.state.pendingChoice = buildRunnerProgramInstallMemoryChoice({
      stateVersion: host.state.stateVersion,
      kind: "access",
      targetCardId: sourceCardId,
      originalChoiceId: legalAction.actionId,
      originalChoiceSource: `access.agenda_install_as_runner_program:${sourceCardId}:${memoryCost}`,
      options: trashableIds.map((cardId) => ({
        id: `card_${cardId}`,
        label: host.cards.definitionFor(cardId).title,
        value: cardId,
      })),
    });
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      installDeferredForMemory: true,
      memoryToFree: memoryDeficit,
    };
    return { handled: true, stateChanged: true };
  }
  const instance = host.cards.cardInstanceFor(sourceCardId);
  host.zones.removeFromAllZones(sourceCardId);
  host.state.runner.rig.programs.push(sourceCardId);
  host.state.runner.memoryUsed += memoryCost;
  host.state.cardInstances[sourceCardId] = {
    ...instance,
    controller: "runner",
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
    installedAsRunnerProgram: {
      memoryCost,
      scoreAsAgendaAction: true,
      removeFromGameOnLeavePlay: true,
      originalType: "agenda",
    },
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    agendaAccessReplacement: "install_as_runner_program",
    installedAsRunnerProgram: true,
    installedRunnerProgramMemoryCost: memoryCost,
    runnerMemoryUsedAfter: host.state.runner.memoryUsed,
    sourceDefinitionId: definition.id,
  };
  if (host.state.run?.breach) {
    return {
      ...completeCurrentBreachAccess(host, "stolen", legalAction),
      accessedCardId: sourceCardId,
      ...resolvedPayloadFor(legalAction),
    };
  }
  host.run.finishRun(true, legalAction);
  return {
    handled: true,
    accessedCardId: sourceCardId,
    runFinished: true,
    accessFinished: true,
    ...resolvedPayloadFor(legalAction),
    stateChanged: true,
  };
}

export function resolveAccessProgramInstallMemoryChoice(
  host: AccessFlowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): AccessExecutionResult {
  const choice = host.state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith(
      `${RUNNER_PROGRAM_INSTALL_MEMORY_CHOICE_PREFIX}:access:`,
    )
  )
    throw new Error("Es ist keine Access-MU-Installationschoice offen.");
  const continuationTarget = choice.source.split(":")[2] as CardInstanceId;
  const targetDefinition = host.cards.definitionFor(continuationTarget);
  const replacement = cardImplementationForDefinitionId(
    targetDefinition.id,
  )?.agendaAccessReplacement;
  if (replacement?.kind !== "install_as_runner_program")
    throw new Error("Die Access-MU-Installationsquelle ist nicht mehr legal.");
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  const selection = resolveRunnerProgramInstallMemoryTrashSelection({
    choice,
    selectedOptionIds,
    installedProgramIds: host.state.runner.rig.programs,
    memoryUsed: host.state.runner.memoryUsed,
    targetMemoryCost: replacement.memoryCost,
    memoryLimit: host.state.runner.memoryLimit,
    memoryCostFor: (cardId) => host.cards.definitionFor(cardId).memoryCost ?? 0,
    usesMemory: (cardId) => host.cards.runnerProgramUsesMemory(cardId),
  });
  const trashedDefinitionIds = selection.trashCardIds.map(
    (cardId) => host.cards.definitionFor(cardId).id,
  );
  for (const cardId of selection.trashCardIds)
    host.zones.trashRunnerInstalledCardToHeap(cardId);
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    cardId: selection.continuation.targetCardId,
    agendaAccessReplacement: "install_as_runner_program",
    installedRunnerProgramMemoryCost: replacement.memoryCost,
  };
  const result = installAccessedAgendaAsRunnerProgram(
    host,
    selection.continuation.targetCardId,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    installDeferredForMemory: true,
    memoryFreed: selection.freedMemory,
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
  };
  return result;
}

export function applyPendingAgendaPointBonusToStolenAgenda(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  const bonus = host.state.run?.nextAgendaAccessAgendaPointBonus;
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
      nextAgendaAccessAgendaPointBonusAmount: bonus.amount,
      sourceDefinitionIds: bonus.sourceDefinitionIds.join(","),
      sourceTitles: bonus.sourceTitles.join(","),
      delayedEffectInstanceIds: bonus.sourceEffectInstanceIds.join(","),
    };
  }
}

export function delayedAgendaAccessReplacementEffect(
  run: ActiveRun,
):
  | Extract<
      NonNullable<ActiveRun["runDurationEffects"]>[number],
      { kind: "delayed_agenda_access_replacement" }
    >
  | undefined {
  return run.runDurationEffects?.find(
    (effect) => effect.kind === "delayed_agenda_access_replacement",
  );
}

export function delayAgendaAccessReplacementScore(
  host: AccessFlowHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const replacementEffect = delayedAgendaAccessReplacementEffect(run);
  if (!replacementEffect)
    throw new Error("Es ist kein verzögerter Agenda-Access-Effekt aktiv.");
  const definition = host.cards.definitionFor(cardId);
  if (definition.type !== "agenda")
    throw new Error(
      "Der verzögerte Access-Effekt kann nur Agenda-Scoring verzögern.",
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
  if (replacementEffect.serverId !== serverId)
    throw new Error("Der verzögerte Access-Effekt passt nicht zu diesem Fort.");
  const existing = host.state.delayedAccessEffects ?? [];
  if (!existing.some((entry) => entry.agendaId === cardId)) {
    host.state.delayedAccessEffects = [
      ...existing,
      {
        kind: "delayed_agenda_access_replacement",
        agendaId: cardId,
        serverId,
        sourceCardInstanceId: replacementEffect.sourceCardInstanceId,
        sourceDefinitionId: replacementEffect.sourceDefinitionId,
        resolveAt: "runner_start_turn",
      },
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

export function trashAccessedCard(
  host: AccessFlowHost,
  cardId: string,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = mustRun(host);
  const targetCardId = cardId as CardInstanceId;
  if (!cardId || run.accessedCardId !== targetCardId)
    throw new Error("Diese Karte wird aktuell nicht accessed.");
  attachAccessOriginPayload(legalAction, run);
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
    throw new Error(
      "Karten in Archives können beim Zugriff nicht getrasht werden.",
    );
  }
  const availableWithoutSupport = availableRunnerAccessTrashCredits(
    host.accessActions,
    cardId as CardInstanceId,
  );
  if (
    trashCost > 0 &&
    legalAction &&
    openRunnerCostPenaltySupportWindow(host.state, legalAction, {
      amount: trashCost,
      availableWithoutSupport,
      context: "runner_access_trash",
    })
  )
    return { handled: true, stateChanged: true };
  if (legalAction) {
    closeRunnerCostPenaltySupportWindowForPayment(
      host.state,
      legalAction,
      trashCost,
    );
  }
  const trashPayment = host.payment.spendRunnerAccessTrashCredits(
    trashCost,
    cardId as CardInstanceId,
  );
  if (legalAction && overrideCost === undefined) {
    const upgradeTrashRecurringCreditsSpent =
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
      ...(upgradeTrashRecurringCreditsSpent > 0
        ? {
            v1922RunnerProgramAbility: "upgrade_trash_recurring_credit",
            upgradeTrashRecurringCreditsSpent:
              upgradeTrashRecurringCreditsSpent,
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
  host.trash.trashCorpInstalledCardToArchives(
    cardId as CardInstanceId,
    legalAction,
  );
  recordAccessTrashConsequences(
    host,
    cardId as CardInstanceId,
    definition,
  );
  consumeAccessTrashCounters(host, definition, legalAction);
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

function recordAccessTrashConsequences(
  host: AccessFlowHost,
  _cardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const run = host.state.run;
  if (
    definition.type === "asset" &&
    host.cards.cardHasSubtype(definition, "node")
  )
    host.runner.ensureTurnFlags().trashedNodeThisTurn = true;
  if (host.cards.cardHasSubtype(definition, "advertisement")) {
    host.runner.ensureTurnFlags().trashedAdvertisementThisTurn = true;
    if (run)
      run.trashedAdvertisementCount =
        Math.max(0, Math.floor(run.trashedAdvertisementCount ?? 0)) + 1;
  }
  if (host.cards.cardHasSubtype(definition, "black_ops") && run)
    run.trashedBlackOpsCount =
      Math.max(0, Math.floor(run.trashedBlackOpsCount ?? 0)) + 1;
  if (host.cards.cardHasSubtype(definition, "transactions"))
    host.runner.ensureTurnFlags().trashedTransactionsThisTurn = true;
}

export function attachAccessOriginPayload(
  legalAction: LegalAction | undefined,
  run: ActiveRun,
): void {
  if (!legalAction) return;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    serverId:
      run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId,
  };
}

export function consumeAccessTrashCounters(
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

export function declineCurrentAccess(
  host: AccessFlowHost,
  legalAction?: LegalAction,
): AccessExecutionResult {
  const run = host.state.run;
  const cardId = run?.accessedCardId;
  if (run && cardId) {
    const definition = host.cards.definitionFor(cardId);
    const replacement = cardImplementationForDefinitionId(
      definition.id,
    )?.agendaAccessReplacement;
    const instance = host.cards.cardInstanceFor(cardId);
    const serverId = run.breach?.serverId ?? run.accessServerOverride ?? run.attackedServerId;
    if (
      replacement?.onDecline?.kind ===
        "score_if_still_installed_in_same_fort_at_runner_start" &&
      instance.zone.side === "corp" &&
      instance.zone.zone === "serverRoot" &&
      instance.zone.serverId === serverId
    ) {
      const delayed = host.state.delayedAccessEffects ?? [];
      if (!delayed.some((entry) => entry.agendaId === cardId)) {
        host.state.delayedAccessEffects = [
          ...delayed,
          {
            kind: "delayed_agenda_access_replacement",
            agendaId: cardId,
            serverId,
            sourceCardInstanceId: cardId,
            sourceDefinitionId: definition.id,
            resolveAt: "runner_start_turn",
          },
        ];
      }
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          agendaAccessReplacement: "declined_install_as_runner_program",
          delayedAgendaAccessScoreScheduled: true,
          sourceDefinitionId: definition.id,
          serverId,
        };
      }
    }
  }
  if (host.state.run?.breach) {
    return completeCurrentBreachAccess(host, "declined", legalAction);
  }
  host.run.finishRun(true, legalAction);
  return { handled: true, accessFinished: true, runFinished: true };
}
