import {
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CorpServer,
  type GameState,
  type LegalAction,
  type PurgeableRunnerVirusCounterType,
  type ResolvedGameEffect,
  type ServerId,
  type Side,
} from "@netgrid/shared";
import {
  CARD_IMPLEMENTATIONS,
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import { costQuotePublicPayload, type CostQuote } from "../payment";
import { assertCorpIceInstallAllowed } from "./corp-ice-install-restrictions";
import {
  purgeableRunnerVirusCounterAmount,
  setPurgeableRunnerVirusCounterAmount,
} from "../turn/turn-basic-execution";
import {
  runnerInstallPaymentPublicPayload,
  type RunnerInstallCreditSpendResult,
} from "./runner-program-install-payment";
import {
  completeRunnerProgramRigInstall,
  type RunnerProgramInstallInstancePatch,
} from "./runner-rig-install-finalization";

export type InstallCardHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    mustInstance: (cardId: CardInstanceId) => CardInstance;
    isUniqueCard: (definition: CardDefinition) => boolean;
    hasInstalledUniqueCardDefinition: (
      side: Side,
      definitionId: CardDefinitionId,
    ) => boolean;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    isRunnerHardwareDeckDefinition: (definition: CardDefinition) => boolean;
    hasCardImplementationMemoryUnitModifier: (
      definition: CardDefinition,
    ) => boolean;
    shouldLoadLegacyRecurringCredits: (definition: CardDefinition) => boolean;
    damagePreventionSourcesForDefinition: (
      definition: CardDefinition,
    ) => readonly unknown[];
    cardImplementationAgendaPointInstallCost: (
      definition: CardDefinition,
    ) => number;
  };
  servers: {
    assertCorpCanCreateNewDataFort: () => void;
    mustServer: (serverId: string) => CorpServer;
    createRemote: () => CorpServer;
    serverChoiceDisplayLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string;
    canInstallCorpRootCardInServer: (
      definition: CardDefinition,
      server: CorpServer,
    ) => boolean;
    corpRootAgendaOrNodeCapacityInServer: (server: CorpServer) => number;
    corpRootAssetIdsInServer: (server: CorpServer) => CardInstanceId[];
    corpRootMainCardIdsInServer: (server: CorpServer) => CardInstanceId[];
    rootInstallRezzesOnInstall: (definition: CardDefinition) => boolean;
    trashOlderRegionUpgradesInServer: (
      server: CorpServer,
      keepCardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    markFortActivityForRunGate: (
      serverId: Exclude<ServerId, "new_remote">,
      legalAction: LegalAction,
    ) => void;
  };
  zones: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    trashRunnerInstalledCardToHeap: (cardId: CardInstanceId) => void;
    trashCorpInstalledCardToArchives: (
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
  };
  runner: {
    ensureTurnFlags: () => NonNullable<GameState["runnerTurnFlags"]>;
    requiresDataFortInstallTarget: (definition: CardDefinition) => boolean;
    startRunnerProgramTrashBeforeInstallChoice: (
      cardId: CardInstanceId,
      legalAction: LegalAction,
    ) => void;
    forfeitRunnerAgendaForPointCost: (cardId: CardInstanceId) => void;
    consumeValuPakProgramInstallAction: (legalAction: LegalAction) => void;
    hiddenRunnerResourceSlotId: (cardId: CardInstanceId) => CardInstanceId;
  };
  corp: {
    expireScoredAgendaInstallRezCreditAbilities: () => void;
    consumeEdgerunnerTempsInstallAction: (legalAction: LegalAction) => void;
    isRegionUpgrade: (definition: CardDefinition) => boolean;
    isFortTraceBitPoolSource: (cardId: CardInstanceId) => boolean;
    fortTraceBitPoolCapacityForCard: (cardId: CardInstanceId) => number;
  };
  hosting: {
    canHostProgramOnDaemon: (
      hostCardId: CardInstanceId,
      definition: CardDefinition,
    ) => boolean;
    hostedPaymentCredits: (cardId: CardInstanceId) => number;
  };
  payment: {
    assertCorpIceInstallCostValid: (
      cardId: CardInstanceId,
      definition: CardDefinition,
      legalAction: LegalAction,
    ) => CostQuote | undefined;
    spendClick: (side: Side) => void;
    spendRunnerInstallCredits: (
      amount: number,
      cardType: CardDefinition["type"],
      paymentPayload?: LegalAction["payload"],
    ) => RunnerInstallCreditSpendResult;
    runnerCanPayInstallCost: (
      amount: number,
      cardType: CardDefinition["type"],
    ) => boolean;
    openRunnerCostPenaltySupportWindow: (
      legalAction: LegalAction,
      amount: number,
      cardType: CardDefinition["type"],
    ) => boolean;
    closeRunnerCostPenaltySupportWindowForPayment: (
      legalAction: LegalAction,
      amount: number,
    ) => void;
    spendCredits: (side: Side, amount: number) => void;
    rezCostForCard: (cardId: CardInstanceId) => number;
  };
  counters: {
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: string,
      amount: number,
    ) => void;
    rollDeterministicDie: (purpose: string) => number;
  };
  lifecycle: {
    executeOnInstall: (
      legalAction: LegalAction,
      definition: CardDefinition,
      cardId: CardInstanceId,
    ) => void;
  };
};

