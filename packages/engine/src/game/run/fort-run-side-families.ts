import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  CounterType,
  EffectCommand,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { RuntimeIcebreakerAbility } from "../../ability-engine/icebreaker-abilities";
import type { CardFortRunWindowImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  PILE_DRIVER_ID,
  RAMMING_PISTON_ID,
} from "../../compatibility/runtime-compatibility";

const DEFAULT_FORT_TRACE_BIT_POOL_BITS = 3;

type ActiveRun = NonNullable<GameState["run"]>;

export type FortRunSideFamiliesHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    runnerInstalledCardIds: () => CardInstanceId[];
  };
  servers: {
    mustServer: (serverId: Exclude<ServerId, "new_remote">) => CorpServer;
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: CounterType) => number;
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    spendCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
  };
  payment: {
    hostedPaymentCredits: (cardId: CardInstanceId) => number;
    spendHostedPaymentCredits: (cardId: CardInstanceId, amount: number) => void;
    rezCostForCard: (cardId: CardInstanceId) => number;
    spendCorpCredits: (amount: number) => void;
  };
  breaker: {
    breakAbilityForLegalAction: (
      legalAction: LegalAction,
    ) => RuntimeIcebreakerAbility | undefined;
  };
  effects: {
    executeEffectCommands: (commands: EffectCommand[]) => void;
    trashRunnerInstalledProgram: (cardId: CardInstanceId) => void;
  };
};

export type FortRunSideFamilyResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId | undefined;
  sourceDefinitionId?: CardDefinitionId | undefined;
  serverId?: Exclude<ServerId, "new_remote"> | undefined;
  serverLabel?: string | undefined;
  stateChanged?: boolean;
};

export type AardvarkRunReactionResult = FortRunSideFamilyResult & {
  targetProgramId?: CardInstanceId | undefined;
  rezzedCardId?: CardInstanceId | undefined;
  trashedCardIds?: CardInstanceId[] | undefined;
  choiceStarted?: boolean;
  choiceResolved?: boolean;
};

export type FortRunEligibilityResult = FortRunSideFamilyResult & {
  runAllowed: boolean;
};

export type FortRunTraceCreditResult = FortRunSideFamilyResult & {
  traceCreditsAvailable: number;
};

export type FortRunStealthLossResult = FortRunSideFamilyResult & {
  targetProgramId?: CardInstanceId | undefined;
  stealthCreditsLost?: number | undefined;
  choiceStarted?: boolean;
};

export function fortRunWindowImplementationForCard<
  K extends CardFortRunWindowImplementation["kind"],
>(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
  kind: K,
): Extract<CardFortRunWindowImplementation, { kind: K }> | undefined {
  return (
    cardImplementationForDefinitionId(host.cards.definitionFor(cardId).id)
      ?.fortRunWindows ?? []
  ).find(
    (window): window is Extract<CardFortRunWindowImplementation, { kind: K }> =>
      window.kind === kind,
  );
}

export function hasFortRunWindowKind(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
  kind: CardFortRunWindowImplementation["kind"],
): boolean {
  return Boolean(fortRunWindowImplementationForCard(host, cardId, kind));
}

export function isAardvarkSource(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): boolean {
  return hasFortRunWindowKind(host, cardId, "aardvark_worm_lock_and_reaction");
}

export function runnerCanUseBreakerOnCurrentFort(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
): boolean {
  const run = host.state.run;
  if (!run || !isWormBreaker(host, breakerId)) return true;
  return !host.servers.mustServer(run.attackedServerId).root.some((cardId) => {
    const instance = host.cards.cardInstanceFor(cardId);
    return instance.rezzed && isAardvarkSource(host, cardId);
  });
}

