import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CardRunnerEventLongtailImplementation,
  ChoiceRequest,
  CorpServer,
  CorpZoneChoiceHandlerHost,
  CounterType,
  DamageSummary,
  DrawTaxDecision,
  GameState,
  HiddenZoneArrangeChoiceHandlerHost,
  HiddenZoneNonSearchChoiceHandlerHost,
  HiddenZoneSearchActivationHandlerHost,
  HiddenZoneSearchChoiceHandlerHost,
  LegalAction,
  PendingChoiceResolutionHost,
  PlayerAction,
  ResolvedGameEffect,
  RunnerDrawSummary,
  RuntimeDeps,
  ServerId,
  Side,
} from "./runtime-shared";
import type { CardLeavePlayCleanupImplementation } from "../../ability-engine/definition-types";

export function createLifecycleRuntime(deps: RuntimeDeps) {
  const {
    HOST_RETURN_HARDWARE_SOURCE,
    NEVINYRRAL_ID,
    cardHasSubtype,
    cardImplementationForDefinitionId,
    cardImplementationRuntimeDeps,
    drawTaxSourceIds,
    clearCardCounters,
    corpRootAgendaOrNodeCapacityInServer,
    corpRootMainCardIdsInServer,
    definitionFor,
    emptyRunnerDrawSummary,
    executeCardImplementationLifecycleEffects,
    hasCardImplementationMemoryUnitModifier,
    hostedCardsOn,
    leavePlayCleanupImplementationsForCard,
    mergeRunnerDrawSummary,
    installedProgramTrashBackupHardwareIds,
    mustArrayValue,
    nextRandom,
    publicCardTitle,
    remainingReplacementLongtailKindForCard,
    removeFromAllZones,
    runnerInstalledCardIds,
    runnerUtilityLongtailKindForDefinition,
    selectedChoiceIds,
    setHostedOn,
    spendCredits,
    uniqueDirectLongtailKindForDefinition,
    mustInstance,
    credits,
    withoutVariableIceState,
  } = deps;

  function discardRandomCorpHqCards(
    state: GameState,
    maxCount: number,
    purposePrefix: string,
  ): CardInstanceId[] {
    const available = state.corp.hq.slice();
    const discarded: CardInstanceId[] = [];
    const limit = Math.min(Math.max(0, Math.floor(maxCount)), available.length);
    for (let index = 0; index < limit; index += 1) {
      const value = nextRandom(state, `${purposePrefix}:selection:${index}`);
      const selectedIndex = Math.floor(value * available.length);
      const cardId = mustArrayValue(
        available,
        selectedIndex,
        "HQ discard selection missing.",
      );
      available.splice(selectedIndex, 1);
      removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: false,
        rezzed: false,
        zone: { side: "corp", zone: "archives" },
      };
      discarded.push(cardId);
    }
    return discarded;
  }

  function trashRunnerInstalledProgram(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    if (!state.runner.rig.programs.includes(cardId)) return;
    const hostedIds = hostedCardsOn(state, cardId);
    const backedUpHostedIds = backupProgramsOnTrashBackupHardwareBeforeTrash(
      state,
      hostedIds,
    );
    for (const hostedId of hostedIds) {
      if (backedUpHostedIds.includes(hostedId)) continue;
      trashRunnerInstalledProgram(state, hostedId);
    }
    const definition = definitionFor(state, cardId);
    const instance = mustInstance(state.cardInstances, cardId);
    const usesMemory = runnerProgramUsesMemory(state, cardId);
    const memoryCost = runnerInstalledProgramMemoryCost(state, cardId);
    const {
      hostedOn: _hostedOn,
      installedAsRunnerProgram: _installedAsRunnerProgram,
      ...withoutHost
    } = instance;
    void _hostedOn;
    void _installedAsRunnerProgram;
    if (usesMemory) {
      state.runner.memoryUsed = Math.max(
        0,
        state.runner.memoryUsed - memoryCost,
      );
    }
    removeFromAllZones(state, cardId);
    if (instance.installedAsRunnerProgram?.removeFromGameOnLeavePlay) {
      removedFromGameZone(state).push(cardId);
      state.cardInstances[cardId] = {
        ...withoutHost,
        faceup: true,
        rezzed: true,
        zone: {
          side: "special",
          zone: "removed_from_game",
          visibility: "public",
        },
      };
      clearCardCounters(state, cardId);
      return;
    }
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutHost,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
    clearCardCounters(state, cardId);
  }

  function backupProgramsOnTrashBackupHardwareBeforeTrash(
    state: GameState,
    candidateProgramIds: CardInstanceId[],
  ): CardInstanceId[] {
    const microtechId = installedProgramTrashBackupHardwareIds(state)[0];
    if (!microtechId) return [];
    const eligible = candidateProgramIds
      .filter((cardId) => state.runner.rig.programs.includes(cardId))
      .filter((cardId) => definitionFor(state, cardId).type === "program")
      .filter((cardId) => cardId !== microtechId)
      .sort();
    if (eligible.length === 0) return [];
    for (const cardId of eligible) {
      if (runnerProgramUsesMemory(state, cardId))
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed -
            (definitionFor(state, cardId).memoryCost ?? 0),
        );
      setHostedOn(state, cardId, microtechId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId),
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "rig" },
        hostedOn: microtechId,
      };
    }
    return eligible;
  }

  function runnerProgramUsesMemory(
    state: GameState,
    cardId: CardInstanceId,
  ): boolean {
    const instance = mustInstance(state.cardInstances, cardId);
    if (!instance.hostedOn) return true;
    const hostDefinition = definitionFor(state, instance.hostedOn);
    if (
      (hostDefinition.type === "program" &&
        cardHasSubtype(hostDefinition, "daemon")) ||
      runnerUtilityLongtailKindForDefinition(hostDefinition.id) ===
        "replace_installed_program_trash_with_host_on_source" ||
      hostDefinition.id === HOST_RETURN_HARDWARE_SOURCE
    )
      return false;
    return true;
  }

  function runnerInstalledProgramMemoryCost(
    state: GameState,
    cardId: CardInstanceId,
  ): number {
    const instance = mustInstance(state.cardInstances, cardId);
    if (instance.installedAsRunnerProgram)
      return Math.max(
        0,
        Math.floor(instance.installedAsRunnerProgram.memoryCost ?? 0),
      );
    return Math.max(0, Math.floor(definitionFor(state, cardId).memoryCost ?? 0));
  }

  function removedFromGameZone(state: GameState): CardInstanceId[] {
    state.specialZones ??= { setAside: [], removedFromGame: [] };
    state.specialZones.removedFromGame ??= [];
    return state.specialZones.removedFromGame;
  }

  function trashRunnerInstalledCardToHeap(
    state: GameState,
    cardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    const definition = definitionFor(state, cardId);
    const sourceInstance = mustInstance(state.cardInstances, cardId);
    if (
      definition.type === "program" ||
      (state.runner.rig.programs.includes(cardId) &&
        sourceInstance.installedAsRunnerProgram)
    ) {
      trashRunnerInstalledProgram(state, cardId);
      return;
    }
    if (definition.type !== "hardware" && definition.type !== "resource")
      return;
    const rig =
      definition.type === "hardware"
        ? state.runner.rig.hardware
        : state.runner.rig.resources;
    if (!rig.includes(cardId)) return;
    executeCardImplementationLifecycleEffects(
      cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_leave_play",
    );
    for (const hostedId of hostedCardsOn(state, cardId)) {
      const hostedDefinition = definitionFor(state, hostedId);
      if (hostedDefinition.type === "program")
        trashRunnerInstalledProgram(state, hostedId);
    }
    const instanceAfterLifecycle = mustInstance(state.cardInstances, cardId);
    const { hostedOn: _hostedOn, ...withoutHost } = instanceAfterLifecycle;
    void _hostedOn;
    removeFromAllZones(state, cardId);
    if (
      definition.type === "hardware" &&
      !hasCardImplementationMemoryUnitModifier(definition) &&
      (definition.memoryLimitBonus ?? 0) > 0
    )
      state.runner.memoryLimit = Math.max(
        0,
        state.runner.memoryLimit - (definition.memoryLimitBonus ?? 0),
      );
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutHost,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
    clearCardCounters(state, cardId);
  }

  function returnRunnerInstalledCardToGrip(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    const definition = definitionFor(state, cardId);
    if (!runnerInstalledCardIds(state).includes(cardId)) return;
    const sourceInstance = mustInstance(state.cardInstances, cardId);
    const memoryCost = runnerInstalledProgramMemoryCost(state, cardId);
    if (runnerProgramUsesMemory(state, cardId)) {
      state.runner.memoryUsed = Math.max(
        0,
        state.runner.memoryUsed - memoryCost,
      );
    }
    if (
      state.runner.rig.programs.includes(cardId) &&
      sourceInstance.installedAsRunnerProgram?.removeFromGameOnLeavePlay
    ) {
      const {
        hostedOn: _hostedOn,
        installedAsRunnerProgram: _installedAsRunnerProgram,
        ...withoutHost
      } = sourceInstance;
      void _hostedOn;
      void _installedAsRunnerProgram;
      removeFromAllZones(state, cardId);
      removedFromGameZone(state).push(cardId);
      state.cardInstances[cardId] = {
        ...withoutHost,
        faceup: true,
        rezzed: true,
        zone: {
          side: "special",
          zone: "removed_from_game",
          visibility: "public",
        },
      };
      clearCardCounters(state, cardId);
      return;
    }
    if (
      definition.type === "hardware" &&
      !hasCardImplementationMemoryUnitModifier(definition) &&
      (definition.memoryLimitBonus ?? 0) > 0
    )
      state.runner.memoryLimit = Math.max(
        0,
        state.runner.memoryLimit - (definition.memoryLimitBonus ?? 0),
      );
    const instanceAfterLifecycle = mustInstance(state.cardInstances, cardId);
    const { hostedOn: _hostedOn, ...withoutHost } = instanceAfterLifecycle;
    void _hostedOn;
    removeFromAllZones(state, cardId);
    state.runner.grip.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutHost,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "grip" },
    };
    clearCardCounters(state, cardId);
  }

  function returnRunnerInstalledProgramsToGripForAccess(
    state: GameState,
    cardIds: readonly CardInstanceId[],
  ): { publicPayload: Record<string, string | number | boolean> } {
    let daemonHostedTrashCount = 0;
    const returnedDefinitionIds: string[] = [];
    for (const cardId of cardIds) {
      if (!state.runner.rig.programs.includes(cardId)) continue;
      if (definitionFor(state, cardId).type !== "program") continue;
      const hostedIds = hostedCardsOn(state, cardId);
      for (const hostedId of hostedIds) {
        if (!state.runner.rig.programs.includes(hostedId)) continue;
        trashRunnerInstalledCardToHeap(state, hostedId);
        daemonHostedTrashCount += 1;
      }
      returnedDefinitionIds.push(definitionFor(state, cardId).id);
      returnRunnerInstalledCardToGrip(state, cardId);
    }
    return {
      publicPayload: {
        returnedProgramCount: returnedDefinitionIds.length,
        returnedProgramDefinitionIds: returnedDefinitionIds.join(","),
        daemonHostedTrashCount,
        runnerGripAfter: state.runner.grip.length,
      },
    };
  }

  function trashCorpInstalledCardToArchives(
    state: GameState,
    cardId: CardInstanceId,
    legalAction?: LegalAction,
  ): void {
    for (const hostedId of hostedCardsOn(state, cardId)) {
      const hostedInstance = mustInstance(state.cardInstances, hostedId);
      if (hostedInstance.owner === "corp")
        trashCorpInstalledCardToArchives(state, hostedId, legalAction);
    }
    const instance = mustInstance(state.cardInstances, cardId);
    const definition = definitionFor(state, cardId);
    const sourceServerId =
      instance.zone.side === "corp" && instance.zone.zone === "serverRoot"
        ? instance.zone.serverId
        : undefined;
    const leavesFortCapacityModifier = leavePlayCleanupImplementationsForCard(
      state,
      cardId,
    ).some(
      (cleanup: CardLeavePlayCleanupImplementation) =>
        cleanup.kind === "trash_agenda_or_node_if_fort_over_capacity" &&
        cleanup.target === "agenda_or_node_inside_same_fort",
    );
    const rezzedNevinyrralLeftPlay =
      (uniqueDirectLongtailKindForDefinition(definition.id) ===
        "rezzed_leave_action_gain_asset" ||
        (definition.id === NEVINYRRAL_ID &&
          !cardImplementationForDefinitionId(definition.id))) &&
      instance.rezzed === true;
    const { hostedOn: _hostedOn, ...withoutHost } = instance;
    void _hostedOn;
    removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutVariableIceState(withoutHost),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    clearCardCounters(state, cardId);
    if (sourceServerId && leavesFortCapacityModifier) {
      cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
        state,
        sourceServerId,
        definition.id,
        legalAction,
      );
    }
    if (rezzedNevinyrralLeftPlay) {
      state.winner = "runner";
      state.gameEndReason = "nevinyrral_left_play";
      state.phase = "game_over";
      state.timingPoint = "game.checkpoint";
      state.activeSide = "runner";
      if (legalAction) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          gameEndReason: "nevinyrral_left_play",
          sourceDefinitionId: definition.id,
        };
      }
    }
  }

  function cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay(
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
    sourceDefinitionId: CardDefinitionId,
    legalAction?: LegalAction,
  ): void {
    const server = state.corp.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) return;
    const capacity = corpRootAgendaOrNodeCapacityInServer(state, server);
    const mainIds = corpRootMainCardIdsInServer(state, server);
    if (mainIds.length <= capacity) return;
    const targetId = mainIds[0];
    if (!targetId) return;
    const targetDefinition = definitionFor(state, targetId);
    if (legalAction) {
      const effectIndex = legalAction.resolvedEffects?.length ?? 0;
      legalAction.resolvedEffects = [
        ...(legalAction.resolvedEffects ?? []),
        {
          effectId: `corp.fort_capacity_cleanup.${server.id}.${effectIndex}`,
          kind: "trash_card",
          visibility: "public",
          side: "corp",
          reason: "fort_capacity_exceeded",
          serverId: server.id,
          serverLabel: server.label,
          sourceDefinitionId,
          sourceTitle: publicCardTitle(sourceDefinitionId),
          cardDefinitionId: targetDefinition.id,
          cardTitle: targetDefinition.title,
        },
      ];
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        namatokiCleanupTrash: true,
        namatokiCleanupTrashedCardDefinitionId: targetDefinition.id,
        fortCapacityAfter: capacity,
        fortAgendaNodeCountBeforeCleanup: mainIds.length,
      };
    }
    trashCorpInstalledCardToArchives(state, targetId, legalAction);
  }

  function drawRunnerCard(
    state: GameState,
    drawTaxDecision: DrawTaxDecision = "auto",
  ): RunnerDrawSummary {
    const summary = emptyRunnerDrawSummary();
    const cardId = state.runner.stack.shift();
    if (!cardId) return summary;
    state.runner.grip.push(cardId);
    state.cardInstances[cardId] = {
      ...mustInstance(state.cardInstances, cardId),
      zone: { side: "runner", zone: "grip" },
    };
    summary.drawnCount = 1;
    (summary.drawnCardIds ??= []).push(cardId);
    const drawTaxSourceCardIds = drawTaxSourceIds(state);
    summary.drawTaxSourceCount = drawTaxSourceCardIds.length;
    for (const _sourceId of drawTaxSourceCardIds) {
      void _sourceId;
      if (
        drawTaxDecision === "pay" ||
        (drawTaxDecision === "auto" && state.runner.credits > 0)
      ) {
        if (state.runner.credits <= 0)
          throw new Error("City Surveillance kann nicht bezahlt werden.");
        spendCredits(state, "runner", 1);
        summary.drawTaxCreditsPaid += 1;
      } else {
        state.runner.tags += 1;
        summary.drawTaxTagsAdded += 1;
      }
    }
    return summary;
  }

  function activeCrashEverettSourceId(
    state: GameState,
  ): CardInstanceId | undefined {
    return state.runner.rig.resources
      .filter(
        (cardId) =>
          remainingReplacementLongtailKindForCard(state, cardId) ===
          "hidden_draw_keep_or_top_replacement",
      )
      .sort()[0];
  }

  function startCrashEverettDrawChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    drawnCardIds: readonly CardInstanceId[],
  ): void {
    if (drawnCardIds.length === 0) return;
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const options = drawnCardIds.flatMap((cardId) => {
      const title = definitionFor(state, cardId).title;
      return [
        {
          id: `trash_${cardId}`,
          label: `${title} trashen`,
          publicLabel: "Gezogene Karte trashen",
          value: `${cardId}:trash`,
        },
        {
          id: `top_${cardId}`,
          label: `${title} oben auf den Stack legen`,
          publicLabel: "Gezogene Karte oben auf den Stack legen",
          value: `${cardId}:top`,
        },
      ];
    });
    state.pendingChoice = {
      choiceId: `p3_61_crash_draw_${state.stateVersion + 1}`,
      side: "runner",
      source: `p3_61.crash_draw:${sourceCardId}:${drawnCardIds.join(",")}:${
        state.stateVersion + 1
      }`,
      prompt: "Crash Everett: gezogene Karte waehlen",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
  }

  function drawRunnerCards(
    state: GameState,
    amount: number,
    drawTaxDecision: DrawTaxDecision = "auto",
  ): RunnerDrawSummary {
    let summary = emptyRunnerDrawSummary();
    const crashSourceId =
      amount > 0 ? activeCrashEverettSourceId(state) : undefined;
    const drawAmount = amount + (crashSourceId ? 1 : 0);
    for (let index = 0; index < drawAmount; index += 1)
      summary = mergeRunnerDrawSummary(
        summary,
        drawRunnerCard(state, drawTaxDecision),
      );
    if (crashSourceId && (summary.drawnCardIds?.length ?? 0) > 0) {
      startCrashEverettDrawChoice(
        state,
        crashSourceId,
        summary.drawnCardIds ?? [],
      );
      summary.crashEverettSourceCardId = crashSourceId;
      summary.crashEverettChoiceOpened = true;
    }
    return summary;
  }

  function resolveCrashEverettDrawChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("p3_61.crash_draw"))
      throw new Error("Es ist keine Crash-Everett-Choice offen.");
    if (choice.side !== "runner" || legalAction.side !== "runner")
      throw new Error("Nur der Runner darf Crash Everett nutzen.");
    const [, sourceCardId = "", drawnList = ""] = choice.source.split(":");
    if (
      !state.runner.rig.resources.includes(sourceCardId as CardInstanceId) ||
      remainingReplacementLongtailKindForCard(
        state,
        sourceCardId as CardInstanceId,
      ) !== "hidden_draw_keep_or_top_replacement"
    )
      throw new Error("Crash Everett ist nicht mehr installiert.");
    const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    const option = choice.options.find(
      (candidate) => candidate.id === selected,
    );
    const [cardId = "", disposition = ""] = String(option?.value ?? "").split(
      ":",
    );
    const legalDrawnCardIds = new Set(drawnList.split(",").filter(Boolean));
    if (!legalDrawnCardIds.has(cardId))
      throw new Error(
        "Die gewaehlte Karte wurde nicht in diesem Draw gezogen.",
      );
    if (!state.runner.grip.includes(cardId as CardInstanceId))
      throw new Error("Die gewaehlte Karte ist nicht mehr im Grip.");
    removeFromAllZones(state, cardId as CardInstanceId);
    if (disposition === "trash") {
      state.runner.heap.push(cardId as CardInstanceId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId as CardInstanceId),
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "heap" },
      };
    } else if (disposition === "top") {
      state.runner.stack.unshift(cardId as CardInstanceId);
      state.cardInstances[cardId] = {
        ...mustInstance(state.cardInstances, cardId as CardInstanceId),
        faceup: false,
        rezzed: false,
        zone: { side: "runner", zone: "stack" },
      };
    } else {
      throw new Error("Crash Everett braucht Trash oder Stack-Top.");
    }
    delete state.pendingChoice;
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      choiceVisibility: "hidden_info_barrier",
      drawReplacementSourceTitle: "Crash Everett, Inventive Fixer",
      sourceDefinitionId: definitionFor(state, sourceCardId as CardInstanceId)
        .id,
      crashEverettDisposition: disposition,
      crashEverettDrawnCardCount: legalDrawnCardIds.size,
      ...(disposition === "trash"
        ? { trashedCount: 1, destinationZone: "heap" }
        : { returnedToStackTop: true, destinationZone: "stack" }),
    };
  }

  return {
    discardRandomCorpHqCards,
    trashRunnerInstalledProgram,
    backupProgramsOnTrashBackupHardwareBeforeTrash,
    runnerProgramUsesMemory,
    trashRunnerInstalledCardToHeap,
    returnRunnerInstalledCardToGrip,
    returnRunnerInstalledProgramsToGripForAccess,
    trashCorpInstalledCardToArchives,
    cleanupCorpRootAgendaOrNodeCapacityAfterLeavePlay,
    drawRunnerCard,
    activeCrashEverettSourceId,
    startCrashEverettDrawChoice,
    drawRunnerCards,
    resolveCrashEverettDrawChoice,
  };
}