export function installCard(
  host: InstallCardHost,
  legalAction: LegalAction,
): void {
  const { state } = host;
  const cardId = String(legalAction.payload?.cardId) as CardInstanceId;
  const definition = host.cards.definitionFor(cardId);
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition(legalAction.side, definition.id)
  ) {
    throw new Error(
      "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
    );
  }
  const corpIceInstallQuote = host.payment.assertCorpIceInstallCostValid(
    cardId,
    definition,
    legalAction,
  );
  if (
    legalAction.side === "runner" &&
    definition.type === "program" &&
    legalAction.payload?.runnerProgramTrashBeforeInstall === true &&
    legalAction.payload?.runnerProgramTrashBeforeInstallResolved !== true
  ) {
    host.runner.startRunnerProgramTrashBeforeInstallChoice(cardId, legalAction);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      runnerProgramTrashChoiceOpened: true,
    };
    return;
  }
  if (
    legalAction.side === "corp" &&
    legalAction.payload?.serverId === "new_remote"
  ) {
    host.servers.assertCorpCanCreateNewDataFort();
  }
  if (
    legalAction.side === "corp" &&
    definition.type === "ice" &&
    legalAction.payload?.placement === "ice"
  ) {
    const server =
      legalAction.payload?.serverId === "new_remote"
        ? undefined
        : host.servers.mustServer(String(legalAction.payload?.serverId));
    assertCorpIceInstallAllowed(
      definition,
      server ?? { id: "new_remote", kind: "remote" },
    );
  }
  const runnerInstallCostsPrepaid =
    legalAction.payload?.runnerProgramTrashBeforeInstallCostsPrepaid === true;
  if (legalAction.side === "runner" && !runnerInstallCostsPrepaid) {
    const installCost = definition.installCost ?? 0;
    if (
      host.payment.openRunnerCostPenaltySupportWindow(
        legalAction,
        installCost,
        definition.type,
      )
    )
      return;
    if (!host.payment.runnerCanPayInstallCost(installCost, definition.type)) {
      throw new Error(
        "Der Runner kann die Installationskosten nicht bezahlen.",
      );
    }
    host.payment.closeRunnerCostPenaltySupportWindowForPayment(
      legalAction,
      installCost,
    );
  }
  host.payment.spendClick(legalAction.side);
  if (legalAction.side === "runner") {
    installRunnerCard(host, legalAction, cardId, definition);
    return;
  }
  installCorpCard(host, legalAction, cardId, definition, corpIceInstallQuote);
}