export function shouldOpenAardvarkInterception(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
): boolean {
  const run = host.state.run;
  if (!run?.encounteredIceId || !isWormBreaker(host, breakerId)) return false;
  if (
    host.servers.mustServer(run.attackedServerId).root.some((cardId) => {
      const instance = host.cards.cardInstanceFor(cardId);
      return instance.rezzed && isAardvarkSource(host, cardId);
    })
  )
    return false;
  if (run.aardvarkInterceptionIceIds?.includes(run.encounteredIceId))
    return false;
  const aardvarkId = host.servers
    .mustServer(run.attackedServerId)
    .root.slice()
    .sort()
    .find((cardId) => {
      const instance = host.cards.cardInstanceFor(cardId);
      return !instance.rezzed && isAardvarkSource(host, cardId);
    });
  if (!aardvarkId) return false;
  return host.state.corp.credits >= host.payment.rezCostForCard(aardvarkId);
}

export function startAardvarkInterceptionChoice(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
  actionType: "pump_breaker" | "break_subroutine",
  legalAction: LegalAction,
): AardvarkRunReactionResult {
  const run = mustRun(host.state);
  if (!run.encounteredIceId)
    throw new Error("Aardvark benötigt ein aktives Encounter-ICE.");
  const aardvarkId = host.servers
    .mustServer(run.attackedServerId)
    .root.slice()
    .sort()
    .find((cardId) => {
      const instance = host.cards.cardInstanceFor(cardId);
      return !instance.rezzed && isAardvarkSource(host, cardId);
    });
  if (!aardvarkId)
    throw new Error("Aardvark ist auf diesem Server nicht verfügbar.");
  const cost = Math.max(0, Math.floor(legalAction.costs[0]?.credits ?? 0));
  const subroutineIndex =
    legalAction.payload?.subroutineIndex === undefined
      ? "none"
      : String(legalAction.payload.subroutineIndex);
  const usedIceIds = run.aardvarkInterceptionIceIds ?? [];
  if (!usedIceIds.includes(run.encounteredIceId))
    usedIceIds.push(run.encounteredIceId);
  run.aardvarkInterceptionIceIds = usedIceIds;
  host.state.pendingChoice = {
    choiceId: `v199_aardvark_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v199.aardvark:${aardvarkId}:${breakerId}:${run.encounteredIceId}:${actionType}:${subroutineIndex}:${cost}`,
    prompt: "Aardvark rezzen und Worm trashen?",
    kind: "select_option",
    options: [
      {
        id: "rez_trash_worm",
        label: "Aardvark rezzen",
        publicLabel: "Aardvark wird gerezzt",
        value: "rez_trash_worm",
      },
      {
        id: "decline",
        label: "Nicht rezzen",
        publicLabel: "Aardvark wird nicht gerezzt",
        value: "decline",
      },
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "private_to_side",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "aardvark_interception_window",
    aardvarkWindowOpened: true,
  };
  return {
    handled: true,
    sourceCardId: aardvarkId,
    sourceDefinitionId: host.cards.definitionFor(aardvarkId).id,
    serverId: run.attackedServerId,
    serverLabel: host.servers.publicServerLabel(run.attackedServerId),
    targetProgramId: breakerId,
    choiceStarted: true,
    stateChanged: true,
  };
}

export function resolveAardvarkInterceptionChoice(
  host: FortRunSideFamiliesHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): AardvarkRunReactionResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v199.aardvark"))
    throw new Error("Es ist keine Aardvark-Choice offen.");
  const [, aardvarkId, breakerId, iceId, actionType, subroutineIndexRaw] =
    choice.source.split(":");
  if (
    !aardvarkId ||
    !breakerId ||
    !iceId ||
    (actionType !== "pump_breaker" && actionType !== "break_subroutine")
  ) {
    throw new Error("Die Aardvark-Choice ist ungueltig.");
  }
  const selected = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
  if (selected !== "rez_trash_worm" && selected !== "decline")
    throw new Error("Die Aardvark-Auswahl ist ungueltig.");
  const run = mustRun(host.state);
  if (run.encounteredIceId !== iceId)
    throw new Error("Die Aardvark-Choice gehoert nicht mehr zu diesem ICE.");
  if (!isWormBreaker(host, breakerId as CardInstanceId))
    throw new Error("Aardvark kann nur einen Worm abfangen.");

  if (selected === "rez_trash_worm") {
    const aardvark = host.cards.cardInstanceFor(aardvarkId as CardInstanceId);
    if (!isAardvarkSource(host, aardvarkId as CardInstanceId))
      throw new Error("Aardvark-Ziel ist ungueltig.");
    if (aardvark.rezzed) throw new Error("Aardvark ist bereits gerezzt.");
    host.payment.spendCorpCredits(
      host.payment.rezCostForCard(aardvarkId as CardInstanceId),
    );
    host.state.cardInstances[aardvarkId] = {
      ...aardvark,
      rezzed: true,
      faceup: true,
    };
    host.effects.trashRunnerInstalledProgram(breakerId as CardInstanceId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      publicRevealDefinitionId: host.cards.definitionFor(
        aardvarkId as CardInstanceId,
      ).id,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "aardvark_rez_trash_worm",
      aardvarkRezzed: true,
      aardvarkWormTrashed: true,
    };
    delete host.state.pendingChoice;
    return {
      handled: true,
      sourceCardId: aardvarkId as CardInstanceId,
      sourceDefinitionId: host.cards.definitionFor(aardvarkId as CardInstanceId).id,
      serverId: run.attackedServerId,
      serverLabel: host.servers.publicServerLabel(run.attackedServerId),
      targetProgramId: breakerId as CardInstanceId,
      rezzedCardId: aardvarkId as CardInstanceId,
      trashedCardIds: [breakerId as CardInstanceId],
      choiceResolved: true,
      stateChanged: true,
    };
  }

  if (actionType === "pump_breaker") {
    host.effects.executeEffectCommands([
      {
        type: "change_breaker_strength",
        breakerId: breakerId as CardInstanceId,
        amount: 1,
      },
    ]);
  } else {
    const subroutineIndex = Number(subroutineIndexRaw);
    if (!Number.isInteger(subroutineIndex) || subroutineIndex < 0)
      throw new Error("Die Aardvark-Subroutine ist ungueltig.");
    host.effects.executeEffectCommands([
      { type: "break_subroutine", subroutineIndex },
    ]);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "aardvark_declined_worm_use",
    aardvarkRezzed: false,
  };
  delete host.state.pendingChoice;
  return {
    handled: true,
    sourceCardId: aardvarkId as CardInstanceId,
    sourceDefinitionId: host.cards.definitionFor(aardvarkId as CardInstanceId).id,
    serverId: run.attackedServerId,
    serverLabel: host.servers.publicServerLabel(run.attackedServerId),
    targetProgramId: breakerId as CardInstanceId,
    choiceResolved: true,
    stateChanged: true,
  };
}

