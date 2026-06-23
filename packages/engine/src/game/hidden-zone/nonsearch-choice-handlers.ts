import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
  Side,
} from "@netgrid/shared";
import { isSecretSpendGuessTargetedBypassRunChoiceSource } from "../../compatibility/payload-compatibility";

type HiddenZonePayload = Record<string, string | number | boolean>;

export type NonSearchInstalledIceSlot = {
  server: CorpServer;
  serverId: Exclude<ServerId, "new_remote">;
  index: number;
  cardId: CardInstanceId;
};

export type HiddenZoneNonSearchChoiceHandlerHost = {
  state: Pick<
    GameState,
    | "runner"
    | "corp"
    | "cardInstances"
    | "pendingChoice"
    | "stateVersion"
    | "activeSide"
    | "secretSpendGuessRunSecret"
  >;
  legalAction: LegalAction;
  playerAction?: PlayerAction;
  constants: {
    corpArchivesToHqOperationCardId: CardDefinitionId;
    runAccessPressureEventCardId: CardDefinitionId;
  };
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    hasCorpUtilityKind: (cardId: CardInstanceId, kind: string) => boolean;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    installedResourceTrashCreditGain: (cardId: CardInstanceId) => number;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
  };
  servers: {
    mustServer: (serverId: string) => CorpServer;
    publicServerLabel: (serverId: string) => string | undefined;
    iceChoiceLabelForSide: (
      cardId: CardInstanceId,
      visibleTo: Side,
      fallback: string,
    ) => { label: string; publicLabel: string };
  };
  callbacks: {
    hasSuccessfulHqRunThisTurn: () => boolean;
    spendCorpCredits: (amount: number) => void;
    gainRunnerCredits: (amount: number) => void;
    startRunWithAutoPass: (
      serverId: Exclude<ServerId, "new_remote">,
      iceId: CardInstanceId,
    ) => void;
  };
};

export type HiddenZoneNonSearchChoiceHandlerResult = {
  handled: boolean;
  stateChanged?: boolean;
  deletePendingChoice?: boolean;
  movedCardIds?: CardInstanceId[];
  trashedCardIds?: CardInstanceId[];
  discardedCount?: number;
  retainedCount?: number;
  paidCredits?: number;
  gainedCredits?: number;
  selectedTargetId?: string;
  resolvedPayload?: HiddenZonePayload;
};

export function handleHiddenZoneNonSearchChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const source = host.state.pendingChoice?.source ?? "";
  if (source.startsWith("v1922.corp_archives_to_hq"))
    return resolveCorpArchivesToHqChoice(host);
  if (source.startsWith("runner.successful_hq_run_corp_pay_to_retain_hq"))
    return resolveCorpHqRetainPaymentChoice(host);
  if (
    source.startsWith("v1922.runner_grip_trash_gain_credits") ||
    source.startsWith("p3_47.runner_grip_trash_for_credits")
  )
    return resolveRunnerGripTrashForCreditsChoice(host);
  if (
    source.startsWith("v1922.runner_installed_trash_gain_credits") ||
    source.startsWith("p3_47.runner_installed_trash_for_credits")
  )
    return resolveRunnerInstalledTrashForCreditsChoice(host);
  if (source.startsWith("runner.installed_resource_trash_for_credits"))
    return resolveInstalledResourceTrashForCreditsChoice(host);
  if (isSecretSpendGuessTargetedBypassRunChoiceSource(source))
    return resolveSecretSpendGuessThenTargetedBypassRunChoice(host);
  return { handled: false };
}

