// @ts-nocheck
import type { RuntimeDeps, GameState, LegalAction, PlayerAction, ChoiceRequest, Side, CardDefinition, CardDefinitionId, CardInstanceId, CorpServer, CounterType, DamageSummary, ResolvedGameEffect, ServerId, PendingChoiceResolutionHost, HiddenZoneSearchActivationHandlerHost, HiddenZoneSearchChoiceHandlerHost, HiddenZoneArrangeChoiceHandlerHost, HiddenZoneNonSearchChoiceHandlerHost, CorpZoneChoiceHandlerHost, CardRunnerEventLongtailImplementation } from "./runtime-shared";

export function createTurnCorpRuntime(deps: RuntimeDeps) {
  const {
    cardImplementationForDefinitionId,
    definitionFor,
    mustArrayValue,
    removeFromAllZones,
    sanitizeId,
    selectedChoiceIds,
    setCardCounter,
    mustInstance,
    credits,
    withoutVariableIceState,
  } = deps;

function advanceableInstalledCardTargets(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((server) =>
      server.root
        .slice()
        .sort()
        .filter((cardId) => {
          const definition = definitionFor(state, cardId);
          return isInstalledCorpCardAdvanceable(state, cardId, definition);
        }),
    );
}

function isInstalledCorpCardAdvanceable(
  state: GameState,
  cardId: CardInstanceId,
  definition = definitionFor(state, cardId),
): boolean {
  const instance = state.cardInstances[cardId];
  if (
    !instance ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverRoot" ||
    !state.corp.servers.some((server) => server.root.includes(cardId))
  )
    return false;
  if (definition.type === "agenda") return true;
  if (
    cardImplementationForDefinitionId(definition.id)?.advanceable?.while ===
    "installed_before_and_after_rez"
  )
    return true;
  return false;
}

type AdvancementDistributionMode =
  | "single_target"
  | "any_combination"
  | "up_to_distinct_targets_one_each";

type AdvancementDistributionOption = {
  id: string;
  label: string;
  publicLabel: string;
  value: string;
};

function advancementDistributionOptions(
  state: GameState,
  amount: number,
  distribution: AdvancementDistributionMode,
): AdvancementDistributionOption[] {
  const targets = advanceableInstalledCardTargets(state);
  if (amount <= 0 || targets.length === 0) return [];
  if (distribution === "single_target") {
    return targets.map((targetId) => {
      const title = definitionFor(state, targetId).title;
      const label = `${amount} Advancement-Counter auf ${title}`;
      return {
        id: `placement_${sanitizeId(targetId)}_${amount}`,
        label,
        publicLabel: label,
        value: `${targetId}:${amount}`,
      };
    });
  }
  if (distribution === "up_to_distinct_targets_one_each") {
    const options: AdvancementDistributionOption[] = [];
    for (let firstIndex = 0; firstIndex < targets.length; firstIndex += 1) {
      const firstTargetId = mustArrayValue(
        targets,
        firstIndex,
        "Advancement-Ziel fehlt.",
      );
      const firstTitle = definitionFor(state, firstTargetId).title;
      const singleLabel = `1 Advancement-Counter auf ${firstTitle}`;
      options.push({
        id: `placement_${sanitizeId(firstTargetId)}_one`,
        label: singleLabel,
        publicLabel: singleLabel,
        value: `${firstTargetId}:1`,
      });
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < targets.length;
        secondIndex += 1
      ) {
        const secondTargetId = mustArrayValue(
          targets,
          secondIndex,
          "Advancement-Ziel fehlt.",
        );
        const secondTitle = definitionFor(state, secondTargetId).title;
        const label = `Je 1 Advancement-Counter auf ${firstTitle} und ${secondTitle}`;
        options.push({
          id: `placement_${sanitizeId(firstTargetId)}_${sanitizeId(
            secondTargetId,
          )}`,
          label,
          publicLabel: label,
          value: `${firstTargetId}:1|${secondTargetId}:1`,
        });
      }
    }
    return options;
  }
  const options: AdvancementDistributionOption[] = [];
  const build = (
    targetIndex: number,
    remaining: number,
    placements: Array<[CardInstanceId, number]>,
  ): void => {
    if (targetIndex >= targets.length) {
      if (remaining !== 0 || placements.length === 0) return;
      const label = placements
        .map(([targetId, placed]) => {
          const title = definitionFor(state, targetId).title;
          return `${placed} auf ${title}`;
        })
        .join(", ");
      options.push({
        id: `placement_${placements
          .map(([targetId, placed]) => `${sanitizeId(targetId)}_${placed}`)
          .join("_")}`,
        label,
        publicLabel: label,
        value: placements
          .map(([targetId, placed]) => `${targetId}:${placed}`)
          .join("|"),
      });
      return;
    }
    const targetId = mustArrayValue(targets, targetIndex, "Advancement-Ziel fehlt.");
    for (let placed = remaining; placed >= 0; placed -= 1) {
      build(
        targetIndex + 1,
        remaining - placed,
        placed > 0 ? [...placements, [targetId, placed]] : placements,
      );
    }
  };
  build(0, amount, []);
  return options;
}

function startCardImplementationAdvancementDistributionChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  amount: number,
  distribution: AdvancementDistributionMode,
): { publicPayload?: Record<string, string | number | boolean> } {
  const options = advancementDistributionOptions(state, amount, distribution);
  if (options.length === 0)
    throw new Error("Die Karte findet kein advancebares installiertes Ziel.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `p3_34_advancement_distribution_${state.stateVersion + 1}`,
    side: "corp",
    source: `p3_34.distribute_advancement:${sourceDefinitionId}:${sourceCardId}:${amount}:${distribution}:${state.stateVersion + 1}`,
    prompt: "Advancement-Counter legen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    advancementCounterChoiceOpened: true,
    advancementCounterChoiceMode: distribution,
    advancementCounterAmount: amount,
    eligiblePlacementCount: options.length,
  };
  return { publicPayload: legalAction.payload };
}

function parseAdvancementDistributionValue(
  value: string,
): Array<[CardInstanceId, number]> {
  if (!value) throw new Error("Advancement-Choice hat keine Auswahl.");
  return value.split("|").map((entry) => {
    const [targetId, rawAmount] = entry.split(":");
    const amount = Number(rawAmount);
    if (!targetId || !Number.isInteger(amount) || amount <= 0)
      throw new Error("Advancement-Choice enthaelt ungueltige Placement-Daten.");
    return [targetId as CardInstanceId, amount];
  });
}

function sourcePartsForP334Choice(
  source: string,
): {
  sourceDefinitionId: CardDefinitionId;
  sourceCardId: CardInstanceId;
  amount: number;
  mode: AdvancementDistributionMode;
} {
  const [, sourceDefinitionId, sourceCardId, rawAmount, mode] = source.split(":");
  const amount = Number(rawAmount);
  if (
    !sourceDefinitionId ||
    !sourceCardId ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    (mode !== "single_target" &&
      mode !== "any_combination" &&
      mode !== "up_to_distinct_targets_one_each")
  )
    throw new Error("Advancement-Choice hat ungueltige Quelldaten.");
  return {
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    sourceCardId: sourceCardId as CardInstanceId,
    amount,
    mode,
  };
}

function validateAdvancementDistribution(
  state: GameState,
  placements: Array<[CardInstanceId, number]>,
  amount: number,
  mode: AdvancementDistributionMode,
): void {
  const eligibleTargets = new Set(advanceableInstalledCardTargets(state));
  const seen = new Set<CardInstanceId>();
  let total = 0;
  for (const [targetId, placed] of placements) {
    if (!eligibleTargets.has(targetId))
      throw new Error("Advancement-Counter duerfen nur auf advancebare Ziele.");
    total += placed;
    if (mode === "up_to_distinct_targets_one_each") {
      if (placed !== 1)
        throw new Error("Team Restructuring legt nur je einen Counter.");
      if (seen.has(targetId))
        throw new Error("Team Restructuring braucht verschiedene Ziele.");
      seen.add(targetId);
    }
  }
  if (mode === "up_to_distinct_targets_one_each") {
    if (total < 1 || total > amount)
      throw new Error("Team Restructuring braucht bis zu zwei Ziele.");
    return;
  }
  if (total !== amount)
    throw new Error("Die Advancement-Verteilung hat die falsche Counterzahl.");
}

function resolveCardImplementationAdvancementDistributionChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_34.distribute_advancement"))
    throw new Error("Es ist keine Advancement-Counter-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Advancement-Counter-Choice braucht eine Auswahl.");
  const { sourceDefinitionId, amount, mode } = sourcePartsForP334Choice(
    choice.source,
  );
  const placements = parseAdvancementDistributionValue(selectedOption.value);
  validateAdvancementDistribution(state, placements, amount, mode);
  for (const [targetId, placed] of placements) {
    mustInstance(state.cardInstances, targetId).advancementCounters += placed;
  }
  const firstTargetId = placements[0]?.[0];
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    v1919OperationAbility: "add_advancement_counters",
    advancementCounterChoiceResolved: true,
    advancementCounterChoiceMode: mode,
    advancementCountersAdded: placements.reduce(
      (sum, [, placed]) => sum + placed,
      0,
    ),
    addedAdvancementCounters: placements.reduce(
      (sum, [, placed]) => sum + placed,
      0,
    ),
    targetCount: placements.length,
    targetCardDefinitionIds: placements
      .map(([targetId]) => definitionFor(state, targetId).id)
      .join(","),
    advancementCounterDistribution: placements
      .map(([targetId, placed]) => `${sanitizeId(targetId)}:${placed}`)
      .join(","),
    ...(firstTargetId
      ? {
          targetCardId: firstTargetId,
          targetCardDefinitionId: definitionFor(state, firstTargetId).id,
          advancementCountersAfter: mustInstance(
            state.cardInstances,
            firstTargetId,
          ).advancementCounters,
        }
      : {}),
  };
  delete state.pendingChoice;
}

function movableAdvancementSourceIds(state: GameState): CardInstanceId[] {
  return state.corp.servers
    .slice()
    .sort((left, right) => left.id.localeCompare(right.id))
    .flatMap((server) =>
      server.root
        .slice()
        .sort()
        .filter((cardId) => {
          const instance = state.cardInstances[cardId];
          return Boolean(instance && instance.advancementCounters > 0);
        }),
    );
}

function moveAdvancementOptions(
  state: GameState,
  sourceCardId: CardInstanceId,
  sourceMode: "chosen_card" | "source_card",
  maxAmount: number | "all",
): AdvancementDistributionOption[] {
  const sourceIds =
    sourceMode === "source_card" ? [sourceCardId] : movableAdvancementSourceIds(state);
  const targetIds = advanceableInstalledCardTargets(state);
  const options: AdvancementDistributionOption[] = [];
  for (const fromId of sourceIds) {
    const fromInstance = state.cardInstances[fromId];
    if (!fromInstance || fromInstance.advancementCounters <= 0) continue;
    const cappedAmount =
      maxAmount === "all"
        ? Math.floor(fromInstance.advancementCounters)
        : Math.min(Math.floor(fromInstance.advancementCounters), maxAmount);
    if (cappedAmount <= 0) continue;
    for (const toId of targetIds) {
      if (toId === fromId) continue;
      for (let amount = 1; amount <= cappedAmount; amount += 1) {
        const fromTitle = definitionFor(state, fromId).title;
        const toTitle = definitionFor(state, toId).title;
        const label = `${amount} Advancement-Counter von ${fromTitle} auf ${toTitle} bewegen`;
        options.push({
          id: `move_${sanitizeId(fromId)}_${sanitizeId(toId)}_${amount}`,
          label,
          publicLabel: label,
          value: `${fromId}|${toId}|${amount}`,
        });
      }
    }
  }
  return options;
}