function installRunnerCard(
  host: InstallCardHost,
  legalAction: LegalAction,
  cardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const { state } = host;
  const hostOnCardId =
    typeof legalAction.payload?.hostOnCardId === "string"
      ? (String(legalAction.payload.hostOnCardId) as CardInstanceId)
      : undefined;
  const selectedServerId =
    typeof legalAction.payload?.selectedServerId === "string"
      ? String(legalAction.payload.selectedServerId)
      : undefined;
  const selectedCardId =
    typeof legalAction.payload?.selectedCardId === "string"
      ? (String(legalAction.payload.selectedCardId) as CardInstanceId)
      : undefined;
  const selectedSubtype =
    typeof legalAction.payload?.selectedSubtype === "string"
      ? String(legalAction.payload.selectedSubtype)
      : undefined;
  const installTargetBinding = cardImplementationForDefinitionId(
    definition.id,
  )?.installTargetBinding;
  if (definition.type !== "program" && hostOnCardId) {
    throw new Error("Nur Programme koennen gehostet installiert werden.");
  }
  if (
    definition.type === "program" &&
    hostOnCardId &&
    ![...state.runner.rig.programs, ...state.runner.rig.hardware].includes(
      hostOnCardId,
    )
  ) {
    throw new Error("Der angegebene Host ist nicht installiert.");
  }
  if (
    definition.type === "program" &&
    hostOnCardId &&
    !host.hosting.canHostProgramOnDaemon(hostOnCardId, definition)
  ) {
    throw new Error("Der angegebene Program-Host ist ungueltig.");
  }
  if (
    host.runner.requiresDataFortInstallTarget(definition) &&
    (!selectedServerId || selectedServerId === "new_remote")
  ) {
    throw new Error(
      "Restrictive Net Zoning benötigt einen gültigen Zielserver.",
    );
  }
  if (installTargetBinding?.kind === "choose_installed_ice_on_install") {
    if (!selectedCardId)
      throw new Error("Die Installation benötigt ein ICE-Ziel.");
    const targetInstance = state.cardInstances[selectedCardId];
    if (
      !targetInstance ||
      targetInstance.zone.side !== "corp" ||
      targetInstance.zone.zone !== "serverIce"
    )
      throw new Error("Das gewählte ICE-Ziel ist nicht installiert.");
  }
  if (installTargetBinding?.kind === "choose_icebreaker_subtype_on_install") {
    const allowed: readonly string[] = installTargetBinding.choices ?? [
      "code_gate",
      "sentry",
      "wall",
    ];
    if (!selectedSubtype || !allowed.includes(selectedSubtype))
      throw new Error(
        "Die Installation benötigt einen gültigen Icebreaker-Typ.",
      );
  }
  validateRunnerInstallCapabilities(host, definition);
  const restrictiveTargetServerId =
    selectedServerId && selectedServerId !== "new_remote"
      ? (selectedServerId as Exclude<ServerId, "new_remote">)
      : undefined;
  if (
    host.runner.requiresDataFortInstallTarget(definition) &&
    restrictiveTargetServerId
  ) {
    host.servers.mustServer(restrictiveTargetServerId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      selectedServerLabel: host.servers.serverChoiceDisplayLabel(
        restrictiveTargetServerId,
      ),
    };
  }
  const concealedHiddenRunnerResource =
    definition.type === "resource" &&
    host.cards.cardHasSubtype(definition, "hidden");
  const cardImplementationAgendaPointCost =
    host.cards.cardImplementationAgendaPointInstallCost(definition);
  if (cardImplementationAgendaPointCost > 0) {
    const agendaCost = Number(legalAction.payload?.installAgendaPointCost ?? 0);
    if (
      !Number.isInteger(agendaCost) ||
      agendaCost !== cardImplementationAgendaPointCost
    )
      throw new Error(
        "Die CardImplementation-Installation benötigt exakt die deklarierten Agenda-Punkt-Zusatzkosten.",
      );
    const agendaPointSourceCardId = String(
      legalAction.payload?.spentAgendaCardId ??
        legalAction.payload?.forfeitAgendaCardId ??
        "",
    ) as CardInstanceId;
    host.runner.forfeitRunnerAgendaForPointCost(agendaPointSourceCardId);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaPointCostPaid: agendaCost,
      spentAgendaCardId: agendaPointSourceCardId,
    };
  }
  if (
    legalAction.payload?.runnerProgramTrashBeforeInstallCostsPrepaid !== true
  ) {
    const paymentResult = host.payment.spendRunnerInstallCredits(
      definition.installCost ?? 0,
      definition.type,
      legalAction.payload,
    );
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      ...runnerInstallPaymentPublicPayload(paymentResult),
    };
  }
  host.zones.removeFromAllZones(cardId);
  let runnerRigInstallFinalized = false;
  if (definition.type === "hardware") {
    installRunnerHardware(host, legalAction, cardId, definition);
  } else if (definition.type === "program") {
    installRunnerProgram(host, cardId, definition, hostOnCardId, {
      ...(hostOnCardId ? { hostedOn: hostOnCardId } : {}),
      ...(installTargetBinding?.kind === "choose_installed_ice_on_install" &&
      selectedCardId
        ? { selectedCardId }
        : {}),
      ...(installTargetBinding?.kind ===
        "choose_icebreaker_subtype_on_install" && selectedSubtype
        ? { selectedSubtype }
        : {}),
    });
    runnerRigInstallFinalized = true;
  } else if (definition.type === "resource") {
    installRunnerResource(
      host,
      legalAction,
      cardId,
      definition,
      concealedHiddenRunnerResource,
    );
    const flags = host.runner.ensureTurnFlags();
    flags.installedResourceIdsThisTurn = [
      ...(flags.installedResourceIdsThisTurn ?? []),
      cardId,
    ];
  } else {
    throw new Error(
      "Nur Programme, Hardware und Resources koennen vom Runner installiert werden.",
    );
  }
  if (!runnerRigInstallFinalized)
    state.cardInstances[cardId] = {
      ...host.cards.mustInstance(cardId),
      faceup: !concealedHiddenRunnerResource,
      rezzed: !concealedHiddenRunnerResource,
      zone: { side: "runner", zone: "rig" },
      ...(host.runner.requiresDataFortInstallTarget(definition) &&
      restrictiveTargetServerId
        ? { selectedServerId: restrictiveTargetServerId }
        : {}),
    };
  host.runner.consumeValuPakProgramInstallAction(legalAction);
  if (host.cards.shouldLoadLegacyRecurringCredits(definition)) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      recurringCreditsLoaded: definition.recurringCredits ?? 0,
    };
  }
  host.lifecycle.executeOnInstall(legalAction, definition, cardId);
}