export function startCorpArchivesToHqChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!isCorpArchivesToHqSource(host, sourceCardId))
    throw new Error("Die Archives-Quelle ist nicht Off-Site Backups.");
  const archiveCards = host.state.corp.archives.filter(
    (cardId) => cardId !== sourceCardId,
  );
  if (archiveCards.length === 0) throw new Error("Archives ist leer.");
  host.state.pendingChoice = {
    choiceId: `v1922_corp_archives_to_hq_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1922.corp_archives_to_hq:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Archives-Karte nach HQ nehmen",
    kind: "select_cards",
    options: archiveCards.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_archives_to_hq",
    eligibleCount: archiveCards.length,
  };
}

export function startCorpHqRetainPaymentChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: string,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (host.state.corp.hq.length === 0)
    throw new Error("HQ enthaelt keine Karten fuer die Retain-Zahlung.");
  host.state.pendingChoice = {
    choiceId: `runner_successful_hq_run_corp_pay_to_retain_hq_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `runner.successful_hq_run_corp_pay_to_retain_hq:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "HQ-Karten fuer je 2 Credits behalten",
    kind: "select_cards",
    options: host.state.corp.hq.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 0,
    maxSelections: Math.min(
      host.state.corp.hq.length,
      Math.floor(host.state.corp.credits / 2),
    ),
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startCorpDiscardHqWithRetainPaymentChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    retainCostPerCard: number;
  },
): { publicPayload: HiddenZonePayload } {
  if (input.retainCostPerCard !== 2)
    throw new Error("Corp-HQ-Retain-Zahlung muss 2 Credits pro Karte kosten.");
  if (host.state.corp.hq.length === 0) {
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
      retainedCount: 0,
      discardedCount: 0,
      paidCredits: 0,
      corpCreditsAfter: host.state.corp.credits,
      sourceDefinitionId: host.cards.definitionFor(input.sourceCardId).id,
    };
    return { publicPayload: host.legalAction.payload ?? {} };
  }
  startCorpHqRetainPaymentChoice(host, input.sourceCardId);
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
    sourceDefinitionId: host.cards.definitionFor(input.sourceCardId).id,
  };
  return { publicPayload: host.legalAction.payload ?? {} };
}

export function startRunnerGripTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: string,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const options = host.state.runner.grip.map((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    return { id: `card_${cardId}`, label: definition.title, value: cardId };
  });
  if (options.length === 0) throw new Error("Keine Karten in der Grip.");
  host.state.pendingChoice = {
    choiceId: `v1922_runner_grip_trash_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.runner_grip_trash_gain_credits:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Grip-Karten trashen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(5, options.length),
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startCardImplementationTrashCardsFromGripForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    max: number;
    gainPerTrashed: number;
  },
): { publicPayload: HiddenZonePayload } {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const boundedMax = Math.max(0, Math.floor(input.max));
  const options = host.state.runner.grip.map((cardId) => {
    const definition = host.cards.definitionFor(cardId);
    return { id: `card_${cardId}`, label: definition.title, value: cardId };
  });
  host.state.pendingChoice = {
    choiceId: `p3_47_runner_grip_trash_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `p3_47.runner_grip_trash_for_credits:${input.sourceCardId}:${input.sourceDefinitionId}:${boundedMax}:${input.gainPerTrashed}:${host.state.stateVersion + 1}`,
    prompt: "Grip-Karten trashen",
    kind: "select_cards",
    options,
    minSelections: 0,
    maxSelections: Math.min(boundedMax, options.length),
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
    sourceDefinitionId: input.sourceDefinitionId,
    maxTrashCount: boundedMax,
    gainPerTrashed: input.gainPerTrashed,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return { publicPayload: payload };
}

export function startRunnerInstalledTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: string,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const installed = runnerInstalledCardIds(host);
  if (installed.length === 0)
    throw new Error("Keine installierten Runner-Karten.");
  host.state.pendingChoice = {
    choiceId: `v1922_runner_installed_trash_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `v1922.runner_installed_trash_gain_credits:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Installierte Karten trashen",
    kind: "select_cards",
    options: installed.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: 0,
    maxSelections: installed.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

export function startCardImplementationTrashOwnInstalledCardsForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  input: {
    sourceCardId: CardInstanceId;
    sourceDefinitionId: CardDefinitionId;
    min: 0 | 1;
    max: "any";
    gainPerTrashed: number;
  },
): { publicPayload: HiddenZonePayload } {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (input.max !== "any")
    throw new Error("Diese installierte-Karten-Auswahl unterstuetzt nur any.");
  const installed = runnerInstalledCardIds(host);
  host.state.pendingChoice = {
    choiceId: `p3_47_runner_installed_trash_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `p3_47.runner_installed_trash_for_credits:${input.sourceCardId}:${input.sourceDefinitionId}:${input.min}:${input.gainPerTrashed}:${host.state.stateVersion + 1}`,
    prompt: "Installierte Karten trashen",
    kind: "select_cards",
    options: installed.map((cardId) => {
      const definition = host.cards.definitionFor(cardId);
      return { id: `card_${cardId}`, label: definition.title, value: cardId };
    }),
    minSelections: input.min,
    maxSelections: installed.length,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
    sourceDefinitionId: input.sourceDefinitionId,
    minTrashCount: input.min,
    gainPerTrashed: input.gainPerTrashed,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return { publicPayload: payload };
}

export function startInstalledCardTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceResourceId: CardInstanceId,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  if (!host.state.runner.rig.resources.includes(sourceResourceId)) return;
  const eligible = runnerInstalledCardIds(host)
    .filter((cardId) => cardId !== sourceResourceId)
    .sort();
  if (eligible.length === 0) return;
  host.state.pendingChoice = {
    choiceId: `runner_installed_resource_trash_for_credits_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `runner.installed_resource_trash_for_credits:${sourceResourceId}:${host.state.stateVersion + 1}`,
    prompt:
      "Eine andere installierte Karte trashen und 2 Credits nehmen?",
    kind: "select_option",
    options: [
      { id: "pass", label: "Nein" },
      ...eligible.map((cardId) => ({
        id: `card_${cardId}`,
        label: host.cards.definitionFor(cardId).title,
        value: cardId,
      })),
    ],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "public",
  };
}

export function startSecretSpendGuessThenTargetedBypassRunHideChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: string,
): void {
  if (host.state.pendingChoice) throw new Error("Es ist bereits eine Choice offen.");
  const maxAmount = Math.max(0, Math.floor(host.state.runner.credits));
  if (maxAmount < 2)
    throw new Error("Die Secret-Spend-Guess-Faehigkeit benoetigt mindestens 2 Credits.");
  host.state.pendingChoice = {
    choiceId: `secret_spend_guess_then_targeted_bypass_run_hide_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Credits geheim verstecken.",
    kind: "bid_amount",
    options: Array.from({ length: maxAmount - 1 }, (_, index) => index + 2).map(
      (amount) => ({
        id: `hide_${amount}`,
        label: `${amount}`,
        publicLabel: "Versteckte Credits",
        value: amount,
      }),
    ),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "runner";
}

function resolveCorpArchivesToHqChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1922.corp_archives_to_hq"))
    throw new Error("Es ist keine V1.9.22-Archives-Choice offen.");
  const [, sourceCardId] = choice.source.split(":");
  if (!sourceCardId || !isCorpArchivesToHqSource(host, sourceCardId))
    throw new Error(
      "Die V1.9.22-Archives-Choice gehoert nicht zu Off-Site Backups.",
    );
  const selectedId = selectedChoiceCardIds(choice, requirePlayerAction(host))[0];
  if (!selectedId || !host.state.corp.archives.includes(selectedId))
    throw new Error("Die gewaehlte Archives-Karte ist ungueltig.");
  host.state.corp.archives = host.state.corp.archives.filter(
    (cardId) => cardId !== selectedId,
  );
  host.state.corp.hq.unshift(selectedId);
  host.state.cardInstances[selectedId] = {
    ...host.cards.mustInstance(selectedId),
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  delete host.state.pendingChoice;
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1922_corp_archives_to_hq",
    movedCount: 1,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return {
    handled: true,
    stateChanged: true,
    movedCardIds: [selectedId],
    resolvedPayload: payload,
  };
}

function resolveCorpHqRetainPaymentChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("runner.successful_hq_run_corp_pay_to_retain_hq"))
    throw new Error(
      "Es ist keine HQ-Retain-Zahlungs-Choice offen.",
    );
  if (!host.callbacks.hasSuccessfulHqRunThisTurn())
    throw new Error(
      "Die HQ-Retain-Zahlung benoetigt einen erfolgreichen HQ-Run in diesem Zug.",
    );
  const retainedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  const retainedSet = new Set(retainedIds);
  if (
    retainedSet.size !== retainedIds.length ||
    retainedIds.some((cardId) => !host.state.corp.hq.includes(cardId))
  )
    throw new Error("Eine gewaehlte HQ-Karte ist nicht legal.");
  const cost = retainedIds.length * 2;
  if (host.state.corp.credits < cost)
    throw new Error("Die Korp kann die behaltenen HQ-Karten nicht bezahlen.");
  const discardedIds = host.state.corp.hq.filter(
    (cardId) => !retainedSet.has(cardId),
  );
  host.callbacks.spendCorpCredits(cost);
  for (const cardId of discardedIds) {
    host.zones.removeFromAllZones(cardId);
    host.state.corp.archives.push(cardId);
    host.state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "archives" },
    };
  }
  delete host.state.pendingChoice;
  const payload = {
    v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
    hiddenZoneBarrier: true,
    hiddenZoneAction: "successful_hq_run_corp_pay_to_retain_hq",
    retainedCount: retainedIds.length,
    discardedCount: discardedIds.length,
    paidCredits: cost,
    corpCreditsAfter: host.state.corp.credits,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return {
    handled: true,
    stateChanged: true,
    retainedCount: retainedIds.length,
    discardedCount: discardedIds.length,
    paidCredits: cost,
    resolvedPayload: payload,
  };
}

function resolveRunnerGripTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (!choice) throw new Error("Es ist keine V1.9.22-Grip-Trash-Choice offen.");
  const parameters = runnerGripTrashChoiceParameters(choice.source);
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  if (selectedIds.length > parameters.max)
    throw new Error("Es wurden zu viele Grip-Karten ausgewaehlt.");
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some((cardId) => !host.state.runner.grip.includes(cardId))
  )
    throw new Error("Die Grip-Auswahl enthaelt ungueltige Karten.");
  for (const cardId of selectedIds) moveRunnerGripCardToHeap(host, cardId);
  const gainedCredits = selectedIds.length * parameters.gainPerTrashed;
  if (gainedCredits > 0) host.callbacks.gainRunnerCredits(gainedCredits);
  delete host.state.pendingChoice;
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: parameters.hiddenZoneAction,
    trashedCount: selectedIds.length,
    gainedCredits,
    runnerCreditsAfter: host.state.runner.credits,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return {
    handled: true,
    stateChanged: true,
    trashedCardIds: selectedIds,
    gainedCredits,
    resolvedPayload: payload,
  };
}

function resolveRunnerInstalledTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (!choice)
    throw new Error("Es ist keine V1.9.22-Installed-Trash-Choice offen.");
  const parameters = runnerInstalledTrashChoiceParameters(choice.source);
  const selectedIds = selectedChoiceCardIds(choice, requirePlayerAction(host));
  if (selectedIds.length < parameters.min)
    throw new Error("Es wurden zu wenige installierte Karten ausgewaehlt.");
  const installed = runnerInstalledCardIds(host);
  const selectedSet = new Set(selectedIds);
  if (
    selectedSet.size !== selectedIds.length ||
    selectedIds.some((cardId) => !installed.includes(cardId))
  )
    throw new Error("Die Installed-Auswahl enthaelt ungueltige Karten.");
  for (const cardId of selectedIds) moveRunnerInstalledCardToHeap(host, cardId);
  const gainedCredits = selectedIds.length * parameters.gainPerTrashed;
  if (gainedCredits > 0) host.callbacks.gainRunnerCredits(gainedCredits);
  delete host.state.pendingChoice;
  const payload = {
    hiddenZoneBarrier: true,
    hiddenZoneAction: parameters.hiddenZoneAction,
    trashedCount: selectedIds.length,
    gainedCredits,
    runnerCreditsAfter: host.state.runner.credits,
  };
  host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
  return {
    handled: true,
    stateChanged: true,
    trashedCardIds: selectedIds,
    gainedCredits,
    resolvedPayload: payload,
  };
}

function resolveInstalledResourceTrashForCreditsChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (
    !choice ||
    !choice.source.startsWith("runner.installed_resource_trash_for_credits")
  )
    throw new Error("Es ist keine Ressourcen-Trash-fuer-Credits-Choice offen.");
  const sourceParts = choice.source.split(":");
  const sourceResourceId = sourceParts[1];
  if (
    !sourceResourceId ||
    !host.state.runner.rig.resources.includes(sourceResourceId)
  )
    throw new Error("Die ausloesende Ressource ist nicht mehr installiert.");
  const sourceDefinition = host.cards.definitionFor(sourceResourceId);
  const gainCredits =
    host.cards.installedResourceTrashCreditGain(sourceResourceId);
  const selectedId =
    selectedChoiceIds(requirePlayerAction(host).selectedChoices)[0] ?? "pass";
  if (selectedId !== "pass") {
    const option = choice.options.find((candidate) => candidate.id === selectedId);
    const cardId = typeof option?.value === "string" ? option.value : "";
    if (!cardId) throw new Error("Die gewaehlte Karte ist ungueltig.");
    if (cardId === sourceResourceId)
      throw new Error("Die ausloesende Ressource kann sich nicht selbst trashen.");
    if (!runnerInstalledCardIds(host).includes(cardId))
      throw new Error("Die gewaehlte Karte ist nicht mehr installiert.");
    const trashedDefinition = host.cards.definitionFor(cardId);
    host.zones.trashRunnerInstalledCardToHeap(cardId);
    host.callbacks.gainRunnerCredits(gainCredits);
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      installedResourceTrashForCreditsTriggered: true,
      trashForCreditsSourceCardId: sourceResourceId,
      sourceDefinitionId: sourceDefinition.id,
      trashedCardId: cardId,
      trashedCardDefinitionId: trashedDefinition.id,
      trashedCardTitle: trashedDefinition.title,
      creditsGained: gainCredits,
      gainedCredits: gainCredits,
    };
    delete host.state.pendingChoice;
    return {
      handled: true,
      stateChanged: true,
      trashedCardIds: [cardId],
      gainedCredits: gainCredits,
    };
  }
  host.legalAction.payload = {
    ...(host.legalAction.payload ?? {}),
    installedResourceTrashForCreditsTriggered: false,
    trashForCreditsSourceCardId: sourceResourceId,
    sourceDefinitionId: sourceDefinition.id,
  };
  delete host.state.pendingChoice;
  return { handled: true, stateChanged: false };
}