export function activityGatedFortRunSourceIds(
  host: FortRunSideFamiliesHost,
  serverId: Exclude<ServerId, "new_remote">,
): CardInstanceId[] {
  return host.servers
    .mustServer(serverId)
    .root.filter((cardId) => {
      const instance = host.state.cardInstances[cardId];
      return (
        instance?.rezzed === true &&
        isRovingRunRestrictionSource(host, cardId)
      );
    })
    .sort();
}

export function isActivityGatedFortRunBlocked(
  host: FortRunSideFamiliesHost,
  serverId: Exclude<ServerId, "new_remote">,
): boolean {
  const sourceIds = activityGatedFortRunSourceIds(host, serverId);
  return (
    sourceIds.length > 0 &&
    !sourceIds.some((sourceId) => host.counters.cardCounter(sourceId, "mark") > 0)
  );
}

export function clearActivityGatedFortRunMarkers(
  host: FortRunSideFamiliesHost,
): void {
  for (const server of host.state.corp.servers) {
    for (const sourceId of activityGatedFortRunSourceIds(host, server.id)) {
      host.counters.setCardCounter(sourceId, "mark", 0);
    }
  }
}

export function markFortActivityForRunGate(
  host: FortRunSideFamiliesHost,
  serverId: Exclude<ServerId, "new_remote">,
  legalAction?: LegalAction,
): FortRunSideFamilyResult {
  const sourceIds = activityGatedFortRunSourceIds(host, serverId);
  if (sourceIds.length === 0) return { handled: false };
  for (const sourceId of sourceIds) host.counters.setCardCounter(sourceId, "mark", 1);
  if (legalAction) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      fortRunGateActivityMarked: true,
      fortRunGateSourceCount: sourceIds.length,
      targetServerLabel: host.servers.publicServerLabel(serverId) ?? serverId,
    };
  }
  return {
    handled: true,
    sourceCardId: sourceIds[0],
    sourceDefinitionId: host.cards.definitionFor(sourceIds[0]!).id,
    serverId,
    serverLabel: host.servers.publicServerLabel(serverId),
    stateChanged: true,
  };
}

