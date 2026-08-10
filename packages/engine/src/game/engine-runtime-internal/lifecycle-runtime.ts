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

export function createLifecycleRuntime(
  deps: RuntimeDeps,
): import("./lifecycle-runtime-port").LifecycleRuntimePort {
  function discardRandomCorpHqCards(
    state: GameState,
    maxCount: number,
    purposePrefix: string,
  ): CardInstanceId[] {
    const available = state.corp.hq.slice();
    const discarded: CardInstanceId[] = [];
    const limit = Math.min(Math.max(0, Math.floor(maxCount)), available.length);
    for (let index = 0; index < limit; index += 1) {
      const value = deps.nextRandom(
        state,
        `${purposePrefix}:selection:${index}`,
      );
      const selectedIndex = Math.floor(value * available.length);
      const cardId = deps.mustArrayValue(
        available,
        selectedIndex,
        "HQ discard selection missing.",
      );
      available.splice(selectedIndex, 1);
      deps.removeFromAllZones(state, cardId);
      state.corp.archives.push(cardId);
      state.cardInstances[cardId] = {
        ...deps.mustInstance(state.cardInstances, cardId),
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
    const hostedIds = deps.hostedCardsOn(state, cardId);
    const backedUpHostedIds = backupProgramsOnTrashBackupHardwareBeforeTrash(
      state,
      hostedIds,
    );
    for (const hostedId of hostedIds) {
      if (backedUpHostedIds.includes(hostedId)) continue;
      trashRunnerInstalledProgram(state, hostedId);
    }
    const definition = deps.definitionFor(state, cardId);
    const instance = deps.mustInstance(state.cardInstances, cardId);
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
    deps.removeFromAllZones(state, cardId);
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
      deps.clearCardCounters(state, cardId);
      return;
    }
    state.runner.heap.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutHost,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    };
    deps.clearCardCounters(state, cardId);
  }

  function backupProgramsOnTrashBackupHardwareBeforeTrash(
    state: GameState,
    candidateProgramIds: CardInstanceId[],
  ): CardInstanceId[] {
    const microtechId = deps.installedProgramTrashBackupHardwareIds(state)[0];
    if (!microtechId) return [];
    const eligible = candidateProgramIds
      .filter((cardId) => state.runner.rig.programs.includes(cardId))
      .filter((cardId) => deps.definitionFor(state, cardId).type === "program")
      .filter((cardId) => cardId !== microtechId)
      .sort();
    if (eligible.length === 0) return [];
    for (const cardId of eligible) {
      if (runnerProgramUsesMemory(state, cardId))
        state.runner.memoryUsed = Math.max(
          0,
          state.runner.memoryUsed -
            (deps.definitionFor(state, cardId).memoryCost ?? 0),
        );
      deps.setHostedOn(state, cardId, microtechId);
      state.cardInstances[cardId] = {
        ...deps.mustInstance(state.cardInstances, cardId),
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
    const instance = deps.mustInstance(state.cardInstances, cardId);
    if (!instance.hostedOn) return true;
    const hostDefinition = deps.definitionFor(state, instance.hostedOn);
    if (
      (hostDefinition.type === "program" &&
        deps.cardHasSubtype(hostDefinition, "daemon")) ||
      deps.runnerUtilityLongtailKindForDefinition(hostDefinition.id) ===
        "replace_installed_program_trash_with_host_on_source"
    )
      return false;
    return true;
  }

  function runnerInstalledProgramMemoryCost(
    state: GameState,
    cardId: CardInstanceId,
  ): number {
    const instance = deps.mustInstance(state.cardInstances, cardId);
    if (instance.installedAsRunnerProgram)
      return Math.max(
        0,
        Math.floor(instance.installedAsRunnerProgram.memoryCost ?? 0),
      );
    return Math.max(
      0,
      Math.floor(deps.definitionFor(state, cardId).memoryCost ?? 0),
    );
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
    const definition = deps.definitionFor(state, cardId);
    const sourceInstance = deps.mustInstance(state.cardInstances, cardId);
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
    deps.executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      cardId,
      "on_leave_play",
    );
    for (const hostedId of deps.hostedCardsOn(state, cardId)) {
      const hostedDefinition = deps.definitionFor(state, hostedId);
      if (hostedDefinition.type === "program")
        trashRunnerInstalledProgram(state, hostedId);
    }
    const instanceAfterLifecycle = deps.mustInstance(
      state.cardInstances,
      cardId,
    );
    const { hostedOn: _hostedOn, ...withoutHost } = instanceAfterLifecycle;
    void _hostedOn;
    deps.removeFromAllZones(state, cardId);
    if (
      definition.type === "hardware" &&
      !deps.hasCardImplementationMemoryUnitModifier(definition) &&
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
    deps.clearCardCounters(state, cardId);
  }

  function returnRunnerInstalledCardToGrip(
    state: GameState,
    cardId: CardInstanceId,
  ): void {
    const definition = deps.definitionFor(state, cardId);
    if (!deps.runnerInstalledCardIds(state).includes(cardId)) return;
    const sourceInstance = deps.mustInstance(state.cardInstances, cardId);
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
      deps.removeFromAllZones(state, cardId);
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
      deps.clearCardCounters(state, cardId);
      return;
    }
    if (
      definition.type === "hardware" &&
      !deps.hasCardImplementationMemoryUnitModifier(definition) &&
      (definition.memoryLimitBonus ?? 0) > 0
    )
      state.runner.memoryLimit = Math.max(
        0,
        state.runner.memoryLimit - (definition.memoryLimitBonus ?? 0),
      );
    const instanceAfterLifecycle = deps.mustInstance(
      state.cardInstances,
      cardId,
    );
    const { hostedOn: _hostedOn, ...withoutHost } = instanceAfterLifecycle;
    void _hostedOn;
    deps.removeFromAllZones(state, cardId);
    state.runner.grip.push(cardId);
    state.cardInstances[cardId] = {
      ...withoutHost,
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "grip" },
    };
    deps.clearCardCounters(state, cardId);
  }

  function returnRunnerInstalledProgramsToGripForAccess(
    state: GameState,
    cardIds: readonly CardInstanceId[],
  ): { publicPayload: Record<string, string | number | boolean> } {
    let daemonHostedTrashCount = 0;
    const returnedDefinitionIds: string[] = [];
    for (const cardId of cardIds) {
      if (!state.runner.rig.programs.includes(cardId)) continue;
      if (deps.definitionFor(state, cardId).type !== "program") continue;
      const hostedIds = deps.hostedCardsOn(state, cardId);
      for (const hostedId of hostedIds) {
        if (!state.runner.rig.programs.includes(hostedId)) continue;
        trashRunnerInstalledCardToHeap(state, hostedId);
        daemonHostedTrashCount += 1;
      }
      returnedDefinitionIds.push(deps.definitionFor(state, cardId).id);
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
    for (const hostedId of deps.hostedCardsOn(state, cardId)) {
      const hostedInstance = deps.mustInstance(state.cardInstances, hostedId);
      if (hostedInstance.owner === "corp")
        trashCorpInstalledCardToArchives(state, hostedId, legalAction);
    }
    const instance = deps.mustInstance(state.cardInstances, cardId);
    const definition = deps.definitionFor(state, cardId);
    const sourceServerId =
      instance.zone.side === "corp" && instance.zone.zone === "serverRoot"
        ? instance.zone.serverId
        : undefined;
    const leavesFortCapacityModifier = deps
      .leavePlayCleanupImplementationsForCard(state, cardId)
      .some(
        (cleanup: CardLeavePlayCleanupImplementation) =>
          cleanup.kind === "trash_agenda_or_node_if_fort_over_capacity" &&
          cleanup.target === "agenda_or_node_inside_same_fort",
      );
    const rezzedNevinyrralLeftPlay =
      deps.uniqueDirectLongtailKindForDefinition(definition.id) ===
        "rezzed_leave_action_gain_asset" && instance.rezzed === true;
    const { hostedOn: _hostedOn, ...withoutHost } = instance;
    void _hostedOn;
    deps.removeFromAllZones(state, cardId);
    state.corp.archives.push(cardId);
    state.cardInstances[cardId] = {
      ...deps.withoutVariableIceState(withoutHost),
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    deps.clearCardCounters(state, cardId);
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
    const capacity = deps.corpRootAgendaOrNodeCapacityInServer(state, server);
    const mainIds = deps.corpRootMainCardIdsInServer(state, server);
    if (mainIds.length <= capacity) return;
    const targetId = mainIds[0];
    if (!targetId) return;
    const targetDefinition = deps.definitionFor(state, targetId);
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
          sourceTitle: deps.publicCardTitle(sourceDefinitionId),
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

  function drawRunnerCardIntoGrip(
    state: GameState,
  ): CardInstanceId | undefined {
    const cardId = state.runner.stack.shift();
    if (!cardId) return undefined;
    state.runner.grip.push(cardId);
    state.cardInstances[cardId] = {
      ...deps.mustInstance(state.cardInstances, cardId),
      zone: { side: "runner", zone: "grip" },
    };
    return cardId;
  }

  function drawRunnerCard(
    state: GameState,
    drawTaxDecision: DrawTaxDecision = "auto",
  ): RunnerDrawSummary {
    const summary = deps.emptyRunnerDrawSummary();
    const cardId = drawRunnerCardIntoGrip(state);
    if (!cardId) return summary;
    summary.drawnCount = 1;
    (summary.drawnCardIds ??= []).push(cardId);
    if (drawTaxDecision === "none") return summary;
    const drawTaxSourceCardIds = deps.drawTaxSourceIds(state);
    if (drawTaxSourceCardIds.length > 0)
      throw new Error(
        "City Surveillance muss ueber die suspendierbare Ziehsequenz aufgeloest werden.",
      );
    return summary;
  }

  function openRunnerDrawTaxChoice(state: GameState): void {
    const sequence = state.runnerDrawSequence;
    if (!sequence) throw new Error("Es ist keine Runner-Ziehsequenz aktiv.");
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    const sourceCardId =
      sequence.currentDrawTaxSourceIds[sequence.currentDrawTaxSourceIndex];
    if (!sourceCardId) throw new Error("Die City-Surveillance-Quelle fehlt.");
    const options = [
      ...(state.runner.credits > 0
        ? [
            {
              id: "pay_credit",
              label: "1 Credit zahlen",
              value: "pay_credit",
            },
          ]
        : []),
      {
        id: "take_tag",
        label: "1 Tag nehmen",
        value: "take_tag",
      },
    ];
    state.pendingChoice = {
      choiceId: `runner_draw_draw_tax_${sequence.sequenceId}_${sequence.currentDrawTaxSourceIndex}_${state.stateVersion + 1}`,
      side: "runner",
      source: `runner_draw.draw_tax:${sequence.sequenceId}:${sourceCardId}:${sequence.currentDrawTaxSourceIndex}`,
      prompt: "City Surveillance: 1 Credit zahlen oder 1 Tag nehmen?",
      kind: "select_option",
      options,
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "public",
    };
  }

  function affordableUnrezzedDrawTaxSourceIds(
    state: GameState,
  ): CardInstanceId[] {
    return state.corp.servers
      .flatMap((server) => server.root)
      .filter((cardId) => {
        const instance = deps.mustInstance(state.cardInstances, cardId);
        return (
          instance.rezzed !== true &&
          deps.isDrawTaxSourceDefinition(state, cardId) &&
          state.corp.credits >= deps.rezCostForCard(state, cardId)
        );
      });
  }

  function openRunnerDrawTaxRezChoice(
    state: GameState,
    sourceCardIds: readonly CardInstanceId[],
  ): void {
    const sequence = state.runnerDrawSequence;
    if (!sequence) throw new Error("Es ist keine Runner-Ziehsequenz aktiv.");
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    state.pendingChoice = {
      choiceId: `runner_draw_draw_tax_rez_${sequence.sequenceId}_${state.stateVersion + 1}`,
      side: "corp",
      source: `runner_draw.draw_tax_rez:${sequence.sequenceId}`,
      prompt: "City Surveillance unmittelbar vor dem Ziehen rezzen?",
      kind: "select_option",
      options: [
        ...sourceCardIds.map((cardId) => ({
          id: `rez_${cardId}`,
          label: `City Surveillance für ${deps.rezCostForCard(state, cardId)} Credit rezzen`,
          publicLabel: "Installierte Karte rezzen",
          value: cardId,
        })),
        { id: "pass", label: "Passen", value: "pass" },
      ],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion + 1,
      visibility: "hidden_info_barrier",
    };
  }

  function continueRunnerDrawSequence(state: GameState): RunnerDrawSummary {
    const summary = deps.emptyRunnerDrawSummary();
    const sequence = state.runnerDrawSequence;
    if (!sequence) return summary;

    while (true) {
      if (
        sequence.currentDrawTaxSourceIndex <
        sequence.currentDrawTaxSourceIds.length
      ) {
        openRunnerDrawTaxChoice(state);
        return summary;
      }

      if (sequence.remainingDrawCount <= 0 || state.runner.stack.length <= 0) {
        const crashSourceId = sequence.crashEverettSourceCardId;
        const drawnCardIds = sequence.drawnCardIds.slice();
        delete state.runnerDrawSequence;
        if (crashSourceId && drawnCardIds.length > 0) {
          startCrashEverettDrawChoice(state, crashSourceId, drawnCardIds);
          summary.crashEverettSourceCardId = crashSourceId;
          summary.crashEverettChoiceOpened = true;
        }
        return summary;
      }

      if (!sequence.preDrawRezWindowPassed) {
        const rezSourceIds = affordableUnrezzedDrawTaxSourceIds(state);
        if (rezSourceIds.length > 0) {
          openRunnerDrawTaxRezChoice(state, rezSourceIds);
          return summary;
        }
        sequence.preDrawRezWindowPassed = true;
      }

      const cardId = drawRunnerCardIntoGrip(state);
      if (!cardId) {
        sequence.remainingDrawCount = 0;
        continue;
      }
      sequence.remainingDrawCount -= 1;
      sequence.drawnCardIds.push(cardId);
      summary.drawnCount += 1;
      (summary.drawnCardIds ??= []).push(cardId);
      sequence.currentDrawTaxSourceIds = deps.drawTaxSourceIds(state);
      sequence.currentDrawTaxSourceIndex = 0;
      sequence.preDrawRezWindowPassed = false;
      sequence.drawTaxSourceCount = Math.max(
        sequence.drawTaxSourceCount,
        sequence.currentDrawTaxSourceIds.length,
      );
      summary.drawTaxSourceCount = Math.max(
        summary.drawTaxSourceCount,
        sequence.currentDrawTaxSourceIds.length,
      );
    }
  }

  function activeCrashEverettSourceId(
    state: GameState,
  ): CardInstanceId | undefined {
    return state.runner.rig.resources
      .filter(
        (cardId) =>
          deps.remainingReplacementLongtailKindForCard(state, cardId) ===
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
      const title = deps.definitionFor(state, cardId).title;
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
      sourceCardInstanceId: sourceCardId,
      sourceCardDefinitionId: deps.definitionFor(state, sourceCardId).id,
      continuation: {
        family: "runner_hidden_draw_keep_or_top_replacement",
        originActionId: "",
        sourceCardInstanceId: sourceCardId,
        sourceCardDefinitionId: deps.definitionFor(state, sourceCardId).id,
        drawnCardInstanceIds: [...drawnCardIds],
        createdAtStateVersion: state.stateVersion + 1,
      },
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
    if (state.runnerDrawSequence)
      throw new Error("Es ist bereits eine Runner-Ziehsequenz aktiv.");
    let summary = deps.emptyRunnerDrawSummary();
    const crashSourceId =
      amount > 0 ? activeCrashEverettSourceId(state) : undefined;
    const drawAmount = amount + (crashSourceId ? 1 : 0);
    if (
      drawAmount > 0 &&
      (deps.drawTaxSourceIds(state).length > 0 ||
        affordableUnrezzedDrawTaxSourceIds(state).length > 0)
    ) {
      state.runnerDrawSequence = {
        sequenceId: `${state.stateVersion + 1}`,
        remainingDrawCount: drawAmount,
        drawnCardIds: [],
        currentDrawTaxSourceIds: [],
        currentDrawTaxSourceIndex: 0,
        preDrawRezWindowPassed: false,
        drawTaxSourceCount: 0,
        drawTaxCreditsPaid: 0,
        drawTaxTagsAdded: 0,
        ...(crashSourceId ? { crashEverettSourceCardId: crashSourceId } : {}),
      };
      return continueRunnerDrawSequence(state);
    }
    for (let index = 0; index < drawAmount; index += 1)
      summary = deps.mergeRunnerDrawSummary(
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

  function resolveRunnerDrawSequenceChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    const sequence = state.runnerDrawSequence;
    if (!choice || !sequence)
      throw new Error("Es ist keine City-Surveillance-Choice offen.");
    if (choice.source.startsWith("runner_draw.draw_tax_rez:")) {
      resolveRunnerDrawTaxRezChoice(state, legalAction, playerAction, choice);
      return;
    }
    if (!choice.source.startsWith("runner_draw.draw_tax:"))
      throw new Error("Es ist keine City-Surveillance-Choice offen.");
    if (choice.side !== "runner" || legalAction.side !== "runner")
      throw new Error("Nur der Runner darf City Surveillance aufloesen.");
    const [, choiceSequenceId = "", sourceCardId = "", sourceIndex = ""] =
      choice.source.split(":");
    if (choiceSequenceId !== sequence.sequenceId)
      throw new Error("Die Runner-Ziehsequenz ist veraltet.");
    const expectedSourceId =
      sequence.currentDrawTaxSourceIds[sequence.currentDrawTaxSourceIndex];
    if (
      expectedSourceId !== sourceCardId ||
      Number(sourceIndex) !== sequence.currentDrawTaxSourceIndex
    )
      throw new Error("Die City-Surveillance-Quelle ist veraltet.");
    const selected = deps.selectedChoiceIds(playerAction.selectedChoices)[0];
    if (!choice.options.some((option) => option.id === selected))
      throw new Error("Die City-Surveillance-Auswahl ist ungueltig.");

    let creditsPaid = 0;
    let tagsAdded = 0;
    if (selected === "pay_credit") {
      if (state.runner.credits <= 0)
        throw new Error("City Surveillance kann nicht bezahlt werden.");
      deps.spendCredits(state, "runner", 1);
      sequence.drawTaxCreditsPaid += 1;
      creditsPaid = 1;
    } else if (selected === "take_tag") {
      // The draw sequence owns the continuation because the Add-Tag window can
      // span several runner choices before the draw may continue.
    } else {
      throw new Error("City Surveillance braucht Credit oder Tag.");
    }

    const sourceCount = sequence.currentDrawTaxSourceIds.length;
    sequence.currentDrawTaxSourceIndex += 1;
    delete state.pendingChoice;
    if (selected === "take_tag") {
      const runnerTagsBefore = state.runner.tags;
      state.pendingAddTagContinuation = {
        kind: "runner_draw_tax",
        sequenceId: sequence.sequenceId,
        sourceCardId: sourceCardId as CardInstanceId,
        sourceIndex: Number(sourceIndex),
        runnerTagsBefore,
      };
      const suspended = deps.addRunnerTagsWithPrevention(
        state,
        legalAction,
        1,
        deps.definitionFor(state, sourceCardId as CardInstanceId).id,
      );
      if (suspended) {
        legalAction.payload = {
          ...(legalAction.payload ?? {}),
          sourceDefinitionId: deps.definitionFor(
            state,
            sourceCardId as CardInstanceId,
          ).id,
          drawTaxDecision: "tag",
          drawTaxSourceCount: sourceCount,
          drawTaxCreditsPaid: 0,
          drawTaxTagsAdded: 0,
          drawTaxTags: 0,
          runnerCreditsAfter: state.runner.credits,
          runnerTagsAfter: state.runner.tags,
        };
        return;
      }
      delete state.pendingAddTagContinuation;
      tagsAdded = Math.max(0, state.runner.tags - runnerTagsBefore);
      sequence.drawTaxTagsAdded += tagsAdded;
    }
    const continuationSummary = continueRunnerDrawSequence(state);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: deps.definitionFor(state, sourceCardId).id,
      drawTaxDecision: selected === "pay_credit" ? "pay" : "tag",
      drawTaxSourceCount: sourceCount,
      drawTaxCreditsPaid: creditsPaid,
      drawTaxTagsAdded: tagsAdded,
      drawTaxTags: tagsAdded,
      runnerCreditsAfter: state.runner.credits,
      runnerTagsAfter: state.runner.tags,
      ...runnerDrawContinuationPayload(continuationSummary),
    };
  }

  function resumeRunnerDrawSequenceAfterTagPrevention(
    state: GameState,
    legalAction: LegalAction,
  ): void {
    const continuation = state.pendingAddTagContinuation;
    const sequence = state.runnerDrawSequence;
    if (!continuation || continuation.kind !== "runner_draw_tax" || !sequence)
      throw new Error("Es ist keine Runner-Zieh-Tag-Fortsetzung offen.");
    if (
      sequence.sequenceId !== continuation.sequenceId ||
      sequence.currentDrawTaxSourceIndex !== continuation.sourceIndex + 1 ||
      sequence.currentDrawTaxSourceIds[continuation.sourceIndex] !==
        continuation.sourceCardId
    )
      throw new Error("Die Runner-Zieh-Tag-Fortsetzung ist veraltet.");
    delete state.pendingAddTagContinuation;
    const tagsAdded = Math.max(
      0,
      state.runner.tags - continuation.runnerTagsBefore,
    );
    sequence.drawTaxTagsAdded += tagsAdded;
    const continuationSummary = continueRunnerDrawSequence(state);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: deps.definitionFor(state, continuation.sourceCardId)
        .id,
      drawTaxDecision: "tag",
      drawTaxSourceCount: sequence.currentDrawTaxSourceIds.length,
      drawTaxCreditsPaid: 0,
      drawTaxTagsAdded: tagsAdded,
      drawTaxTags: tagsAdded,
      runnerCreditsAfter: state.runner.credits,
      runnerTagsAfter: state.runner.tags,
      ...runnerDrawContinuationPayload(continuationSummary),
    };
  }

  function runnerDrawContinuationPayload(
    summary: RunnerDrawSummary,
  ): Record<string, string | number | boolean> {
    return {
      ...(summary.drawnCount > 0 ? { drawnCount: summary.drawnCount } : {}),
      ...(summary.crashEverettChoiceOpened
        ? {
            drawReplacementSourceTitle: "Crash Everett, Inventive Fixer",
            drawReplacementExtraDrawn: 1,
            crashEverettChoiceOpened: true,
          }
        : {}),
    };
  }

  function resolveRunnerDrawTaxRezChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
    choice: ChoiceRequest,
  ): void {
    const sequence = state.runnerDrawSequence;
    if (!sequence) throw new Error("Es ist keine Runner-Ziehsequenz aktiv.");
    if (choice.side !== "corp" || legalAction.side !== "corp")
      throw new Error("Nur die Korp darf City Surveillance rezzen.");
    const [, choiceSequenceId = ""] = choice.source.split(":");
    if (choiceSequenceId !== sequence.sequenceId)
      throw new Error("Die Runner-Ziehsequenz ist veraltet.");
    const selected = deps.selectedChoiceIds(playerAction.selectedChoices)[0];
    if (!choice.options.some((option) => option.id === selected))
      throw new Error("Die City-Surveillance-Rez-Auswahl ist ungueltig.");
    delete state.pendingChoice;
    if (selected === "pass") {
      sequence.preDrawRezWindowPassed = true;
      const continuationSummary = continueRunnerDrawSequence(state);
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...runnerDrawContinuationPayload(continuationSummary),
      };
      return;
    }

    const sourceCardId = selected?.startsWith("rez_")
      ? (selected.slice("rez_".length) as CardInstanceId)
      : undefined;
    if (!sourceCardId)
      throw new Error("Die City-Surveillance-Rez-Auswahl ist ungueltig.");
    if (!affordableUnrezzedDrawTaxSourceIds(state).includes(sourceCardId))
      throw new Error("City Surveillance kann nicht mehr gerezzt werden.");
    const instance = deps.mustInstance(state.cardInstances, sourceCardId);
    const definition = deps.definitionFor(state, sourceCardId);
    const rezCost = deps.rezCostForCard(state, sourceCardId);
    deps.spendCredits(state, "corp", rezCost);
    state.cardInstances[sourceCardId] = {
      ...instance,
      faceup: true,
      rezzed: true,
    };
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      rezCostPaid: rezCost,
      corpCreditsAfter: state.corp.credits,
    };
    deps.executeCardImplementationLifecycleEffects(
      deps.cardImplementationRuntimeDeps,
      state,
      legalAction,
      definition,
      sourceCardId,
      "on_rez",
    );
    const continuationSummary = continueRunnerDrawSequence(state);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerDrawContinuationPayload(continuationSummary),
    };
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
      deps.remainingReplacementLongtailKindForCard(
        state,
        sourceCardId as CardInstanceId,
      ) !== "hidden_draw_keep_or_top_replacement"
    )
      throw new Error("Crash Everett ist nicht mehr installiert.");
    const selected =
      deps.selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
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
    deps.removeFromAllZones(state, cardId as CardInstanceId);
    if (disposition === "trash") {
      state.runner.heap.push(cardId as CardInstanceId);
      state.cardInstances[cardId] = {
        ...deps.mustInstance(state.cardInstances, cardId as CardInstanceId),
        faceup: true,
        rezzed: true,
        zone: { side: "runner", zone: "heap" },
      };
    } else if (disposition === "top") {
      state.runner.stack.unshift(cardId as CardInstanceId);
      state.cardInstances[cardId] = {
        ...deps.mustInstance(state.cardInstances, cardId as CardInstanceId),
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
      sourceDefinitionId: deps.definitionFor(
        state,
        sourceCardId as CardInstanceId,
      ).id,
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
    resolveRunnerDrawSequenceChoice,
    resumeRunnerDrawSequenceAfterTagPrevention,
  };
}