function resolveSecretSpendGuessThenTargetedBypassRunChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): HiddenZoneNonSearchChoiceHandlerResult {
  const choice = host.state.pendingChoice;
  if (!choice || !isSecretSpendGuessTargetedBypassRunChoiceSource(choice.source))
    throw new Error("Es ist keine Secret-Spend-Guess-Choice offen.");
  const [, sourceCardId = ""] = choice.source.split(":");
  if (host.cards.definitionFor(sourceCardId).id !== host.constants.runAccessPressureEventCardId)
    throw new Error("Die Secret-Spend-Guess-Quelle passt nicht zur Karte.");
  const playerAction = requirePlayerAction(host);
  if (choice.source.startsWith("hidden_zone.secret_spend_guess_then_targeted_bypass_run.hide:")) {
    const hiddenAmount = selectedBidAmount(choice, playerAction);
    if (hiddenAmount < 2 || hiddenAmount > host.state.runner.credits)
      throw new Error("Der Secret-Spend-Guess-Betrag ist nicht legal.");
    host.state.secretSpendGuessRunSecret = {
      sourceCardId,
      hiddenAmount,
    };
    host.state.pendingChoice = secretSpendGuessChoice(host, sourceCardId);
    host.state.activeSide = "corp";
    const payload = {
      sourceDefinitionId: host.constants.runAccessPressureEventCardId,
      secretSpendGuessRunStep: "runner_hidden_amount_selected",
      hiddenZoneBarrier: true,
    };
    host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
    return { handled: true, stateChanged: true, resolvedPayload: payload };
  }
  if (choice.source.startsWith("hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:")) {
    const secret = host.state.secretSpendGuessRunSecret;
    if (!secret || secret.sourceCardId !== sourceCardId)
      throw new Error("Die Secret-Spend-Guess-Choice hat keinen geheimen Betrag.");
    const guess = selectedBidAmount(choice, playerAction);
    const correct = guess === secret.hiddenAmount;
    if (correct) {
      host.state.runner.credits = Math.max(
        0,
        host.state.runner.credits - secret.hiddenAmount,
      );
      delete host.state.secretSpendGuessRunSecret;
      delete host.state.pendingChoice;
      host.state.activeSide = "runner";
      const payload = {
        sourceDefinitionId: host.constants.runAccessPressureEventCardId,
        secretSpendGuessRunGuessCorrect: true,
        secretHiddenAmountRevealed: secret.hiddenAmount,
        secretGuessAmount: guess,
        runnerCreditsAfter: host.state.runner.credits,
        hiddenZoneBarrier: true,
      };
      host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
      return { handled: true, stateChanged: true, paidCredits: secret.hiddenAmount };
    }
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      sourceDefinitionId: host.constants.runAccessPressureEventCardId,
      secretSpendGuessRunGuessCorrect: false,
      secretHiddenAmountRevealed: secret.hiddenAmount,
      secretGuessAmount: guess,
      hiddenZoneBarrier: true,
    };
    startSecretSpendGuessTargetedBypassRunTargetChoice(host, sourceCardId);
    return { handled: true, stateChanged: true };
  }
  if (choice.source.startsWith("hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:")) {
    const selectedId = selectedChoiceIds(playerAction.selectedChoices)[0] ?? "";
    const option = choice.options.find((candidate) => candidate.id === selectedId);
    const value = typeof option?.value === "string" ? option.value : "";
    const [serverId = "", iceId = ""] = value.split("|") as [
      Exclude<ServerId, "new_remote">,
      CardInstanceId,
    ];
    const server = host.servers.mustServer(serverId);
    if (!server.ice.includes(iceId))
      throw new Error("Das Secret-Spend-Guess-ICE-Ziel ist nicht mehr installiert.");
    delete host.state.secretSpendGuessRunSecret;
    delete host.state.pendingChoice;
    const payload = {
      sourceDefinitionId: host.constants.runAccessPressureEventCardId,
      secretSpendGuessRunGuessCorrect: false,
      autoPassChosenIce: true,
      secretSpendGuessRun: true,
      hiddenZoneBarrier: true,
      serverId,
      chosenIcePosition: server.ice.indexOf(iceId),
    };
    host.legalAction.payload = { ...(host.legalAction.payload ?? {}), ...payload };
    host.callbacks.startRunWithAutoPass(server.id, iceId);
    return {
      handled: true,
      stateChanged: true,
      selectedTargetId: `${server.id}|${iceId}`,
      resolvedPayload: payload,
    };
  }
  throw new Error("Unbekannte Secret-Spend-Guess-Choice.");
}