export function validateActivityGatedFortRun(
  host: FortRunSideFamiliesHost,
  serverId: Exclude<ServerId, "new_remote">,
): FortRunEligibilityResult {
  const sourceIds = activityGatedFortRunSourceIds(host, serverId);
  if (sourceIds.length === 0)
    return {
      handled: false,
      runAllowed: true,
      serverId,
      serverLabel: host.servers.publicServerLabel(serverId),
    };
  const hasActivity = sourceIds.some(
    (sourceId) => host.counters.cardCounter(sourceId, "mark") > 0,
  );
  if (!hasActivity)
    throw new Error(
      "Roving Submarine erlaubt Runs auf dieses Remote nur nach Korp-Aktivitaet im letzten Korpzug.",
    );
  return {
    handled: true,
    sourceCardId: sourceIds[0],
    sourceDefinitionId: host.cards.definitionFor(sourceIds[0]!).id,
    serverId,
    serverLabel: host.servers.publicServerLabel(serverId),
    runAllowed: true,
  };
}

export function fortTraceBitPoolImplementationForCard(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
):
  | Extract<
      CardFortRunWindowImplementation,
      { kind: "corp_trace_bits_during_runs_on_this_fort" }
    >
  | undefined {
  return fortRunWindowImplementationForCard(
    host,
    cardId,
    "corp_trace_bits_during_runs_on_this_fort",
  );
}

export function fortTraceBitPoolCapacityForCard(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): number {
  return (
    fortTraceBitPoolImplementationForCard(host, cardId)?.amount ??
    DEFAULT_FORT_TRACE_BIT_POOL_BITS
  );
}

export function isFortTraceBitPoolSource(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): boolean {
  return fortTraceBitPoolImplementationForCard(host, cardId) !== undefined;
}

export function tokyoUnsuccessfulRunAmountForCard(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): number | undefined {
  return fortRunWindowImplementationForCard(
    host,
    cardId,
    "gain_credits_after_unsuccessful_run_on_same_fort",
  )?.amount;
}

export function isTokyoUnsuccessfulRunSource(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): boolean {
  return tokyoUnsuccessfulRunAmountForCard(host, cardId) !== undefined;
}

export function fortTraceBitPoolSource(
  host: FortRunSideFamiliesHost,
): { cardId: CardInstanceId; serverId: Exclude<ServerId, "new_remote"> } | undefined {
  const run = host.state.run;
  if (!run) return undefined;
  const server = host.servers.mustServer(run.attackedServerId);
  const cardId = server.root
    .slice()
    .sort()
    .find((rootId) => {
      const instance = host.state.cardInstances[rootId];
      return (
        instance?.rezzed === true &&
        Boolean(fortTraceBitPoolImplementationForCard(host, rootId)) &&
        host.counters.cardCounter(rootId, "bit") > 0
      );
    });
  return cardId ? { cardId, serverId: server.id } : undefined;
}