function validateRunnerInstallCapabilities(
  host: InstallCardHost,
  definition: CardDefinition,
): void {
  const installCapabilities =
    cardImplementationForDefinitionId(definition.id)?.installCapabilities ?? [];
  for (const capability of installCapabilities) {
    if (capability.kind !== "runner_made_successful_run_on_server_this_turn")
      continue;
    const flags = host.runner.ensureTurnFlags();
    const allowed =
      (capability.server === "hq" && flags.successfulHqRunThisTurn === true) ||
      (capability.server === "rd" && flags.successfulRdRunThisTurn === true) ||
      (capability.server === "any_data_fort" &&
        flags.successfulRunThisTurn === true);
    if (!allowed)
      throw new Error(
        "Diese Karte darf erst nach einem passenden erfolgreichen Run in diesem Zug installiert werden.",
      );
  }
}

function installRunnerHardware(
  host: InstallCardHost,
  legalAction: LegalAction,
  cardId: CardInstanceId,
  definition: CardDefinition,
): void {
  const { state } = host;
  const trashedDeckDefinitionIds: string[] = [];
  if (host.cards.isRunnerHardwareDeckDefinition(definition)) {
    for (const oldDeckId of state.runner.rig.hardware.slice().sort()) {
      if (
        !host.cards.isRunnerHardwareDeckDefinition(
          host.cards.definitionFor(oldDeckId),
        )
      )
        continue;
      trashedDeckDefinitionIds.push(host.cards.definitionFor(oldDeckId).id);
      host.zones.trashRunnerInstalledCardToHeap(oldDeckId);
    }
  }
  state.runner.rig.hardware.push(cardId);
  if (!host.cards.hasCardImplementationMemoryUnitModifier(definition)) {
    if (definition.mechanics.includes("modify_memory_limit"))
      state.runner.memoryLimit += definition.memoryLimitBonus ?? 1;
    else if ((definition.memoryLimitBonus ?? 0) > 0)
      state.runner.memoryLimit += definition.memoryLimitBonus ?? 0;
  }
  if (host.cards.shouldLoadLegacyRecurringCredits(definition))
    host.counters.setCardCounter(
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  if (trashedDeckDefinitionIds.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      deckUniqueReplacement: true,
      trashedDeckDefinitionIds: trashedDeckDefinitionIds.join(","),
    };
  }
}

function installRunnerProgram(
  host: InstallCardHost,
  cardId: CardInstanceId,
  definition: CardDefinition,
  hostOnCardId: CardInstanceId | undefined,
  instancePatch: RunnerProgramInstallInstancePatch,
): void {
  completeRunnerProgramRigInstall({
    state: host.state,
    cardId,
    definition,
    usesMemory: !hostOnCardId,
    mustInstance: host.cards.mustInstance,
    setCardCounter: host.counters.setCardCounter,
    addCardCounter: host.counters.addCardCounter,
    shouldLoadLegacyRecurringCredits:
      host.cards.shouldLoadLegacyRecurringCredits,
    instancePatch,
  });
}