function startSecretSpendGuessTargetedBypassRunTargetChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): void {
  const slots = installedIceSlots(host);
  if (slots.length === 0) {
    delete host.state.secretSpendGuessRunSecret;
    delete host.state.pendingChoice;
    host.state.activeSide = "runner";
    host.legalAction.payload = {
      ...(host.legalAction.payload ?? {}),
      sourceDefinitionId: host.constants.runAccessPressureEventCardId,
      secretSpendGuessRunGuessCorrect: false,
      secretSpendGuessRunNoIceTarget: true,
      hiddenZoneBarrier: true,
    };
    return;
  }
  host.state.pendingChoice = {
    choiceId: `secret_spend_guess_then_targeted_bypass_run_target_${host.state.stateVersion + 1}`,
    side: "runner",
    source: `hidden_zone.secret_spend_guess_then_targeted_bypass_run.target:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Fort und ICE fuer Auto-Pass waehlen.",
    kind: "select_cards",
    options: slots.map((slot) => {
      const fallback = `${host.servers.publicServerLabel(slot.serverId) ?? slot.serverId} ICE ${slot.index + 1}`;
      const labels = host.servers.iceChoiceLabelForSide(
        slot.cardId,
        "runner",
        fallback,
      );
      return {
        id: `ice_${slot.cardId}`,
        label: labels.label,
        publicLabel: fallback,
        value: `${slot.serverId}|${slot.cardId}`,
      };
    }),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  host.state.activeSide = "runner";
}

function secretSpendGuessChoice(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: CardInstanceId,
): ChoiceRequest {
  const maxAmount = Math.max(2, Math.floor(host.state.runner.credits));
  return {
    choiceId: `secret_spend_guess_then_targeted_bypass_run_guess_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:${sourceCardId}:${host.state.stateVersion + 1}`,
    prompt: "Versteckte Credits raten.",
    kind: "bid_amount",
    options: Array.from({ length: maxAmount + 1 }, (_, amount) => ({
      id: `guess_${amount}`,
      label: `${amount}`,
      publicLabel: "Geratene Credits",
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
}

function runnerGripTrashChoiceParameters(choiceSource: string): {
  max: number;
  gainPerTrashed: number;
  hiddenZoneAction: string;
} {
  if (choiceSource.startsWith("p3_47.runner_grip_trash_for_credits")) {
    const [, , , max, gainPerTrashed] = choiceSource.split(":");
    return {
      max: Math.max(0, Math.floor(Number(max))),
      gainPerTrashed: Math.max(0, Math.floor(Number(gainPerTrashed))),
      hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
    };
  }
  return {
    max: 5,
    gainPerTrashed: 2,
    hiddenZoneAction: "v1922_runner_grip_trash_gain_credits",
  };
}

function runnerInstalledTrashChoiceParameters(choiceSource: string): {
  min: number;
  gainPerTrashed: number;
  hiddenZoneAction: string;
} {
  if (choiceSource.startsWith("p3_47.runner_installed_trash_for_credits")) {
    const [, , , min, gainPerTrashed] = choiceSource.split(":");
    return {
      min: Math.max(0, Math.floor(Number(min))),
      gainPerTrashed: Math.max(0, Math.floor(Number(gainPerTrashed))),
      hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
    };
  }
  return {
    min: 0,
    gainPerTrashed: 3,
    hiddenZoneAction: "v1922_runner_installed_trash_gain_credits",
  };
}

function moveRunnerGripCardToHeap(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  cardId: CardInstanceId,
): void {
  host.zones.removeFromAllZones(cardId);
  host.state.runner.heap.push(cardId);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: true,
    zone: { side: "runner", zone: "heap" },
  };
}

function moveRunnerInstalledCardToHeap(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  cardId: CardInstanceId,
): void {
  host.zones.removeFromAllZones(cardId);
  host.state.runner.heap.push(cardId);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: true,
    zone: { side: "runner", zone: "heap" },
  };
}

function runnerInstalledCardIds(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): CardInstanceId[] {
  return [
    ...host.state.runner.rig.programs,
    ...host.state.runner.rig.hardware,
    ...host.state.runner.rig.resources,
  ];
}

function installedIceSlots(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): NonSearchInstalledIceSlot[] {
  const slots: NonSearchInstalledIceSlot[] = [];
  for (const server of host.state.corp.servers) {
    for (let index = 0; index < server.ice.length; index += 1) {
      slots.push({
        server,
        serverId: server.id,
        index,
        cardId: server.ice[index]!,
      });
    }
  }
  return slots;
}

function isCorpArchivesToHqSource(
  host: HiddenZoneNonSearchChoiceHandlerHost,
  sourceCardId: string,
): sourceCardId is CardInstanceId {
  if (!sourceCardId) return false;
  return (
    host.cards.definitionFor(sourceCardId).id ===
      host.constants.corpArchivesToHqOperationCardId ||
    host.cards.hasCorpUtilityKind(sourceCardId, "corp_archives_to_hq")
  );
}

function selectedChoiceCardIds(
  choice: ChoiceRequest,
  playerAction: PlayerAction,
): CardInstanceId[] {
  return selectedChoiceIds(playerAction.selectedChoices).map((optionId) => {
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (typeof option?.value !== "string")
      throw new Error("Die gewaehlte Kartenoption ist ungueltig.");
    return option.value;
  });
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

function selectedBidAmount(
  choice: ChoiceRequest | undefined,
  playerAction: PlayerAction,
): number {
  if (!choice) throw new Error("Es ist keine Bid-Choice offen.");
  const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];
  const selected = choice.options.find((option) => option.id === selectedOptionId);
  const amount = typeof selected?.value === "number" ? selected.value : Number.NaN;
  if (!Number.isInteger(amount) || amount < 0)
    throw new Error("Der Trace-Bid ist ungueltig.");
  return amount;
}

function requirePlayerAction(
  host: HiddenZoneNonSearchChoiceHandlerHost,
): PlayerAction {
  if (!host.playerAction) throw new Error("PlayerAction fehlt fuer Choice.");
  return host.playerAction;
}
