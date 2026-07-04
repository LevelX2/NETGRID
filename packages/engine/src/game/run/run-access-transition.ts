import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import {
  accessCountPayloadForBreach,
  buildBreachState,
  type BreachStateHost,
} from "../access/breach-state";

type ActiveRun = NonNullable<GameState["run"]>;
const GYPSY_RD_REVEAL_CHOICE_SOURCE = "successful_run.gypsy_rd_reveal";
const GYPSY_RD_REVEAL_NEXT_OPTION_ID = "reveal_next";
const GYPSY_RD_REVEAL_FINISH_OPTION_ID = "finish";

export type SuccessfulRunInterventionKind =
  | "temporary_hq_ice_encounter_after_successful_run"
  | "install_hq_ice_innermost_after_successful_run";

export type RunAccessTransitionHost = {
  state: GameState;
  breach: BreachStateHost;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
    awardEventAgendaPoint?: (
      sourceCardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      legalAction?: LegalAction,
    ) => void;
  };
  draw: {
    drawCorpCards: (count: number) => void;
  };
  trash?: {
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  rng: {
    shuffleStateIds: (
      ids: CardInstanceId[],
      purpose: string,
    ) => CardInstanceId[];
  };
  access: {
    hasHiddenResourceAccessStartActions: (
      run: ActiveRun,
      serverId: Exclude<ServerId, "new_remote">,
    ) => boolean;
    advanceArchivesBreachPastNonDecisionCards: (
      legalAction?: LegalAction,
    ) => void;
    findPreAccessTopRdReorderSource: (
      run: ActiveRun,
    ) => CardInstanceId | undefined;
    isPreAccessTopRdReorderSource: (cardId: CardInstanceId) => boolean;
    startRunnerPrivateLookChoice: (
      sourceCardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      zone: Extract<ServerId, "rd" | "hq">,
      count: number | "all",
      reason: "ability" | "successful_run" | "post_access",
      legalAction?: LegalAction,
    ) => boolean;
  };
  run: {
    isV097OrLater: () => boolean;
    finishRun: (successful: boolean, legalAction?: LegalAction) => void;
    applyUniqueDirectSuccessfulRunTriggers: (legalAction?: LegalAction) => void;
    successfulRunInterventionKindForSource: (
      sourceCardId: CardInstanceId,
    ) => SuccessfulRunInterventionKind | undefined;
    successfulRunInterventionCost: (
      kind: SuccessfulRunInterventionKind,
      serverId: Exclude<ServerId, "new_remote">,
      hqIceId: CardInstanceId,
    ) => number;
  };
  choices: {
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
  };
};