function installRunnerResource(
  host: InstallCardHost,
  legalAction: LegalAction,
  cardId: CardInstanceId,
  definition: CardDefinition,
  concealedHiddenRunnerResource: boolean,
): void {
  host.state.runner.rig.resources.push(cardId);
  if (
    host.cards.shouldLoadLegacyRecurringCredits(definition) &&
    !concealedHiddenRunnerResource
  )
    host.counters.setCardCounter(
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  if (concealedHiddenRunnerResource) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      hiddenRunnerResourceInstall: true,
      hiddenResourceSlotId: host.runner.hiddenRunnerResourceSlotId(cardId),
      redactedKind: "hidden_runner_resource",
    };
  }
}

function installCorpCard(
  host: InstallCardHost,
  legalAction: LegalAction,
  cardId: CardInstanceId,
  definition: CardDefinition,
  corpIceInstallQuote: CostQuote | undefined,
): void {
  const { state } = host;
  const placement = legalAction.payload?.placement;
  if (placement === "ice") {
    const server =
      legalAction.payload?.serverId === "new_remote"
        ? undefined
        : host.servers.mustServer(String(legalAction.payload?.serverId));
    assertCorpIceInstallAllowed(
      definition,
      server ?? { id: "new_remote", kind: "remote" },
    );
    const installServer = server ?? host.servers.createRemote();
    if (corpIceInstallQuote) {
      legalAction.payload = {
        ...(legalAction.payload ?? {}),
        ...costQuotePublicPayload(corpIceInstallQuote),
      };
    }
    host.payment.spendCredits(
      "corp",
      corpIceInstallQuote?.finalCredits ?? legalAction.costs[0]?.credits ?? 0,
    );
    finalizeCorpIceInstallAfterExternalPayment(
      host,
      cardId,
      installServer,
      legalAction,
    );
    return;
  }

  host.zones.removeFromAllZones(cardId);
  const server =
    legalAction.payload?.serverId === "new_remote"
      ? host.servers.createRemote()
      : host.servers.mustServer(String(legalAction.payload?.serverId));
  if (!host.servers.canInstallCorpRootCardInServer(definition, server)) {
    throw new Error(
      "In diesem Server darf diese Karte nicht im Root installiert sein.",
    );
  }
  const rootCapacity =
    host.servers.corpRootAgendaOrNodeCapacityInServer(server);
  const replacedRootAssetIds =
    definition.type === "agenda" &&
    host.servers.corpRootMainCardIdsInServer(server).length >= rootCapacity
      ? host.servers.corpRootAssetIdsInServer(server)
      : [];
  const replacedRootDefinitionIds = replacedRootAssetIds.map(
    (replacedId) => host.cards.definitionFor(replacedId).id,
  );
  for (const replacedId of replacedRootAssetIds) {
    host.zones.trashCorpInstalledCardToArchives(replacedId, legalAction);
  }
  if (replacedRootAssetIds.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      rootReplacement: "asset_to_agenda",
      replacedRootCardIds: replacedRootAssetIds.join(","),
      replacedRootDefinitionIds: replacedRootDefinitionIds.join(","),
      replacedRootCardType: "asset",
    };
  }
  server.root.push(cardId);
  const rootRezOnInstall = host.servers.rootInstallRezzesOnInstall(definition);
  if (rootRezOnInstall) {
    host.payment.spendCredits(
      "corp",
      legalAction.costs[0]?.credits ?? host.payment.rezCostForCard(cardId),
    );
  }
  state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: rootRezOnInstall,
    rezzed: rootRezOnInstall,
    zone: { side: "corp", zone: "serverRoot", serverId: server.id },
  };
  host.corp.expireScoredAgendaInstallRezCreditAbilities();
  if (rootRezOnInstall) {
    appendRootRezOnInstallEffect(host, server, cardId, definition, legalAction);
  }
  if (rootRezOnInstall && host.corp.isFortTraceBitPoolSource(cardId)) {
    const capacity = host.corp.fortTraceBitPoolCapacityForCard(cardId);
    host.counters.setCardCounter(cardId, "bit", capacity);
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      sourceDefinitionId: definition.id,
      counterType: "bit",
      addedCounterAmount: capacity,
      remainingCounters: capacity,
    };
  }
  host.lifecycle.executeOnInstall(legalAction, definition, cardId);
  if (host.corp.isRegionUpgrade(definition)) {
    host.servers.trashOlderRegionUpgradesInServer(server, cardId, legalAction);
  }
  host.servers.markFortActivityForRunGate(server.id, legalAction);
  host.corp.consumeEdgerunnerTempsInstallAction(legalAction);
  applyArmageddonDoomCounterInstallRolls(host, cardId, legalAction);
}

