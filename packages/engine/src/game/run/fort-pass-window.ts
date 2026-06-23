import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import type { CardFortRunWindowImplementation } from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { buildLegalAction } from "../turn/action-builders";
import { selectedChoiceCardIds } from "./encounter-resolution";
import { afterPassingLastIceWindowContext } from "./windows/after-passing-last-ice-window";

type ActiveRun = NonNullable<GameState["run"]>;

export type FortPassWindowHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    publicInstalledCorpCardIdentityKnown: (cardId: CardInstanceId) => boolean;
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => CorpServer;
  };
  payment: {
    spendCorpCredits: (amount: number) => void;
  };
};

export type FortPassWindowActionBuildResult = {
  legalActions: LegalAction[];
};

export type FortPassWindowExecutionResult = {
  handled: boolean;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: string;
  serverId?: Exclude<ServerId, "new_remote"> | string;
  serverLabel?: string;
  windowPassed?: boolean;
  continueAfterWindow?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]> | undefined;
  stateChanged?: boolean;
};

export type RunIceRepositionWindowResult = FortPassWindowExecutionResult & {
  selectedIceId?: CardInstanceId;
  iceOrderChanged?: boolean;
};

export type RunIceSwapChoiceResult = FortPassWindowExecutionResult & {
  selectedIceId?: CardInstanceId;
  selectedHqIceId?: CardInstanceId;
  iceOrderChanged?: boolean;
  choiceStarted?: boolean;
  choiceResolved?: boolean;
};

export function buildCorpFortPassWindowActions(
  host: FortPassWindowHost,
): LegalAction[] {
  const context = afterPassingLastIceWindowContext(host.state);
  if (!context) return [];
  const { run, server, passedIceId } = context;
  const used = new Set(run.fortPassWindowUsedSourceIdsThisRun ?? []);
  const actions: LegalAction[] = [];
  for (const sourceCardId of server.root.slice().sort()) {
    if (used.has(sourceCardId)) continue;
    const sourceInstance = host.state.cardInstances[sourceCardId];
    if (!sourceInstance?.rezzed) continue;
    const implementation = fortRunWindowImplementationForCard(
      host,
      sourceCardId,
      "add_advancement_counters_after_passing_last_ice_on_this_fort",
    );
    if (!implementation) continue;
    const cost = Math.max(0, Math.floor(implementation.cost.amount));
    if (host.state.corp.credits < cost) continue;
    const targets = advanceableInstalledCardTargetsOnServer(host, server.id);
    for (const targetCardId of targets) {
      const sourceDefinition = host.cards.definitionFor(sourceCardId);
      const targetDefinition = host.cards.definitionFor(targetCardId);
      actions.push(
        buildLegalAction(
          host.state,
          "corp",
          "trigger_ability",
          `${sourceDefinition.title}: 2 Advancement-Counter auf ${targetDefinition.title}`,
          sourceCardId,
          cost > 0 ? [{ credits: cost }] : [],
          {
            cardId: sourceCardId,
            sourceDefinitionId: sourceDefinition.id,
            targetCardId,
            targetCardDefinitionId: targetDefinition.id,
            serverId: server.id,
            serverLabel: server.label,
            passedIceId,
            fortRunWindowAbility:
              "add_advancement_counters_after_passing_last_ice_on_this_fort",
            advancementCountersAdded: implementation.amount,
            addedCounterAmount: implementation.amount,
            creditCost: cost,
          },
        ),
      );
    }
  }
  return actions;
}

