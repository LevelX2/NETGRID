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
    advanceArchivesBreachPastNonDecisionCards: (
      legalAction?: LegalAction,
    ) => void;
    findMicrotechAiInterfacePreAccessSource: (
      run: ActiveRun,
    ) => CardInstanceId | undefined;
    isMicrotechAiInterfacePreAccessSource: (cardId: CardInstanceId) => boolean;
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
    applyUniqueDirectSuccessfulRunTriggers: (
      legalAction?: LegalAction,
    ) => void;
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
    selectedChoiceIds: (selectedChoices: PlayerAction["selectedChoices"]) => string[];
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
  const run = mustRun(host);
  if (startSuccessfulRunInterventionChoice(host, run, legalAction))
    return { handled: true, stateChanged: true, ...resolvedPayloadFor(legalAction) };
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
    startPriorityWreckSpendChoice(host, run, legalAction);
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
  if (run.successfulRunAccessReplacement === "trash_rezzed_ice_on_fort_and_tag_runner") {
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
  const microtechSourceId =
    host.access.findMicrotechAiInterfacePreAccessSource(run);
  if (microtechSourceId) {
    startMicrotechAiInterfacePreAccessChoice(
      host,
      run,
      microtechSourceId,
      legalAction,
    );
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

export function resolvePriorityWreckSpendChoice(
  host: RunAccessTransitionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  const run = host.state.run;
  if (!choice || !run || !choice.source.startsWith("p3_33.priority_wreck"))
    throw new Error("Es ist keine Priority-Wreck-Choice offen.");
  if (run.successfulRunAccessReplacement !== "runner_spend_corp_lose_credits")
    throw new Error("Priority Wreck passt nicht zum aktuellen Run.");
  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  const amount = Number(option?.value ?? -1);
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Priority-Wreck-Betrag ist ungueltig.");
  if (amount > host.state.runner.credits)
    throw new Error("Der Runner kann diesen Priority-Wreck-Betrag nicht zahlen.");
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

export function resolveMicrotechAiInterfacePreAccessChoice(
  host: RunAccessTransitionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_33.microtech_ai_interface"))
    throw new Error("Es ist keine Microtech-AI-Interface-Choice offen.");
  const sourceCardId = choice.source.split(":")[2] as CardInstanceId | undefined;
  if (
    !sourceCardId ||
    !host.access.isMicrotechAiInterfacePreAccessSource(sourceCardId)
  )
    throw new Error("Microtech AI Interface ist nicht mehr installiert.");
  const selectedId = host.choices.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  const option = choice.options.find((candidate) => candidate.id === selectedId);
  const amount = Number(option?.value ?? -1);
  if (!Number.isInteger(amount) || amount < 0 || amount > host.state.corp.rd.length)
    throw new Error("Die Microtech-Cut-Anzahl ist ungueltig.");
  if (amount > 0) {
    const moved = host.state.corp.rd.slice(0, amount);
    host.state.corp.rd = [...host.state.corp.rd.slice(amount), ...moved];
  }
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_33_microtech_ai_interface_pre_access",
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    movedCount: amount,
  };
  enterAccessFromSuccessfulRun(host, legalAction);
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
  let trashedRezzedIceCount = 0;
  const trashedRezzedIceDefinitionIds: CardDefinitionId[] = [];
  if (run.successfulRunAccessReplacement === "trash_rezzed_ice_on_fort_and_tag_runner") {
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
      accessReplacement: run.successfulRunAccessReplacement ?? "corp_lose_credits",
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
        ? { trashedCardDefinitionIds: trashedRezzedIceDefinitionIds.sort().join(",") }
        : {}),
      hiddenZoneBarrier: true,
    };
  }
}

function startPriorityWreckSpendChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  legalAction?: LegalAction,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  host.state.run = { ...run, phase: "access", successful: true };
  const maxSpend = Math.max(0, Math.floor(host.state.runner.credits));
  host.state.pendingChoice = {
    choiceId: `p3_33_priority_wreck_${run.runId}_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `p3_33.priority_wreck:${run.runId}:${host.state.stateVersion + 1}`,
    prompt: "Priority Wreck: Betrag zahlen",
    kind: "select_option",
    options: Array.from({ length: maxSpend + 1 }, (_, amount) => ({
      id: `pay_${amount}`,
      label: `${amount} Credits zahlen`,
      publicLabel: "Priority-Wreck-Zahlung",
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
      priorityWreckChoiceOpened: true,
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

function startMicrotechAiInterfacePreAccessChoice(
  host: RunAccessTransitionHost,
  run: ActiveRun,
  sourceCardId: CardInstanceId,
  legalAction?: LegalAction,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  host.state.run = { ...run, microtechAiInterfacePreAccessResolved: true };
  const maxCut = host.state.corp.rd.length;
  host.state.pendingChoice = {
    choiceId: `p3_33_microtech_ai_interface_${run.runId}_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `p3_33.microtech_ai_interface:${run.runId}:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Microtech AI Interface: R&D cutten",
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
      hiddenZoneAction: "p3_33_microtech_ai_interface_pre_access",
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
  for (const cardId of revealedIds) {
    const instance = host.cards.cardInstanceFor(cardId);
    host.state.cardInstances[cardId] = { ...instance, faceup: true, rezzed: true };
  }
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenZoneBarrier: true,
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealCount: revealedIds.length,
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
    `p3_33.record_reconstructor.${run.runId}`,
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
