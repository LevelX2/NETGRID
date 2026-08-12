import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  PlayerAction,
  ResolvedGameEffect,
  Side,
  SpecialZoneState,
} from "@netgrid/shared";
import { selectedChoiceIds } from "../choices/choice-validation";
import { completeRunnerProgramRigInstall } from "../install/runner-rig-install-finalization";

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
    hiddenReplacementLongtailKindForDefinition: (
      definition: CardDefinition,
    ) => string | undefined;
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
    runnerProgramUsesMemory: (
      state: GameState,
      cardId: CardInstanceId,
    ) => boolean;
  };
  hiddenZone: {
    startHiddenStackProgramInstallActivation: (
      sourceCardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
  };
  lifecycle: {
    executeOnInstall: (
      legalAction: LegalAction | undefined,
      definition: CardDefinition,
      cardId: CardInstanceId,
      effects?: ResolvedGameEffect[],
    ) => void;
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

  if (legalAction.payload?.delayedInstallAbility === "set_aside_from_grip") {
    resolveDelayedInstallSetAside(host, legalAction);
    return handled(legalAction);
  }
  if (legalAction.payload?.delayedInstallAbility === "remove_shell_counter") {
    resolveDelayedInstallRemoveCounter(host, legalAction);
    return handled(legalAction);
  }

  return { handled: false };
}

export function topRunnerHeapCardId(
  state: GameState,
): CardInstanceId | undefined {
  return state.runner.heap.at(-1);
}

export function delayedInstallCounterCost(definition: CardDefinition): number {
  const value = Number(definition.installCost ?? 0);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0)
    throw new Error("Shell-Traders-Installationskosten sind ungueltig.");
  return value;
}

function isShellTradersSource(
  host: RunnerSpecialTriggerExecutionHost,
  sourceCardId: CardInstanceId,
): boolean {
  return (
    host.cards.hiddenReplacementLongtailKindForDefinition(
      host.cards.definitionFor(host.state, sourceCardId),
    ) === "delayed_install_with_counter_countdown"
  );
}

function shellTradersDefinitionId(
  host: RunnerSpecialTriggerExecutionHost,
  sourceCardId: CardInstanceId,
): CardDefinitionId {
  const definition = host.cards.definitionFor(host.state, sourceCardId);
  if (!isShellTradersSource(host, sourceCardId))
    throw new Error(
      "Die verzögerte Installationsfähigkeit passt nicht zur Karte.",
    );
  return definition.id;
}

export function delayedInstallPrepareTargetIds(
  host: RunnerSpecialTriggerExecutionHost,
): CardInstanceId[] {
  return host.state.runner.grip
    .filter((cardId) => delayedInstallCanPrepareTarget(host, cardId))
    .sort();
}

export function delayedInstallPreparedTargetIds(
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
        delayedInstallCanResolveFinalCounter(host, cardId, definition)
      );
    })
    .sort();
}

export function applyDelayedInstallStartOfTurn(
  host: RunnerSpecialTriggerExecutionHost,
  effects?: ResolvedGameEffect[],
): void {
  const { state } = host;
  if (state.pendingChoice) return;
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
    runnerActionOrdinal: 0,
    abilityUsedSourceIdsByLimitKey: {},
    startOfTurnFloatingCreditsApplied: false,
    bonusRunPending: false,
  } as NonNullable<GameState["runnerTurnFlags"]>);
  const resolvedSourceIds = (flags.delayedInstallStartTurnResolvedSourceIds ??=
    []);
  for (const sourceCardId of state.runner.rig.resources.slice().sort()) {
    if (!isShellTradersSource(host, sourceCardId)) continue;
    if (resolvedSourceIds.includes(sourceCardId)) continue;
    const targetCardIds = delayedInstallPreparedTargetIds(host);
    if (targetCardIds.length === 0) return;
    if (targetCardIds.length > 1) {
      startDelayedInstallStartTurnChoice(host, sourceCardId, targetCardIds);
      return;
    }
    const targetCardId = targetCardIds[0]!;
    resolvedSourceIds.push(sourceCardId);
    const installEffects: ResolvedGameEffect[] = [];
    const result = removeShellCounterAndMaybeInstall(host, targetCardId, {
      sourceCardId,
      reason: "start_turn",
      effects: installEffects,
    });
    if (result.memoryChoiceOpened) return;
    effects?.push(
      delayedInstallStartTurnCounterEffect(
        host,
        sourceCardId,
        targetCardId,
        result,
      ),
      ...installEffects,
    );
  }
}