export function buildHqIceSwapRunActions(
  host: FortPassWindowHost,
  run: ActiveRun,
  server: CorpServer,
): LegalAction[] {
  if (run.attackedServerId !== server.id) return [];
  const hqIceIds = host.state.corp.hq
    .filter((cardId) => host.cards.definitionFor(cardId).type === "ice")
    .sort();
  if (hqIceIds.length === 0) return [];
  const used = new Set(run.singaporeCityGridUsedSourceIdsThisRun ?? []);
  const unrezzedIceTargets = server.ice
    .map((cardId, iceIndex) => ({ cardId, iceIndex }))
    .filter(({ cardId }) => !host.cards.cardInstanceFor(cardId).rezzed)
    .sort((left, right) => left.iceIndex - right.iceIndex);
  if (unrezzedIceTargets.length === 0) return [];
  return server.root
    .slice()
    .sort()
    .filter((cardId) => !used.has(cardId))
    .filter((cardId) => {
      const instance = host.cards.cardInstanceFor(cardId);
      return instance.rezzed && isFortIceSwapSource(host, cardId);
    })
    .flatMap((sourceCardId) => {
      const definition = host.cards.definitionFor(sourceCardId);
      return unrezzedIceTargets.map(({ cardId: targetIceId, iceIndex }) =>
        buildLegalAction(
          host.state,
          "corp",
          "trigger_ability",
          `${definition.title}: ICE in ${server.label} austauschen`,
          sourceCardId,
          [],
          {
            cardId: sourceCardId,
            targetIceId,
            serverId: server.id,
            iceIndex,
            v1918UpgradeAbility: "hq_ice_swap",
            hiddenZoneBarrier: true,
            hiddenZoneAction: "v1918_singapore_city_grid_choice",
          },
        ),
      );
    });
}

export function buildStartRunIceRepositionActions(
  host: FortPassWindowHost,
  run: ActiveRun,
  server: CorpServer,
): LegalAction[] {
  if (host.state.timingPoint !== "run.approach_ice") return [];
  if (run.attackedServerId !== server.id) return [];
  if (run.phase !== "approach_ice" || run.position.kind !== "ice") return [];
  if (run.position.iceIndex !== outermostIceIndex(server)) return [];
  if (server.ice.length < 2) return [];
  const used = new Set(run.iceRepositionUsedSourceIdsThisRun ?? []);
  return server.ice
    .map((sourceCardId, sourceIceIndex) => ({ sourceCardId, sourceIceIndex }))
    .filter(({ sourceCardId }) => !used.has(sourceCardId))
    .filter(({ sourceCardId }) =>
      isStartRunIceRepositionSource(host, sourceCardId),
    )
    .flatMap(({ sourceCardId, sourceIceIndex }) => {
      const implementation = fortRunWindowImplementationForCard(
        host,
        sourceCardId,
        "move_self_to_different_position_on_same_fort",
      );
      if (!implementation) return [];
      const cost = Math.max(0, Math.floor(implementation.cost.amount));
      if (host.state.corp.credits < cost) return [];
      const definition = host.cards.definitionFor(sourceCardId);
      return server.ice
        .map((_cardId, targetIceIndex) => targetIceIndex)
        .filter((targetIceIndex) => targetIceIndex !== sourceIceIndex)
        .map((targetIceIndex) =>
          buildLegalAction(
            host.state,
            "corp",
            "trigger_ability",
            `${definition.title}: ICE in ${server.label} bewegen`,
            sourceCardId,
            cost > 0 ? [{ credits: cost }] : [],
            {
              cardId: sourceCardId,
              sourceDefinitionId: definition.id,
              serverId: server.id,
              serverLabel: server.label,
              sourceIceIndex,
              targetIceIndex,
              creditCost: cost,
              fortRunWindowAbility:
                "move_self_to_different_position_on_same_fort",
            },
          ),
        );
    });
}