function startCardImplementationMoveAdvancementChoice(
  state: GameState,
  legalAction: LegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  sourceMode: "chosen_card" | "source_card",
  maxAmount: number | "all",
): { publicPayload?: Record<string, string | number | boolean> } {
  const options = moveAdvancementOptions(
    state,
    sourceCardId,
    sourceMode,
    maxAmount,
  );
  if (options.length === 0)
    throw new Error("Die Karte findet keine bewegbaren Advancement-Counter.");
  if (state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  state.pendingChoice = {
    choiceId: `p3_34_move_advancement_${state.stateVersion + 1}`,
    side: "corp",
    source: `p3_34.move_advancement:${sourceDefinitionId}:${sourceCardId}:${sourceMode}:${maxAmount}:${state.stateVersion + 1}`,
    prompt: "Advancement-Counter bewegen",
    kind: "select_option",
    options,
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion + 1,
    visibility: "public",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId,
    advancementCounterMoveChoiceOpened: true,
    eligibleMoveCount: options.length,
  };
  return { publicPayload: legalAction.payload };
}

function resolveCardImplementationMoveAdvancementChoice(
  state: GameState,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): void {
  const choice = state.pendingChoice;
  if (!choice || !choice.source.startsWith("p3_34.move_advancement"))
    throw new Error("Es ist keine Advancement-Move-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selectedOption = choice.options.find(
    (option) => option.id === selectedOptionId,
  );
  if (!selectedOption || typeof selectedOption.value !== "string")
    throw new Error("Die Advancement-Move-Choice braucht eine Auswahl.");
  const [, sourceDefinitionId, sourceCardId, sourceMode, rawMaxAmount] =
    choice.source.split(":");
  const [fromId, toId, rawAmount] = selectedOption.value.split("|");
  const amount = Number(rawAmount);
  if (
    !sourceDefinitionId ||
    !sourceCardId ||
    (sourceMode !== "chosen_card" && sourceMode !== "source_card") ||
    !fromId ||
    !toId ||
    !Number.isInteger(amount) ||
    amount <= 0
  )
    throw new Error("Die Advancement-Move-Choice ist ungueltig.");
  const maxAmount =
    rawMaxAmount === "all" ? "all" : Number(rawMaxAmount ?? Number.NaN);
  if (
    maxAmount !== "all" &&
    (!Number.isInteger(maxAmount) || amount > maxAmount)
  )
    throw new Error("Die Advancement-Move-Choice bewegt zu viele Counter.");
  if (sourceMode === "source_card" && fromId !== sourceCardId)
    throw new Error("Diese Karte darf nur eigene Advancement-Counter bewegen.");
  if (fromId === toId)
    throw new Error("Advancement-Counter muessen auf eine andere Karte wechseln.");
  const fromInstance = state.cardInstances[fromId];
  if (!fromInstance || fromInstance.advancementCounters < amount)
    throw new Error("Die Quellkarte hat nicht genug Advancement-Counter.");
  if (!isInstalledCorpCardAdvanceable(state, toId as CardInstanceId))
    throw new Error("Das Ziel ist nicht advancebar installiert.");
  fromInstance.advancementCounters -= amount;
  const toInstance = mustInstance(state.cardInstances, toId as CardInstanceId);
  toInstance.advancementCounters += amount;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: sourceDefinitionId as CardDefinitionId,
    v1919OperationAbility: "move_advancement_counters",
    advancementCountersMoved: amount,
    movedAdvancementCounters: amount,
    advancementCounterSourceCardId: fromId,
    advancementCounterSourceDefinitionId: definitionFor(
      state,
      fromId as CardInstanceId,
    ).id,
    advancementCounterTargetCardId: toId,
    advancementCounterTargetDefinitionId: definitionFor(
      state,
      toId as CardInstanceId,
    ).id,
    advancementCounterSourceAfter: fromInstance.advancementCounters,
    advancementCounterTargetAfter: toInstance.advancementCounters,
  };
  delete state.pendingChoice;
}

function resolveManagementShakeUpOperation(
  state: GameState,
  legalAction: LegalAction,
): void {
  const targets = advanceableInstalledCardTargets(state);
  if (targets.length === 0)
    throw new Error("Management Shake-Up findet keine advancebare Karte.");
  const placements: Record<CardInstanceId, number> = {};
  for (let index = 0; index < 3; index += 1) {
    const targetId = mustArrayValue(
      targets,
      index % targets.length,
      "Management-Shake-Up-Ziel fehlt.",
    );
    placements[targetId] = (placements[targetId] ?? 0) + 1;
  }
  for (const [targetId, amount] of Object.entries(placements)) {
    mustInstance(state.cardInstances, targetId).advancementCounters += amount;
  }
  const targetCount = Object.keys(placements).length;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1919OperationAbility: "add_advancement_counters",
    addedAdvancementCounters: 3,
    targetCount,
    managementShakeUpDistribution: Object.entries(placements)
      .map(([targetId, amount]) => `${sanitizeId(targetId)}:${amount}`)
      .join(","),
  };
}

function awardRunnerEventAgendaPoint(
  state: GameState,
  legalAction: LegalAction,
  sourceDefinitionId: CardDefinitionId,
): void {
  const cardId = String(legalAction.payload?.cardId ?? "");
  if (!cardId || !state.cardInstances[cardId])
    throw new Error("Die Event-Karte fuer Agenda-Punkt-Gewinn fehlt.");
  removeFromAllZones(state, cardId);
  state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...mustInstance(state.cardInstances, cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  };
  setCardCounter(state, cardId, "agenda", 1);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    scoredAsAgenda: true,
    sourceDefinitionId,
    gainedAgendaPoints: 1,
  };
}


  return {
    advanceableInstalledCardTargets,
    isInstalledCorpCardAdvanceable,
    advancementDistributionOptions,
    startCardImplementationAdvancementDistributionChoice,
    parseAdvancementDistributionValue,
    sourcePartsForP334Choice,
    validateAdvancementDistribution,
    resolveCardImplementationAdvancementDistributionChoice,
    movableAdvancementSourceIds,
    moveAdvancementOptions,
    startCardImplementationMoveAdvancementChoice,
    resolveCardImplementationMoveAdvancementChoice,
    resolveManagementShakeUpOperation,
    awardRunnerEventAgendaPoint
  };
}