export type RunAccessTransitionResult = {
  handled: boolean;
  accessStarted?: boolean;
  accessSkipped?: boolean;
  replacementApplied?: string;
  serverId?: Exclude<ServerId, "new_remote">;
  accessCount?: number;
  runFinished?: boolean;
  stateChanged?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export function enterAccessFromSuccessfulRun(
  host: RunAccessTransitionHost,
  legalAction?: LegalAction,
): RunAccessTransitionResult {
  let run = mustRun(host);
  if (startSuccessfulRunInterventionChoice(host, run, legalAction))
    return {
      handled: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  markSuccessfulRunForTurn(host, run);
  host.run.applyUniqueDirectSuccessfulRunTriggers(legalAction);
  if (
    run.successfulRunAccessReplacement === "corp_lose_credits" &&
    (!run.successfulRunRequiresCorpCredits || host.state.corp.credits > 0)
  ) {
    applySuccessfulRunAccessReplacement(host, run, legalAction);
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "corp_lose_credits",
      runFinished: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (run.successfulRunAccessReplacement === "runner_spend_corp_lose_credits") {
    startSuccessfulRunCreditLossSpendChoice(host, run, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "runner_spend_corp_lose_credits",
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (run.successfulRunAccessReplacement === "private_look_top_rd") {
    return startSuccessfulRunPrivateLookChoice(host, run, legalAction);
  }
  if (run.successfulRunAccessReplacement === "archives_faceup_to_rd") {
    applyArchivesFaceupToRdReplacement(host, run, legalAction);
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "archives_faceup_to_rd",
      runFinished: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (
    run.successfulRunAccessReplacement ===
    "trash_rezzed_ice_on_fort_and_tag_runner"
  ) {
    applySuccessfulRunAccessReplacement(host, run, legalAction);
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "trash_rezzed_ice_on_fort_and_tag_runner",
      runFinished: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (run.successfulRunAccessReplacement === "runner_gain_agenda_point") {
    applySuccessfulRunAccessReplacement(host, run, legalAction);
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "runner_gain_agenda_point",
      runFinished: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (
    run.successfulRunAccessReplacement === "reveal_rd_until_agenda_store_in_hq"
  ) {
    startRevealRdUntilAgendaStoreInHqChoice(host, run, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "reveal_rd_until_agenda_store_in_hq",
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  const microtechSourceId = host.access.findPreAccessTopRdReorderSource(run);
  if (microtechSourceId) {
    startPreAccessTopRdReorderChoice(host, run, microtechSourceId, legalAction);
    return {
      handled: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  run = applyConditionalAccessBonus(host, run, legalAction);
  const accessServerId = run.accessServerOverride ?? run.attackedServerId;
  if (
    !run.hiddenRunnerResourceAccessStartWindowClosed &&
    host.access.hasHiddenResourceAccessStartActions(run, accessServerId)
  ) {
    host.state.run = {
      ...run,
      hiddenRunnerResourceAccessStartServerId: accessServerId,
    };
    host.state.activeSide = "runner";
    host.state.timingPoint = "game.checkpoint";
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        hiddenRunnerResourceAccessStartWindowOpened: true,
        serverId: accessServerId,
      };
    }
    return {
      handled: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  if (host.run.isV097OrLater()) {
    revealArchivesAtBreachStart(host, run, legalAction);
    const breach = buildBreachState(host.breach, run);
    if (breach.queue.length === 0) {
      host.run.finishRun(true, legalAction);
      return {
        handled: true,
        accessSkipped: true,
        runFinished: true,
        stateChanged: true,
        ...resolvedPayloadFor(legalAction),
      };
    }
    if (legalAction) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...accessCountPayloadForBreach(host.breach, breach),
      };
    }
    const { accessedCardId: _accessedCardId, ...runWithoutAccessedCard } = run;
    void _accessedCardId;
    host.state.run = {
      ...runWithoutAccessedCard,
      phase: "access",
      successful: true,
      breach,
    };
    host.access.advanceArchivesBreachPastNonDecisionCards(legalAction);
    if (!host.state.run)
      return {
        handled: true,
        accessStarted: true,
        runFinished: true,
        stateChanged: true,
        ...resolvedPayloadFor(legalAction),
      };
    host.state.timingPoint = "access.resolve_card";
    host.state.activeSide = "runner";
    return {
      handled: true,
      accessStarted: true,
      serverId: breach.serverId,
      accessCount: breach.queue.length,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  host.state.run = { ...run, phase: "access", successful: true };
  host.state.timingPoint = "access.resolve_card";
  host.state.activeSide = "runner";
  return {
    handled: true,
    accessStarted: true,
    serverId: run.attackedServerId,
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

export function sourcePayloadForSuccessfulRunReplacement(
  run: ActiveRun,
): Record<string, string> {
  return {
    ...(run.successfulRunSourceCardId
      ? { cardId: run.successfulRunSourceCardId }
      : {}),
    ...(run.successfulRunSourceDefinitionId
      ? { sourceDefinitionId: run.successfulRunSourceDefinitionId }
      : {}),
    ...(run.successfulRunSourceTitle
      ? { sourceTitle: run.successfulRunSourceTitle }
      : {}),
  };
}

export function resolveSuccessfulRunCreditLossSpendChoice(
  host: RunAccessTransitionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  const run = host.state.run;
  if (
    !choice ||
    !run ||
    !choice.source.startsWith("successful_run.credit_loss_spend")
  )
    throw new Error("Es ist keine Successful-Run-Credit-Loss-Choice offen.");
  if (run.successfulRunAccessReplacement !== "runner_spend_corp_lose_credits")
    throw new Error("Credit-Loss-Spend passt nicht zum aktuellen Run.");
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
  const amount = Number(option?.value ?? -1);
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Credit-Loss-Betrag ist ungueltig.");
  if (amount > host.state.runner.credits)
    throw new Error("Der Runner kann diesen Credit-Loss-Betrag nicht zahlen.");
  host.state.runner.credits -= amount;
  host.state.corp.credits = Math.max(0, host.state.corp.credits - amount);
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    accessReplacement: "runner_spend_corp_lose_credits",
    runnerPaidAmount: amount,
    corpLostCredits: amount,
    runnerCreditsAfter: host.state.runner.credits,
    corpCreditsAfter: host.state.corp.credits,
    hiddenZoneBarrier: true,
    ...sourcePayloadForSuccessfulRunReplacement(run),
  };
  host.run.finishRun(true, legalAction);
}

export function resolvePreAccessTopRdReorderChoice(
  host: RunAccessTransitionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("pre_access.top_rd_reorder"))
    throw new Error("Es ist keine Pre-Access-R&D-Reorder-Choice offen.");
  const sourceCardId = choice.source.split(":")[2] as
    | CardInstanceId
    | undefined;
  if (!sourceCardId || !host.access.isPreAccessTopRdReorderSource(sourceCardId))
    throw new Error(
      "Die Pre-Access-R&D-Reorder-Quelle ist nicht mehr installiert.",
    );
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find(
    (candidate) => candidate.id === selectedId,
  );
  const amount = Number(option?.value ?? -1);
  if (
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount > host.state.corp.rd.length
  )
    throw new Error("Die R&D-Cut-Anzahl ist ungueltig.");
  if (amount > 0) {
    const moved = host.state.corp.rd.slice(0, amount);
    host.state.corp.rd = [...host.state.corp.rd.slice(amount), ...moved];
  }
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "pre_access_top_rd_reorder",
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    movedCount: amount,
  };
  enterAccessFromSuccessfulRun(host, legalAction);
}

export function resolveRevealRdUntilAgendaStoreInHqChoice(
  host: RunAccessTransitionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  const run = host.state.run;
  if (
    !choice ||
    !run ||
    !choice.source.startsWith(GYPSY_RD_REVEAL_CHOICE_SOURCE)
  )
    throw new Error("Es ist keine Gypsy-R&D-Reveal-Choice offen.");
  if (
    run.successfulRunAccessReplacement !== "reveal_rd_until_agenda_store_in_hq"
  )
    throw new Error("Gypsy-R&D-Reveal passt nicht zum aktuellen Run.");
  const parsed = parseGypsyRdRevealChoiceSource(choice.source);
  if (parsed.runId !== run.runId)
    throw new Error("Gypsy-R&D-Reveal passt nicht mehr zum aktuellen Run.");
  assertGypsyRevealedPrefix(host, parsed.revealedIds);
  const selectedId =
    host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selectedId === GYPSY_RD_REVEAL_NEXT_OPTION_ID) {
    revealNextGypsyRdCard(host, run, parsed.revealedIds, legalAction);
    return;
  }
  if (selectedId === GYPSY_RD_REVEAL_FINISH_OPTION_ID) {
    finishGypsyRdReveal(host, run, parsed.revealedIds, legalAction);
    return;
  }
  throw new Error("Die Gypsy-R&D-Reveal-Auswahl ist ungueltig.");
}

export function successfulRunInterventionSourceIds(
  host: RunAccessTransitionHost,
  run: ActiveRun,
): CardInstanceId[] {
  if (run.successfulRunInterventionWindowClosed || run.delayedSuccessfulRun)
    return [];
  const server = host.breach.servers.mustServer(run.attackedServerId);
  const used = new Set(run.successfulRunInterventionUsedSourceIds ?? []);
  const hqIceIds = host.state.corp.hq
    .filter((cardId) => host.cards.definitionFor(cardId).type === "ice")
    .sort();
  if (hqIceIds.length === 0) return [];
  return server.root
    .slice()
    .sort()
    .filter((cardId) => !used.has(cardId))
    .filter((cardId) => host.cards.cardInstanceFor(cardId).rezzed)
    .filter((cardId) => {
      const kind = host.run.successfulRunInterventionKindForSource(cardId);
      if (!kind) return false;
      return hqIceIds.some(
        (hqIceId) =>
          host.state.corp.credits >=
          host.run.successfulRunInterventionCost(kind, server.id, hqIceId),
      );
    });
}

export function startSuccessfulRunInterventionChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): boolean {
  const sourceCardId = successfulRunInterventionSourceIds(host, run)[0];
  if (!sourceCardId) return false;
  const kind = host.run.successfulRunInterventionKindForSource(sourceCardId);
  if (!kind) return false;
  const server = host.breach.servers.mustServer(run.attackedServerId);
  const hqIceOptions = host.state.corp.hq
    .filter((cardId) => host.cards.definitionFor(cardId).type === "ice")
    .sort()
    .map((cardId) => ({
      cardId,
      cost: host.run.successfulRunInterventionCost(kind, server.id, cardId),
    }))
    .filter(({ cost }) => host.state.corp.credits >= cost);
  if (hqIceOptions.length === 0) return false;
  const definition = host.cards.definitionFor(sourceCardId);
  host.state.pendingChoice = {
    choiceId: `p3_54_delayed_success_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `p3_54.delayed_success:${sourceCardId}:${kind}:${run.attackedServerId}:${host.state.stateVersion + 1}`,
    prompt: `${definition.title}: Successful Run verzögern?`,
    kind: "select_option",
    options: [
      {
        id: "decline",
        label: "Nicht nutzen",
        publicLabel: `${definition.title} wird nicht genutzt`,
        value: "decline",
      },
      ...hqIceOptions.map(({ cardId, cost }) => ({
        id: `ice_${sanitizeId(cardId)}`,
        label: `ICE aus HQ wählen (${cost} Credits)`,
        publicLabel: `${definition.title}: ICE aus HQ wählen`,
        value: cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "corp";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      delayedSuccessfulRun: true,
      runSuccessDelayed: true,
      fortWindowSourceTitle: definition.title,
      sourceDefinitionId: definition.id,
      sourceCardId,
      hqIceSelectedCount: hqIceOptions.length,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_54_delayed_success_intervention_choice",
      serverId: run.attackedServerId,
    };
  }
  return true;
}

function markSuccessfulRunForTurn(
  host: RunAccessTransitionHost,
  run: ActiveRun,
): void {
  if (run.attackedServerId === "hq")
    host.runner.ensureTurnFlags().successfulHqRunThisTurn = true;
}

function applySuccessfulRunAccessReplacement(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const creditLoss = Math.max(0, Math.floor(run.successfulRunCreditLoss ?? 0));
  if (creditLoss > 0)
    host.state.corp.credits = Math.max(0, host.state.corp.credits - creditLoss);
  const runnerTagGain = Math.max(
    0,
    Math.floor(run.successfulRunRunnerTagGain ?? 0),
  );
  if (runnerTagGain > 0) host.state.runner.tags += runnerTagGain;
  const corpDraw = Math.max(0, Math.floor(run.successfulRunCorpDraw ?? 0));
  if (corpDraw > 0) host.draw.drawCorpCards(corpDraw);
  const runnerCreditGain = Math.max(
    0,
    Math.floor(run.successfulRunRunnerCreditGain ?? 0),
  );
  if (runnerCreditGain > 0) host.state.runner.credits += runnerCreditGain;
  if (run.successfulRunAccessReplacement === "runner_gain_agenda_point") {
    const sourceCardId = run.successfulRunSourceCardId;
    const sourceDefinitionId = run.successfulRunSourceDefinitionId;
    if (!sourceCardId || !sourceDefinitionId)
      throw new Error("Runner-Agenda-Punkt-Ersetzung braucht eine Quelle.");
    if (!host.runner.awardEventAgendaPoint)
      throw new Error("Runner-Agenda-Punkt-Callback fehlt.");
    host.runner.awardEventAgendaPoint(
      sourceCardId,
      sourceDefinitionId,
      legalAction,
    );
  }
  let trashedRezzedIceCount = 0;
  const trashedRezzedIceDefinitionIds: CardDefinitionId[] = [];
  if (
    run.successfulRunAccessReplacement ===
    "trash_rezzed_ice_on_fort_and_tag_runner"
  ) {
    const server = host.breach.servers.mustServer(run.attackedServerId);
    for (const iceId of server.ice.slice()) {
      if (host.cards.cardInstanceFor(iceId).rezzed !== true) continue;
      trashedRezzedIceDefinitionIds.push(host.cards.definitionFor(iceId).id);
      if (!host.trash)
        throw new Error("Successful-run ICE-trash callback fehlt.");
      host.trash.trashCorpInstalledCardToArchives(iceId, legalAction);
      trashedRezzedIceCount += 1;
    }
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessReplacement:
        run.successfulRunAccessReplacement ?? "corp_lose_credits",
      creditLoss,
      corpCreditsAfter: host.state.corp.credits,
      tagsAdded: runnerTagGain,
      runnerTagsAfter: host.state.runner.tags,
      corpDrawnCount: corpDraw,
      gainedCredits: runnerCreditGain,
      runnerCreditsAfter: host.state.runner.credits,
      trashedRezzedIceCount,
      trashedCount: trashedRezzedIceCount,
      ...(trashedRezzedIceDefinitionIds.length > 0
        ? {
            trashedCardDefinitionIds: trashedRezzedIceDefinitionIds
              .sort()
              .join(","),
          }
        : {}),
      hiddenZoneBarrier: true,
      ...sourcePayloadForSuccessfulRunReplacement(run),
    };
  }
}

function startRevealRdUntilAgendaStoreInHqChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  host.state.run = { ...run, phase: "access", successful: true };
  host.state.pendingChoice = gypsyRdRevealChoice(
    host,
    run,
    [],
    host.state.stateVersion + 1,
  );
  host.state.timingPoint = "access.resolve_card";
  host.state.activeSide = "runner";
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessReplacement: "reveal_rd_until_agenda_store_in_hq",
      hiddenZoneAction: "gypsy_schedule_analyzer_reveal_choice_opened",
      hiddenZoneBarrier: true,
      choiceVisibility: "hidden_info_barrier",
      ...sourcePayloadForSuccessfulRunReplacement(run),
    };
  }
}

function revealNextGypsyRdCard(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  revealedIds: CardInstanceId[],
  legalAction: LegalAction,
): void {
  if (firstRevealedAgendaId(host, revealedIds))
    throw new Error(
      "Gypsy Schedule Analyzer hat bereits eine Agenda gefunden.",
    );
  const nextCardId = host.state.corp.rd[revealedIds.length];
  if (!nextCardId)
    throw new Error("R&D enthaelt keine weitere Gypsy-Reveal-Karte.");
  const nextRevealedIds = [...revealedIds, nextCardId];
  const nextRevealedDefinitions = nextRevealedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  const revealedAgendaDefinitionIds = nextRevealedDefinitions
    .filter((definition) => definition.type === "agenda")
    .map((definition) => definition.id);
  host.state.pendingChoice = gypsyRdRevealChoice(
    host,
    run,
    nextRevealedIds,
    host.state.stateVersion + 1,
  );
  host.state.timingPoint = "access.resolve_card";
  host.state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    accessReplacement: "reveal_rd_until_agenda_store_in_hq",
    hiddenZoneAction: "gypsy_schedule_analyzer_reveal_next",
    publicRevealKind: "reveal",
    publicRevealDefinitionIds: nextRevealedDefinitions
      .map((definition) => definition.id)
      .join(","),
    publicRevealTitles: nextRevealedDefinitions
      .map((definition) => definition.title)
      .join("||"),
    revealedAgendaDefinitionIds: revealedAgendaDefinitionIds.join(","),
    revealedCount: nextRevealedIds.length,
    revealedNonAgendaCount: nextRevealedDefinitions.filter(
      (definition) => definition.type !== "agenda",
    ).length,
    agendaStoredInHq: false,
    hiddenZoneBarrier: true,
    choiceVisibility: "hidden_info_barrier",
    ...sourcePayloadForSuccessfulRunReplacement(run),
  };
}

function finishGypsyRdReveal(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  revealedIds: CardInstanceId[],
  legalAction: LegalAction,
): void {
  const agendaId = firstRevealedAgendaId(host, revealedIds);
  if (!agendaId && revealedIds.length < host.state.corp.rd.length)
    throw new Error("Gypsy Schedule Analyzer muss weiter R&D aufdecken.");
  const remainingRd = host.state.corp.rd.slice(revealedIds.length);
  const revealedNonAgendaIds = revealedIds.filter(
    (cardId) => cardId !== agendaId,
  );
  const revealedDefinitions = revealedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  if (agendaId) {
    host.state.corp.hq.push(agendaId);
    host.state.cardInstances[agendaId] = {
      ...host.cards.cardInstanceFor(agendaId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "hq" },
    };
  }
  const shuffledRd = host.rng.shuffleStateIds(
    [...remainingRd, ...revealedNonAgendaIds],
    `successful_run.reveal_rd_until_agenda.${run.runId}`,
  );
  host.state.corp.rd = shuffledRd;
  for (const cardId of shuffledRd) {
    host.state.cardInstances[cardId] = {
      ...host.cards.cardInstanceFor(cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "rd" },
    };
  }
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    accessReplacement: "reveal_rd_until_agenda_store_in_hq",
    hiddenZoneAction: "gypsy_schedule_analyzer_reveal_rd_until_agenda",
    publicRevealKind: "reveal",
    revealedCount: revealedIds.length,
    agendaStoredInHq: Boolean(agendaId),
    ...(agendaId
      ? { storedAgendaDefinitionId: host.cards.definitionFor(agendaId).id }
      : {}),
    revealedAgendaDefinitionIds: agendaId
      ? host.cards.definitionFor(agendaId).id
      : "",
    publicRevealDefinitionIds: revealedDefinitions
      .map((definition) => definition.id)
      .join(","),
    publicRevealTitles: revealedDefinitions
      .map((definition) => definition.title)
      .join("||"),
    revealedNonAgendaCount: revealedNonAgendaIds.length,
    shuffledIntoRdCount: revealedNonAgendaIds.length,
    hiddenZoneBarrier: true,
    choiceVisibility: "hidden_info_barrier",
    randomCounterAfter: host.state.randomCounter,
    ...sourcePayloadForSuccessfulRunReplacement(run),
  };
  host.run.finishRun(true, legalAction);
}

function gypsyRdRevealChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  revealedIds: CardInstanceId[],
  stateVersion: number,
): NonNullable<GameState["pendingChoice"]> {
  const agendaRevealed = Boolean(firstRevealedAgendaId(host, revealedIds));
  const canRevealNext =
    !agendaRevealed && revealedIds.length < host.state.corp.rd.length;
  const option = canRevealNext
    ? {
        id: GYPSY_RD_REVEAL_NEXT_OPTION_ID,
        label:
          revealedIds.length === 0
            ? "Erste R&D-Karte zeigen"
            : "Nächste R&D-Karte zeigen",
        publicLabel: "Gypsy Schedule Analyzer deckt eine R&D-Karte auf",
        value: GYPSY_RD_REVEAL_NEXT_OPTION_ID,
      }
    : {
        id: GYPSY_RD_REVEAL_FINISH_OPTION_ID,
        label: agendaRevealed
          ? "Agenda nach HQ legen und R&D mischen"
          : revealedIds.length > 0
            ? "R&D mischen und Effekt abschließen"
            : "Effekt abschließen",
        publicLabel: "Gypsy Schedule Analyzer abschließen",
        value: GYPSY_RD_REVEAL_FINISH_OPTION_ID,
      };
  return {
    choiceId: `gypsy_rd_reveal_${run.runId}_${stateVersion}`,
    side: "runner",
    source: gypsyRdRevealChoiceSource(run.runId, revealedIds, stateVersion),
    prompt: "Gypsy Schedule Analyzer: R&D aufdecken",
    kind: "select_option",
    options: [option],
    minSelections: 1,
    maxSelections: 1,
    stateVersion,
    visibility: "hidden_info_barrier",
  };
}

function gypsyRdRevealChoiceSource(
  runId: string,
  revealedIds: CardInstanceId[],
  stateVersion: number,
): string {
  return `${GYPSY_RD_REVEAL_CHOICE_SOURCE}:${runId}:${revealedIds.join(",")}:${stateVersion}`;
}

function parseGypsyRdRevealChoiceSource(source: string): {
  runId: string;
  revealedIds: CardInstanceId[];
} {
  const [prefix, runId = "", revealedIdCsv = ""] = source.split(":");
  if (prefix !== GYPSY_RD_REVEAL_CHOICE_SOURCE || !runId)
    throw new Error("Die Gypsy-R&D-Reveal-Choice ist ungueltig.");
  const revealedIds = revealedIdCsv
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean) as CardInstanceId[];
  return { runId, revealedIds };
}

function assertGypsyRevealedPrefix(
  host: RunAccessTransitionHost,
  revealedIds: CardInstanceId[],
): void {
  const rdPrefix = host.state.corp.rd.slice(0, revealedIds.length);
  if (
    rdPrefix.length !== revealedIds.length ||
    rdPrefix.some((cardId, index) => cardId !== revealedIds[index])
  )
    throw new Error("Die Gypsy-R&D-Reveal-Reihenfolge ist nicht mehr gueltig.");
}

function firstRevealedAgendaId(
  host: RunAccessTransitionHost,
  revealedIds: CardInstanceId[],
): CardInstanceId | undefined {
  return revealedIds.find(
    (cardId) => host.cards.definitionFor(cardId).type === "agenda",
  );
}

function applyConditionalAccessBonus(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): ActiveRun {
  const bonus = run.conditionalAccessBonus;
  if (!bonus || run.conditionalAccessBonusApplied) return run;
  const qualifies =
    bonus.kind === "no_noisy_icebreaker_or_trace" &&
    run.usedNoisyIcebreakerThisRun !== true &&
    run.traceAttemptedThisRun !== true;
  const amount = qualifies ? Math.max(0, Math.floor(bonus.amount)) : 0;
  const updated: ActiveRun = {
    ...run,
    accessCount: Math.max(1, Math.floor(run.accessCount ?? 1)) + amount,
    conditionalAccessBonusApplied: true,
  };
  host.state.run = updated;
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      conditionalAccessBonusKind: bonus.kind,
      conditionalAccessBonusApplied: qualifies,
      additionalAccessCount: amount,
      effectiveAccessCountAfterConditionalBonus: Math.max(
        1,
        Math.floor(updated.accessCount ?? 1),
      ),
      sourceDefinitionId: bonus.sourceDefinitionId,
    };
  }
  return updated;
}

function startSuccessfulRunCreditLossSpendChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  host.state.run = { ...run, phase: "access", successful: true };
  const maxSpend = Math.max(0, Math.floor(host.state.runner.credits));
  host.state.pendingChoice = {
    choiceId: `successful_run_credit_loss_spend_${run.runId}_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `successful_run.credit_loss_spend:${run.runId}:${host.state.stateVersion + 1}`,
    prompt: "Betrag fuer Credit-Loss zahlen",
    kind: "select_option",
    options: Array.from({ length: maxSpend + 1 }, (_, amount) => ({
      id: `pay_${amount}`,
      label: `${amount} Credits zahlen`,
      publicLabel: "Credit-Loss-Zahlung",
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessReplacement: "runner_spend_corp_lose_credits",
      successfulRunCreditLossSpendChoiceOpened: true,
      hiddenZoneBarrier: true,
      ...sourcePayloadForSuccessfulRunReplacement(run),
    };
  }
}

function startSuccessfulRunPrivateLookChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): RunAccessTransitionResult {
  const sourceCardId = run.successfulRunSourceCardId;
  const sourceDefinitionId = run.successfulRunSourceDefinitionId;
  if (!sourceCardId || !sourceDefinitionId)
    throw new Error("Successful-run private look has no source.");
  host.state.run = { ...run, phase: "access", successful: true };
  const opened = host.access.startRunnerPrivateLookChoice(
    sourceCardId,
    sourceDefinitionId,
    "rd",
    Math.max(1, Math.floor(run.successfulRunPrivateLookCount ?? 5)),
    "successful_run",
    legalAction,
  );
  if (!opened) {
    host.run.finishRun(true, legalAction);
    return {
      handled: true,
      accessSkipped: true,
      replacementApplied: "private_look_top_rd",
      runFinished: true,
      stateChanged: true,
      ...resolvedPayloadFor(legalAction),
    };
  }
  return {
    handled: true,
    accessSkipped: true,
    replacementApplied: "private_look_top_rd",
    stateChanged: true,
    ...resolvedPayloadFor(legalAction),
  };
}

function startPreAccessTopRdReorderChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  sourceCardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  host.state.run = { ...run, preAccessTopRdReorderResolved: true };
  const maxCut = host.state.corp.rd.length;
  host.state.pendingChoice = {
    choiceId: `pre_access_top_rd_reorder_${run.runId}_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `pre_access.top_rd_reorder:${run.runId}:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "R&D vor Zugriff cutten",
    kind: "select_option",
    options: Array.from({ length: maxCut + 1 }, (_, amount) => ({
      id: `cut_${amount}`,
      label: `${amount} Karten nach unten legen`,
      publicLabel: "R&D-Cut-Anzahl",
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "pre_access_top_rd_reorder",
      sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    };
  }
}

function revealArchivesAtBreachStart(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const accessServerId = run.accessServerOverride ?? run.attackedServerId;
  if (accessServerId !== "archives") return;
  const revealedIds = host.state.corp.archives.filter(
    (cardId) => !host.cards.cardInstanceFor(cardId).faceup,
  );
  if (revealedIds.length === 0) return;
  const revealedDefinitions = revealedIds.map((cardId) =>
    host.cards.definitionFor(cardId),
  );
  const revealedAgendaDefinitions = revealedDefinitions.filter(
    (definition) => definition.type === "agenda",
  );
  for (const cardId of revealedIds) {
    const instance = host.cards.cardInstanceFor(cardId);
    host.state.cardInstances[cardId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealCount: revealedIds.length,
      archivesRevealDefinitionIds: revealedDefinitions
        .map((definition) => definition.id)
        .join(","),
      archivesRevealTitles: revealedDefinitions
        .map((definition) => definition.title)
        .join("|"),
      archivesRevealAgendaDefinitionIds: revealedAgendaDefinitions
        .map((definition) => definition.id)
        .join(","),
      publicRevealDefinitionIds: revealedDefinitions
        .map((definition) => definition.id)
        .join(","),
      publicRevealTitles: revealedDefinitions
        .map((definition) => definition.title)
        .join("|"),
    };
  }
}

function applyArchivesFaceupToRdReplacement(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  const faceupIds = host.state.corp.archives.filter(
    (cardId) => host.cards.cardInstanceFor(cardId).faceup,
  );
  const shuffled = host.rng.shuffleStateIds(
    faceupIds,
    `p3_33.archives_faceup_to_rd_replacement.${run.runId}`,
  );
  const moveCount = Math.min(
    Math.max(0, Math.floor(run.successfulRunArchivesMoveCount ?? 2)),
    shuffled.length,
  );
  const moved = shuffled.slice(0, moveCount);
  const remainingFaceup = shuffled.slice(moveCount);
  const facedownArchives = host.state.corp.archives.filter(
    (cardId) => !faceupIds.includes(cardId),
  );
  host.state.corp.archives = [...facedownArchives, ...remainingFaceup];
  host.state.corp.rd = [...moved, ...host.state.corp.rd];
  for (const cardId of moved) {
    host.state.cardInstances[cardId] = {
      ...host.cards.cardInstanceFor(cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "rd" },
    };
  }
  for (const cardId of remainingFaceup) {
    host.state.cardInstances[cardId] = {
      ...host.cards.cardInstanceFor(cardId),
      zone: { side: "corp", zone: "archives" },
    };
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      accessReplacement: "archives_faceup_to_rd",
      shuffledFaceUpArchivesCount: faceupIds.length,
      movedCount: moveCount,
      randomCounterAfter: host.state.randomCounter,
      hiddenZoneBarrier: true,
      ...sourcePayloadForSuccessfulRunReplacement(run),
    };
  }
}

function resolvedPayloadFor(
  legalAction: LegalAction | undefined,
): Pick<RunAccessTransitionResult, "resolvedPayload"> {
  return legalAction?.payload ? { resolvedPayload: legalAction.payload } : {};
}

function mustRun(host: RunAccessTransitionHost): ActiveRun {
  if (!host.state.run) throw new Error("Es laeuft kein Run.");
  return host.state.run;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
