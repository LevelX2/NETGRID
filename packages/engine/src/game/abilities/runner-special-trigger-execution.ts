import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  Side,
  SpecialZoneState,
} from "@netgrid/shared";

export type RunnerSpecialTriggerExecutionHost = {
  state: GameState;
  actions: {
    spendClick: (state: GameState, side: Side) => void;
  };
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    mustInstance: (
      source: Record<CardInstanceId, CardInstance>,
      cardId: CardInstanceId,
    ) => CardInstance;
    isUniqueCard: (definition: CardDefinition) => boolean;
    hasInstalledUniqueCardDefinition: (
      state: GameState,
      side: Side,
      definitionId: CardDefinitionId,
    ) => boolean;
    hasCardImplementationMemoryUnitModifier: (
      definition: CardDefinition,
    ) => boolean;
    shouldLoadLegacyRecurringCredits: (definition: CardDefinition) => boolean;
    publicTitle: (definitionId: CardDefinitionId) => string;
  };
  credits: {
    spend: (state: GameState, side: Side, amount: number) => void;
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    setCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    spendCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: CardInstanceId) => void;
    ensureSpecialZones: (state: GameState) => SpecialZoneState;
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  runner: {
    runnerMemoryLimit: (state: GameState) => number;
  };
  hiddenZone: {
    startSelfModifyingCodeStackActivation: (
      sourceCardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
  };
  constants: {
    BUTCHER_BOY_ID: string;
    JUNKYARD_BBS_ID: string;
    SELF_MODIFYING_CODE_ID: string;
    SHELL_TRADERS_ID: string;
    SKIVVISS_ID: string;
  };
};

export type RunnerSpecialTriggerExecutionResult = {
  handled: boolean;
  actionType?: LegalAction["type"];
};