export function fortTraceBitPoolTotal(
  host: FortRunSideFamiliesHost,
): number {
  const source = fortTraceBitPoolSource(host);
  return source ? host.counters.cardCounter(source.cardId, "bit") : 0;
}

export function spendFortTraceBitPool(
  host: FortRunSideFamiliesHost,
  sourceCardId: CardInstanceId | undefined,
  serverId: Exclude<ServerId, "new_remote"> | undefined,
  amount: number,
): number {
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Fort-Trace-Bit-Pool-Ausgabe ist ungueltig.");
  if (amount <= 0) return 0;
  const current = fortTraceBitPoolSource(host);
  if (
    !current ||
    current.cardId !== sourceCardId ||
    current.serverId !== serverId ||
    !host.state.run ||
    host.state.run.attackedServerId !== serverId
  ) {
    throw new Error("Fort-Trace-Bit-Pool ist fuer diesen Trace nicht verfuegbar.");
  }
  if (host.counters.cardCounter(current.cardId, "bit") < amount)
    throw new Error("Fort-Trace-Bit-Pool hat nicht genug Bits.");
  host.counters.spendCardCounter(current.cardId, "bit", amount);
  return amount;
}

export function applyPostBreakStealthLoss(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
  legalAction: LegalAction,
): FortRunStealthLossResult {
  const breakerDefinition = host.cards.definitionFor(breakerId);
  const ability = host.breaker.breakAbilityForLegalAction(legalAction);
  const lossAmount = ability?.postBreakStealthLoss ?? 0;
  if (lossAmount <= 0) return { handled: false };
  const stealthSources = runnerStealthRecurringCreditSources(host);
  const availableStealth = stealthSources.reduce(
    (sum, source) => sum + source.available,
    0,
  );
  const requiredLoss = Math.min(lossAmount, availableStealth);
  if (requiredLoss <= 0) return { handled: false };
  if (stealthSources.length > 1) {
    startHammerStealthLossChoice(host, breakerId, requiredLoss, stealthSources);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      postBreakStealthLossPending: requiredLoss,
    };
    return {
      handled: true,
      targetProgramId: breakerId,
      stealthCreditsLost: requiredLoss,
      choiceStarted: true,
      stateChanged: true,
    };
  }
  let remaining = lossAmount;
  let spent = 0;
  for (const { cardId } of stealthSources) {
    if (remaining <= 0) break;
    const available = host.payment.hostedPaymentCredits(cardId);
    const cardSpent = Math.min(available, remaining);
    if (cardSpent > 0) {
      host.payment.spendHostedPaymentCredits(cardId, cardSpent);
      remaining -= cardSpent;
      spent += cardSpent;
    }
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    postBreakStealthLoss: spent,
    ...(breakerDefinition.id === RAMMING_PISTON_ID
      ? { v1922RunnerProgramAbility: "post_break_stealth_loss" }
      : {}),
    ...(breakerDefinition.id === PILE_DRIVER_ID
      ? { v1922RunnerProgramAbility: "post_break_stealth_loss" }
      : {}),
  };
  return {
    handled: true,
    targetProgramId: breakerId,
    stealthCreditsLost: spent,
    stateChanged: spent > 0,
  };
}

export function runnerStealthRecurringCreditSources(
  host: FortRunSideFamiliesHost,
): { cardId: CardInstanceId; available: number }[] {
  const runnerRig = [
    ...host.state.runner.rig.hardware,
    ...host.state.runner.rig.programs,
    ...host.state.runner.rig.resources,
  ];
  const sources: { cardId: CardInstanceId; available: number }[] = [];
  for (const cardId of runnerRig) {
    if (!host.cards.cardHasSubtype(host.cards.definitionFor(cardId), "stealth"))
      continue;
    const available = host.payment.hostedPaymentCredits(cardId);
    if (available > 0) sources.push({ cardId, available });
  }
  return sources;
}