export function resolveDelayedInstallStartTurnChoice(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
  effects?: ResolvedGameEffect[],
): void {
  const { state } = host;
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("runner_start.delayed_install:"))
    throw new Error("Es ist keine Shell-Traders-Startzugwahl offen.");
  if (legalAction.side !== "runner" || playerAction.side !== "runner")
    throw new Error("Nur der Runner darf das Shell-Traders-Ziel wählen.");

  const sourceCardId = choice.source.split(":")[1] as
    | CardInstanceId
    | undefined;
  if (
    !sourceCardId ||
    !state.runner.rig.resources.includes(sourceCardId) ||
    !isShellTradersSource(host, sourceCardId)
  )
    throw new Error("The Shell Traders ist nicht mehr installiert.");

  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (selectedOptionIds.length !== 1)
    throw new Error("Genau ein Shell-Traders-Ziel muss gewählt werden.");
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionIds[0],
  );
  const targetCardId =
    typeof selectedOption?.value === "string"
      ? (selectedOption.value as CardInstanceId)
      : undefined;
  if (
    !targetCardId ||
    !delayedInstallPreparedTargetIds(host).includes(targetCardId)
  )
    throw new Error("Das gewählte Shell-Traders-Ziel ist nicht mehr legal.");

  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  delete state.pendingChoice;
  const flags = state.runnerTurnFlags;
  if (!flags) throw new Error("Runner-Zugstatus fehlt.");
  const resolvedSourceIds = (flags.delayedInstallStartTurnResolvedSourceIds ??=
    []);
  if (!resolvedSourceIds.includes(sourceCardId))
    resolvedSourceIds.push(sourceCardId);
  const result = removeShellCounterAndMaybeInstall(host, targetCardId, {
    sourceCardId,
    reason: "start_turn",
    legalAction,
  });
  if (!result.memoryChoiceOpened) {
    effects?.push(
      delayedInstallStartTurnCounterEffect(
        host,
        sourceCardId,
        targetCardId,
        result,
      ),
    );
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    delayedInstallAbility: "start_turn_remove_shell_counter",
    abilityFamily: "hosting-counters",
    effectKind: "counter_change",
    sourceDefinitionId: shellTradersDefinitionId(host, sourceCardId),
    targetCardId,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    removedCounterAmount: result.memoryChoiceOpened ? 0 : 1,
    remainingCounters: result.remainingCounters,
    delayedInstallInstalledTarget: result.installed,
    delayedInstallMemoryChoiceOpened: result.memoryChoiceOpened,
  };
}