export function handleRunnerSpecialTriggerExecution(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
): RunnerSpecialTriggerExecutionResult {
  if (legalAction.type !== "trigger_ability") return { handled: false };

  if (
    legalAction.payload?.v1911HiddenZoneAbility ===
    "self_modifying_code_install_program"
  ) {
    resolveSelfModifyingCodeAbility(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.resourceAbility === "junkyard_bbs_return_top_heap") {
    resolveJunkyardBbsAbility(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.shellTradersAbility === "set_aside_from_grip") {
    resolveShellTradersSetAside(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.shellTradersAbility === "remove_shell_counter") {
    resolveShellTradersRemoveCounter(host, legalAction);
    return handled(legalAction);
  }

  return { handled: false };
}

export function topRunnerHeapCardId(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.heap.at(-1);
}

export function shellTradersInstallCost(definition: CardDefinition): number {
  const value = Number(definition.installCost ?? 0);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0)
    throw new Error("Shell-Traders-Installationskosten sind ungueltig.");
  return value;
}

export function shellTradersPrepareTargetIds(
  host: RunnerSpecialTriggerExecutionHost,
): CardInstanceId[] {
  return host.state.runner.grip
    .filter((cardId) => shellTradersCanPrepareTarget(host, cardId))
    .sort();
}

export function shellTradersPreparedTargetIds(
  host: RunnerSpecialTriggerExecutionHost,
): CardInstanceId[] {
  return (host.state.specialZones?.setAside ?? [])
    .filter((cardId) => {
      const instance = host.state.cardInstances[cardId];
      if (!instance) return false;
      if (instance.owner !== "runner" || instance.zone.side !== "special")
        return false;
      if (instance.zone.zone !== "set_aside") return false;
      if (instance.zone.visibility !== "public") return false;
      const shellCounters = host.counters.cardCounter(
        host.state,
        cardId,
        "shell",
      );
      if (shellCounters <= 0) return false;
      const definition = host.cards.definitionFor(host.state, cardId);
      if (definition.type !== "program" && definition.type !== "hardware")
        return false;
      // Only the final Shell counter is gated by installability: earlier
      // counters may still be removed while the delayed install target drifts.
      return (
        shellCounters > 1 ||
        shellTradersCanInstallPreparedCardForFree(host, cardId, definition)
      );
    })
    .sort();
}

export function applyShellTradersStartOfTurn(
  host: RunnerSpecialTriggerExecutionHost,
  effects?: ResolvedGameEffect[],
): void {
  const { state } = host;
  const flags = (state.runnerTurnFlags ??= {
    stoleAgendaThisTurn: false,
    stoleAgendaLastTurn: false,
    stolenAgendaAdvancementCountersThisTurn: 0,
    stolenAgendaAdvancementCountersLastTurn: 0,
    runnerReceivedTagThisTurn: false,
    stoleResearchAgendaThisTurn: false,
    stoleGrayOpsAgendaThisTurn: false,
    runAttemptsThisTurn: 0,
    runAttemptsLastTurn: 0,
    successfulHqRunThisTurn: false,
    successfulRunThisTurn: false,
    damagePreventionUsage: {},
    runnerActionsTakenThisTurn: 0,
    abilityUsedSourceIdsByLimitKey: {},
    startOfTurnFloatingCreditsApplied: false,
    allNighterBonusRunPending: false,
  } as NonNullable<GameState["runnerTurnFlags"]>);
  const resolvedSourceIds = (flags.shellTradersStartTurnResolvedSourceIds ??= []);
  for (const sourceCardId of state.runner.rig.resources.slice().sort()) {
    if (
      host.cards.definitionFor(state, sourceCardId).id !==
      host.constants.SHELL_TRADERS_ID
    )
      continue;
    if (resolvedSourceIds.includes(sourceCardId)) continue;
    const targetCardId = shellTradersPreparedTargetIds(host)[0];
    if (!targetCardId) continue;
    resolvedSourceIds.push(sourceCardId);
    const targetDefinition = host.cards.definitionFor(state, targetCardId);
    const result = removeShellCounterAndMaybeInstall(host, targetCardId);
    effects?.push({
      effectId: `runner.start.shell_traders.${sourceCardId}.${targetCardId}`,
      kind: "counter_change",
      visibility: "public",
      side: "runner",
      amount: result.remainingCounters,
      reason: "start_of_turn",
      counterType: "shell",
      removedCounterAmount: 1,
      remainingCounters: result.remainingCounters,
      sourceDefinitionId: host.constants.SHELL_TRADERS_ID,
      sourceTitle: host.cards.publicTitle(
        host.constants.SHELL_TRADERS_ID as CardDefinitionId,
      ),
      cardDefinitionId: targetDefinition.id,
      cardTitle: host.cards.publicTitle(targetDefinition.id),
    });
  }
}

function resolveJunkyardBbsAbility(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Junkyard BBS nutzen.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("Junkyard BBS ist nicht installiert.");
  if (
    host.cards.definitionFor(state, sourceCardId).id !==
    host.constants.JUNKYARD_BBS_ID
  )
    throw new Error("Die Junkyard-BBS-Faehigkeit passt nicht zur Karte.");
  if (
    clickCostForAction(legalAction) !== 1 ||
    creditCostForAction(legalAction) !== 1
  )
    throw new Error("Junkyard BBS verlangt genau 1 Klick und 1 Credit.");

  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  const currentTopCardId = topRunnerHeapCardId(state);
  if (!targetCardId || !currentTopCardId || targetCardId !== currentTopCardId)
    throw new Error("Die Zielkarte ist nicht die oberste Karte im Heap.");
  if (!state.runner.heap.includes(targetCardId))
    throw new Error("Die Junkyard-BBS-Zielkarte liegt nicht im Heap.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Junkyard-BBS-Zielkarte hat sich geaendert.");

  host.actions.spendClick(state, "runner");
  host.credits.spend(state, "runner", 1);
  state.runner.heap = state.runner.heap.filter((id) => id !== targetCardId);
  state.runner.grip.unshift(targetCardId);
  state.cardInstances[targetCardId] = {
    ...host.cards.mustInstance(state.cardInstances, targetCardId),
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.constants.JUNKYARD_BBS_ID,
    targetCardDefinitionId: targetDefinition.id,
    returnedCardDefinitionId: targetDefinition.id,
    returnedCount: 1,
    sourceZone: "heap",
    destinationZone: "grip",
    returnedToGrip: true,
    runnerCreditsAfter: state.runner.credits,
  };
}

function resolveShellTradersSetAside(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf The Shell Traders nutzen.");
  if (state.phase !== "runner_action_phase")
    throw new Error("The Shell Traders darf nur im Runner-Zug genutzt werden.");
  if (
    clickCostForAction(legalAction) !== 1 ||
    creditCostForAction(legalAction) !== 0
  )
    throw new Error("The Shell Traders verlangt genau 1 Klick.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("The Shell Traders ist nicht installiert.");
  if (
    host.cards.definitionFor(state, sourceCardId).id !==
    host.constants.SHELL_TRADERS_ID
  )
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!shellTradersCanPrepareTarget(host, targetCardId))
    throw new Error("The Shell Traders hat kein gueltiges Ziel.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");
  const shellCounterAmount = shellTradersInstallCost(targetDefinition);
  const payloadCounterAmount = Number(
    legalAction.payload?.shellCounterAmount ?? shellCounterAmount,
  );
  if (
    !Number.isInteger(payloadCounterAmount) ||
    payloadCounterAmount !== shellCounterAmount
  )
    throw new Error("Die Shell-Counter-Anzahl passt nicht mehr zum Ziel.");

  host.actions.spendClick(state, "runner");
  host.zones.removeFromAllZones(state, targetCardId);
  const specialZones = host.zones.ensureSpecialZones(state);
  specialZones.setAside.push(targetCardId);
  specialZones.setAside.sort();
  state.cardInstances[targetCardId] = {
    ...host.cards.mustInstance(state.cardInstances, targetCardId),
    faceup: true,
    rezzed: true,
    zone: {
      side: "special",
      zone: "set_aside",
      visibility: "public",
      returnZone: { side: "runner", zone: "rig" },
    },
  };
  host.counters.setCardCounter(state, targetCardId, "shell", shellCounterAmount);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "shell_traders_set_aside",
    sourceDefinitionId: host.constants.SHELL_TRADERS_ID,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    addedCounterAmount: shellCounterAmount,
    shellCounterAmount,
    remainingCounters: shellCounterAmount,
    specialZone: "set_aside",
    specialZoneVisibility: "public",
  };
}

function resolveShellTradersRemoveCounter(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf The Shell Traders nutzen.");
  if (state.phase !== "runner_action_phase")
    throw new Error("The Shell Traders darf nur im Runner-Zug genutzt werden.");
  if (
    clickCostForAction(legalAction) !== 0 ||
    creditCostForAction(legalAction) !== 1
  )
    throw new Error("Shell-Counter entfernen kostet genau 1 Credit.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.resources.includes(sourceCardId))
    throw new Error("The Shell Traders ist nicht installiert.");
  if (
    host.cards.definitionFor(state, sourceCardId).id !==
    host.constants.SHELL_TRADERS_ID
  )
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!shellTradersPreparedTargetIds(host).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");

  host.credits.spend(state, "runner", 1);
  const result = removeShellCounterAndMaybeInstall(host, targetCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.constants.SHELL_TRADERS_ID,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    removedCounterAmount: 1,
    remainingCounters: result.remainingCounters,
    shellTradersInstalledTarget: result.installed,
    runnerCreditsAfter: state.runner.credits,
  };
}

function removeShellCounterAndMaybeInstall(
  host: RunnerSpecialTriggerExecutionHost,
  targetCardId: CardInstanceId,
): { remainingCounters: number; installed: boolean } {
  // Re-check the prepared target at resolution time because both paid and
  // start-of-turn removal can turn the last counter into an immediate install.
  if (!shellTradersPreparedTargetIds(host).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  host.counters.spendCardCounter(host.state, targetCardId, "shell", 1);
  const remainingCounters = host.counters.cardCounter(
    host.state,
    targetCardId,
    "shell",
  );
  if (remainingCounters > 0)
    return { remainingCounters, installed: false };
  installShellTradersPreparedCardForFree(host, targetCardId);
  return { remainingCounters, installed: true };
}

function installShellTradersPreparedCardForFree(
  host: RunnerSpecialTriggerExecutionHost,
  cardId: CardInstanceId,
): void {
  const { state } = host;
  const definition = host.cards.definitionFor(state, cardId);
  const instance = host.cards.mustInstance(state.cardInstances, cardId);
  if (
    instance.owner !== "runner" ||
    instance.zone.side !== "special" ||
    instance.zone.zone !== "set_aside"
  )
    throw new Error("The Shell Traders kann nur vorbereitete Runner-Karten installieren.");
  if (definition.type !== "program" && definition.type !== "hardware")
    throw new Error("The Shell Traders installiert nur Programme oder Hardware.");
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error("Eine Unique-Karte mit diesem Namen ist bereits installiert.");
  if (
    definition.type === "program" &&
    !shellTradersCanInstallPreparedCardForFree(host, cardId, definition)
  )
    throw new Error("Nicht genug Memory fuer The Shell Traders.");

  host.zones.removeFromAllZones(state, cardId);
  if (definition.type === "program") {
    state.runner.rig.programs.push(cardId);
    state.runner.memoryUsed += definition.memoryCost ?? 0;
  } else {
    state.runner.rig.hardware.push(cardId);
    if (!host.cards.hasCardImplementationMemoryUnitModifier(definition)) {
      if (definition.mechanics.includes("modify_memory_limit"))
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      else if ((definition.memoryLimitBonus ?? 0) > 0)
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
    }
  }
  state.cardInstances[cardId] = {
    ...host.cards.mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
  };
  host.counters.setCardCounter(state, cardId, "shell", 0);
  if (host.cards.shouldLoadLegacyRecurringCredits(definition))
    host.counters.setCardCounter(
      state,
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  if (
    definition.type === "program" &&
    definition.mechanics.includes("virus") &&
    definition.id !== host.constants.BUTCHER_BOY_ID &&
    definition.id !== host.constants.SKIVVISS_ID
  )
    host.counters.addCardCounter(state, cardId, "virus", 1);
}

function shellTradersCanInstallPreparedCardForFree(
  host: RunnerSpecialTriggerExecutionHost,
  cardId: CardInstanceId,
  definition = host.cards.definitionFor(host.state, cardId),
): boolean {
  const { state } = host;
  const instance = state.cardInstances[cardId];
  if (
    !instance ||
    instance.owner !== "runner" ||
    instance.zone.side !== "special" ||
    instance.zone.zone !== "set_aside"
  )
    return false;
  if (definition.type !== "program" && definition.type !== "hardware")
    return false;
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    return false;
  return (
    definition.type !== "program" ||
    state.runner.memoryUsed + (definition.memoryCost ?? 0) <=
      host.runner.runnerMemoryLimit(state)
  );
}

function resolveSelfModifyingCodeAbility(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side !== "runner")
    throw new Error("Nur der Runner darf Self-Modifying Code nutzen.");
  if (state.timingPoint !== "run.encounter_ice" || !state.run?.encounteredIceId)
    throw new Error("Self-Modifying Code ist nur während eines ICE-Encounters legal.");
  const sourceCardId = String(legalAction.payload?.cardId ?? "");
  if (!state.runner.rig.programs.includes(sourceCardId))
    throw new Error("Self-Modifying Code ist nicht installiert.");
  if (
    host.cards.definitionFor(state, sourceCardId).id !==
    host.constants.SELF_MODIFYING_CODE_ID
  )
    throw new Error("Die Self-Modifying-Code-Fähigkeit passt nicht zur Karte.");
  if (
    !state.runner.stack.some(
      (cardId) => host.cards.definitionFor(state, cardId).type === "program",
    )
  )
    throw new Error("Keine suchbare Programmkarte im Stack.");

  host.zones.trashRunnerInstalledCardToHeap(state, sourceCardId);
  host.hiddenZone.startSelfModifyingCodeStackActivation(
    sourceCardId,
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    sourceDefinitionId: host.constants.SELF_MODIFYING_CODE_ID,
    hiddenZoneAction: "self_modifying_code_install_program",
    trashOnUse: true,
    trashedCardDefinitionId: host.constants.SELF_MODIFYING_CODE_ID,
  };
}

function shellTradersCanPrepareTarget(
  host: RunnerSpecialTriggerExecutionHost,
  cardId: CardInstanceId,
): boolean {
  const { state } = host;
  if (!state.runner.grip.includes(cardId)) return false;
  const definition = host.cards.definitionFor(state, cardId);
  if (definition.type !== "program" && definition.type !== "hardware")
    return false;
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    return false;
  if (
    definition.type === "program" &&
    state.runner.memoryUsed + (definition.memoryCost ?? 0) >
      host.runner.runnerMemoryLimit(state)
  )
    return false;
  return true;
}

function clickCostForAction(legalAction: LegalAction): number {
  return (legalAction.costs ?? []).reduce(
    (sum, cost) => sum + (typeof cost.clicks === "number" ? cost.clicks : 0),
    0,
  );
}

function creditCostForAction(legalAction: LegalAction): number {
  return (legalAction.costs ?? []).reduce(
    (sum, cost) => sum + (typeof cost.credits === "number" ? cost.credits : 0),
    0,
  );
}

function handled(
  legalAction: LegalAction,
): RunnerSpecialTriggerExecutionResult {
  return { handled: true, actionType: legalAction.type };
}