export function runnerStealthRecurringCredits(
  host: FortRunSideFamiliesHost,
): number {
  return runnerStealthRecurringCreditSources(host).reduce(
    (sum, source) => sum + source.available,
    0,
  );
}

export function resolveHammerStealthLossChoice(
  host: FortRunSideFamiliesHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): FortRunStealthLossResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.hammer_stealth_loss"))
    throw new Error("Hammer-Stealth-Choice ist nicht offen.");
  const selectedOptionIds = selectedChoiceIds(playerAction.selectedChoices);
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length)
    throw new Error("Hammer-Stealth-Auswahl enthaelt doppelte Optionen.");
  const lossByCardId = new Map<CardInstanceId, number>();
  for (const optionId of selectedOptionIds) {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    const cardId =
      typeof option?.value === "string"
        ? (option.value as CardInstanceId)
        : undefined;
    if (!cardId) throw new Error("Ungueltige Hammer-Stealth-Auswahl.");
    lossByCardId.set(cardId, (lossByCardId.get(cardId) ?? 0) + 1);
  }
  const installed = host.cards.runnerInstalledCardIds();
  for (const [cardId, amount] of lossByCardId) {
    if (!installed.includes(cardId))
      throw new Error("Die Stealth-Quelle ist nicht mehr installiert.");
    if (!host.cards.cardHasSubtype(host.cards.definitionFor(cardId), "stealth"))
      throw new Error("Nur Stealth-Karten koennen gewaehlt werden.");
    if (host.payment.hostedPaymentCredits(cardId) < amount)
      throw new Error("Nicht genug Stealth-Credits fuer die Auswahl.");
    host.payment.spendHostedPaymentCredits(cardId, amount);
  }
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_hammer_stealth_loss_distribution",
    selectedCount: selectedOptionIds.length,
    postBreakStealthLoss: selectedOptionIds.length,
  };
  return {
    handled: true,
    stealthCreditsLost: selectedOptionIds.length,
    stateChanged: selectedOptionIds.length > 0,
  };
}

function startHammerStealthLossChoice(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
  requiredLoss: number,
  sources: { cardId: CardInstanceId; available: number }[],
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options: ChoiceRequest["options"] = [];
  for (const source of sources) {
    const definition = host.cards.definitionFor(source.cardId);
    for (
      let creditIndex = 0;
      creditIndex < Math.min(source.available, requiredLoss);
      creditIndex += 1
    ) {
      options.push({
        id: `stealth_${source.cardId}_${creditIndex + 1}`,
        label: `${definition.title}: 1 Stealth-Credit verlieren`,
        value: source.cardId,
      });
    }
  }
  host.state.pendingChoice = {
    choiceId: `choice_v1922_hammer_stealth_loss_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.hammer_stealth_loss:${breakerId}:${host.state.stateVersion + 1}`,
    prompt: "Stealth-Verlust verteilen.",
    kind: "select_cards",
    options,
    minSelections: requiredLoss,
    maxSelections: requiredLoss,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function isWormBreaker(
  host: FortRunSideFamiliesHost,
  breakerId: CardInstanceId,
): boolean {
  const definition = host.cards.definitionFor(breakerId);
  return definition.type === "program" && host.cards.cardHasSubtype(definition, "worm");
}

function isRovingRunRestrictionSource(
  host: FortRunSideFamiliesHost,
  cardId: CardInstanceId,
): boolean {
  return hasFortRunWindowKind(
    host,
    cardId,
    "can_run_fort_only_if_last_corp_turn_activity_on_fort",
  );
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es ist kein Run aktiv.");
  return state.run;
}

function selectedChoiceIds(
  selectedChoices: PlayerAction["selectedChoices"],
): string[] {
  const raw =
    selectedChoices?.selectedOptionIds ??
    selectedChoices?.optionIds ??
    selectedChoices?.options ??
    selectedChoices?.selectedOptions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is string => typeof value === "string");
}