export function resolveDelayedInstallMemoryChoice(
  host: RunnerSpecialTriggerExecutionHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
  effects?: ResolvedGameEffect[],
): void {
  const { state } = host;
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1912.delayed_install_memory:"))
    throw new Error("Es ist keine Shell-Traders-MU-Wahl offen.");
  if (
    choice.side !== "runner" ||
    legalAction.side !== "runner" ||
    playerAction.side !== "runner"
  )
    throw new Error("Nur der Runner darf Shell-Traders-MU freimachen.");

  const [, sourceCardId, targetCardId, reason] = choice.source.split(":") as [
    string,
    CardInstanceId | undefined,
    CardInstanceId | undefined,
    "paid" | "start_turn" | undefined,
  ];
  if (
    !sourceCardId ||
    !state.runner.rig.resources.includes(sourceCardId) ||
    !isShellTradersSource(host, sourceCardId)
  )
    throw new Error("The Shell Traders ist nicht mehr installiert.");
  if (!targetCardId) throw new Error("Die Shell-Traders-Zielkarte fehlt.");
  if (reason !== "paid" && reason !== "start_turn")
    throw new Error("Der Shell-Traders-MU-Grund ist ungültig.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (targetDefinition.type !== "program")
    throw new Error("Nur Programme benötigen eine Shell-Traders-MU-Wahl.");
  if (!delayedInstallPreparedTargetIds(host).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht mehr vorbereitet.");
  if (host.counters.cardCounter(state, targetCardId, "shell") !== 1)
    throw new Error("Die Shell-Traders-MU-Wahl verlangt den letzten Counter.");

  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  const selectedCardIds = selectedOptionIds.map((optionId) => {
    const option = choice.options.find(
      (candidate) => candidate.id === optionId,
    );
    if (typeof option?.value !== "string")
      throw new Error(
        "Die Shell-Traders-MU-Wahl enthält eine ungültige Option.",
      );
    return option.value as CardInstanceId;
  });
  const uniqueCardIds = [...new Set(selectedCardIds)];
  if (uniqueCardIds.length !== selectedCardIds.length)
    throw new Error("Die Shell-Traders-MU-Wahl enthält doppelte Programme.");
  for (const cardId of uniqueCardIds) {
    if (
      !state.runner.rig.programs.includes(cardId) ||
      !host.runner.runnerProgramUsesMemory(state, cardId)
    )
      throw new Error(
        "Die Shell-Traders-MU-Wahl enthält kein gültiges installiertes Programm.",
      );
  }
  const freedMemory = uniqueCardIds.reduce(
    (sum, cardId) =>
      sum + (host.cards.definitionFor(state, cardId).memoryCost ?? 0),
    0,
  );
  if (
    state.runner.memoryUsed + (targetDefinition.memoryCost ?? 0) - freedMemory >
    host.runner.runnerMemoryLimit(state)
  )
    throw new Error("Die Shell-Traders-MU-Wahl macht nicht genug MU frei.");

  const trashedDefinitionIds = uniqueCardIds.map(
    (cardId) => host.cards.definitionFor(state, cardId).id,
  );
  for (const cardId of uniqueCardIds)
    host.zones.trashRunnerInstalledCardToHeap(state, cardId);
  delete state.pendingChoice;
  host.counters.spendCardCounter(state, targetCardId, "shell", 1);
  installDelayedPreparedCardForFree(host, targetCardId, legalAction);
  const result = { remainingCounters: 0, installed: true };
  if (reason === "start_turn") {
    effects?.push(
      delayedInstallStartTurnCounterEffect(
        host,
        sourceCardId,
        targetCardId,
        result,
      ),
    );
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    delayedInstallAbility: "resolve_delayed_install_memory",
    abilityFamily: "hosting-counters",
    abilityId: "resolve_delayed_install_memory",
    effectKind: "counter_change",
    sourceDefinitionId: shellTradersDefinitionId(host, sourceCardId),
    targetCardId,
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    removedCounterAmount: 1,
    remainingCounters: 0,
    delayedInstallInstalledTarget: true,
    trashedCount: uniqueCardIds.length,
    trashedCardDefinitionIds: trashedDefinitionIds.join(","),
    shellCounterRemovalReason: reason ?? "paid",
  };
}

function startDelayedInstallStartTurnChoice(
  host: RunnerSpecialTriggerExecutionHost,
  sourceCardId: CardInstanceId,
  targetCardIds: CardInstanceId[],
): void {
  const { state } = host;
  const nextStateVersion = state.stateVersion + 1;
  state.pendingChoice = {
    choiceId: `runner_start_delayed_install_${nextStateVersion}_${sourceCardId}`,
    side: "runner",
    source: `runner_start.delayed_install:${sourceCardId}:${nextStateVersion}`,
    prompt: `${host.cards.publicTitle(
      shellTradersDefinitionId(host, sourceCardId),
    )}: Wähle eine Karte, von der 1 Shell-Counter entfernt wird.`,
    kind: "select_cards",
    options: targetCardIds.map((cardId) => {
      const definition = host.cards.definitionFor(state, cardId);
      const remainingCounters = host.counters.cardCounter(
        state,
        cardId,
        "shell",
      );
      return {
        id: `card_${cardId}`,
        label: `${definition.title} (${remainingCounters})`,
        value: cardId,
        metadata: { delayedInstallRemainingCounters: remainingCounters },
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: nextStateVersion,
    visibility: "public",
  };
}

function delayedInstallStartTurnCounterEffect(
  host: RunnerSpecialTriggerExecutionHost,
  sourceCardId: CardInstanceId,
  targetCardId: CardInstanceId,
  result: { remainingCounters: number; installed: boolean },
): ResolvedGameEffect {
  const targetDefinition = host.cards.definitionFor(host.state, targetCardId);
  return {
    effectId: `runner.start.delayed_install.${sourceCardId}.${targetCardId}`,
    kind: "counter_change",
    visibility: "public",
    side: "runner",
    amount: result.remainingCounters,
    reason: "start_of_turn",
    counterType: "shell",
    removedCounterAmount: 1,
    remainingCounters: result.remainingCounters,
    sourceDefinitionId: shellTradersDefinitionId(host, sourceCardId),
    sourceTitle: host.cards.publicTitle(
      shellTradersDefinitionId(host, sourceCardId),
    ),
    cardDefinitionId: targetDefinition.id,
    cardTitle: host.cards.publicTitle(targetDefinition.id),
  };
}

function resolveDelayedInstallSetAside(
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
  if (!isShellTradersSource(host, sourceCardId))
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!delayedInstallCanPrepareTarget(host, targetCardId))
    throw new Error("The Shell Traders hat kein gueltiges Ziel.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");
  const shellCounterAmount = delayedInstallCounterCost(targetDefinition);
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
  host.counters.setCardCounter(
    state,
    targetCardId,
    "shell",
    shellCounterAmount,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "delayed_install_set_aside",
    sourceDefinitionId: shellTradersDefinitionId(host, sourceCardId),
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    addedCounterAmount: shellCounterAmount,
    shellCounterAmount,
    remainingCounters: shellCounterAmount,
    specialZone: "set_aside",
    specialZoneVisibility: "public",
  };
}

function resolveDelayedInstallRemoveCounter(
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
  if (!isShellTradersSource(host, sourceCardId))
    throw new Error("Die Shell-Traders-Faehigkeit passt nicht zur Karte.");
  const targetCardId = String(legalAction.payload?.targetCardId ?? "");
  if (!delayedInstallPreparedTargetIds(host).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  const targetDefinition = host.cards.definitionFor(state, targetCardId);
  if (
    typeof legalAction.payload?.targetCardDefinitionId === "string" &&
    legalAction.payload.targetCardDefinitionId !== targetDefinition.id
  )
    throw new Error("Die Shell-Traders-Zielkarte hat sich geaendert.");

  host.credits.spend(state, "runner", 1);
  const result = removeShellCounterAndMaybeInstall(host, targetCardId, {
    sourceCardId,
    reason: "paid",
    legalAction,
  });
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: shellTradersDefinitionId(host, sourceCardId),
    targetCardDefinitionId: targetDefinition.id,
    counterType: "shell",
    removeCounterAmount: result.memoryChoiceOpened ? 0 : 1,
    removedCounterAmount: result.memoryChoiceOpened ? 0 : 1,
    remainingCounters: result.remainingCounters,
    delayedInstallInstalledTarget: result.installed,
    delayedInstallMemoryChoiceOpened: result.memoryChoiceOpened,
    runnerCreditsAfter: state.runner.credits,
  };
}

function removeShellCounterAndMaybeInstall(
  host: RunnerSpecialTriggerExecutionHost,
  targetCardId: CardInstanceId,
  context: {
    sourceCardId: CardInstanceId;
    reason: "paid" | "start_turn";
    legalAction?: LegalAction;
    effects?: ResolvedGameEffect[];
  },
): {
  remainingCounters: number;
  installed: boolean;
  memoryChoiceOpened: boolean;
} {
  // Re-check the prepared target at resolution time because both paid and
  // start-of-turn removal can turn the last counter into an immediate install.
  if (!delayedInstallPreparedTargetIds(host).includes(targetCardId))
    throw new Error("Die Shell-Traders-Zielkarte ist nicht vorbereitet.");
  const countersBefore = host.counters.cardCounter(
    host.state,
    targetCardId,
    "shell",
  );
  const definition = host.cards.definitionFor(host.state, targetCardId);
  if (
    countersBefore === 1 &&
    definition.type === "program" &&
    !delayedInstallCanInstallPreparedCardForFree(host, targetCardId, definition)
  ) {
    startDelayedInstallMemoryChoice(host, targetCardId, definition, context);
    return {
      remainingCounters: countersBefore,
      installed: false,
      memoryChoiceOpened: true,
    };
  }
  host.counters.spendCardCounter(host.state, targetCardId, "shell", 1);
  const remainingCounters = host.counters.cardCounter(
    host.state,
    targetCardId,
    "shell",
  );
  if (remainingCounters > 0)
    return { remainingCounters, installed: false, memoryChoiceOpened: false };
  installDelayedPreparedCardForFree(
    host,
    targetCardId,
    context.legalAction,
    context.effects,
  );
  return { remainingCounters, installed: true, memoryChoiceOpened: false };
}

function startDelayedInstallMemoryChoice(
  host: RunnerSpecialTriggerExecutionHost,
  targetCardId: CardInstanceId,
  targetDefinition: CardDefinition,
  context: {
    sourceCardId: CardInstanceId;
    reason: "paid" | "start_turn";
  },
): void {
  if (
    !delayedInstallCanResolveFinalCounter(host, targetCardId, targetDefinition)
  )
    throw new Error(
      "Durch Programmtrash kann nicht genug MU freigemacht werden.",
    );
  const options = host.state.runner.rig.programs
    .filter((cardId) => host.runner.runnerProgramUsesMemory(host.state, cardId))
    .sort()
    .map((cardId) => ({
      id: `card_${cardId}`,
      label: host.cards.definitionFor(host.state, cardId).title,
      value: cardId,
    }));
  if (options.length === 0)
    throw new Error("Es gibt kein installiertes Programm zum MU-Freimachen.");
  const nextStateVersion = host.state.stateVersion + 1;
  host.state.pendingChoice = {
    choiceId: `v1912_delayed_install_memory_${nextStateVersion}_${targetCardId}`,
    side: "runner",
    source: `v1912.delayed_install_memory:${context.sourceCardId}:${targetCardId}:${context.reason}:${nextStateVersion}`,
    prompt: "Programme für The Shell Traders überschreiben",
    kind: "select_cards",
    options,
    minSelections: 1,
    maxSelections: options.length,
    stateVersion: nextStateVersion,
    visibility: "hidden_info_barrier",
  };
}

function installDelayedPreparedCardForFree(
  host: RunnerSpecialTriggerExecutionHost,
  cardId: CardInstanceId,
  legalAction?: LegalAction,
  effects?: ResolvedGameEffect[],
): void {
  const { state } = host;
  const definition = host.cards.definitionFor(state, cardId);
  const instance = host.cards.mustInstance(state.cardInstances, cardId);
  if (
    instance.owner !== "runner" ||
    instance.zone.side !== "special" ||
    instance.zone.zone !== "set_aside"
  )
    throw new Error(
      "The Shell Traders kann nur vorbereitete Runner-Karten installieren.",
    );
  if (definition.type !== "program" && definition.type !== "hardware")
    throw new Error(
      "The Shell Traders installiert nur Programme oder Hardware.",
    );
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(state, "runner", definition.id)
  )
    throw new Error(
      "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
    );
  if (
    definition.type === "program" &&
    !delayedInstallCanInstallPreparedCardForFree(host, cardId, definition)
  )
    throw new Error("Nicht genug Memory fuer The Shell Traders.");

  host.zones.removeFromAllZones(state, cardId);
  if (definition.type === "program") {
    completeRunnerProgramRigInstall({
      state,
      cardId,
      definition,
      usesMemory: true,
      mustInstance: (targetCardId) =>
        host.cards.mustInstance(state.cardInstances, targetCardId),
      setCardCounter: (targetCardId, counterType, amount) =>
        host.counters.setCardCounter(state, targetCardId, counterType, amount),
      addCardCounter: (targetCardId, counterType, amount) =>
        host.counters.addCardCounter(state, targetCardId, counterType, amount),
      shouldLoadLegacyRecurringCredits:
        host.cards.shouldLoadLegacyRecurringCredits,
    });
  } else {
    state.runner.rig.hardware.push(cardId);
    if (!host.cards.hasCardImplementationMemoryUnitModifier(definition)) {
      if (definition.mechanics.includes("modify_memory_limit"))
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
      else if ((definition.memoryLimitBonus ?? 0) > 0)
        state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
    }
    state.cardInstances[cardId] = {
      ...host.cards.mustInstance(state.cardInstances, cardId),
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "rig" },
    };
  }
  host.counters.setCardCounter(state, cardId, "shell", 0);
  if (
    definition.type === "hardware" &&
    host.cards.shouldLoadLegacyRecurringCredits(definition)
  )
    host.counters.setCardCounter(
      state,
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  host.lifecycle.executeOnInstall(legalAction, definition, cardId, effects);
}

function delayedInstallCanInstallPreparedCardForFree(
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

function delayedInstallCanResolveFinalCounter(
  host: RunnerSpecialTriggerExecutionHost,
  cardId: CardInstanceId,
  definition = host.cards.definitionFor(host.state, cardId),
): boolean {
  if (delayedInstallCanInstallPreparedCardForFree(host, cardId, definition))
    return true;
  if (definition.type !== "program") return false;
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(
      host.state,
      "runner",
      definition.id,
    )
  )
    return false;
  const reclaimableMemory = host.state.runner.rig.programs.reduce(
    (sum, installedCardId) =>
      sum +
      (host.runner.runnerProgramUsesMemory(host.state, installedCardId)
        ? (host.cards.definitionFor(host.state, installedCardId).memoryCost ??
          0)
        : 0),
    0,
  );
  return (
    host.state.runner.memoryUsed +
      (definition.memoryCost ?? 0) -
      reclaimableMemory <=
    host.runner.runnerMemoryLimit(host.state)
  );
}

function delayedInstallCanPrepareTarget(
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
    delayedInstallCounterCost(definition) === 0 &&
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