export function resolveFortPassAdvancementWindow(
  host: FortPassWindowHost,
  legalAction: LegalAction,
): FortPassWindowExecutionResult {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf dieses Fort-Pass-Fenster nutzen.");
  if (host.state.timingPoint !== "run.jack_out_window")
    throw new Error("Das Fort-Pass-Fenster ist nicht offen.");
  const run = mustRun(host.state);
  if (run.position.kind !== "server" || !run.lastPassedIceId)
    throw new Error(
      "Runner hat nicht gerade das letzte ICE dieses Forts passiert.",
    );
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const targetCardId = String(
    legalAction.payload?.targetCardId ?? "",
  ) as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "");
  if (serverId !== run.position.serverId)
    throw new Error("Das Fort-Pass-Fenster gehoert zu einem anderen Fort.");
  if (String(legalAction.payload?.passedIceId ?? "") !== run.lastPassedIceId)
    throw new Error(
      "Das passierte ICE passt nicht mehr zum Fort-Pass-Fenster.",
    );
  const server = host.servers.mustServer(run.position.serverId);
  if (!server.root.includes(sourceCardId))
    throw new Error("Die Fort-Pass-Quelle liegt nicht in diesem Fort.");
  if (!server.root.includes(targetCardId))
    throw new Error("Das Advancement-Ziel liegt nicht in diesem Fort.");
  const source = host.cards.cardInstanceFor(sourceCardId);
  if (!source.rezzed) throw new Error("Die Fort-Pass-Quelle ist nicht rezzed.");
  const used = run.fortPassWindowUsedSourceIdsThisRun ?? [];
  if (used.includes(sourceCardId))
    throw new Error(
      "Diese Fort-Pass-Quelle wurde in diesem Run bereits genutzt.",
    );
  const implementation = fortRunWindowImplementationForCard(
    host,
    sourceCardId,
    "add_advancement_counters_after_passing_last_ice_on_this_fort",
  );
  if (!implementation)
    throw new Error("Die Fort-Pass-Quelle hat keine passende Ability.");
  if (!isInstalledCorpCardAdvanceable(host, targetCardId))
    throw new Error(
      "Das Fort-Pass-Ziel kann keine Advancement-Counter erhalten.",
    );
  const cost = Math.max(0, Math.floor(implementation.cost.amount));
  if (creditCostForAction(legalAction) !== cost)
    throw new Error("Die Fort-Pass-Kosten passen nicht mehr.");
  host.payment.spendCorpCredits(cost);
  const amount = Math.max(0, Math.floor(implementation.amount));
  host.cards.cardInstanceFor(targetCardId).advancementCounters += amount;
  run.fortPassWindowUsedSourceIdsThisRun = [...used, sourceCardId];
  run.rootRezWindowPassedKeys = Array.from(
    new Set([
      ...(run.rootRezWindowPassedKeys ?? []),
      corpRunRootRezWindowKey(run),
    ]),
  ).sort();
  host.state.activeSide = "runner";
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    targetCardDefinitionId: host.cards.definitionFor(targetCardId).id,
    advancementCountersAdded: amount,
    addedCounterAmount: amount,
    advancementCountersAfter:
      host.cards.cardInstanceFor(targetCardId).advancementCounters,
    corpCreditsAfter: host.state.corp.credits,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: server.id,
    serverLabel: server.label,
    windowPassed: true,
    continueAfterWindow: true,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function resolveStartRunIceRepositionWindow(
  host: FortPassWindowHost,
  legalAction: LegalAction,
): RunIceRepositionWindowResult {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf ICE am Run-Start bewegen.");
  if (host.state.timingPoint !== "run.approach_ice")
    throw new Error("Das ICE-Bewegungsfenster ist nicht offen.");
  const run = mustRun(host.state);
  if (run.phase !== "approach_ice" || run.position.kind !== "ice")
    throw new Error("Runner ist nicht am Run-Start eines ICE-Forts.");
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  if (serverId !== run.attackedServerId)
    throw new Error("Die ICE-Bewegung gehoert zu einem anderen Run.");
  const server = host.servers.mustServer(serverId);
  if (run.position.iceIndex !== outermostIceIndex(server))
    throw new Error("ICE-Bewegung ist nur am Start des Runs legal.");
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const sourceIceIndex = Number(legalAction.payload?.sourceIceIndex ?? -1);
  const targetIceIndex = Number(legalAction.payload?.targetIceIndex ?? -1);
  if (
    !Number.isInteger(sourceIceIndex) ||
    sourceIceIndex < 0 ||
    server.ice[sourceIceIndex] !== sourceCardId
  )
    throw new Error("Die ICE-Quellposition ist nicht mehr legal.");
  if (
    !Number.isInteger(targetIceIndex) ||
    targetIceIndex < 0 ||
    targetIceIndex >= server.ice.length ||
    targetIceIndex === sourceIceIndex
  )
    throw new Error("Die ICE-Zielposition ist nicht legal.");
  if (run.iceRepositionUsedSourceIdsThisRun?.includes(sourceCardId))
    throw new Error(
      "Diese ICE-Bewegungsquelle wurde in diesem Run bereits genutzt.",
    );
  const implementation = fortRunWindowImplementationForCard(
    host,
    sourceCardId,
    "move_self_to_different_position_on_same_fort",
  );
  if (!implementation)
    throw new Error("Die ICE-Quelle hat keine passende Bewegungsfaehigkeit.");
  const cost = Math.max(0, Math.floor(implementation.cost.amount));
  if (creditCostForAction(legalAction) !== cost)
    throw new Error("Die ICE-Bewegungskosten passen nicht mehr.");
  host.payment.spendCorpCredits(cost);
  const sourceInstance = host.cards.cardInstanceFor(sourceCardId);
  const wasRevealed = sourceInstance.faceup || sourceInstance.rezzed;
  const [movedIceId] = server.ice.splice(sourceIceIndex, 1);
  if (movedIceId !== sourceCardId)
    throw new Error("Die ICE-Quellposition ist nicht mehr stabil.");
  server.ice.splice(targetIceIndex, 0, sourceCardId);
  if (!sourceInstance.rezzed && implementation.revealIfUnrezzed) {
    host.state.cardInstances[sourceCardId] = {
      ...sourceInstance,
      faceup: true,
    };
  }
  const newApproachIndex = outermostIceIndex(server);
  const approachedIceId = mustArrayValue(
    server.ice,
    newApproachIndex,
    "Server hat kein ICE.",
  );
  run.position = {
    kind: "ice",
    serverId: server.id,
    iceIndex: newApproachIndex,
  };
  run.approachedIceId = approachedIceId;
  delete run.encounteredIceId;
  run.iceRepositionUsedSourceIdsThisRun = [
    ...(run.iceRepositionUsedSourceIdsThisRun ?? []),
    sourceCardId,
  ].sort();
  host.state.activeSide = "corp";
  host.state.timingPoint = "run.approach_ice";
  const revealPayload =
    !wasRevealed && implementation.revealIfUnrezzed
      ? {
          publicRevealDefinitionId: host.cards.definitionFor(sourceCardId).id,
        }
      : {};
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverLabel: server.label,
    movedIceCount: 1,
    sourceIceIndex,
    targetIceIndex,
    newApproachIceIndex: newApproachIndex,
    newApproachIceRevealed:
      host.cards.publicInstalledCorpCardIdentityKnown(approachedIceId),
    revealedSource: !wasRevealed && implementation.revealIfUnrezzed,
    ...revealPayload,
    corpCreditsAfter: host.state.corp.credits,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: server.id,
    serverLabel: server.label,
    selectedIceId: approachedIceId,
    iceOrderChanged: true,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function startHqIceSwapChoice(
  host: FortPassWindowHost,
  legalAction: LegalAction,
): RunIceSwapChoiceResult {
  if (legalAction.side !== "corp")
    throw new Error("Nur die Korp darf Singapore City Grid nutzen.");
  const run = mustRun(host.state);
  if (
    host.state.timingPoint !== "run.approach_ice" &&
    host.state.timingPoint !== "run.jack_out_window"
  )
    throw new Error("Singapore City Grid ist nur waehrend eines Runs legal.");
  const sourceCardId = String(
    legalAction.payload?.cardId ?? "",
  ) as CardInstanceId;
  const serverId = String(legalAction.payload?.serverId ?? "") as Exclude<
    ServerId,
    "new_remote"
  >;
  const targetIceId = String(
    legalAction.payload?.targetIceId ?? "",
  ) as CardInstanceId;
  const iceIndex = Number(legalAction.payload?.iceIndex ?? -1);
  if (serverId !== run.attackedServerId)
    throw new Error("Singapore City Grid ist nicht an diesen Run gebunden.");
  const server = host.servers.mustServer(serverId);
  if (!server.root.includes(sourceCardId))
    throw new Error("Singapore City Grid ist nicht im angegriffenen Remote.");
  const sourceInstance = host.cards.cardInstanceFor(sourceCardId);
  if (!sourceInstance.rezzed || !isFortIceSwapSource(host, sourceCardId))
    throw new Error("Singapore City Grid ist nicht rezzed installiert.");
  if (run.singaporeCityGridUsedSourceIdsThisRun?.includes(sourceCardId))
    throw new Error("Singapore City Grid wurde in diesem Run bereits genutzt.");
  if (
    !Number.isInteger(iceIndex) ||
    iceIndex < 0 ||
    server.ice[iceIndex] !== targetIceId
  )
    throw new Error("Das Singapore-City-Grid-ICE-Ziel ist ungueltig.");
  const targetInstance = host.cards.cardInstanceFor(targetIceId);
  if (targetInstance.rezzed)
    throw new Error("Singapore City Grid darf nur unrezzed ICE austauschen.");
  const hqIceIds = host.state.corp.hq
    .filter((cardId) => host.cards.definitionFor(cardId).type === "ice")
    .sort();
  if (hqIceIds.length === 0)
    throw new Error("In HQ liegt kein ICE fuer Singapore City Grid.");
  if (host.state.pendingChoice)
    throw new Error("Es ist bereits eine Choice offen.");
  host.state.pendingChoice = {
    choiceId: `v1918_singapore_city_grid_${host.state.stateVersion + 1}`,
    side: "corp",
    source: `v1918.singapore_city_grid:${sourceCardId}:${server.id}:${targetIceId}:${iceIndex}:${run.runId}`,
    prompt: "Singapore City Grid: ICE aus HQ wählen.",
    kind: "select_cards",
    options: hqIceIds.map((cardId) => ({
      id: `card_${cardId}`,
      label: host.cards.definitionFor(cardId).title,
      publicLabel: "HQ-ICE",
      value: cardId,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: host.state.stateVersion + 1,
    visibility: "hidden_info_barrier",
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_singapore_city_grid_choice",
    choiceVisibility: "hidden_info_barrier",
    selectedCount: 1,
    serverLabel: server.label,
    oncePerRunConsumed: false,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: server.id,
    serverLabel: server.label,
    selectedIceId: targetIceId,
    choiceStarted: true,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

export function resolveHqIceSwapChoice(
  host: FortPassWindowHost,
  legalAction: LegalAction,
  playerAction: PlayerAction,
): RunIceSwapChoiceResult {
  const choice = host.state.pendingChoice;
  if (!choice || !choice.source.startsWith("v1918.singapore_city_grid"))
    throw new Error("Es ist keine Singapore-City-Grid-Choice offen.");
  const [, sourceCardIdRaw, serverIdRaw, targetIceIdRaw, iceIndexRaw, runId] =
    choice.source.split(":");
  if (!sourceCardIdRaw || !serverIdRaw || !targetIceIdRaw || !runId)
    throw new Error("Die Singapore-City-Grid-Choice ist ungueltig.");
  const sourceCardId = sourceCardIdRaw as CardInstanceId;
  const targetIceId = targetIceIdRaw as CardInstanceId;
  const serverId = serverIdRaw as Exclude<ServerId, "new_remote">;
  const iceIndex = Number(iceIndexRaw ?? -1);
  const run = mustRun(host.state);
  if (run.runId !== runId || run.attackedServerId !== serverId)
    throw new Error(
      "Die Singapore-City-Grid-Choice gehoert nicht zu diesem Run.",
    );
  const server = host.servers.mustServer(serverId);
  if (!server.root.includes(sourceCardId))
    throw new Error(
      "Singapore City Grid ist nicht mehr im angegriffenen Remote.",
    );
  if (
    !isFortIceSwapSource(host, sourceCardId) ||
    !host.cards.cardInstanceFor(sourceCardId).rezzed
  )
    throw new Error("Singapore City Grid ist nicht mehr rezzed installiert.");
  if (run.singaporeCityGridUsedSourceIdsThisRun?.includes(sourceCardId))
    throw new Error("Singapore City Grid wurde in diesem Run bereits genutzt.");
  if (
    !Number.isInteger(iceIndex) ||
    iceIndex < 0 ||
    server.ice[iceIndex] !== targetIceId
  )
    throw new Error("Das Singapore-City-Grid-ICE-Ziel ist nicht mehr legal.");
  const targetInstance = host.cards.cardInstanceFor(targetIceId);
  if (targetInstance.rezzed)
    throw new Error("Singapore City Grid darf nur unrezzed ICE austauschen.");
  const hqIceId = selectedChoiceCardIds(choice, playerAction)[0];
  if (!hqIceId || !host.state.corp.hq.includes(hqIceId))
    throw new Error("Das Singapore-City-Grid-HQ-ICE ist nicht mehr in HQ.");
  if (host.cards.definitionFor(hqIceId).type !== "ice")
    throw new Error("Singapore City Grid darf nur ICE aus HQ waehlen.");
  const hqIndex = host.state.corp.hq.indexOf(hqIceId);
  host.state.corp.hq[hqIndex] = targetIceId;
  server.ice[iceIndex] = hqIceId;
  host.state.cardInstances[targetIceId] = {
    ...withoutVariableIceState(targetInstance),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "hq" },
  };
  host.state.cardInstances[hqIceId] = {
    ...host.cards.cardInstanceFor(hqIceId),
    faceup: false,
    rezzed: false,
    zone: { side: "corp", zone: "serverIce", serverId },
  };
  run.singaporeCityGridUsedSourceIdsThisRun = [
    ...(run.singaporeCityGridUsedSourceIdsThisRun ?? []),
    sourceCardId,
  ];
  delete host.state.pendingChoice;
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    hiddenZoneBarrier: true,
    hiddenZoneAction: "v1918_singapore_city_grid_swap",
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverLabel: server.label,
    iceIndex,
    swappedIceCount: 1,
    oncePerRunConsumed: true,
  };
  return {
    handled: true,
    sourceCardId,
    sourceDefinitionId: host.cards.definitionFor(sourceCardId).id,
    serverId: server.id,
    serverLabel: server.label,
    selectedIceId: targetIceId,
    selectedHqIceId: hqIceId,
    choiceResolved: true,
    iceOrderChanged: true,
    resolvedPayload: legalAction.payload,
    stateChanged: true,
  };
}

function advanceableInstalledCardTargetsOnServer(
  host: FortPassWindowHost,
  serverId: Exclude<ServerId, "new_remote">,
): CardInstanceId[] {
  return host.servers
    .mustServer(serverId)
    .root.slice()
    .sort()
    .filter((cardId) => isInstalledCorpCardAdvanceable(host, cardId));
}

function isInstalledCorpCardAdvanceable(
  host: FortPassWindowHost,
  cardId: CardInstanceId,
): boolean {
  const definition = host.cards.definitionFor(cardId);
  const instance = host.state.cardInstances[cardId];
  if (
    !instance ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverRoot" ||
    !host.state.corp.servers.some((server) => server.root.includes(cardId))
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

function fortRunWindowImplementationForCard<
  K extends CardFortRunWindowImplementation["kind"],
>(
  host: FortPassWindowHost,
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

function isFortIceSwapSource(
  host: FortPassWindowHost,
  cardId: CardInstanceId,
): boolean {
  return Boolean(
    fortRunWindowImplementationForCard(
      host,
      cardId,
      "swap_unrezzed_fort_ice_with_hq_ice",
    ),
  );
}

function isStartRunIceRepositionSource(
  host: FortPassWindowHost,
  cardId: CardInstanceId,
): boolean {
  return Boolean(
    fortRunWindowImplementationForCard(
      host,
      cardId,
      "move_self_to_different_position_on_same_fort",
    ),
  );
}

function corpRunRootRezWindowKey(run: ActiveRun): string {
  const position =
    run.position.kind === "ice"
      ? `ice:${run.position.serverId}:${run.position.iceIndex}`
      : `server:${run.position.serverId}`;
  return `${run.runId}:${position}`;
}

function creditCostForAction(legalAction: LegalAction): number {
  return legalAction.costs.reduce(
    (sum, cost) =>
      sum + (Number.isInteger(cost.credits) && cost.credits ? cost.credits : 0),
    0,
  );
}

function withoutVariableIceState(instance: CardInstance): CardInstance {
  const { variableIceState: _variableIceState, ...rest } = instance;
  void _variableIceState;
  return rest;
}

function outermostIceIndex(server: CorpServer): number {
  return server.ice.length - 1;
}

function mustArrayValue<T>(values: T[], index: number, message: string): T {
  const value = values[index];
  if (value === undefined) throw new Error(message);
  return value;
}

function mustRun(state: GameState): ActiveRun {
  if (!state.run) throw new Error("Es läuft kein Run.");
  return state.run;
}