/**
 * Completes the canonical Corp ICE install lifecycle after an owning Engine
 * effect has validated and paid its exact install contract. Action and base
 * install costs stay with that owning effect; board legality, fort activity,
 * install-triggered replacements and install/rez-credit invalidation do not.
 */
export function finalizeCorpIceInstallAfterExternalPayment(
  host: InstallCardHost,
  cardId: CardInstanceId,
  server: CorpServer,
  legalAction: LegalAction,
  options: { placement?: "outermost" | "innermost" } = {},
): void {
  const definition = host.cards.definitionFor(cardId);
  if (definition.type !== "ice")
    throw new Error("Der externe Corp-ICE-Installpfad braucht ICE.");
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition("corp", definition.id)
  )
    throw new Error(
      "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
    );
  assertCorpIceInstallAllowed(definition, server);
  host.zones.removeFromAllZones(cardId);
  if (options.placement === "innermost") server.ice.unshift(cardId);
  else server.ice.push(cardId);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId: server.id },
  };
  host.corp.expireScoredAgendaInstallRezCreditAbilities();
  host.lifecycle.executeOnInstall(legalAction, definition, cardId);
  host.servers.markFortActivityForRunGate(server.id, legalAction);
  host.corp.consumeEdgerunnerTempsInstallAction(legalAction);
  applyArmageddonDoomCounterInstallRolls(host, cardId, legalAction);
}

/**
 * Completes an already-paid Corp root install for an Engine-owned effect.
 * Mandatory rez-on-install payment stays with the owning sequence, while the
 * canonical install legality, replacement, lifecycle and fort hooks stay here.
 */
export function finalizeCorpRootInstallAfterExternalPayment(
  host: InstallCardHost,
  cardId: CardInstanceId,
  server: CorpServer,
  legalAction: LegalAction,
): void {
  const definition = host.cards.definitionFor(cardId);
  if (
    definition.type !== "asset" &&
    definition.type !== "agenda" &&
    definition.type !== "upgrade"
  )
    throw new Error(
      "Der externe Corp-Root-Installpfad braucht eine Root-Karte.",
    );
  if (
    host.cards.isUniqueCard(definition) &&
    host.cards.hasInstalledUniqueCardDefinition("corp", definition.id)
  )
    throw new Error(
      "Eine Unique-Karte mit diesem Namen ist bereits installiert.",
    );
  if (!host.servers.canInstallCorpRootCardInServer(definition, server))
    throw new Error(
      "In diesem Server darf diese Karte nicht im Root installiert sein.",
    );
  const rootCapacity =
    host.servers.corpRootAgendaOrNodeCapacityInServer(server);
  const replacedRootAssetIds =
    definition.type === "agenda" &&
    host.servers.corpRootMainCardIdsInServer(server).length >= rootCapacity
      ? host.servers.corpRootAssetIdsInServer(server)
      : [];
  const replacedRootDefinitionIds = replacedRootAssetIds.map(
    (replacedId) => host.cards.definitionFor(replacedId).id,
  );
  for (const replacedId of replacedRootAssetIds)
    host.zones.trashCorpInstalledCardToArchives(replacedId, legalAction);
  if (replacedRootAssetIds.length > 0) {
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      rootReplacement: "asset_to_agenda",
      replacedRootCardIds: replacedRootAssetIds.join(","),
      replacedRootDefinitionIds: replacedRootDefinitionIds.join(","),
      replacedRootCardType: "asset",
    };
  }
  host.zones.removeFromAllZones(cardId);
  server.root.push(cardId);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverRoot", serverId: server.id },
  };
  host.corp.expireScoredAgendaInstallRezCreditAbilities();
  host.lifecycle.executeOnInstall(legalAction, definition, cardId);
  if (host.corp.isRegionUpgrade(definition))
    host.servers.trashOlderRegionUpgradesInServer(server, cardId, legalAction);
  host.servers.markFortActivityForRunGate(server.id, legalAction);
  host.corp.consumeEdgerunnerTempsInstallAction(legalAction);
  applyArmageddonDoomCounterInstallRolls(host, cardId, legalAction);
}

function appendRootRezOnInstallEffect(
  host: InstallCardHost,
  server: CorpServer,
  cardId: CardInstanceId,
  definition: CardDefinition,
  legalAction: LegalAction,
): void {
  const effect: ResolvedGameEffect = {
    effectId: `corp.root_rez_on_install.${server.id}.${cardId}`,
    kind: "rez_card",
    visibility: "public",
    side: "corp",
    reason: host.corp.isRegionUpgrade(definition)
      ? "region_install"
      : "install_rez",
    sourceDefinitionId: definition.id,
    sourceTitle: definition.title,
    cardDefinitionId: definition.id,
    cardTitle: definition.title,
    serverId: server.id,
    serverLabel: server.label,
  };
  legalAction.resolvedEffects = [
    ...(legalAction.resolvedEffects ?? []),
    effect,
  ];
}

function applyArmageddonDoomCounterInstallRolls(
  host: InstallCardHost,
  installedCardId: CardInstanceId,
  legalAction: LegalAction,
): void {
  const { state } = host;
  if (legalAction.side && legalAction.side !== "corp") return;
  const owners = CARD_IMPLEMENTATIONS.filter(
    (implementation) =>
      implementation.virusCounter?.onCorpInstall?.kind ===
      "roll_per_counter_trash_installed_card_and_remove_counter_on_success",
  );
  if (owners.length === 0) return;
  if (owners.length !== 1)
    throw new Error(
      `Expected exactly one Corp-install virus-counter owner; received ${owners.length}.`,
    );
  const owner = owners[0]!;
  const virusCounter = owner.virusCounter!;
  const trigger = virusCounter.onCorpInstall!;
  const counterType =
    virusCounter.counterKind as PurgeableRunnerVirusCounterType;
  const corpCounters = state.purgeableRunnerVirusCounters?.corp;
  const countersBefore = purgeableRunnerVirusCounterAmount(
    corpCounters,
    counterType,
  );
  if (!corpCounters || countersBefore <= 0) return;
  let hits = 0;
  const dieRolls: number[] = [];
  const randomPurposes: string[] = [];
  for (let index = 0; index < countersBefore; index += 1) {
    const randomPurpose = `virus.${owner.cardDefinitionId}.install.${state.stateVersion}.${installedCardId}.${index}`;
    const dieRoll = host.counters.rollDeterministicDie(randomPurpose);
    randomPurposes.push(randomPurpose);
    dieRolls.push(dieRoll);
    if (dieRoll === trigger.successDieValue) hits += 1;
  }
  if (hits > 0) {
    const countersRemoved = hits * trigger.removeCounterPerSuccess;
    setPurgeableRunnerVirusCounterAmount(
      corpCounters,
      counterType,
      countersBefore - countersRemoved,
    );
    if (
      Object.keys(corpCounters).length === 0 &&
      state.purgeableRunnerVirusCounters
    )
      delete state.purgeableRunnerVirusCounters.corp;
    if (
      state.purgeableRunnerVirusCounters &&
      !state.purgeableRunnerVirusCounters.corp &&
      !state.purgeableRunnerVirusCounters.servers &&
      !state.purgeableRunnerVirusCounters.effects
    )
      delete state.purgeableRunnerVirusCounters;
    if (state.cardInstances[installedCardId])
      host.zones.trashCorpInstalledCardToArchives(installedCardId, legalAction);
  }
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    proteusDoomInstallRolls: dieRolls.join(","),
    proteusDoomRandomPurposes: randomPurposes.join(","),
    proteusDoomHits: hits,
    doomCountersBefore: countersBefore,
    doomCountersAfter: purgeableRunnerVirusCounterAmount(
      state.purgeableRunnerVirusCounters?.corp,
      counterType,
    ),
    randomCounterAfter: state.randomCounter,
    proteusDoomSourceDefinitionId: owner.cardDefinitionId,
    ...(hits > 0
      ? {
          trashedInstalledCardDefinitionId:
            host.cards.definitionFor(installedCardId).id,
        }
      : {}),
  };
}
